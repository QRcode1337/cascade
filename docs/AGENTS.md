# AGENTS.md
**EPSILON · CASCADE Console — Agent Registry & Playbooks**

This file defines the *roles*, *interfaces*, and *playbook bindings* for the CASCADE agent system (the thing that turns “AI strategy” into actual deployments, not vibes).

> **Primary promise (CASCADE):** automate repetitive workflows, build internal AI capability, and keep clients secure while doing it.

---

## 0) Operating Rules (so outputs are consistent)

### Output contracts (default)
Unless a task specifies otherwise, agents should return:
1) **Deliverable** (Markdown, copy/paste ready)
2) **Assumptions** (bullets)
3) **Next actions** (checklist, sequenced)

### Client-safety & security
- Avoid collecting sensitive data unless explicitly required for the workflow.
- Prefer links to client-owned systems (Google Business Profile, existing CRMs) over storing PII in ad‑hoc docs.
- When using SMS or email sequences, include **opt-out language** and respect consent.

### Program lanes (default)
- **Lane 1:** No website → “Digital Receptionist Drop”
- **Lane 2:** Outdated site → “Digital Employee Overlay”
- **Lane 3:** Restaurants → “Reputation & Reservation Engine”

---

## 1) Local Playbook Library (uploaded assets)
All agents should treat these as the canonical, reusable building blocks.

| Asset | What it contains | Primary agents |
|---|---|---|
| `01-audit-methodology.md` | 90–120 min audit framework: discovery → opportunity mapping → demo | AuditAgent, StrategyAgent, ProposalAgent |
| `02-outreach-email-templates.md` | Cold/warm/DM/referral sequences + follow-up cadence | OutreachAgent |
| `03-landing-page-copy.md` | Landing copy (Carrd/Notion), pricing, FAQ, layout | LandingPageAgent, StrategyAgent |
| `04-proposal-template.md` | Audit report + proposal template, phases & pricing options | ProposalAgent, OrchestratorAgent |
| `05-case-study-framework.md` | Case study templates + proof checklist | CaseStudyAgent |
| `06-demo-setup-guide.md` | 3 demo automations + scripts + budget | DemoBuilderAgent, AuditAgent |
| `07-typebot-flow-templates.json` | Typebot flow templates (generic/RE/dental/FAQ) + customization notes | AutomationArchitectAgent, DemoBuilderAgent |
| `08-make-automation-blueprints.md` | Make scenarios (lead capture, reminders, post-appointment review) | AutomationArchitectAgent |
| `09-email-sms-templates.md` | Booking confirmations, reminders, review requests, no-show follow-up | AutomationArchitectAgent, OutreachAgent |
| `10-quick-start-checklist.md` | Day-by-day setup checklist for demo stack | DemoBuilderAgent, OrchestratorAgent |
| `11-no-site-outreachpack.md` | Lane 1 “I built it already” outreach pack + QR leave-behind | OutreachAgent, StrategyAgent |
| `12-lane-2-strat-guide.txt` | Lane 2 & 3 hooks, stacks, ROI phrases | StrategyAgent, OutreachAgent |
| `13-high-impact-outreach-scripts.txt` | Pattern interrupt email + permission-to-text scripts | OutreachAgent |
| `Personalized Email Templates for Local Businesses.md` | Examples of personalized emails + structure | OutreachAgent |
| `Website Improvement Email Templates for Contractors.md` | Lane 2 contractor outreach templates + guidelines | OutreachAgent |
| `Find businesses online.docx` | Lead-finding workflow + DC “no website” examples with drafts | LeadGenAgent, OutreachAgent |
| `ClaudeCodeSession-epsilonllc.md` | Multi-agent orchestration notes (swarm/topologies/orchestration patterns) | ConsoleEngineerAgent |
| `businesses.txt` | Raw business info extracted (unstructured) | LeadGenAgent, DataOpsAgent |
| `businesses_spreadsheet.csv` | Structured businesses sheet | LeadGenAgent, DataOpsAgent |
| `cascade_prospects_50.csv` | Prospect seed list w/ priorities + digital gap signals | LeadGenAgent, OrchestratorAgent |
| `cascade_prospects_50_contacts_template.csv` | Enrichment template w/ search queries + contact fields | LeadGenAgent, DataOpsAgent |
| `outdated_websites.txt` | Raw notes on outdated sites | LeadGenAgent |
| `outdated_websites_spreadsheet.csv` | Structured outdated-site sheet w/ URL + issues | LeadGenAgent, OutreachAgent |
| `todo.md` | Execution backlog | OrchestratorAgent |

