import type { SocialMediaAssetNodeInput } from './social-types.js';

interface LinkedInPublishInput {
  accessToken: string;
  authorUrn: string;
  content: string;
  media: SocialMediaAssetNodeInput[];
}

interface LinkedInPublishResult {
  ok: boolean;
  postId?: string;
  status: number;
  body: unknown;
}

export async function publishToLinkedIn(input: LinkedInPublishInput): Promise<LinkedInPublishResult> {
  const payload: Record<string, unknown> = {
    author: input.authorUrn,
    commentary: input.content,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  if (input.media.length > 0) {
    payload.content = {
      media: {
        title: input.media[0]?.title,
        id: input.media[0]?.url,
      },
    };
  }

  const response = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'LinkedIn-Version': '202405',
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  return {
    ok: response.ok,
    postId: response.headers.get('x-restli-id') ?? undefined,
    status: response.status,
    body,
  };
}
