# CASCADE Console & Worker

This monorepo contains the early scaffold for **CASCADE**, a mission-control console for orchestrating AI workflows and their execution. It follows a polyrepo structure with a Next.js frontend and a worker back end.

## High‑level architecture

- **apps/console** – a Next.js 15 application responsible for the operator UI.  It will host pages for workspaces, playbook definitions, runs, and guardrail configuration.
- **apps/worker** – a Node.js process that pulls workflow jobs from a queue and executes them step by step.  In production it would be packaged as a separate service (e.g. a container).
- **packages/core-workflows** – reusable logic for running playbooks: parsing the workflow definition, stepping through the DAG, and calling LLMs/tools.  This package is consumed by both the worker and potentially by other services.
- **packages/shared-types** – Zod schemas and TypeScript types shared across applications.  Keeping them in one place ensures all parts of the system agree on data shapes.
- **prisma** – database schema defined with Prisma.  It models organisations, workspaces, playbooks, runs, steps, guardrail policies, connectors, etc.

## Next steps

1. **Initialize dependencies and package management**: decide on `npm` or `pnpm` and set up workspaces in the root `package.json`.  Install core dependencies such as Next.js, React, TypeScript, Prisma, Zod, and Tailwind.
2. **Configure database**: connect Prisma to your Postgres instance and run `prisma migrate` to create the database.  Seed an initial organisation and workspace for development.
3. **Implement authentication & multi‑tenancy**: integrate Clerk/Auth.js and wire org membership throughout the console.  Ensure all queries filter by `organizationId`.
4. **Build UI pages**: start with three core pages – workspaces list, playbook editor (JSON), and run timeline.  Use shadcn/ui and Tailwind to build clean layouts.
5. **Develop the workflow engine**: flesh out the `runWorkflow` function in `apps/worker/src/index.ts`, connecting to the database and executing steps.  Implement basic step handlers for LLM calls, HTTP calls, and simple branching.
6. **Add guardrails**: create a simple rule engine for maximum cost and token limits, enforcing them during execution and surfacing violations in the UI.

The skeleton files below are minimal placeholders to get you started.  Replace them with your actual implementation as you build out the system.
