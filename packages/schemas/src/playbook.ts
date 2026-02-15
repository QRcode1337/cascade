import { z } from 'zod';

// ============================================
// NODE TYPES
// ============================================

export const LlmNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('llm'),
  name: z.string().min(1),
  model: z.string().default('gpt-4o'),
  system: z.string().optional(),
  prompt: z.string().min(1),
  maxOutputTokens: z.number().int().min(1).max(32768).default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  tools: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        parameters: z.record(z.unknown()),
      })
    )
    .optional(),
  saveAs: z.string().optional(),
  next: z.string().optional(),
});

export const HttpNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('http'),
  name: z.string().min(1),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string(),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  timeout: z.number().int().min(1000).max(30000).default(10000),
  saveAs: z.string().optional(),
  next: z.string().optional(),
});

export const BranchNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('branch'),
  name: z.string().min(1),
  expression: z.string().min(1),
  onTrue: z.string(),
  onFalse: z.string(),
});

export const SlackNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('slack'),
  name: z.string().min(1),
  channel: z.string(),
  message: z.string(),
  saveAs: z.string().optional(),
  next: z.string().optional(),
});

export const WaitNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('wait'),
  name: z.string().min(1),
  duration: z.number().int().min(1000).max(300000),
  next: z.string().optional(),
});

export const TransformNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('transform'),
  name: z.string().min(1),
  expression: z.string(),
  saveAs: z.string(),
  next: z.string().optional(),
});

export const SecretRefSchema = z.object({
  secretKey: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Secret key must be uppercase with underscores'),
});

export const SocialChannelSchema = z.enum(['linkedin', 'meta']);

export const SocialMediaAssetSchema = z.object({
  url: z.string().url(),
  mimeType: z.string().optional(),
  title: z.string().optional(),
  altText: z.string().optional(),
});

const LinkedInCredentialsSchema = z.object({
  accessToken: SecretRefSchema,
  authorUrn: SecretRefSchema,
});

const MetaCredentialsSchema = z.object({
  accessToken: SecretRefSchema,
  pageId: SecretRefSchema,
});

export const SocialScheduleNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('social_schedule'),
  name: z.string().min(1),
  channel: SocialChannelSchema,
  publishAt: z.string().datetime(),
  timezone: z.string().optional(),
  content: z.string().min(1),
  media: z.array(SocialMediaAssetSchema).default([]),
  saveAs: z.string().optional(),
  next: z.string().optional(),
});

export const SocialPublishNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('social_publish'),
  name: z.string().min(1),
  channel: SocialChannelSchema,
  content: z.string().min(1),
  media: z.array(SocialMediaAssetSchema).default([]),
  credentials: z
    .object({
      linkedin: LinkedInCredentialsSchema.optional(),
      meta: MetaCredentialsSchema.optional(),
    })
    .optional(),
  fallbackMode: z.enum(['manual_export', 'fail']).default('manual_export'),
  saveAs: z.string().optional(),
  next: z.string().optional(),
});

export const NodeSchema = z.discriminatedUnion('type', [
  LlmNodeSchema,
  HttpNodeSchema,
  BranchNodeSchema,
  SlackNodeSchema,
  WaitNodeSchema,
  TransformNodeSchema,
  SocialScheduleNodeSchema,
  SocialPublishNodeSchema,
]);

// ============================================
// PLAYBOOK DEFINITION
// ============================================

export const PlaybookDefinitionSchema = z
  .object({
    version: z.literal(1),
    entry: z.string().min(1),
    nodes: z.array(NodeSchema).min(1),
  })
  .refine(
    (data) => {
      const nodeIds = new Set(data.nodes.map((n) => n.id));
      if (!nodeIds.has(data.entry)) return false;
      for (const node of data.nodes) {
        if ('next' in node && node.next && !nodeIds.has(node.next)) return false;
        if ('onTrue' in node && !nodeIds.has(node.onTrue)) return false;
        if ('onFalse' in node && !nodeIds.has(node.onFalse)) return false;
      }
      return true;
    },
    { message: 'Invalid node references in playbook' }
  );

// ============================================
// PLAYBOOK CRUD
// ============================================

export const CreatePlaybookSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  definition: PlaybookDefinitionSchema,
});

export const UpdatePlaybookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const PublishPlaybookSchema = z.object({
  playbookId: z.string().min(1),
  definition: PlaybookDefinitionSchema,
});

// ============================================
// TYPE EXPORTS
// ============================================

export type LlmNode = z.infer<typeof LlmNodeSchema>;
export type HttpNode = z.infer<typeof HttpNodeSchema>;
export type BranchNode = z.infer<typeof BranchNodeSchema>;
export type SlackNode = z.infer<typeof SlackNodeSchema>;
export type WaitNode = z.infer<typeof WaitNodeSchema>;
export type TransformNode = z.infer<typeof TransformNodeSchema>;
export type SocialScheduleNode = z.infer<typeof SocialScheduleNodeSchema>;
export type SocialPublishNode = z.infer<typeof SocialPublishNodeSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type PlaybookDefinition = z.infer<typeof PlaybookDefinitionSchema>;
export type CreatePlaybook = z.infer<typeof CreatePlaybookSchema>;
export type UpdatePlaybook = z.infer<typeof UpdatePlaybookSchema>;
