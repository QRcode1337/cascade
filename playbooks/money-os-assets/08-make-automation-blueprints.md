# Make.com Automation Blueprints
**Copy-Paste Ready Automation Workflows**

---

## 🔧 Blueprint 1: Chatbot → Google Sheets + Email Confirmation

### Scenario Name
`Chatbot Lead Capture → Sheets + Email`

### Visual Flow
```
[Typebot Webhook] → [Google Sheets: Add Row] → [Gmail: Send Email]
```

---

### Module 1: Webhook Trigger

**Module**: Webhooks → Custom Webhook

**Configuration**:
```
Webhook Name: Typebot Lead Capture
Data Structure: Auto-determine from first request
```

**Setup Steps**:
1. Add "Webhooks" module to scenario
2. Choose "Custom webhook"
3. Click "Add" to create new webhook
4. Copy the webhook URL (you'll paste this in Typebot settings)
5. Save webhook

**Webhook URL Format**:
```
https://hook.us1.make.com/[your-unique-id]
```

---

### Module 2: Google Sheets - Add Row

**Module**: Google Sheets → Add a Row

**Configuration**:
```json
{
  "connection": "Your Google Account",
  "spreadsheet": "Lead Database",
  "sheet": "Sheet1",
  "values": {
    "Name": "{{1.name}}",
    "Email": "{{1.email}}",
    "Phone": "{{1.phone}}",
    "Intent": "{{1.intent}}",
    "Timeline": "{{1.timeline}}",
    "Booking Time": "{{1.booking_time}}",
    "Date Submitted": "{{formatDate(now; 'YYYY-MM-DD HH:mm:ss')}}",
    "Status": "New Lead",
    "Reminder Sent": "No"
  }
}
```

**Setup Steps**:
1. Click "+" to add new module
2. Search "Google Sheets"
3. Choose "Add a row"
4. Connect your Google account (authorize access)
5. Select spreadsheet: "Lead Database"
6. Select sheet: "Sheet1"
7. Map fields using the JSON above (click each field and select from Typebot webhook data)

**Google Sheets Column Headers** (create these first):
```
Name | Email | Phone | Intent | Timeline | Booking Time | Date Submitted | Status | Reminder Sent
```

---

### Module 3: Gmail - Send Confirmation Email

**Module**: Gmail → Send an Email

**Configuration**:
```json
{
  "connection": "Your Gmail Account",
  "to": "{{1.email}}",
  "subject": "Your consultation with [BUSINESS NAME] is confirmed!",
  "content": "See email template below",
  "attachments": []
}
```

**Email Template** (HTML):
```html
Hi {{1.name}},

Thanks for booking a consultation with [BUSINESS NAME]!

📅 <b>Appointment Details:</b>
Date/Time: {{1.booking_time}}
Duration: 30 minutes
Location: Zoom link will be sent 24 hours before

📋 <b>What to Expect:</b>
We'll walk through your current workflow and show you how to automate {{1.intent}}.

If you need to reschedule, just reply to this email.

Looking forward to speaking with you!

Best,
[YOUR NAME]
[BUSINESS NAME]
[PHONE NUMBER]
```

**Setup Steps**:
1. Click "+" to add new module
2. Search "Gmail" or "Email"
3. Choose "Send an email"
4. Connect your Gmail account
5. Fill in fields:
   - To: Click and select `{{1.email}}` from Typebot data
   - Subject: Type the subject line
   - Content: Paste email template above
   - Replace `{{1.name}}`, `{{1.booking_time}}`, etc. by clicking and selecting from Typebot data
6. Test the email send

---

### Testing the Scenario

**Step-by-Step Test**:
1. Click "Run once" in Make.com
2. Go to your Typebot chatbot
3. Fill out the form with test data
4. Check Make.com execution log (should show green checkmarks)
5. Verify Google Sheets has new row
6. Check email inbox for confirmation

**Troubleshooting**:
- ❌ Webhook not triggering: Check webhook URL is correct in Typebot settings
- ❌ Sheets error: Make sure column headers match exactly
- ❌ Email not sending: Verify Gmail connection is authorized

---

### Activate the Scenario

1. Click "Scheduling" toggle to ON
2. Set schedule: "Immediately as data arrives"
3. Save scenario
4. Scenario is now live!

---

## 🔧 Blueprint 2: 24-Hour Appointment Reminder (SMS)

### Scenario Name
`24hr SMS Reminder`

### Visual Flow
```
[Schedule: Daily 9am] → [Google Sheets: Search Rows] → [Filter] → [Twilio: Send SMS] → [Google Sheets: Update Row]
```

---

### Module 1: Schedule Trigger

**Module**: Tools → Schedule

**Configuration**:
```json
{
  "schedule": "Every day at 09:00",
  "timezone": "America/New_York"
}
```

**Setup**:
1. Add "Schedule" module
2. Choose "Every day"
3. Set time: 09:00
4. Set your timezone

---

### Module 2: Google Sheets - Search Rows

**Module**: Google Sheets → Search Rows (Advanced)

**Configuration**:
```json
{
  "spreadsheet": "Lead Database",
  "sheet": "Sheet1",
  "filter": {
    "Booking Date": "{{formatDate(addDays(now, 1); 'YYYY-MM-DD')}}",
    "Reminder Sent": "No"
  }
}
```

**Formula Explanation**:
- `addDays(now, 1)` = tomorrow's date
- `formatDate(..., 'YYYY-MM-DD')` = format as 2024-12-15
- Filter finds rows where appointment is tomorrow AND reminder not yet sent

**Setup**:
1. Add "Google Sheets" module
2. Choose "Search Rows (Advanced)"
3. Select spreadsheet and sheet
4. Add filter conditions:
   - Column: "Booking Date"
   - Condition: "Equal to"
   - Value: `{{formatDate(addDays(now, 1); 'YYYY-MM-DD')}}`
5. Add second filter:
   - Column: "Reminder Sent"
   - Condition: "Equal to"
   - Value: "No"

---

### Module 3: Iterator (for multiple appointments)

**Module**: Flow Control → Iterator

**Configuration**:
```
Array: {{2.array}}
```

This allows you to send SMS to multiple people if multiple appointments tomorrow.

---

### Module 4: Twilio - Send SMS

**Module**: Twilio → Send SMS Message

**Configuration**:
```json
{
  "connection": "Your Twilio Account",
  "to": "{{3.phone}}",
  "from": "YOUR_TWILIO_PHONE_NUMBER",
  "message": "Hi {{3.name}}! Reminder: You have an appointment with [BUSINESS NAME] tomorrow at {{3.booking_time}}.\n\nLocation: [ZOOM LINK or ADDRESS]\n\nReply CANCEL if you need to reschedule.\n\nSee you soon!"
}
```

**Setup**:
1. Sign up for Twilio (free trial with $15 credit)
2. Get a Twilio phone number
3. In Make.com, add "Twilio" module
4. Choose "Send SMS Message"
5. Connect Twilio account (enter Account SID and Auth Token)
6. From: Your Twilio number
7. To: `{{3.phone}}` (from Google Sheets iterator)
8. Message: Paste template above

---

### Module 5: Google Sheets - Update Row

**Module**: Google Sheets → Update a Row

**Configuration**:
```json
{
  "spreadsheet": "Lead Database",
  "sheet": "Sheet1",
  "row_number": "{{3.__rowNumber}}",
  "values": {
    "Reminder Sent": "Yes",
    "Reminder Sent Date": "{{formatDate(now; 'YYYY-MM-DD HH:mm:ss')}}"
  }
}
```

**Setup**:
1. Add "Google Sheets" module
2. Choose "Update a row"
3. Select spreadsheet and sheet
4. Row Number: `{{3.__rowNumber}}` (auto-detected from search)
5. Update fields:
   - Reminder Sent: "Yes"
   - Reminder Sent Date: Current timestamp

This prevents sending duplicate reminders.

---

### Testing

**Test Process**:
1. Add a test row to Google Sheets with tomorrow's date
2. Set "Reminder Sent" to "No"
3. Run scenario manually
4. Check that:
   - SMS is sent (check your phone)
   - Google Sheet updated to "Reminder Sent: Yes"

---

## 🔧 Blueprint 3: Post-Appointment Thank You + Review Request

### Scenario Name
`Post-Appointment Thank You Email`

### Visual Flow
```
[Schedule: Daily 10am] → [Google Sheets: Search] → [Filter: Yesterday's Appointments] → [Gmail: Send Thank You]
```

---

### Module 1: Schedule

**Configuration**:
```
Every day at 10:00 AM
```

---

### Module 2: Google Sheets - Search Rows

**Filter**:
```
Booking Date = {{formatDate(addDays(now, -1); 'YYYY-MM-DD')}}
Thank You Sent = No
```

Finds appointments from yesterday that haven't received thank you email.

---

### Module 3: Gmail - Send Thank You Email

**Email Template**:
```
Subject: Thanks for meeting with us, {{name}}!

Hi {{name}},

Thanks for taking the time to meet with us yesterday! I hope you found our conversation helpful.

If you have any questions about [what you discussed], feel free to reply to this email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you enjoyed working with us, we'd love a quick review! ⭐

👉 Leave a review: [YOUR GOOGLE REVIEW LINK]

Your feedback helps us serve more businesses like yours.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thanks again!

Best,
[YOUR NAME]
[BUSINESS NAME]
[PHONE] | [WEBSITE]
```

---

### Module 4: Update Google Sheets

**Update**:
```
Thank You Sent = Yes
Thank You Sent Date = {{now}}
```

---

## 🚀 Quick Start Checklist

### Before You Start (5 minutes)
- [ ] Sign up for Make.com (free account)
- [ ] Sign up for Typebot (free account)
- [ ] Sign up for Cal.com (free account)
- [ ] Sign up for Twilio (trial account)
- [ ] Create Google Sheet named "Lead Database"

### Scenario #1: Lead Capture (30 min)
- [ ] Create new scenario in Make.com
- [ ] Add Webhook module → Copy webhook URL
- [ ] Add Google Sheets "Add Row" module → Connect account
- [ ] Add Gmail "Send Email" module → Connect account
- [ ] Configure all mappings (name, email, phone, etc.)
- [ ] Test with sample Typebot submission
- [ ] Activate scenario

### Scenario #2: SMS Reminders (20 min)
- [ ] Create new scenario in Make.com
- [ ] Add Schedule module → Set to 9am daily
- [ ] Add Google Sheets "Search Rows" → Filter for tomorrow's appointments
- [ ] Add Iterator module
- [ ] Add Twilio "Send SMS" → Connect Twilio account
- [ ] Add Google Sheets "Update Row" → Mark reminder sent
- [ ] Test with sample data
- [ ] Activate scenario

### Scenario #3: Thank You Email (15 min)
- [ ] Create new scenario in Make.com
- [ ] Add Schedule module → Set to 10am daily
- [ ] Add Google Sheets "Search Rows" → Filter for yesterday's appointments
- [ ] Add Gmail "Send Email" → Thank you template
- [ ] Add Google Sheets "Update Row" → Mark thank you sent
- [ ] Test with sample data
- [ ] Activate scenario

---

## 📊 Expected Resource Usage (Free Tiers)

### Make.com Free Tier: 1,000 operations/month

**Operation Count**:
- Lead capture: 3 operations per lead (webhook + sheets + email)
- SMS reminder: 4 operations per appointment (schedule + search + SMS + update)
- Thank you: 4 operations per appointment (schedule + search + email + update)

**Example Monthly Usage**:
- 50 leads captured = 150 operations
- 50 appointments with reminders = 200 operations
- 50 thank you emails = 200 operations
- **Total: 550 operations** (well within free tier)

---

## 🎯 Customization Variables

**Replace these in all templates**:
- `[BUSINESS NAME]` → Your business name
- `[YOUR NAME]` → Your name
- `[PHONE NUMBER]` → Your phone
- `[WEBSITE]` → Your website
- `[ZOOM LINK or ADDRESS]` → Meeting location
- `[YOUR GOOGLE REVIEW LINK]` → Your Google Business review link
- `YOUR_TWILIO_PHONE_NUMBER` → Your Twilio number
- `YOUR_CAL_COM_LINK_HERE` → Your Cal.com booking link

---

## 🛠️ Troubleshooting Common Issues

### Issue: Webhook not receiving data
**Fix**:
1. Copy webhook URL from Make.com
2. Go to Typebot → Settings → Webhooks
3. Paste URL and click "Test webhook"
4. Make sure "Enabled" is checked

### Issue: Google Sheets permission error
**Fix**:
1. Go to Make.com connections
2. Reconnect Google Sheets
3. Make sure you grant "Edit" permissions (not just "View")

### Issue: Gmail not sending
**Fix**:
1. Check Gmail connection in Make.com
2. Make sure "Less secure app access" is enabled in Gmail (if using personal Gmail)
3. OR use App Password instead of regular password

### Issue: Twilio SMS not sending
**Fix**:
1. Verify Twilio phone number is SMS-capable
2. Check trial account restrictions (can only send to verified numbers during trial)
3. Verify phone number format: +1XXXXXXXXXX

---

## 📁 Template Files Provided

You now have:
1. ✅ Typebot flow templates (JSON)
2. ✅ Make.com blueprints (this file)
3. ✅ Email/SMS templates (next file)
4. ✅ Quick-start checklist (next file)

**Next: Setting up your accounts and importing these templates!**

---

**END OF MAKE.COM BLUEPRINTS**
