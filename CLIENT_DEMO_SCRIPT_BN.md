# ARBCore SwiftConnect Client Demo Script (Bangla/Banglish)

## Demo Flow

1. Dashboard
2. Contacts
3. Auto Reply
4. Send Messages
5. Settings
6. License

## 1. Opening

Assalamu Alaikum / Hello everyone.

আজকে আমি আপনাদেরকে দেখাবো **ARBCore SwiftConnect**। এটি একটি **Enterprise Beta** CRM এবং WhatsApp automation platform, যা business owners এবং teams-দের customer communication আরও organized করতে সাহায্য করে।

এই beta version controlled testing এবং client demo-র জন্য ready. Core modules কাজ করছে, আর কিছু advanced production features যেমন full billing enforcement, complete WhatsApp webhook automation, advanced campaign scheduling এগুলো next phase-এ add করা যাবে।

## 2. Business Problem

বাংলাদেশের অনেক business customer communication-এর জন্য WhatsApp ব্যবহার করে। কিন্তু অনেক সময় পুরো process scattered থাকে।

Common problems:

- Customer number একেক জায়গায় থাকে
- Manual follow-up করতে হয়
- Customer history clear থাকে না
- একই question বারবার manually answer করতে হয়
- Team workflow organized না
- Business owner dashboard থেকে activity বুঝতে পারেন না

ARBCore SwiftConnect এই কাজগুলোকে এক জায়গায় আনতে সাহায্য করে।

## 3. What The App Solves

এই platform দিয়ে business team:

- Customer contacts manage করতে পারে
- WhatsApp communication workflow organize করতে পারে
- Common questions-এর জন্য auto-reply rules prepare করতে পারে
- Message attempt safely log করতে পারে
- Dashboard থেকে workspace activity দেখতে পারে
- Team members manage করতে পারে

এটি business communication-কে more structured, trackable, এবং safer করে।

## 4. Dashboard

প্রথমে আমরা **Dashboard** দেখব।

Dashboard থেকে business owner quick overview পায়:

- Total contacts
- Message activity
- Active auto-reply rules
- Team members
- Campaign বা connected number information, যেখানে data available

এতে team বুঝতে পারে system-এর ভিতরে কী activity হচ্ছে।

## 5. Contacts

এখন আমরা **Contacts** module দেখব।

এখানে customer records manage করা যায়। আমরা:

- New contact add করতে পারি
- Contact edit করতে পারি
- Contact delete করতে পারি
- Search এবং filter করতে পারি
- Duplicate phone number prevent করতে পারি

যদি same phone number আবার add করা হয়, app friendly error দেখায়। Raw database error দেখায় না। এতে customer data clean রাখা সহজ হয়।

## 6. Auto Reply

এখন আসি **Auto Reply** module-এ।

এই module দিয়ে keyword-based reply rules বানানো যায়। যেমন customer যদি "price", "delivery", "payment", বা "support" type করে, business আগে থেকেই একটি reply message prepare করে রাখতে পারে।

এই beta version-এ users:

- Auto-reply rule create করতে পারে
- Rule edit করতে পারে
- Rule activate/deactivate করতে পারে
- Rule delete করতে পারে
- Keyword এবং reply message database-এ save করতে পারে

যেসব business একই প্রশ্নের উত্তর বারবার দেয়, তাদের জন্য এটি খুব useful.

## 7. Send Messages

এখন আমরা **Send Messages** module দেখব।

এই module WhatsApp message sending workflow-এর জন্য তৈরি। কিন্তু এখানে একটি important production safety point আছে:

**App fake WhatsApp sending করে না।**

যদি WhatsApp Cloud API configure করা না থাকে, app clearly বলে:

> WhatsApp Cloud API is required to send real messages.

মানে, real WhatsApp provider response ছাড়া app কখনো "sent successfully" দেখাবে না।

WhatsApp Cloud API connect করা হলে এই module দিয়ে real message sending test করা যাবে।

## 8. Settings

এখন আমরা **Settings** module-এ যাব।

এখানে business configure করতে পারে:

- Business profile
- Workspace name
- Phone number
- Website
- Timezone
- Language
- Notification preferences
- WhatsApp/API settings

WhatsApp/API section-এ Phone Number ID, Verify Token, Webhook URL, এবং Access Token setup করা যায়। Security-এর জন্য access token refresh করার পর UI-তে full token দেখানো হয় না।

## 9. Team Management

Settings-এর ভিতরে **Team Management**-ও আছে।

এখানে owner/admin:

- Team member add করতে পারে
- Role assign করতে পারে
- Role update করতে পারে
- User deactivate করতে পারে

যদি duplicate email add করা হয়, app friendly message দেখায়:

> A team member with this email already exists.

এটি client-facing demo এবং beta testing-এর জন্য clean experience দেয়।

## 10. License

**License** page-এ product status clearly দেখানো আছে: **Enterprise Beta**.

এখানে বলা আছে যে billing বা license enforcement এই beta version-এ active না। এতে early client এবং tester-দের expectation clear থাকে।

## 11. What Works Now

Currently working and production verified:

- Dashboard real statistics সহ load হয়
- Business Profile save এবং refresh কাজ করে
- WhatsApp/API Settings save এবং refresh কাজ করে
- WhatsApp access token refresh-এর পর hidden থাকে
- Contacts create, edit, delete কাজ করে
- Duplicate contact phone friendly error দেখায়
- Auto Reply create, edit, activate, deactivate, delete কাজ করে
- Team duplicate email friendly error দেখায়
- Send Messages WhatsApp API ছাড়া fake success দেখায় না
- License page beta status দেখায়
- Operating Manual, Launch Checklist, এবং Demo Script ready

## 12. What Requires WhatsApp Cloud API

Real WhatsApp message send করতে WhatsApp Cloud API setup লাগবে।

Required items:

- WhatsApp Phone Number ID
- Access Token
- Verify Token
- Webhook URL
- Meta Business / WhatsApp Cloud API setup

এই setup ছাড়া app real message sent বলে claim করবে না।

## 13. Current Beta Limitations

এই Enterprise Beta version-এ এখনো কিছু limitation আছে:

- Full billing automation নেই
- Full license enforcement নেই
- Complete inbound WhatsApp webhook automation এখনো final না
- Advanced campaign scheduling limited
- Advanced analytics next phase-এ improve করা যাবে
- Multi-workspace enterprise permission system future phase-এর জন্য

## 14. Closing

Summary হিসেবে, **ARBCore SwiftConnect** এখন controlled beta testing এবং client demo-এর জন্য ready.

Core modules stable, production build ready, এবং WhatsApp sending behavior safe রাখা হয়েছে। App কখনো fake send success দেখায় না।

Next recommended step হলো real WhatsApp Cloud API credentials connect করে small approved user group-এর সাথে live message testing করা।

Thank you.
