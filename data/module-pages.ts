export type ModuleSlug =
  | "connect"
  | "contacts"
  | "campaigns"
  | "send-messages"
  | "ai-studio"
  | "auto-reply"
  | "crm"
  | "analytics"
  | "settings"
  | "license";

export type ModulePageConfig = {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  primaryAction: string;
  secondaryAction: string;
  stats: Array<{ label: string; value: string; helper: string; tone: "blue" | "green" | "violet" | "amber" }>;
  workflowTitle: string;
  workflow: Array<{ title: string; detail: string; status: string }>;
  cards: Array<{ title: string; value: string; detail: string; tone: "blue" | "green" | "violet" | "amber" }>;
  table: {
    title: string;
    columns: string[];
    rows: string[][];
  };
};

export const modulePages: Record<ModuleSlug, ModulePageConfig> = {
  connect: {
    eyebrow: "Connection Hub",
    title: "Manage WhatsApp business numbers",
    description: "Connect official channels, monitor quality, and keep number health ready for campaigns.",
    icon: "MessageCircle",
    primaryAction: "Add Number",
    secondaryAction: "Sync Now",
    stats: [
      { label: "Connected", value: "1", helper: "Official number online", tone: "green" },
      { label: "Quality Score", value: "92", helper: "Excellent reputation", tone: "blue" },
      { label: "Daily Limit", value: "10k", helper: "2,842 used today", tone: "violet" },
      { label: "Last Sync", value: "2m", helper: "Webhook active", tone: "amber" }
    ],
    workflowTitle: "Connection Checklist",
    workflow: [
      { title: "Business verification", detail: "Acme Digital Solutions verified", status: "Done" },
      { title: "Webhook status", detail: "Incoming messages routed to inbox", status: "Live" },
      { title: "Template namespace", detail: "Promo and service templates available", status: "Ready" }
    ],
    cards: [
      { title: "Primary Number", value: "+880 1712-345678", detail: "Bangladesh official channel", tone: "green" },
      { title: "Message Window", value: "24h", detail: "Customer care window active", tone: "blue" },
      { title: "API Status", value: "Operational", detail: "No failed webhook events", tone: "violet" }
    ],
    table: {
      title: "Connected Channels",
      columns: ["Channel", "Status", "Quality", "Owner"],
      rows: [
        ["Acme Official", "Connected", "Good", "Rasel Ahmed"],
        ["Seasonal Campaign", "Pending", "Review", "Marketing Team"],
        ["Support Backup", "Draft", "Not connected", "Support Team"]
      ]
    }
  },
  contacts: {
    eyebrow: "Contact Center",
    title: "Segment, tag, and manage customers",
    description: "Keep customer profiles organized for campaigns, CRM follow-ups, and support replies.",
    icon: "ContactRound",
    primaryAction: "Import Contacts",
    secondaryAction: "Create Segment",
    stats: [
      { label: "Total Contacts", value: "18,420", helper: "2,140 added this month", tone: "blue" },
      { label: "Opted In", value: "15,870", helper: "86.1% reachable", tone: "green" },
      { label: "Segments", value: "24", helper: "Active audience groups", tone: "violet" },
      { label: "Duplicates", value: "38", helper: "Needs cleanup", tone: "amber" }
    ],
    workflowTitle: "Audience Hygiene",
    workflow: [
      { title: "Import validation", detail: "Phone format and consent checked", status: "Active" },
      { title: "Smart tagging", detail: "Auto tags based on replies and purchases", status: "Live" },
      { title: "Duplicate review", detail: "38 contacts queued for merge", status: "Review" }
    ],
    cards: [
      { title: "Top Segment", value: "VIP Buyers", detail: "4,280 contacts", tone: "blue" },
      { title: "Highest Intent", value: "Interested", detail: "642 contacts in CRM", tone: "green" },
      { title: "Recent Import", value: "2,140", detail: "From May promo sheet", tone: "violet" }
    ],
    table: {
      title: "Recent Contacts",
      columns: ["Name", "Phone", "Segment", "Stage"],
      rows: [
        ["Sadia Rahman", "+880 1712-000111", "VIP Buyers", "Won"],
        ["Mahmudul Hasan", "+880 1712-000222", "New Leads", "Interested"],
        ["Nusrat Jahan", "+880 1712-000333", "Catalog Requests", "Follow-up"]
      ]
    }
  },
  campaigns: {
    eyebrow: "Campaign Command",
    title: "Plan and track WhatsApp campaigns",
    description: "Create template-based campaigns, schedule broadcasts, and monitor delivery performance.",
    icon: "Megaphone",
    primaryAction: "New Campaign",
    secondaryAction: "View Calendar",
    stats: [
      { label: "Active Campaigns", value: "12", helper: "Scheduled and running", tone: "violet" },
      { label: "Delivered", value: "94.8%", helper: "Last 7 days", tone: "green" },
      { label: "Replies", value: "3,284", helper: "18.6% response rate", tone: "blue" },
      { label: "Failed", value: "1.2%", helper: "Mostly invalid numbers", tone: "amber" }
    ],
    workflowTitle: "Campaign Flow",
    workflow: [
      { title: "Template selected", detail: "Promo - Special Offer", status: "Ready" },
      { title: "Audience locked", detail: "VIP Buyers and Interested leads", status: "Ready" },
      { title: "Send protection", detail: "Rate limit and opt-in checks enabled", status: "On" }
    ],
    cards: [
      { title: "Best Campaign", value: "Eid Promo", detail: "32.4% reply rate", tone: "green" },
      { title: "Next Schedule", value: "10:30 AM", detail: "Catalog follow-up", tone: "blue" },
      { title: "Template Pool", value: "18", detail: "Approved templates", tone: "violet" }
    ],
    table: {
      title: "Campaign Queue",
      columns: ["Campaign", "Audience", "Status", "Performance"],
      rows: [
        ["Eid Promo", "VIP Buyers", "Running", "94.8% delivered"],
        ["Catalog Follow-up", "Interested", "Scheduled", "10:30 AM"],
        ["Winback Offer", "Inactive 60d", "Draft", "Needs template"]
      ]
    }
  },
  "send-messages": {
    eyebrow: "Message Desk",
    title: "Send direct and bulk messages",
    description: "Compose personalized WhatsApp messages with previews, variables, and send controls.",
    icon: "Send",
    primaryAction: "Send Message",
    secondaryAction: "Save Draft",
    stats: [
      { label: "Sent Today", value: "2,842", helper: "28.6% above yesterday", tone: "blue" },
      { label: "Queued", value: "320", helper: "Next batch ready", tone: "violet" },
      { label: "Templates", value: "18", helper: "Approved and usable", tone: "green" },
      { label: "Drafts", value: "7", helper: "Need review", tone: "amber" }
    ],
    workflowTitle: "Composer Steps",
    workflow: [
      { title: "Choose audience", detail: "Segment or individual contacts", status: "Step 1" },
      { title: "Personalize message", detail: "Use name, offer, order, and link variables", status: "Step 2" },
      { title: "Preview and send", detail: "Validate template before sending", status: "Step 3" }
    ],
    cards: [
      { title: "Selected Template", value: "Promo Offer", detail: "Marketing category", tone: "blue" },
      { title: "Recipients", value: "1,248", detail: "New Leads segment", tone: "green" },
      { title: "Send Mode", value: "Staggered", detail: "Protect number quality", tone: "violet" }
    ],
    table: {
      title: "Message Drafts",
      columns: ["Draft", "Audience", "Owner", "Status"],
      rows: [
        ["Promo Offer", "New Leads", "Rasel Ahmed", "Ready"],
        ["Order Update", "Recent Buyers", "Support Team", "Review"],
        ["Payment Reminder", "Pending Payments", "Finance", "Draft"]
      ]
    }
  },
  "ai-studio": {
    eyebrow: "AI Studio",
    title: "Design assistant behavior and replies",
    description: "Tune the ARBI assistant for sales, support, campaign replies, and brand-safe responses.",
    icon: "Bot",
    primaryAction: "Create Assistant",
    secondaryAction: "Test Prompt",
    stats: [
      { label: "AI Credits", value: "48.5k", helper: "51.5k remaining", tone: "violet" },
      { label: "Suggestions", value: "1,326", helper: "Generated this week", tone: "blue" },
      { label: "Accepted", value: "82%", helper: "Agent approval rate", tone: "green" },
      { label: "Needs Review", value: "14", helper: "Flagged responses", tone: "amber" }
    ],
    workflowTitle: "Assistant Setup",
    workflow: [
      { title: "Brand voice", detail: "Helpful, concise, professional", status: "Set" },
      { title: "Knowledge source", detail: "Catalog, shipping, payment, policies", status: "Loaded" },
      { title: "Safety review", detail: "Human approval before auto-send", status: "Enabled" }
    ],
    cards: [
      { title: "Default Assistant", value: "ARBI Sales", detail: "Campaign and product queries", tone: "violet" },
      { title: "Fallback Mode", value: "Suggest Only", detail: "No auto-send for uncertain replies", tone: "blue" },
      { title: "Top Intent", value: "Pricing", detail: "38% of AI suggestions", tone: "green" }
    ],
    table: {
      title: "AI Test Runs",
      columns: ["Scenario", "Intent", "Result", "Reviewer"],
      rows: [
        ["Catalog request", "Product info", "Approved", "Rasel Ahmed"],
        ["Payment issue", "Support", "Approved", "Support Team"],
        ["Discount ask", "Sales", "Needs review", "Marketing"]
      ]
    }
  },
  "auto-reply": {
    eyebrow: "Automation Rules",
    title: "Automate common customer replies",
    description: "Use keyword rules and AI suggestions to answer repeat questions quickly and consistently.",
    icon: "Zap",
    primaryAction: "Add Rule",
    secondaryAction: "Test Reply",
    stats: [
      { label: "Active Rules", value: "36", helper: "Across sales and support", tone: "blue" },
      { label: "Resolved", value: "1,180", helper: "This week", tone: "green" },
      { label: "Avg Speed", value: "7s", helper: "From customer message", tone: "violet" },
      { label: "Conflicts", value: "3", helper: "Need rule priority review", tone: "amber" }
    ],
    workflowTitle: "Rule Governance",
    workflow: [
      { title: "Keyword matching", detail: "price, order, support, payment", status: "Live" },
      { title: "Business hours", detail: "Different reply outside support hours", status: "On" },
      { title: "Human handoff", detail: "Escalate high intent messages to team", status: "On" }
    ],
    cards: [
      { title: "Most Used Rule", value: "price", detail: "312 triggers this week", tone: "blue" },
      { title: "Best Outcome", value: "order", detail: "41% moved to CRM", tone: "green" },
      { title: "Review Queue", value: "12", detail: "AI suggestions pending", tone: "amber" }
    ],
    table: {
      title: "Reply Rules",
      columns: ["Keyword", "Reply Type", "Priority", "Status"],
      rows: [
        ["price", "Price list", "High", "Active"],
        ["order", "Order process", "High", "Active"],
        ["support", "Support hours", "Medium", "Active"]
      ]
    }
  },
  crm: {
    eyebrow: "CRM Pipeline",
    title: "Move conversations into revenue stages",
    description: "Track WhatsApp leads from first message to won deal with owners, notes, and next actions.",
    icon: "KanbanSquare",
    primaryAction: "Add Deal",
    secondaryAction: "Assign Leads",
    stats: [
      { label: "New Leads", value: "1,248", helper: "24.5% up this month", tone: "blue" },
      { label: "Interested", value: "642", helper: "Active follow-ups", tone: "green" },
      { label: "Follow-up", value: "231", helper: "Needs next message", tone: "amber" },
      { label: "Won", value: "89", helper: "12.7% up", tone: "violet" }
    ],
    workflowTitle: "Lead Motion",
    workflow: [
      { title: "Capture", detail: "New WhatsApp conversations become leads", status: "Auto" },
      { title: "Qualify", detail: "AI identifies intent and suggested stage", status: "Assisted" },
      { title: "Close", detail: "Won deals update contact history", status: "Tracked" }
    ],
    cards: [
      { title: "Pipeline Value", value: "BDT 4.8M", detail: "Open opportunity value", tone: "green" },
      { title: "Next Actions", value: "57", detail: "Due by today", tone: "amber" },
      { title: "Owner Load", value: "8 reps", detail: "Balanced assignments", tone: "blue" }
    ],
    table: {
      title: "Priority Leads",
      columns: ["Lead", "Stage", "Owner", "Next Step"],
      rows: [
        ["Sadia Rahman", "Won", "Rasel Ahmed", "Send invoice"],
        ["Mahmudul Hasan", "Interested", "Sales Team", "Share details"],
        ["Nusrat Jahan", "Follow-up", "Support Team", "Send catalog"]
      ]
    }
  },
  analytics: {
    eyebrow: "Performance Analytics",
    title: "Understand messaging and campaign results",
    description: "Measure delivery, response rate, lead movement, and automation impact from one view.",
    icon: "BarChart3",
    primaryAction: "Export Report",
    secondaryAction: "Filter Range",
    stats: [
      { label: "Delivery Rate", value: "94.8%", helper: "Last 30 days", tone: "green" },
      { label: "Response Rate", value: "18.6%", helper: "Campaign replies", tone: "blue" },
      { label: "Lead Conversion", value: "7.1%", helper: "Won from conversations", tone: "violet" },
      { label: "Failed Sends", value: "1.2%", helper: "Needs contact cleanup", tone: "amber" }
    ],
    workflowTitle: "Insights Queue",
    workflow: [
      { title: "Campaign trend", detail: "Promo campaigns outperform service updates", status: "Insight" },
      { title: "Audience quality", detail: "VIP Buyers show the strongest response", status: "Insight" },
      { title: "Automation impact", detail: "Auto replies reduce first response time", status: "Insight" }
    ],
    cards: [
      { title: "Best Day", value: "Thursday", detail: "Highest campaign response", tone: "green" },
      { title: "Peak Hour", value: "8 PM", detail: "Most replies received", tone: "blue" },
      { title: "Top Template", value: "Promo Offer", detail: "32.4% response", tone: "violet" }
    ],
    table: {
      title: "Report Summary",
      columns: ["Metric", "Current", "Previous", "Change"],
      rows: [
        ["Messages sent", "28,420", "22,110", "+28.5%"],
        ["Open conversations", "156", "131", "+18.9%"],
        ["Won leads", "89", "79", "+12.7%"]
      ]
    }
  },
  settings: {
    eyebrow: "Workspace Settings",
    title: "Control workspace preferences and security",
    description: "Manage profile details, notification settings, team permissions, and operational defaults.",
    icon: "Settings",
    primaryAction: "Save Changes",
    secondaryAction: "Invite Member",
    stats: [
      { label: "Team Members", value: "8", helper: "25 seats available", tone: "blue" },
      { label: "Roles", value: "4", helper: "Admin, sales, support, finance", tone: "violet" },
      { label: "Security", value: "Good", helper: "Two-factor encouraged", tone: "green" },
      { label: "Pending Invites", value: "3", helper: "Expires in 5 days", tone: "amber" }
    ],
    workflowTitle: "Admin Tasks",
    workflow: [
      { title: "Workspace profile", detail: "Acme Digital Solutions details saved", status: "Done" },
      { title: "Notification policy", detail: "Team alerts for hot leads and failures", status: "On" },
      { title: "Permission review", detail: "Finance role needs billing access check", status: "Review" }
    ],
    cards: [
      { title: "Default Owner", value: "Rasel Ahmed", detail: "New leads assigned to admin", tone: "blue" },
      { title: "Timezone", value: "Asia/Dhaka", detail: "Campaign schedule basis", tone: "green" },
      { title: "Language", value: "English", detail: "Bangla support planned", tone: "violet" }
    ],
    table: {
      title: "Team Access",
      columns: ["Member", "Role", "Status", "Last Active"],
      rows: [
        ["Rasel Ahmed", "Admin", "Active", "Now"],
        ["Sales Team", "Sales", "Active", "12 mins ago"],
        ["Support Team", "Support", "Active", "22 mins ago"]
      ]
    }
  },
  license: {
    eyebrow: "License and Usage",
    title: "Monitor plan limits and account status",
    description: "Track subscription, message quota, AI credits, team seats, and API service health.",
    icon: "ShieldCheck",
    primaryAction: "Upgrade Plan",
    secondaryAction: "Download Invoice",
    stats: [
      { label: "Plan", value: "Enterprise", helper: "Renews 30 Jun 2026", tone: "violet" },
      { label: "Messages", value: "28.4k", helper: "100k monthly limit", tone: "blue" },
      { label: "AI Credits", value: "48.5k", helper: "100k monthly limit", tone: "green" },
      { label: "Seats", value: "8/25", helper: "17 seats available", tone: "amber" }
    ],
    workflowTitle: "Account Health",
    workflow: [
      { title: "Subscription", detail: "Enterprise plan active", status: "Active" },
      { title: "Quota guard", detail: "Usage alerts at 75% and 90%", status: "On" },
      { title: "API service", detail: "Operational with no incidents", status: "Healthy" }
    ],
    cards: [
      { title: "Monthly Cost", value: "BDT 35,000", detail: "Enterprise workspace", tone: "violet" },
      { title: "Next Renewal", value: "30 Jun", detail: "Auto-renew enabled", tone: "blue" },
      { title: "API Status", value: "Operational", detail: "All systems normal", tone: "green" }
    ],
    table: {
      title: "Usage Breakdown",
      columns: ["Resource", "Used", "Limit", "Status"],
      rows: [
        ["Messages", "28,420", "100,000", "Healthy"],
        ["AI Credits", "48,500", "100,000", "Healthy"],
        ["Team Seats", "8", "25", "Healthy"]
      ]
    }
  }
};
