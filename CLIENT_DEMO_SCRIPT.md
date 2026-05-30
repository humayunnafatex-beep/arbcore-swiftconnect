# ARBCore SwiftConnect Client Demo Script

## Demo Flow Order

1. Dashboard
2. Contacts
3. Auto Reply
4. Send Messages
5. Settings
6. License

## 1. Opening

Assalamu Alaikum / Hello everyone.

Today I will walk you through **ARBCore SwiftConnect**, an **Enterprise Beta** CRM and WhatsApp automation platform for businesses that want to manage contacts, organize customer communication, prepare auto replies, and monitor activity from one dashboard.

This beta version is ready for controlled client testing. The core business modules are working, while advanced production features such as full billing enforcement, complete webhook automation, and expanded enterprise permissions can be added in the next phase.

## 2. Business Problem

Many businesses already use WhatsApp for customer communication, but the workflow is often scattered.

Common challenges include:

- Customer numbers stored in different places
- Manual follow-ups
- No clear customer history
- Repeated questions answered manually
- No dashboard for activity tracking
- No structured team workflow

ARBCore SwiftConnect brings these tasks into one simple workspace so the business can work in a more organized way.

## 3. Dashboard

First, we start with the **Dashboard**.

The dashboard gives the business owner a quick overview of workspace activity, including contacts, message activity, active auto-reply rules, team members, campaigns, and connected number information where available.

This helps the team quickly understand what is happening inside the system.

## 4. Contacts

Next, we open the **Contacts** module.

Here the business can manage customer records. We can add a new contact, edit contact information, delete a contact, search and filter records, and prevent duplicate phone numbers.

If something goes wrong, such as entering a duplicate phone number, the app shows a friendly message instead of a raw technical error. This keeps customer data cleaner and easier to manage.

## 5. Auto Reply

Now we move to **Auto Reply**.

This module lets the business create keyword-based reply rules. For example, if a customer asks about price, delivery, payment, or support, the team can prepare a saved response for that keyword.

In this beta version, users can create rules, edit rules, activate or deactivate rules, delete rules, and save the trigger keyword and reply message in the database.

This is useful for businesses that answer the same customer questions again and again.

## 6. Send Messages

Next is **Send Messages**.

This module is designed for WhatsApp message sending and message-attempt logging.

The important production-safety point is that the app **does not fake WhatsApp sending**. If WhatsApp Cloud API is not configured, the app clearly says:

> WhatsApp Cloud API is required to send real messages.

This means the system will only show a real send success after WhatsApp Cloud API accepts the message. Until then, the module is safe for beta testing and message preparation.

## 7. Settings

Now we open **Settings**.

Settings allows the business to manage the workspace profile, including business name, workspace name, phone number, website, timezone, language, notification preferences, and WhatsApp/API settings.

The WhatsApp/API section stores launch configuration such as Phone Number ID, Verify Token, Webhook URL, and Access Token. For security, the access token is hidden after refresh and is not exposed back in the user interface.

## 8. Team Management

Inside Settings, there is also **Team Management**.

Owners or admins can add team members, assign roles, update roles, and deactivate users.

The app handles duplicate email errors in a friendly way. For example, if the same email is added twice, it shows:

> A team member with this email already exists.

This makes the workflow cleaner and more client-ready.

## 9. License

The **License** page shows the current product status as **Enterprise Beta**.

It clearly explains that billing and license enforcement are not active in this beta version. This keeps expectations clear for early users, testers, and client stakeholders.

## 10. What Works Now

The following areas are currently working and production verified:

- Dashboard loads with real statistics
- Business Profile save and refresh
- WhatsApp/API Settings save and refresh
- WhatsApp access token stays hidden after refresh
- Contacts create, edit, delete, search, and duplicate-phone handling
- Auto Reply create, edit, activate, deactivate, and delete
- Team duplicate email friendly error
- Send Messages safety check
- License beta status
- Operating Manual and Launch Checklist

## 11. What Requires WhatsApp Cloud API

Real WhatsApp sending requires a proper WhatsApp Cloud API setup.

Required items include:

- WhatsApp Phone Number ID
- Access Token
- Verify Token
- Webhook URL
- Meta Business / WhatsApp Cloud API configuration

Without these items, the app will not pretend that real messages were sent.

## 12. Beta Limitations

This Enterprise Beta version does not yet include:

- Full billing automation
- Full license enforcement
- Complete inbound WhatsApp webhook automation
- Advanced campaign scheduling
- Advanced analytics
- Multi-workspace enterprise permission management

These items can be developed in the next production phase.

## 13. Closing

To summarize, **ARBCore SwiftConnect** is ready for controlled beta testing and client demonstration.

The core modules are working, the production build is stable, and the app is designed to be safe and honest about WhatsApp sending status.

The recommended next step is to connect real WhatsApp Cloud API credentials and test live sending with a small approved user group.

Thank you.