---

## 2) Agent Interfaces (shared schema)
Agents accept a task packet and return a result packet.

### Task packet (input)
```json
{
  "client_or_prospect": {
    "name": "string",
    "industry": "string",
    "location": "string",
    "website": "string|null",
    "primary_goal": "string"
  },
  "lane": "lane1|lane2|lane3|unknown",
  "constraints": {
    "budget": "string|number|null",
    "tools": ["Typebot","Cal.com","Make.com","Twilio","Google Sheets"],
    "compliance": ["HIPAA","PCI","None"]
  },
  "artifacts": {
    "notes": "string",
    "links": ["string"]
  }
}
```

### Result packet (output)
```json
{
  "deliverable_markdown": "string",
  "assumptions": ["string"],
  "next_actions": ["string"],
  "risk_notes": ["string"],
  "handoff": {
    "to_agent": "string",
    "summary": "string"
  }
}
```

---

## 3) Agent Registry

### 3.1 OrchestratorAgent (PMAgent)
**Mission:** Run the CASCADE program end-to-end: pick lane, assign agents, track deliverables, and ship outcomes on schedule.

**Use when:**
- You need a coherent plan from “lead list” → “demo” → “proposal” → “implementation” → “case study” → “security upsell”.

**Primary playbooks:**
- `todo.md`
- `10-quick-start-checklist.md`
- `04-proposal-template.md`

**Outputs:**
- 14-day execution plan
- Daily outreach + demo quotas
- Milestone checklist per client

**System prompt (recommended):**
- “You are the CASCADE Orchestrator. Optimize for shipped deliverables and scheduled demos. If something is ambiguous, choose the lowest-risk default and proceed.”

---

### 3.2 StrategyAgent
**Mission:** Decide the best lane, offer, and positioning for a given business. Translate “AI” into a concrete business outcome.

**Primary playbooks:**
- `03-landing-page-copy.md`
- `01-audit-methodology.md`
- `11-no-site-outreachpack.md`
- `12-lane-2-strat-guide.txt`

**Typical inputs:**
- Business type, intake notes, digital gap signals, constraints (budget/compliance)

**Outputs:**
- Lane selection + “hook”
- Top 3 automations + ROI estimate (directional)
- Discovery questions for the audit call

**Example outputs:**
- Lane 1: “Digital Receptionist Drop”
- Lane 2: “Digital Employee Overlay”
- Lane 3: “Reputation & Reservation Engine”

---

### 3.3 LeadGenAgent (Prospecting + Research)
**Mission:** Build and enrich lead lists (name, phone, email, website, issues) and hand clean rows to OutreachAgent.

**Primary playbooks & datasets:**
- `Find businesses online.docx`
- `cascade_prospects_50_contacts_template.csv`
- `cascade_prospects_50.csv`
- `businesses.txt`, `businesses_spreadsheet.csv`
- `outdated_websites.txt`, `outdated_websites_spreadsheet.csv`

**Outputs:**
- Enriched spreadsheet rows (contact + evidence)
- “Digital gap signal” notes per row (1–2 bullets)
- Suggested lane per prospect

**Quality bar:**
- Each row has *at least one* contact path (email, contact form, or phone)
- Each row includes a *specific* personalization hook (missing website link, outdated mobile UX, no online booking, etc.)

