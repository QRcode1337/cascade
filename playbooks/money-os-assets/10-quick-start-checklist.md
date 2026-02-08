# Quick-Start Setup Checklist
**Get Your Demos Running in 3-4 Hours**

---

## 🎯 Overview

**Goal**: Build 3 working demo automations by end of Day 2

**Total Time**: 3-4 hours (can be split across 2 days)

**Budget**: $0 (all free tiers)

**What You'll Have**:
- ✅ Lead qualification chatbot (live demo)
- ✅ Appointment reminder system (working workflow)
- ✅ FAQ auto-responder (ready to customize)
- ✅ Google Sheets lead database
- ✅ Professional presentation deck

---

## 📅 DAY 1: Account Setup & Chatbot (2 hours)

### HOUR 1: Create All Accounts (30 minutes)

**Tools to Sign Up For**:

#### 1. Typebot (5 min)
- [ ] Go to https://typebot.io
- [ ] Click "Sign up"
- [ ] Use GitHub or email signup
- [ ] Verify email
- [ ] **Save login**: Email + password in password manager

#### 2. Cal.com (5 min)
- [ ] Go to https://cal.com
- [ ] Click "Sign up for free"
- [ ] Connect your Google Calendar
- [ ] **Save login**: Email + password

#### 3. Make.com (5 min)
- [ ] Go to https://make.com
- [ ] Click "Sign up for free"
- [ ] Choose free plan (1,000 operations/month)
- [ ] Verify email
- [ ] **Save login**: Email + password

#### 4. Twilio (10 min)
- [ ] Go to https://twilio.com
- [ ] Click "Sign up for free"
- [ ] Complete phone verification
- [ ] Get free trial phone number
- [ ] **Copy**: Account SID, Auth Token, Phone Number
- [ ] **Save**: In a secure notes file

#### 5. Google Account Setup (5 min)
- [ ] Use existing Gmail or create new account
- [ ] Enable Google Sheets
- [ ] Enable Gmail API access (if using automation)

---

### HOUR 2: Build Google Sheets Database (15 minutes)

#### Create Lead Database Spreadsheet

1. **Create New Sheet**
   - [ ] Go to Google Sheets (sheets.google.com)
   - [ ] Click "Blank" to create new spreadsheet
   - [ ] Name it: "Lead Database"

2. **Add Column Headers** (Row 1):
   ```
   Name | Email | Phone | Intent | Timeline | Booking Time | Date Submitted | Status | Reminder Sent | Thank You Sent
   ```

3. **Format Columns**:
   - [ ] Select all columns → Right-click → "Resize columns" → 150 pixels
   - [ ] Make header row bold
   - [ ] Add background color to header row (light blue)

4. **Add Sample Data** (for testing):
   ```
   Row 2:
   John Smith | john@example.com | +15551234567 | consultation | this_week | 2024-12-20 10:00 AM | 2024-12-14 09:30 AM | New Lead | No | No

   Row 3:
   Jane Doe | jane@example.com | +15559876543 | quote | this_month | 2024-12-21 2:00 PM | 2024-12-14 10:15 AM | New Lead | No | No
   ```

