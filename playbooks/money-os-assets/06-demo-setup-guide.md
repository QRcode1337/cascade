# Demo Automation Setup Guide
**AI Workflow Audit Demo System**

---

## 🎯 Demo Strategy Overview

**Goal**: Build 3 working demo automations you can show prospects during the 90-minute audit to prove the concept and close deals faster.

**Demo Philosophy**:
- **Show, don't tell**: Live, working examples beat slide decks
- **Industry-agnostic**: Build templates that work for any business with simple customization
- **Low-cost**: Use free tiers and trials where possible
- **Quick to customize**: Swap names, questions, and branding in <10 minutes

**Budget Allocation for Demos**: $80 from Week 1 budget

---

## 📋 Demo Automation #1: Lead Qualification Chatbot

### What It Does
- Greets website visitors instantly
- Asks 3-5 qualifying questions
- Books appointments directly into your calendar
- Sends confirmation email + SMS
- Logs data to a simple database/spreadsheet

### Tech Stack (Option A: Free/Low-Cost)

**Chatbot Platform**: Typebot (https://typebot.io)
- **Cost**: Free tier (unlimited chatbots, 100 chats/month)
- **Why**: Visual flow builder, easy to customize, modern UI
- **Alternative**: Voiceflow ($0 free tier, 1,000 interactions/month)

**Calendar**: Cal.com (https://cal.com)
- **Cost**: Free tier (unlimited event types)
- **Why**: Open-source, Calendly alternative, API-friendly
- **Alternative**: Calendly free tier (1 event type)

**Database**: Google Sheets
- **Cost**: Free
- **Why**: Easy to share with clients, familiar interface
- **Alternative**: Airtable free tier

**Automation Glue**: Make.com (https://make.com)
- **Cost**: Free tier (1,000 operations/month)
- **Why**: Visual workflow builder, extensive integrations
- **Alternative**: Zapier free tier (100 tasks/month)

**SMS (Optional for demo)**: Twilio Trial
- **Cost**: Free trial ($15 credit)
- **Why**: Industry standard, reliable
- **Alternative**: SimpleTexting (14-day trial)

**Total Cost for Demo #1**: $0 (all free tiers)

---

### Step-by-Step Setup (60-90 minutes)

#### STEP 1: Create Typebot Chatbot (20 minutes)

1. **Sign up for Typebot**
   - Go to https://typebot.io
   - Create account (email or GitHub)
   - Create new workspace

2. **Build the Flow**

   **Opening Message:**
   ```
   Block Type: Text
   Content: "Hi there! 👋 I'm the AI assistant for [Business Name].

   I can help you book a consultation in under 60 seconds.

   Ready to get started?"

   Buttons: ["Yes, let's do it!" | "Just browsing"]
   ```

   **Question 1: Name**
   ```
   Block Type: Text Input
   Content: "Great! What's your name?"
   Variable: {{name}}
   ```

   **Question 2: Email**
   ```
   Block Type: Email Input
   Content: "Thanks {{name}}! What's the best email to reach you?"
   Variable: {{email}}
   ```

   **Question 3: Phone (Optional)**
   ```
   Block Type: Phone Input
   Content: "And your phone number? (We'll send you a confirmation text)"
   Variable: {{phone}}
   ```

   **Question 4: Qualifying Question (Industry-Specific)**

   *For Real Estate:*
   ```
   Block Type: Button Choice
   Content: "What are you looking for?"
   Options:
   - "Buying a home"
   - "Selling a home"
   - "Investment property"
   - "Just exploring"
   Variable: {{intent}}
   ```

   *For Dental:*
   ```
   Block Type: Button Choice
   Content: "What brings you in?"
   Options:
   - "Routine checkup"
   - "Dental emergency"
   - "Cosmetic procedure"
   - "New patient"
   Variable: {{intent}}
   ```

   *Generic/Multi-Industry:*
   ```
   Block Type: Button Choice
   Content: "How can we help you today?"
   Options:
   - "Book a consultation"
   - "Get a quote"
   - "Ask a question"
   - "Just browsing"
   Variable: {{intent}}
   ```

   **Question 5: Timeline**
   ```
   Block Type: Button Choice
   Content: "When are you looking to get started?"
   Options:
   - "This week"
   - "This month"
   - "Just researching"
   Variable: {{timeline}}
   ```

   **Calendar Booking Integration:**
   ```
   Block Type: Cal.com Integration
   Content: "Perfect! Let's get you scheduled. Pick a time that works for you:"
   Cal.com Event Link: [Your Cal.com event URL]
   Variable: {{booking_time}}
   ```

   **Confirmation Message:**
   ```
   Block Type: Text
   Content: "You're all set, {{name}}! 🎉

   You'll receive a confirmation email at {{email}} and a text reminder 24 hours before.

   Looking forward to speaking with you!"
   ```

3. **Design & Branding**
   - Go to Theme settings
   - Set colors to match your brand (or keep default modern look)
   - Add logo (optional for demo)
   - Choose font (Inter or Poppins recommended)

4. **Test the Flow**
   - Click "Test" button in Typebot
   - Walk through entire conversation
   - Verify all variables are captured
   - Check calendar booking integration

5. **Get Embed Code**
   - Click "Share" → "Embed"
   - Copy the JavaScript snippet
   - Save for later (you'll show this to clients)

---

#### STEP 2: Set Up Cal.com Calendar (15 minutes)

1. **Sign up for Cal.com**
   - Go to https://cal.com
   - Create account
   - Connect your Google Calendar or Outlook

2. **Create Event Type**
   - Click "Event Types" → "New Event Type"
   - Name: "AI Workflow Audit" (or "Free Consultation")
   - Duration: 90 minutes (or 30 min for quick demo)
   - Location: Zoom or Google Meet (auto-generated link)
   - Buffer time: 15 min before/after (prevent back-to-back bookings)

3. **Configure Availability**
   - Set your working hours (e.g., Mon-Fri 9am-5pm)
   - Add any blocked time or holidays
   - Set minimum notice period (e.g., 4 hours)

4. **Customize Booking Page**
   - Add description: "We'll walk through your current workflow and identify 5-10 automation opportunities."
   - Add questions (optional):
     - "Tell me about your business"
     - "What's your biggest challenge right now?"
   - Branding: Upload logo, set colors

5. **Get Booking Link**
   - Copy your Cal.com event URL (e.g., cal.com/yourname/audit)
   - This is what you'll integrate into Typebot

6. **Connect to Typebot**
   - Go back to Typebot
   - In the Cal.com block, paste your booking URL
   - Test the integration

---

#### STEP 3: Set Up Make.com Automation (25 minutes)

**What This Does**: When someone books via the chatbot, automatically:
1. Log their info to Google Sheets
2. Send confirmation email
3. (Optional) Send SMS reminder 24 hours before

1. **Sign up for Make.com**
   - Go to https://make.com
   - Create account (free tier: 1,000 operations/month)

2. **Create New Scenario**
   - Click "Create a new scenario"
   - Name it "Chatbot → Sheets + Email"

3. **Add Typebot Webhook Trigger**
   - Search for "Webhooks" module
   - Choose "Custom webhook"
   - Copy the webhook URL Make provides
   - Go to Typebot → Settings → Webhooks
   - Paste Make webhook URL
   - Configure to send data on form completion

4. **Add Google Sheets Module**
   - Search for "Google Sheets"
   - Choose "Add a row"
   - Connect your Google account
   - Create a new spreadsheet: "Lead Database"
   - Columns: Name | Email | Phone | Intent | Timeline | Booking Time | Date Submitted
   - Map Typebot variables to spreadsheet columns:
     - Name → {{name}}
     - Email → {{email}}
     - Phone → {{phone}}
     - Intent → {{intent}}
     - Timeline → {{timeline}}
     - Booking Time → {{booking_time}}
     - Date Submitted → {{now}}

5. **Add Email Module (Confirmation)**
   - Search for "Email" or "Gmail"
   - Choose "Send an email"
   - To: {{email}}
   - Subject: "Your consultation with [Business Name] is confirmed!"
   - Body:
   ```
   Hi {{name}},

   Thanks for booking a consultation with us!

   📅 Date/Time: {{booking_time}}
   📍 Location: [Zoom link will be sent separately]

   We'll walk through your current workflow and show you how to automate [their intent].

   Looking forward to it!

   Best,
   [Your Name]
   [Business Name]
   ```

6. **Test the Scenario**
   - Click "Run once"
   - Go to your Typebot and submit a test form
   - Check that:
     - Data appears in Google Sheets
     - Confirmation email is sent
   - Debug any errors

7. **Activate the Scenario**
   - Click "Scheduling" → Turn ON
   - Save scenario

---

#### STEP 4: (Optional) Add SMS Reminder (20 minutes)

**Note**: Skip this for initial demo if you want to keep it simple. You can add it later when showing real implementations.

1. **Sign up for Twilio Trial**
   - Go to https://twilio.com
   - Create account (free trial with $15 credit)
   - Get a phone number (free trial number)

2. **Create Make.com SMS Scenario**
   - New scenario: "24hr Appointment Reminder"
   - Trigger: "Schedule" → Set to run daily at 9am
   - Filter: Google Sheets → Find rows where booking date = tomorrow
   - Action: Twilio → Send SMS
   - To: {{phone}}
   - Message:
   ```
   Hi {{name}}, reminder: You have a consultation with [Business Name] tomorrow at {{booking_time}}.

   Zoom link: [link]

   Reply CANCEL to reschedule.
   ```

3. **Test & Activate**

---

### Demo Script for Chatbot

**During Audit (Show Screen Share):**

> "Let me show you what this looks like in action. Imagine this is your website..."
>
> [Open Typebot demo in browser]
>
> "When someone lands on your site, they see this friendly AI assistant pop up. Let me walk through what a visitor would experience..."
>
> [Walk through the flow, filling in sample data]
>
> "Notice how it:
> 1. Greets them instantly (even at 2am when you're sleeping)
> 2. Asks qualifying questions so you know their budget and timeline
> 3. Books them directly into your calendar (no back-and-forth emails)
> 4. Sends a confirmation email automatically
>
> And here's the best part..."
>
> [Open Google Sheets]
>
> "Every lead is logged here with all their info. You can see exactly who's interested, when they want to start, and what they need."
>
> [Open Make.com scenario]
>
> "This is the automation behind the scenes. When someone books, it triggers this workflow that handles everything automatically."
>
> "For your business specifically, we'd customize the questions to ask about [their industry-specific qualifier], and integrate this with your existing calendar and CRM."
>
> "How many leads per week do you think you could capture if you had instant responses 24/7?"

---

## 📋 Demo Automation #2: Appointment Reminder System

### What It Does
- Sends email confirmation when appointment is booked
- Sends SMS 24 hours before appointment
- Sends final SMS 2 hours before
- Sends post-appointment thank you + review request

### Tech Stack

**Calendar**: Cal.com (already set up)
**Automation**: Make.com (already set up)
**SMS**: Twilio (trial account)
**Email**: Gmail or SendGrid (free tier)

---

### Step-by-Step Setup (45 minutes)

#### STEP 1: Create Reminder Workflows in Make.com

**Workflow 1: 24-Hour Reminder**

1. **Create New Scenario**: "24hr SMS Reminder"

2. **Trigger: Schedule**
   - Set to run daily at 9am

3. **Module 1: Google Sheets → Search Rows**
   - Spreadsheet: "Lead Database"
   - Search for rows where:
     - Booking Date = {{addDays(now, 1)}} (tomorrow)
     - Reminder Sent = "No" (track to avoid duplicates)

4. **Module 2: Twilio → Send SMS**
   - To: {{phone}}
   - Message:
   ```
   Hi {{name}}! Reminder: You have an appointment with [Business Name] tomorrow at {{booking_time}}.

   Location: [Zoom link or address]

   Reply CANCEL if you need to reschedule.

   See you soon!
   ```

5. **Module 3: Google Sheets → Update Row**
   - Mark "Reminder Sent" = "Yes" (prevent duplicate sends)

**Workflow 2: 2-Hour Reminder**

1. Create similar scenario but:
   - Search for appointments in 2 hours
   - Different message:
   ```
   Quick reminder: Your appointment with [Business Name] starts in 2 hours ({{booking_time}}).

   Zoom link: [link]

   See you soon!
   ```

**Workflow 3: Post-Appointment Thank You**

1. Trigger: 1 hour after appointment time

2. Send email:
   ```
   Subject: Thanks for meeting with us!

   Hi {{name}},

   Thanks for taking the time to meet with us today! I hope you found our conversation helpful.

   If you have any questions, feel free to reply to this email.

   And if you enjoyed working with us, we'd love a quick review:
   [Google Review Link / Yelp Link]

   Thanks again!

   Best,
   [Your Name]
   ```

---

### Demo Script for Reminders

**During Audit (Show Make.com Dashboard):**

> "Here's the reminder system. Once someone books an appointment, they automatically get:
>
> 1. An immediate confirmation email
> 2. A text message 24 hours before (here's what it looks like)..." [Show SMS screenshot]
> 3. A final text 2 hours before
> 4. After the meeting, a thank you email with a review request
>
> "Industry data shows this reduces no-shows by 40-60%. If you're currently at [their no-show rate], this alone could save you [X] hours/week and recapture $[X]/month in lost revenue."
>
> "And the best part? Once it's set up, it runs completely on autopilot. You never have to think about it."

---

## 📋 Demo Automation #3: FAQ Auto-Responder

### What It Does
- AI chatbot trained on business's top 20 FAQs
- Answers questions instantly
- Escalates to human for complex questions
- Available 24/7

### Tech Stack

**Chatbot**: Typebot (already set up) with custom knowledge base
**Alternative**: Voiceflow with GPT integration
**Knowledge Base**: Google Doc or Notion page

---

### Step-by-Step Setup (30 minutes)

#### STEP 1: Create FAQ Knowledge Base

1. **Create Google Doc**: "FAQ Knowledge Base Template"

2. **Add Common Business FAQs** (Customize for different industries)

**General Business FAQs:**
```
Q: What are your hours?
A: We're open Monday-Friday 9am-5pm, Saturday 10am-2pm. Closed Sundays.

Q: How much do your services cost?
A: Our pricing varies based on your needs. [Service 1] starts at $X, [Service 2] starts at $Y. Book a free consultation to get a custom quote.

Q: Do you offer [specific service]?
A: Yes! We specialize in [service]. Here's what we offer: [brief description]. Want to learn more? Book a call here: [link]

Q: How long does [process] take?
A: Typically [timeframe], depending on [factors]. During your consultation, we'll give you a detailed timeline.

Q: Do you serve [location]?
A: Yes, we serve [service area]. We also work with clients nationwide remotely.

Q: How do I get started?
A: Easy! Just book a free consultation here: [Cal.com link]. We'll discuss your needs and create a custom plan.

Q: What makes you different from competitors?
A: [Unique value proposition — e.g., "We focus on small businesses and offer personalized service, not cookie-cutter solutions."]

Q: Do you have testimonials or reviews?
A: Absolutely! Check out our Google reviews here: [link]. We have [X] 5-star reviews from happy clients.
```

**Industry-Specific Examples:**

*Real Estate:*
```
Q: Are you a buyer's agent or seller's agent?
A: Both! We represent buyers and sellers in the [location] area.

Q: What's the current market like?
A: Great question! The [location] market is [current trend]. Book a call and I'll give you a detailed market analysis for your area.

Q: How much is my home worth?
A: I'd love to give you a free home valuation! Book a call here: [link]
```

*Dental:*
```
Q: Do you accept my insurance?
A: We accept most major insurance plans including [list]. Call us at [phone] to verify your specific plan.

Q: Do you offer emergency appointments?
A: Yes! For dental emergencies, call us at [phone] and we'll get you in as soon as possible.

Q: Is this procedure covered by insurance?
A: Most plans cover [procedure] at [X]%. We'll verify your coverage before your appointment.
```

---

#### STEP 2: Build FAQ Chatbot in Typebot

**Option A: Simple Button-Based FAQ**

1. Create new Typebot: "FAQ Assistant"

2. Opening message:
   ```
   Hi! I'm here to answer your questions about [Business Name]. What would you like to know?
   ```

3. Add buttons for top 5-7 questions:
   - "What are your hours?"
   - "How much does it cost?"
   - "How do I get started?"
   - "Do you serve my area?"
   - "Something else"

4. For each button, add a text block with the answer

5. After each answer, add:
   ```
   "Did that answer your question?"
   [Yes | No, I need to talk to someone]
   ```

6. If "No" → Collect email/phone and say: "No problem! Someone from our team will reach out within 24 hours. What's your email?"

**Option B: AI-Powered FAQ (More Advanced)**

1. Use Voiceflow instead of Typebot

2. Connect OpenAI API (GPT-4 or GPT-3.5)

3. Upload FAQ knowledge base as context

4. Configure AI to:
   - Answer questions based on knowledge base
   - Stay on topic (business-related only)
   - Escalate to human if question is too complex
   - Always end with CTA ("Want to book a call?")

**For Demo Purposes**: Start with Option A (simpler, more reliable for live demos)

---

### Demo Script for FAQ Bot

**During Audit (Show Live Typebot):**

> "This is the FAQ assistant. Let me show you how it handles common questions..."
>
> [Click through 2-3 FAQ examples]
>
> "See how it answers instantly? Even at midnight on a Sunday. And if someone asks something it can't answer, it collects their contact info and notifies you."
>
> "For your business, we'd load in answers to your top 20 questions. Based on what you told me earlier, that would probably include [their specific FAQs]."
>
> "This alone could save you [X] hours/week that you're currently spending answering the same questions over and over."
>
> "And it improves customer satisfaction because they get instant answers instead of waiting hours for an email response."

---

## 🎨 Demo Presentation Strategy

### Before the Audit Call

1. **Prepare 3 Demo Tabs**:
   - Tab 1: Typebot chatbot (lead qualification)
   - Tab 2: Make.com dashboard (automation workflows)
   - Tab 3: Google Sheets (lead database)
   - Tab 4: Typebot FAQ bot

2. **Have Sample Data Ready**:
   - Pre-fill spreadsheet with 5-10 sample leads
   - Show what data looks like when collected

3. **Customize for Their Industry**:
   - Swap out questions in chatbot to match their business
   - Change business name placeholders
   - Update FAQ examples to their industry

### During the Demo (20 minutes of the 90-minute audit)

**Timing Breakdown**:
- 5 min: Show chatbot in action (fill out live)
- 3 min: Show Make.com automation workflow
- 2 min: Show Google Sheets data capture
- 5 min: Show reminder system workflow
- 3 min: Show FAQ bot
- 2 min: Answer their questions

**Demo Flow**:
1. "Let me show you what this looks like in your business..."
2. Walk through chatbot as if you're a customer
3. Show backend automation (Make.com)
4. Show data collection (Google Sheets)
5. Relate it back to their pain points: "Remember when you said you lose leads because you can't respond fast enough? This solves that."

---

## 📊 Demo Success Metrics

**What Prospects Should See**:
- ✅ Working automation (not just slides)
- ✅ Professional, modern UI
- ✅ Customizable for their business
- ✅ Clear ROI (time saved, revenue impact)
- ✅ Simple to use once set up

**Conversion Boosters**:
- Show them their name in the chatbot (personalization)
- Use their business name throughout
- Reference their specific pain points in the script
- Quantify the impact: "This would save you [X] hours/week"

---

## 🚀 Quick Setup Timeline

**Total Setup Time**: 3-4 hours

**Day 1 (2 hours):**
- [ ] Sign up for all tools (Typebot, Cal.com, Make.com, Twilio)
- [ ] Build chatbot flow in Typebot
- [ ] Set up Cal.com event type

**Day 2 (1.5 hours):**
- [ ] Create Make.com automation (Sheets + Email)
- [ ] Test end-to-end flow
- [ ] Build FAQ chatbot

**Day 3 (30 min):**
- [ ] Customize for 2-3 industry examples (real estate, dental, generic)
- [ ] Practice demo presentation
- [ ] Prepare talking points

---

## 💰 Total Demo Budget Breakdown

| Tool | Cost | Purpose |
|------|------|---------|
| Typebot | $0 (free tier) | Chatbot platform |
| Cal.com | $0 (free tier) | Calendar booking |
| Make.com | $0 (free tier) | Automation workflows |
| Google Sheets | $0 (free) | Data storage |
| Twilio | $0 (trial credit) | SMS reminders |
| Gmail | $0 (existing) | Email confirmations |
| **TOTAL** | **$0** | All free tiers |

**Upgrade Path for Real Clients** (when you start implementations):
- Make.com Pro: $9/mo (10,000 operations)
- Typebot Pro: $25/mo (unlimited chats)
- Twilio: Pay-as-you-go ($0.0075/SMS)

---

## 🎯 Next Steps

1. **Set up your demo stack** (3-4 hours, spread over 2 days)
2. **Practice the demo** (run through it 3-5 times alone)
3. **Customize for top 3 industries** (real estate, dental, professional services)
4. **Book your first audit** and show the demo live

**You're now ready to run professional AI workflow audits with working demos that close deals.**

---

**END OF DEMO SETUP GUIDE**