---

### 3.4 DataOpsAgent (Sheets + CRM Hygiene)
**Mission:** Keep the pipeline clean: normalize spreadsheets, dedupe rows, manage statuses, and prep imports into CRMs.

**Primary datasets:**
- `businesses_spreadsheet.csv`
- `cascade_prospects_50_contacts_template.csv`
- `outdated_websites_spreadsheet.csv`

**Outputs:**
- Clean CSVs ready for upload
- Tracker columns: status, last touch, next action, demo link, notes
- Simple reporting: touch → reply → demo booked rates

---

### 3.5 OutreachAgent (Email/Call/Text)
**Mission:** Generate personalized outreach that gets replies without sounding like a malfunctioning sales robot.

**Primary playbooks:**
- `02-outreach-email-templates.md`
- `11-no-site-outreachpack.md`
- `13-high-impact-outreach-scripts.txt`
- `Personalized Email Templates for Local Businesses.md`
- `Website Improvement Email Templates for Contractors.md`
- `09-email-sms-templates.md` (for post-booking comms and reminders)
- `12-lane-2-strat-guide.txt`

**Outputs:**
- 3-touch email sequence per lane (cold → follow-up → final)
- Phone script + voicemail script
- “Permission-to-text” message + the actual text containing the demo link
- Subject line variants (3–5)

**Guardrails:**
- Keep cold emails short (under ~120 words).
- Use one specific personalization hook in the first 1–2 lines.
- Never promise impossible outcomes. Promise *speed-to-lead*, *no-show reduction*, *hours saved*.

---

### 3.6 AuditAgent (Workflow Audit + Opportunity Map)
**Mission:** Run the 90–120 minute audit, surface 3–5 high-impact automations, and structure them into a deliverable that sells implementation.

**Primary playbooks:**
- `01-audit-methodology.md`
- `06-demo-setup-guide.md`
- `10-quick-start-checklist.md`

**Outputs:**
- Current state map (lead intake, scheduling, comms, ops)
- Opportunity backlog (ranked by impact/effort)
- Quick demo plan tailored to the business

**Security lens (minimum):**
- Identify where PII flows (forms, inbox, SMS, spreadsheets)
- Flag high-risk workflows (medical, payments, credentials)

---

### 3.7 AutomationArchitectAgent (Make + Typebot + Ops Flows)
**Mission:** Turn opportunities into concrete system designs (modules, triggers, data schema, messages) that can be implemented quickly.

**Primary playbooks:**
- `08-make-automation-blueprints.md`
- `07-typebot-flow-templates.json`
- `09-email-sms-templates.md`
- `10-quick-start-checklist.md`

**Outputs:**
- Architecture diagram (text is fine)
- Make.com scenario specs (modules + field mappings)
- Typebot flow selection + customization checklist
- Operational templates (email/SMS) wired to variables

**Implementation defaults:**
- Lead DB: Google Sheets (until a real CRM is justified)
- Scheduling: Cal.com
- Automations: Make.com
- SMS: Twilio (only with consent)

---

### 3.8 DemoBuilderAgent (Proof-of-Concept Builder)
**Mission:** Build the live demo assets that close deals: working bot, booking, notifications, follow-ups.

**Primary playbooks:**
- `06-demo-setup-guide.md`
- `10-quick-start-checklist.md`
- `07-typebot-flow-templates.json`
- `08-make-automation-blueprints.md`

**Outputs:**
- Demo link + short “how to use” script
- Screenshot pack (bot → booking → sheet row → confirmation)
- Demo checklist (what to show in 7 minutes)

---

### 3.9 ProposalAgent (Audit Report + Offer Packaging)
**Mission:** Convert audit outputs into a paid engagement with clean scope, timeline, and pricing.

**Primary playbooks:**
- `04-proposal-template.md`
- `01-audit-methodology.md`
- `03-landing-page-copy.md`