5. **Get Sheet ID**:
   - [ ] Copy URL from browser
   - [ ] Extract Sheet ID (between /d/ and /edit)
   - [ ] Save this ID (you'll need it for Make.com)

---

### HOUR 3: Build Typebot Chatbot (45 minutes)

#### Step 1: Create New Typebot (5 min)

- [ ] Log into Typebot.io
- [ ] Click "Create a typebot"
- [ ] Choose "Start from scratch"
- [ ] Name it: "Lead Qualification Demo"

#### Step 2: Build the Flow (30 min)

**Block 1: Welcome Message**
- [ ] Add "Text" block
- [ ] Enter text:
  ```
  Hi there! 👋 I'm the AI assistant for [YOUR BUSINESS NAME].

  I can help you book a free consultation in under 60 seconds.

  Ready to get started?
  ```
- [ ] Add buttons: "Yes, let's do it!" and "Just browsing"

**Block 2: Name Input**
- [ ] Add "Text input" block
- [ ] Enter text: "Great! What's your name?"
- [ ] Variable name: `name`
- [ ] Placeholder: "John Smith"

**Block 3: Email Input**
- [ ] Add "Email input" block
- [ ] Enter text: "Thanks {{name}}! What's the best email to reach you?"
- [ ] Variable name: `email`
- [ ] Placeholder: "john@example.com"

**Block 4: Phone Input**
- [ ] Add "Phone input" block
- [ ] Enter text: "And your phone number? (We'll send you a confirmation text)"
- [ ] Variable name: `phone`
- [ ] Default country: US

**Block 5: Intent (Qualifying Question)**
- [ ] Add "Buttons" block
- [ ] Enter text: "How can we help you today?"
- [ ] Variable name: `intent`
- [ ] Add buttons:
  - "Book a consultation"
  - "Get a quote"
  - "Ask a question"
  - "Just browsing"

**Block 6: Timeline**
- [ ] Add "Buttons" block
- [ ] Enter text: "When are you looking to get started?"
- [ ] Variable name: `timeline`
- [ ] Add buttons:
  - "This week"
  - "This month"
  - "Next 3 months"
  - "Just researching"

**Block 7: Calendar Integration**
- [ ] Add "Cal.com" block (if available) OR "Text" block with link
- [ ] Enter text: "Perfect! Let's get you scheduled. Pick a time that works for you:"
- [ ] Cal.com URL: [YOUR CAL.COM LINK]
- [ ] Variable name: `booking_time`

**Block 8: Confirmation**
- [ ] Add "Text" block
- [ ] Enter text:
  ```
  You're all set, {{name}}! 🎉

  You'll receive a confirmation email at {{email}} and a text reminder 24 hours before.

  Looking forward to speaking with you!
  ```

#### Step 3: Customize Theme (5 min)

- [ ] Click "Theme" in left sidebar
- [ ] Choose color scheme (blue/professional recommended)
- [ ] Upload logo (optional)
- [ ] Choose font: Inter or Poppins
- [ ] Save theme

#### Step 4: Test the Flow (5 min)

- [ ] Click "Test" button (top right)
- [ ] Walk through entire conversation
- [ ] Verify all variables are captured
- [ ] Check that calendar booking works
- [ ] Fix any errors

---

### HOUR 4: Set Up Cal.com Calendar (15 minutes)

#### Create Event Type

1. **Basic Info**
   - [ ] Go to Cal.com dashboard
   - [ ] Click "Event Types" → "New Event Type"
   - [ ] Name: "Free AI Workflow Audit"
   - [ ] URL slug: `/audit` (your link will be cal.com/yourname/audit)
   - [ ] Duration: 90 minutes
   - [ ] Location: Google Meet or Zoom (auto-generated)

2. **Availability**
   - [ ] Set working hours: Mon-Fri 9am-5pm (adjust as needed)
   - [ ] Buffer time: 15 min before/after
   - [ ] Minimum notice: 4 hours
   - [ ] Date range: Rolling 30 days

3. **Booking Questions** (optional)
   - [ ] "Tell me about your business" (short text)
   - [ ] "What's your biggest challenge right now?" (long text)

4. **Branding**
   - [ ] Add description:
     ```
     We'll walk through your current workflow and identify 5-10 automation opportunities.

     You'll get a full roadmap + ROI projection — even if we don't work together.

     No cost, no obligation.
     ```
   - [ ] Upload logo (optional)
   - [ ] Choose color theme

5. **Get Booking Link**
   - [ ] Copy your Cal.com event URL
   - [ ] Save this link (you'll add it to Typebot)

6. **Connect to Typebot**
   - [ ] Go back to Typebot
   - [ ] Find Cal.com block
   - [ ] Paste your booking link
   - [ ] Save

---

**END OF DAY 1 ✅**

**What You've Built**:
- ✅ All accounts created
- ✅ Google Sheets database ready
- ✅ Typebot chatbot working
- ✅ Cal.com calendar configured
- ✅ End-to-end booking flow tested

**Time Spent**: ~2 hours

---

## 📅 DAY 2: Automation Workflows (1.5-2 hours)

### HOUR 1: Make.com Automation - Lead Capture (45 minutes)

#### Scenario 1: Typebot → Sheets + Email

**Step 1: Create Webhook (5 min)**

- [ ] Log into Make.com
- [ ] Click "Create a new scenario"
- [ ] Name it: "Chatbot Lead Capture"
- [ ] Add "Webhooks" module
- [ ] Choose "Custom webhook"
- [ ] Click "Add" to create webhook
- [ ] **Copy webhook URL**
- [ ] Go to Typebot → Settings → Webhooks
- [ ] Paste Make.com webhook URL
- [ ] Enable webhook
- [ ] Test webhook (send test data from Typebot)

**Step 2: Add Google Sheets Module (15 min)**

- [ ] In Make.com, click "+" after webhook
- [ ] Search "Google Sheets"
- [ ] Choose "Add a row"
- [ ] Click "Create a connection"
- [ ] Authorize Google account
- [ ] Select spreadsheet: "Lead Database"
- [ ] Select sheet: "Sheet1"
- [ ] Map columns:
  - Name → `{{1.name}}`
  - Email → `{{1.email}}`
  - Phone → `{{1.phone}}`
  - Intent → `{{1.intent}}`
  - Timeline → `{{1.timeline}}`
  - Booking Time → `{{1.booking_time}}`
  - Date Submitted → `{{formatDate(now; "YYYY-MM-DD HH:mm:ss")}}`
  - Status → "New Lead"
  - Reminder Sent → "No"
  - Thank You Sent → "No"

**Step 3: Add Email Module (15 min)**

- [ ] Click "+" after Google Sheets
- [ ] Search "Gmail" or "Email"
- [ ] Choose "Send an email"
- [ ] Authorize Gmail account
- [ ] Configure email:
  - To: `{{1.email}}`
  - Subject: "Your consultation with [BUSINESS NAME] is confirmed!"
  - Body: Copy from `09-email-sms-templates.md` → Email #1
  - Replace placeholders with variables from webhook
- [ ] Save

**Step 4: Test End-to-End (10 min)**

- [ ] Click "Run once" in Make.com
- [ ] Go to Typebot and submit test form
- [ ] Check Make.com execution log (should be green)
- [ ] Verify Google Sheets has new row
- [ ] Check email inbox for confirmation
- [ ] Fix any errors

**Step 5: Activate Scenario**

- [ ] Click "Scheduling" → Toggle ON
- [ ] Set to "Immediately as data arrives"
- [ ] Save scenario
- [ ] Scenario is now live!

---

### HOUR 2: SMS Reminder Automation (30 minutes)

#### Scenario 2: 24-Hour SMS Reminder

**Step 1: Create Schedule Trigger (5 min)**

- [ ] Create new scenario: "24hr SMS Reminder"
- [ ] Add "Schedule" module
- [ ] Set to run: Every day at 9:00 AM
- [ ] Choose your timezone

**Step 2: Search Google Sheets (10 min)**

- [ ] Add "Google Sheets" → "Search rows (advanced)"
- [ ] Select spreadsheet: "Lead Database"
- [ ] Add filter:
  - Column: "Booking Time"
  - Condition: Contains
  - Value: `{{formatDate(addDays(now, 1); "YYYY-MM-DD")}}`
    (This finds appointments tomorrow)
- [ ] Add second filter:
  - Column: "Reminder Sent"
  - Condition: Equal to
  - Value: "No"

**Step 3: Add Iterator (2 min)**

- [ ] Add "Flow Control" → "Iterator"
- [ ] Array: `{{2.array}}` (results from Google Sheets)

**Step 4: Send SMS via Twilio (10 min)**

- [ ] Add "Twilio" → "Send SMS"
- [ ] Create Twilio connection:
  - Account SID: [FROM YOUR TWILIO ACCOUNT]
  - Auth Token: [FROM YOUR TWILIO ACCOUNT]
- [ ] Configure SMS:
  - From: [YOUR TWILIO PHONE NUMBER]
  - To: `{{3.phone}}`
  - Message: Copy from `09-email-sms-templates.md` → SMS #2
  - Replace placeholders with `{{3.name}}`, `{{3.booking_time}}`, etc.

**Step 5: Update Google Sheets (3 min)**

- [ ] Add "Google Sheets" → "Update a row"
- [ ] Select spreadsheet: "Lead Database"
- [ ] Row number: `{{3.__rowNumber}}`
- [ ] Update values:
  - Reminder Sent: "Yes"

**Step 6: Test & Activate**

- [ ] Add test row to Google Sheets with tomorrow's date
- [ ] Run scenario manually
- [ ] Check that SMS is sent
- [ ] Verify Sheets updated to "Reminder Sent: Yes"
- [ ] Activate scenario

---

### HOUR 3: FAQ Bot (30 minutes)

#### Build FAQ Chatbot in Typebot

**Step 1: Create New Typebot (5 min)**

- [ ] Create new typebot: "FAQ Assistant"
- [ ] Add welcome message:
  ```
  Hi! I'm here to answer your questions about [BUSINESS NAME].

  What would you like to know?
  ```

**Step 2: Add FAQ Buttons (15 min)**

- [ ] Add "Buttons" block
- [ ] Add buttons for top FAQs:
  - "What are your hours?"
  - "How much does it cost?"
  - "How do I get started?"
  - "Do you serve my area?"
  - "Something else"

**Step 3: Add Answer Blocks (10 min)**

For each button, add a "Text" block with the answer:

**Hours:**
```
We're open Monday-Friday 9am-5pm, Saturday 10am-2pm. Closed Sundays.

Want to schedule a call? [CALENDAR LINK]
```

**Pricing:**
```
Our pricing varies based on your needs. Most projects start at $[X].

Book a free consultation to get a custom quote: [CALENDAR LINK]
```

**Getting Started:**
```
Easy! Just book a free consultation here: [CALENDAR LINK]

We'll discuss your needs and create a custom plan.
```

**Service Area:**
```
We serve the [DMV AREA] and work with clients nationwide remotely.

Want to discuss your project? [CALENDAR LINK]
```

**Something Else:**
```
No problem! Please leave your email and question below, and we'll get back to you within 24 hours.

[Collect email + question]
```

**Step 4: Test FAQ Bot**

- [ ] Click through each FAQ option
- [ ] Verify answers display correctly
- [ ] Test "Something else" form submission

---

**END OF DAY 2 ✅**

**What You've Built**:
- ✅ Lead capture automation (Typebot → Sheets → Email)
- ✅ 24-hour SMS reminder system
- ✅ FAQ auto-responder chatbot
- ✅ Full end-to-end demo ready

**Total Time Day 2**: 1.5-2 hours

---

## 🎬 DAY 3: Practice & Customize (30 minutes)

### Prepare for First Demo

**Step 1: Customize for Top 3 Industries (15 min)**

Create 3 versions of your chatbot with industry-specific questions:

**Version 1: Real Estate**
- [ ] Duplicate Typebot chatbot
- [ ] Rename: "Real Estate Lead Qualifier"
- [ ] Update qualifying questions:
  - "Buying or selling?"
  - "Budget range?"
  - "Timeline?"

**Version 2: Dental/Medical**
- [ ] Duplicate Typebot chatbot
- [ ] Rename: "Dental Practice Intake"
- [ ] Update qualifying questions:
  - "What brings you in?"
  - "Do you have insurance?"
  - "Preferred appointment time?"

**Version 3: Professional Services**
- [ ] Keep generic version as is
- [ ] Works for: consultants, agencies, B2B services

**Step 2: Practice Demo Presentation (10 min)**

- [ ] Open 4 browser tabs:
  1. Typebot chatbot (demo)
  2. Make.com dashboard (show automation)
  3. Google Sheets (show data capture)
  4. FAQ chatbot
- [ ] Walk through entire demo alone (practice talking through it)
- [ ] Time yourself (should be 15-20 min max)

**Step 3: Create Demo Talking Points (5 min)**

**For Each Automation, Prepare**:
1. Problem statement: "Right now you're losing X leads because..."
2. Solution demo: "Here's how it works..." [show live]
3. Impact statement: "This would save you X hours/week and $X/month"
4. Customization note: "For YOUR business, we'd customize it to..."

---

## ✅ FINAL CHECKLIST

### Before Your First Audit Call

**Technical Setup**:
- [ ] All 3 chatbots working (generic, real estate, dental)
- [ ] Make.com scenarios activated and tested
- [ ] Google Sheets database set up with sample data
- [ ] Cal.com calendar configured and linked
- [ ] Twilio SMS tested (sent yourself a test message)

**Demo Preparation**:
- [ ] 4 browser tabs bookmarked for demo
- [ ] Business name placeholders replaced in all templates
- [ ] Talking points written for each automation
- [ ] Practiced full demo at least 2x

**Materials Ready**:
- [ ] Audit methodology document (from `01-audit-methodology.md`)
- [ ] Proposal template (from `04-proposal-template.md`)
- [ ] Email templates customized with your info
- [ ] Sample audit report ready to show

**Account Logins Saved**:
- [ ] Typebot login saved
- [ ] Cal.com login saved
- [ ] Make.com login saved
- [ ] Twilio credentials saved
- [ ] Google account accessible

---

## 🎯 Success Metrics

**You're Ready When**:
- ✅ Can walk through full chatbot demo in <5 minutes
- ✅ Can explain Make.com automation in <3 minutes
- ✅ Can customize chatbot for any industry in <10 minutes
- ✅ End-to-end flow works without errors
- ✅ Feel confident showing it to prospects

---

## 🚨 Troubleshooting Common Issues

### Issue: Typebot webhook not receiving data
**Fix**:
- [ ] Copy webhook URL from Make.com
- [ ] Paste in Typebot → Settings → Webhooks
- [ ] Make sure "Enabled" is checked
- [ ] Test webhook with sample submission

### Issue: Google Sheets permission error
**Fix**:
- [ ] Reconnect Google Sheets in Make.com
- [ ] Grant "Edit" permissions (not just "View")
- [ ] Make sure sheet name matches exactly ("Lead Database")

### Issue: Twilio SMS not sending
**Fix**:
- [ ] Verify Account SID and Auth Token are correct
- [ ] Check phone number format: +1XXXXXXXXXX
- [ ] For trial accounts, verify recipient number is verified
- [ ] Check Twilio console for error messages

### Issue: Cal.com not showing in Typebot
**Fix**:
- [ ] Use direct link instead of integration
- [ ] Add "Text" block with Cal.com URL
- [ ] Use URL shortener (bit.ly) if link is too long

---

## 📊 Time Investment Summary

| Day | Tasks | Time | Status |
|-----|-------|------|--------|
| Day 1 | Account setup + Chatbot + Calendar | 2 hours | ⬜ |
| Day 2 | Automation workflows + FAQ bot | 1.5-2 hours | ⬜ |
| Day 3 | Practice + customize | 30 min | ⬜ |
| **TOTAL** | **Full demo system** | **3.5-4 hours** | ⬜ |

**ROI**: 3-4 hours investment → 3x higher close rate on audits → $1,200+ additional revenue per closed client

---

## 🎉 You're Done! What's Next?

1. ✅ **Day 1-2**: Set up all demos (using this checklist)
2. ✅ **Day 3**: Customize landing page with demo screenshots
3. ✅ **Day 4**: Start outreach (use templates from `02-outreach-email-templates.md`)
4. ✅ **Day 5-7**: Book and run first 3-5 audits

**You now have everything you need to start landing clients!**

---

**END OF QUICK-START CHECKLIST**
