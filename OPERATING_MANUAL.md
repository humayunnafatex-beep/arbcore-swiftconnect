# ARBCore SwiftConnect Operating Manual

ARBCore SwiftConnect is a WhatsApp business workspace for managing contacts, campaigns, message drafts, auto replies, CRM follow-up, and account settings.

## 1. Dashboard

The Dashboard is the main business overview. It shows live workspace activity such as connected WhatsApp numbers, messages sent, open conversations, active campaigns, contacts, auto-reply rules, and team members where the app has database data available.

Use it at the start of the day to check whether the workspace is healthy, whether message activity is happening, and where follow-up is needed.

## 2. Contacts

Contacts is the customer list. Each contact can store a name, WhatsApp phone number, email, source or segment, tags, status, and opt-in preference.

Use Contacts to add new leads, update customer details, search by name or phone, filter by status or tags, import CSV or Excel files, and remove test or unwanted records.

## 3. Campaigns

Campaigns is for planning bulk or segmented WhatsApp outreach. A campaign stores the campaign name, template, target segment, schedule, and sending status.

Use Campaigns to organize promotional messages, follow-up lists, and customer announcements before sending through a real WhatsApp Cloud API setup.

## 4. Send Messages

Send Messages is the message desk. It lets the team select or enter a phone number, write a message, preview the text, and record the send attempt.

If WhatsApp Cloud API is not configured, the app will not pretend a real message was sent. It will show that WhatsApp Cloud API is required to send real messages and can log the attempted message for review.

## 5. Auto Reply

Auto Reply manages keyword-based replies. A rule contains a trigger keyword, reply message, match mode, priority, and active/inactive status.

Use Auto Reply for common questions such as price, delivery, payment, order status, support, or unsubscribe requests. Active rules are ready to respond when webhook processing is connected.

## 6. CRM

CRM tracks sales opportunities and customer follow-up. Deals can be organized by lead stage, owner, value, next action, and due date.

Use CRM to move customers from new lead to interested, follow-up, won, or lost so the business team knows what action comes next.

## 7. Settings

Settings controls workspace configuration. Business Profile saves company name, workspace name, WhatsApp number, website, and timezone. WhatsApp/API Settings stores phone number ID, access token, verify token, and webhook URL. Notification and language preferences also save here.

Team Members lets owners and admins add users, change roles, deactivate users, and see friendly duplicate-email errors.

## 8. License

License shows the current plan, usage limits, and seat/message allowance for the workspace.

Use License to review whether the business is within its current package and what needs upgrading before higher-volume messaging.

## 9. What Works Without WhatsApp API

Without WhatsApp Cloud API, the app can still manage business settings, WhatsApp/API settings, contacts, team members, campaigns, CRM records, auto-reply rules, message drafts or attempted message logs, dashboard counts, and local AI-assisted text generation.

This is enough for preparing customer data, training the team, building message templates, and organizing the sales workflow.

## 10. What Requires WhatsApp Cloud API

Real WhatsApp sending requires WhatsApp Cloud API credentials and webhook setup. This includes delivering outbound messages to customers, receiving inbound WhatsApp messages automatically, processing delivery/read receipts, and triggering auto replies from real incoming customer messages.

Before production sending, confirm that the WhatsApp phone number ID, access token, verify token, webhook URL, and Meta webhook verification are fully configured.