**Outputs:**
- Completed proposal (client-ready Markdown)
- Pricing options mapped to Lane (30-day vs 60-day vs retainer)
- “Next steps” email + follow-up cadence (handoff to OutreachAgent)

---

### 3.10 SecurityAgent (AI + Cyber Hygiene)
**Mission:** Add the security/risk lens that differentiates EPSILON: data minimization, access control, logging, and safer AI usage.

**Primary inputs:**
- Audit findings (from AuditAgent)
- Automation design (from AutomationArchitectAgent)

**Outputs:**
- Risk register (top risks + mitigation)
- “Minimum Secure Setup” checklist (accounts, MFA, API keys, data retention)
- Bi‑monthly security check offer (scope + deliverables)

**Minimum checklist (baseline):**
- MFA on Google, Twilio, Make, Cal, Typebot
- Secrets handling: no keys in docs, rotate on staff changes
- Least privilege: limit who can access lead sheets
- Consent + opt-out for SMS

---

### 3.11 CaseStudyAgent (Proof Engine)
**Mission:** Turn delivered work into proof that sells the next client.

**Primary playbooks:**
- `05-case-study-framework.md`
- `03-landing-page-copy.md` (case study preview section)

**Outputs:**
- 1-page case study (short)
- Full case study (detailed)
- Proof assets checklist (screenshots, metrics, testimonial request email)

---

### 3.12 LandingPageAgent (epsilonsec.ai / CASCADE)
**Mission:** Maintain a landing page that converts and doesn’t read like a crypto scam.

**Primary playbooks:**
- `03-landing-page-copy.md`
- `05-case-study-framework.md` (proof blocks)

**Outputs:**
- Updated sections (hero, problem, solution, pricing, FAQ)
- CTA variants (book call, request audit)
- Industry-specific landing variants (optional)

---

### 3.13 ConsoleEngineerAgent (CASCADE Console / Repo)
**Mission:** Implement the multi-agent console (Next.js/TS) that orchestrates agents, stores playbooks, and generates deliverables.

**Primary references:**
- `ClaudeCodeSession-epsilonllc.md` (swarm/topologies/orchestration patterns)

**Outputs:**
- Repo structure (Next.js app + API layer)
- Agent registry loader (reads this AGENTS.md)
- Playbook store (local markdown/json + searchable index)
- Execution runs: “Create outreach pack”, “Generate proposal”, “Build demo checklist”

**Implementation notes:**
- Keep it boring: JSON configs, markdown templates, minimal state machine.
- Add audit logging (who generated what, when, from what inputs).

---

## 4) Default End-to-End Workflow (recommended)
1) **LeadGenAgent** builds/enriches list  
2) **OutreachAgent** runs lane-appropriate sequence  
3) **AuditAgent** runs audit + captures opportunities  
4) **DemoBuilderAgent** shows working proof  
5) **ProposalAgent** generates client-ready proposal  
6) **AutomationArchitectAgent** builds implementation plan  
7) **SecurityAgent** performs risk review + offers bi-monthly checks  
8) **CaseStudyAgent** publishes proof  
9) **LandingPageAgent** updates proof blocks + CTA  
10) **OrchestratorAgent** keeps everything moving (because entropy is undefeated)

---

## 5) Agent Handoff Notes (quick)
- AuditAgent → ProposalAgent: ranked opportunities + ROI notes + screenshots
- ProposalAgent → OutreachAgent: proposal + follow-up dates + objection notes
- AutomationArchitectAgent → SecurityAgent: data flows + storage locations + integrations
- DemoBuilderAgent → CaseStudyAgent: “before/after” screenshots + metrics

---

## 6) Appendix: Typebot Template Index (from `07-typebot-flow-templates.json`)
- Lead Qualification Chatbot (Generic Business)
- Lead Qualification Chatbot (Real Estate)
- Lead Qualification Chatbot (Dental Practice)
- FAQ Auto-Responder (Generic)
