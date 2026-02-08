import { WebClient } from '@slack/web-api';
import type { SlackNode } from '@cascade/schemas';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

interface SlackResult {
  output: {
    ok: boolean;
    channel: string;
    ts?: string;
    error?: string;
  };
}

export async function executeSlackNode(node: SlackNode): Promise<SlackResult> {
  try {
    const result = await slack.chat.postMessage({
      channel: node.channel,
      text: node.message,
      mrkdwn: true,
    });

    return {
      output: {
        ok: result.ok || false,
        channel: node.channel,
        ts: result.ts,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Slack API error';
    return {
      output: {
        ok: false,
        channel: node.channel,
        error: message,
      },
    };
  }
}
