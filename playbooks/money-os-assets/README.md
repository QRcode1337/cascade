# Money-OS Business Playbook

Complete business playbook for AI automation consulting service targeting local businesses.

## Overview

This directory contains a production-ready playbook system with 13 numbered assets covering the entire business workflow from prospecting to delivery.

## Playbook Assets

### Sales & Marketing (01-05)

- **01-audit-methodology.md** - 90-120 minute audit framework
- **02-outreach-email-templates.md** - Cold email sequences
- **03-landing-page-copy.md** - Website/landing page templates
- **04-proposal-template.md** - Professional proposal framework
- **05-case-study-framework.md** - Success story templates

### Implementation & Delivery (06-10)

- **06-demo-setup-guide.md** - Step-by-step demo system setup
- **07-typebot-flow-templates.json** - Chatbot conversation flows
- **08-make-automation-blueprints.md** - Workflow automation patterns
- **09-email-sms-templates.md** - Customer communication templates
- **10-quick-start-checklist.md** - 3-4 hour implementation guide

### Specialized Strategies (11-13)

- **11-no-site-outreachpack.md** - No-website business targeting
- **12-lane-2-strat-guide.txt** - Outdated website strategy
- **13-high-impact-outreach-scripts.txt** - Phone/meeting scripts

## Data Assets

### Prospect Database

- **cascade_prospects_50.csv** - 50 pre-researched DMV businesses
  - Columns: Business name, category, city, state, priority (A/B)
  - Industries: Restaurants, services, retail, medical, trades
  - Digital gap signals for automation opportunities

- **cascade_prospects_50_contacts_template.csv** - Extended contact tracking template
  - Additional fields: Contact name, email, phone, notes, outreach status

### Intelligence Data

- **Apple_Intelligence_Report.json** - Market intelligence placeholder

## Technical Utilities

The technical scripts have been migrated to `packages/business-utils` for integration into CASCADE workflows:

- **Prospect Enrichment** (`@cascade/business-utils/enrich-prospects`)
  - Google Places API integration for automated contact research
  - Batch CSV processing with error handling
  - Enriches: Phone, website, address, Google Maps URL

- **Database Utilities** (`@cascade/business-utils/supabase`)
  - Supabase client configuration and helpers
  - Backend database operations for lead management

## Presentation Materials

- **CASCADE_0_to_profit.pptx** (2.6 MB) - Comprehensive business model presentation
  - Use cases: Client pitches, internal training, investor presentations

## Usage

### For Sales Teams

1. Start with **10-quick-start-checklist.md** for 3-4 hour setup
2. Use **01-audit-methodology.md** for discovery calls
3. Leverage **02-outreach-email-templates.md** for cold outreach
4. Close with **04-proposal-template.md**

### For Implementation Teams

1. Follow **06-demo-setup-guide.md** to build demo system
2. Use **07-typebot-flow-templates.json** for chatbot flows
3. Configure **08-make-automation-blueprints.md** workflows
4. Deploy **09-email-sms-templates.md** for customer comms

### For Strategy

- **Lane 1 (No Website)**: Use assets 11, 13, 06
- **Lane 2 (Outdated Site)**: Use assets 12, 02, 04
- **Lane 3 (Restaurants)**: Use assets 09, 08, 05

## Integration with CASCADE

These playbooks serve as reference implementations for CASCADE's agent-based workflow system. The 13 assets map to CASCADE's agent architecture defined in `docs/AGENTS.md`.

For technical integration, see `packages/business-utils` for reusable automation utilities.
