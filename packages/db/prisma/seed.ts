import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'admin@cascade.app' },
    update: {},
    create: {
      email: 'admin@cascade.app',
      name: 'Admin User',
    },
  });
  console.log('Created user:', user.email);

  // Create a default workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      userId: user.id,
      name: 'Default Workspace',
      slug: 'default',
    },
  });
  console.log('Created workspace:', workspace.slug);

  // Create default guardrails
  await prisma.guardrail.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: {
      workspaceId: workspace.id,
      dailyTokenCap: 250000,
      dailyCostCapCents: 1000,
      perRunTokenCap: 200000,
      perRunCostCapCents: 500,
    },
  });
  console.log('Created guardrails for workspace');

  // Create a sample playbook
  const playbook = await prisma.playbook.upsert({
    where: {
      workspaceId_name: {
        workspaceId: workspace.id,
        name: 'Hello World',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Hello World',
      description: 'A simple hello world playbook',
    },
  });
  console.log('Created playbook:', playbook.name);

  // Create a playbook version
  const version = await prisma.playbookVersion.upsert({
    where: {
      playbookId_version: {
        playbookId: playbook.id,
        version: 1,
      },
    },
    update: {},
    create: {
      playbookId: playbook.id,
      version: 1,
      definition: {
        version: 1,
        entry: 'start',
        nodes: [
          {
            id: 'start',
            type: 'llm',
            name: 'Generate Greeting',
            model: 'gpt-4o-mini',
            prompt: 'Say hello to {{ctx.input.name}} in a friendly way.',
            maxOutputTokens: 100,
            saveAs: 'greeting',
          },
        ],
      },
    },
  });
  console.log('Created playbook version:', version.version);

  // Update playbook to point to current version
  await prisma.playbook.update({
    where: { id: playbook.id },
    data: { currentId: version.id },
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
