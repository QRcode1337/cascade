# Email & SMS Templates
**Ready-to-Use Message Templates for Automations**

---

## 📧 EMAIL TEMPLATES

### Email #1: Instant Booking Confirmation

**Subject**: Your consultation with [BUSINESS NAME] is confirmed! ✅

**Body** (HTML):
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">

  <p>Hi <strong>{{name}}</strong>,</p>

  <p>Thanks for booking a consultation with <strong>[BUSINESS NAME]</strong>!</p>

  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #2563eb;">📅 Appointment Details</h3>
    <p style="margin: 5px 0;"><strong>Date & Time:</strong> {{booking_time}}</p>
    <p style="margin: 5px 0;"><strong>Duration:</strong> 30 minutes</p>
    <p style="margin: 5px 0;"><strong>Location:</strong> Zoom link will be sent 24 hours before</p>
  </div>

  <h3 style="color: #2563eb;">📋 What to Expect</h3>
  <p>During our call, we'll:</p>
  <ul>
    <li>Walk through your current {{intent}} workflow</li>
    <li>Identify 5-10 automation opportunities</li>
    <li>Show you exactly how AI can save you 10+ hours/week</li>
    <li>Provide a custom roadmap (even if we don't work together)</li>
  </ul>

  <p style="margin-top: 30px;">If you need to reschedule, just reply to this email.</p>

  <p>Looking forward to speaking with you!</p>

  <p style="margin-top: 30px;">
    Best,<br>
    <strong>[YOUR NAME]</strong><br>
    [BUSINESS NAME]<br>
    [PHONE NUMBER]<br>
    <a href="[YOUR WEBSITE]">[YOUR WEBSITE]</a>
  </p>

</body>
</html>
```

**Plain Text Version**:
```
Hi {{name}},

Thanks for booking a consultation with [BUSINESS NAME]!

📅 APPOINTMENT DETAILS
━━━━━━━━━━━━━━━━━━━━
Date & Time: {{booking_time}}
Duration: 30 minutes
Location: Zoom link will be sent 24 hours before

📋 WHAT TO EXPECT
━━━━━━━━━━━━━━━━━━━━
During our call, we'll:
• Walk through your current {{intent}} workflow
• Identify 5-10 automation opportunities
• Show you exactly how AI can save you 10+ hours/week
• Provide a custom roadmap (even if we don't work together)

If you need to reschedule, just reply to this email.

Looking forward to speaking with you!

Best,
[YOUR NAME]
[BUSINESS NAME]
[PHONE NUMBER]
[YOUR WEBSITE]
```

---

### Email #2: 7-Day Confirmation (Week Before)

**Subject**: Quick reminder: We're meeting in 7 days

**Body**:
```
Hi {{name}},

Quick reminder: We have a consultation scheduled for {{booking_time}} (that's next {{day_of_week}}).

I'm looking forward to showing you how to automate your {{intent}} workflow and reclaim 10+ hours/week.

In the meantime, if you have any specific questions or pain points you'd like me to address during our call, feel free to reply to this email.

See you next week!

Best,
[YOUR NAME]
```

---

### Email #3: 24-Hour Reminder with Zoom Link

**Subject**: Tomorrow: Your consultation with [BUSINESS NAME]

**Body**:
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">

  <p>Hi <strong>{{name}}</strong>,</p>

  <p>Quick reminder: We're meeting <strong>tomorrow at {{booking_time}}</strong>.</p>

  <div style="background-color: #f0f9ff; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #2563eb;">🔗 Join the Meeting</h3>
    <p><a href="[ZOOM_LINK]" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Click to Join Zoom</a></p>
    <p style="margin-top: 15px; font-size: 14px; color: #666;">Meeting ID: [MEETING_ID]</p>
  </div>

  <h3>📋 To Prepare:</h3>
  <p>Think about your top 2-3 pain points related to:</p>
  <ul>
    <li>Lead follow-up and response times</li>
    <li>Appointment scheduling and no-shows</li>
    <li>Repetitive customer questions</li>
    <li>Manual admin work eating up your time</li>
  </ul>

  <p>The more specific you can be, the more tailored our recommendations will be!</p>

  <p style="margin-top: 30px;">See you tomorrow!</p>

  <p>
    Best,<br>
    <strong>[YOUR NAME]</strong><br>
    [PHONE NUMBER]
  </p>

</body>
</html>
```

---

### Email #4: Post-Appointment Thank You + Review Request

**Subject**: Thanks for meeting with us, {{name}}!

**Body**:
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">

  <p>Hi <strong>{{name}}</strong>,</p>

  <p>Thanks for taking the time to meet with us yesterday! I hope you found our AI workflow audit helpful.</p>

  <p>As promised, I've attached your personalized audit report with:</p>
  <ul>
    <li>5-10 automation opportunities we identified</li>
    <li>Estimated time savings and ROI</li>
    <li>3 implementation options (DIY, Guided, Done-For-You)</li>
  </ul>

  <p>If you have any questions about the report or want to discuss next steps, just reply to this email or text me at [PHONE].</p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #d97706;">⭐ Enjoyed our conversation?</h3>
    <p>If you found value in our audit, we'd love a quick review!</p>
    <p>Your feedback helps us serve more businesses like yours.</p>
    <p style="margin-top: 15px;">
      <a href="[YOUR_GOOGLE_REVIEW_LINK]" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Leave a Review</a>
    </p>
  </div>

  <p style="margin-top: 30px;">Thanks again!</p>

  <p>
    Best,<br>
    <strong>[YOUR NAME]</strong><br>
    [BUSINESS NAME]<br>
    [PHONE] | [WEBSITE]
  </p>

</body>
</html>
```

---

### Email #5: No-Show Follow-Up

**Subject**: We missed you today - want to reschedule?

**Body**:
```
Hi {{name}},

I noticed we didn't connect today for our scheduled consultation at {{booking_time}}.

No worries! Things come up.

If you'd still like to discuss automating your {{intent}} workflow and reclaiming 10+ hours/week, I'd be happy to reschedule.

Just reply to this email with a few times that work for you, or book directly here:
[CALENDAR_LINK]

If now's not the right time, no problem. Feel free to reach out whenever you're ready.

Best,
[YOUR NAME]
[PHONE]
```

---

## 📱 SMS TEMPLATES

### SMS #1: Instant Booking Confirmation

**Trigger**: Immediately after booking

**Message**:
```
Hi {{name}}! Your consultation with [BUSINESS NAME] is confirmed for {{booking_time}}. You'll get a Zoom link 24hrs before. Reply CANCEL to reschedule.
```

**Character Count**: 145 (under 160-char SMS limit)

---

### SMS #2: 24-Hour Reminder

**Trigger**: 24 hours before appointment

**Message**:
```
Hi {{name}}! Reminder: You have an appointment with [BUSINESS NAME] tomorrow at {{booking_time}}.

Zoom link: [ZOOM_LINK]

Reply CANCEL if you need to reschedule.

See you soon!
```

**Character Count**: ~180 (may split into 2 SMS messages depending on link length)

**Alternative (Shorter)**:
```
Tomorrow {{booking_time}}: Your consultation with [BUSINESS NAME]. Zoom link: [SHORTENED_LINK]. Reply CANCEL to reschedule.
```

---

### SMS #3: 2-Hour Final Reminder

**Trigger**: 2 hours before appointment

**Message**:
```
Quick reminder: Your appointment with [BUSINESS NAME] starts in 2 hours ({{booking_time}}).

Zoom: [ZOOM_LINK]

See you soon!
```

---

### SMS #4: Post-Appointment Thank You

**Trigger**: 1 hour after appointment end time

**Message**:
```
Thanks for meeting with us, {{name}}! Your audit report has been emailed. Questions? Reply here or call [PHONE].

Love to help? Leave a review: [SHORT_REVIEW_LINK]
```

---

### SMS #5: No-Show Follow-Up

**Trigger**: 1 hour after missed appointment

**Message**:
```
Hi {{name}}, we missed you today at {{booking_time}}. Want to reschedule? Reply YES and I'll send you new times. No worries if you need to postpone!

- [YOUR NAME]
```

---

## 🎨 INDUSTRY-SPECIFIC VARIATIONS

### Real Estate Agent

**Booking Confirmation Email Subject**:
`Your home buying/selling consultation is confirmed!`

**Email Body Addition**:
```
During our call, I'll provide:
• Current market analysis for {{target_area}}
• Pricing strategy for your home
• Timeline and next steps
• Answers to all your questions

Please have ready:
• Your address (if selling)
• Your must-haves (if buying)
• Any specific questions about the process
```

---

### Dental Practice

**Booking Confirmation Email Subject**:
`Your dental appointment is confirmed!`

**Email Body Addition**:
```
📋 Before Your Visit:
• Please arrive 10 minutes early for new patient paperwork
• Bring your insurance card and ID
• List any medications you're currently taking
• Let us know about dental anxiety - we're here to help!

📍 Location:
[PRACTICE ADDRESS]
[PARKING INSTRUCTIONS]

Need to reschedule? Call us at [PHONE] or reply to this email.
```

**SMS Reminder**:
```
Hi {{name}}! Reminder: Dental appointment tomorrow at {{booking_time}} with Dr. [NAME]. Address: [SHORT_ADDRESS]. Reply CANCEL to reschedule.
```

---

### Restaurant Reservations

**Booking Confirmation Email Subject**:
`Your table at [RESTAURANT NAME] is reserved!`

**Email Body**:
```
Hi {{name}},

Your reservation is confirmed!

📅 Date: {{booking_date}}
🕐 Time: {{booking_time}}
👥 Party Size: {{party_size}}
📍 Location: [RESTAURANT ADDRESS]

We're looking forward to serving you!

Special requests or dietary restrictions? Reply to this email.

See you soon!

[RESTAURANT NAME]
[PHONE]
```

**SMS (24hr Reminder)**:
```
Hi {{name}}! Your table at [RESTAURANT] is reserved tomorrow at {{booking_time}} for {{party_size}}. Reply CANCEL to modify.
```

---

## 🔧 TEMPLATE CUSTOMIZATION GUIDE

### Variables to Replace

**Business Information**:
- `[BUSINESS NAME]` → Your business name
- `[YOUR NAME]` → Your full name
- `[PHONE NUMBER]` → Your phone (format: +1-555-123-4567)
- `[YOUR WEBSITE]` → Your website URL
- `[PRACTICE ADDRESS]` → Physical address (if applicable)

**Dynamic Variables (from Typebot/CRM)**:
- `{{name}}` → Lead's first name
- `{{email}}` → Lead's email
- `{{phone}}` → Lead's phone
- `{{booking_time}}` → Appointment date/time
- `{{intent}}` → What they're interested in
- `{{timeline}}` → Their timeline (this week, this month, etc.)
- `{{day_of_week}}` → Monday, Tuesday, etc.

**Meeting Information**:
- `[ZOOM_LINK]` → Your Zoom meeting URL
- `[MEETING_ID]` → Zoom meeting ID
- `[CALENDAR_LINK]` → Your Cal.com or Calendly link

**Review Links**:
- `[YOUR_GOOGLE_REVIEW_LINK]` → Your Google Business review URL
- `[SHORT_REVIEW_LINK]` → Shortened review link (use bit.ly or tinyurl)

---

## 📊 Email vs. SMS Decision Matrix

| Use Case | Email | SMS | Both |
|----------|-------|-----|------|
| Instant booking confirmation | ✅ | ✅ | ✅ |
| 7-day reminder | ✅ | ❌ | - |
| 24-hour reminder | ✅ | ✅ | ✅ |
| 2-hour reminder | ❌ | ✅ | - |
| Post-appointment thank you | ✅ | ✅ | ✅ |
| Audit report delivery | ✅ | ❌ | - |
| Review request | ✅ | ✅ | ✅ |
| No-show follow-up | ✅ | ✅ | ✅ |

**Why Both?**
- Email = detailed info, links, attachments
- SMS = urgent reminders, high open rate (98% vs 20% email)

---

## 🎯 Best Practices

### Email Best Practices

✅ **Do**:
- Keep subject lines under 50 characters
- Use personalization ({{name}})
- Include clear CTA (calendar link, Zoom link)
- Make it skimmable (short paragraphs, bullets)
- Test on mobile (60%+ of emails opened on mobile)
- Include plain-text version (for spam filters)

❌ **Don't**:
- Use ALL CAPS or excessive exclamation points!!!
- Send attachments in first email (spam trigger)
- Include too many links (max 3-4)
- Forget to include unsubscribe link (if using email marketing tool)

---

### SMS Best Practices

✅ **Do**:
- Keep under 160 characters when possible
- Include business name in EVERY message
- Provide opt-out option ("Reply STOP to unsubscribe")
- Use URL shorteners for links
- Send during business hours (9am-8pm)

❌ **Don't**:
- Send promotional SMS without consent (illegal in US)
- Send after 9pm or before 8am
- Use emojis excessively
- Send more than 1 SMS per day (unless time-sensitive)

---

### Legal Compliance

**Email (CAN-SPAM)**:
- Include physical address in footer
- Provide clear unsubscribe option
- Honor opt-outs within 10 business days
- Don't use misleading subject lines

**SMS (TCPA)**:
- Get explicit consent before sending marketing SMS
- Transactional SMS (appointment reminders) usually exempt
- Include opt-out instructions ("Reply STOP")
- Keep records of consent

**GDPR (if serving EU customers)**:
- Get explicit consent for email/SMS
- Explain how data will be used
- Provide data deletion option
- Maintain consent records

---

## 📁 Template Files Included

You now have:
1. ✅ 5 Email templates (booking, reminders, thank you, no-show)
2. ✅ 5 SMS templates (booking, reminders, thank you, no-show)
3. ✅ Industry-specific variations (real estate, dental, restaurant)
4. ✅ Customization guide with all variables

**Next: Quick-start setup checklist!**

---

**END OF EMAIL & SMS TEMPLATES**
