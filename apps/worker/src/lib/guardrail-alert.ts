/**
 * Fire-and-forget Slack alert sent when a guardrail is breached.
 *
 * Lookup order for the bot token:
 *   1. Workspace secret whose `key` equals "SLACK_BOT_TOKEN"
 *   2. (nothing — alert is silently skipped)
 *
 * Lookup order for the alert channel:
 *   1. Env var GUARDRAIL_ALERT_CHANNEL
 *   2. Fallback "#alerts"
 *
 * Decryption matches the AES-256-GCM scheme in
 * apps/console/src/lib/crypto/secrets.ts using the same
 * ENCRYPTION_KEY / SECRETS_ENCRYPTION_KEY env vars.
 */

import crypto from 'crypto';
import { WebClient } from '@slack/web-api';
import { prisma } from '@cascade/db';
import type { Logger } from 'pino';

const ALGORITHM = 'aes-256-gcm';

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  process.env.SECRETS_ENCRYPTION_KEY ||
  'default-key-change-in-production-32';

function decryptSecret(cipherText: Buffer, iv: Buffer, authTag: Buffer): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(cipherText), decipher.final()]).toString('utf8');
}

export interface GuardrailBreachContext {
  workspaceId: string;
  workspaceName: string;
  runId: string;
  reason: string;
}

/**
 * Sends a Slack alert for a guardrail breach.
 * Never throws — failures are logged and swallowed so the
 * caller's error path is unaffected.
 */
export async function sendGuardrailBreachAlert(
  ctx: GuardrailBreachContext,
  logger: Logger,
): Promise<void> {
  try {
    const secret = await prisma.secret.findUnique({
      where: {
        workspaceId_key: {
          workspaceId: ctx.workspaceId,
          key: 'SLACK_BOT_TOKEN',
        },
      },
    });

    if (!secret) {
      logger.debug(
        { workspaceId: ctx.workspaceId },
        'No SLACK_BOT_TOKEN secret found; skipping guardrail breach alert',
      );
      return;
    }

    const token = decryptSecret(
      Buffer.from(secret.cipherText),
      Buffer.from(secret.iv),
      Buffer.from(secret.authTag),
    );

    const channel = process.env.GUARDRAIL_ALERT_CHANNEL || '#alerts';

    const text =
      `:rotating_light: *CASCADE Guardrail Breach*\n` +
      `*Workspace:* ${ctx.workspaceName}\n` +
      `*Run:* ${ctx.runId}\n` +
      `*Reason:* ${ctx.reason}`;

    const client = new WebClient(token);
    await client.chat.postMessage({ channel, text, mrkdwn: true });

    logger.info(
      { workspaceId: ctx.workspaceId, runId: ctx.runId, channel },
      'Guardrail breach alert sent to Slack',
    );
  } catch (err) {
    // Fire-and-forget: log the failure but never propagate it.
    logger.warn(
      { err, workspaceId: ctx.workspaceId, runId: ctx.runId },
      'Failed to send guardrail breach Slack alert (non-fatal)',
    );
  }
}
