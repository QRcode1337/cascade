import type { SocialMediaAssetNodeInput } from './social-types.js';

interface MetaPublishInput {
  accessToken: string;
  pageId: string;
  content: string;
  media: SocialMediaAssetNodeInput[];
}

export async function publishToMeta(_input: MetaPublishInput): Promise<never> {
  throw new Error('Meta publishing connector not implemented yet. Use manual_export fallback.');
}
