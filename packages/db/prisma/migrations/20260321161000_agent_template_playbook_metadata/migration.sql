-- Add CASCADE agent registry + playbook template tables and Playbook metadata columns.
-- Idempotent to support environments that were previously patched via request-time SQL.

CREATE TABLE IF NOT EXISTS "Agent" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "mission" TEXT NOT NULL,
  "systemPrompt" TEXT,
  "playbooks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "outputs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "lane" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Agent_slug_key'
  ) THEN
    ALTER TABLE "Agent" ADD CONSTRAINT "Agent_slug_key" UNIQUE ("slug");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Agent_slug_idx" ON "Agent"("slug");

CREATE TABLE IF NOT EXISTS "PlaybookTemplate" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "agents" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlaybookTemplate_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PlaybookTemplate_slug_key'
  ) THEN
    ALTER TABLE "PlaybookTemplate"
    ADD CONSTRAINT "PlaybookTemplate_slug_key" UNIQUE ("slug");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PlaybookTemplate_category_idx"
ON "PlaybookTemplate"("category");

ALTER TABLE "Playbook"
ADD COLUMN IF NOT EXISTS "agentSlug" TEXT,
ADD COLUMN IF NOT EXISTS "templateId" TEXT,
ADD COLUMN IF NOT EXISTS "lane" TEXT;

CREATE INDEX IF NOT EXISTS "Playbook_agentSlug_idx" ON "Playbook"("agentSlug");
