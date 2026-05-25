export const kpis = [
  {
    label: "Connected Numbers",
    value: "1",
    change: "Online",
    helper: "1 Active - 0 Inactive",
    tone: "whatsapp"
  },
  {
    label: "Messages Sent Today",
    value: "2,842",
    change: "28.6%",
    helper: "vs yesterday 2,210",
    tone: "sky"
  },
  {
    label: "Open Conversations",
    value: "156",
    change: "18.9%",
    helper: "vs yesterday 131",
    tone: "blue"
  },
  {
    label: "Active Campaigns",
    value: "12",
    change: "33.3%",
    helper: "Scheduled & Running",
    tone: "violet"
  }
] as const;

export const crmStages = [
  { label: "New Leads", value: "1,248", change: "24.5%", state: "up", color: "blue" },
  { label: "Interested", value: "642", change: "18.2%", state: "up", color: "cyan" },
  { label: "Follow-up", value: "231", change: "5.3%", state: "down", color: "amber" },
  { label: "Won", value: "89", change: "12.7%", state: "up", color: "green" }
] as const;

export const recentChats = [
  {
    name: "Sadia Rahman",
    message: "Thanks! That worked.",
    time: "11:30 AM",
    unread: 2,
    avatar: "SR"
  },
  {
    name: "Mahmudul Hasan",
    message: "I want to know more details.",
    time: "11:18 AM",
    unread: 1,
    avatar: "MH"
  },
  {
    name: "Nusrat Jahan",
    message: "Please send the catalog.",
    time: "10:45 AM",
    unread: 1,
    avatar: "NJ"
  },
  {
    name: "Rafiq Ahmed",
    message: "How can I place an order?",
    time: "10:20 AM",
    unread: 2,
    avatar: "RA"
  },
  {
    name: "Tanzila Islam",
    message: "Is there any discount?",
    time: "09:58 AM",
    unread: 0,
    avatar: "TI"
  }
] as const;

export const recentReplies = [
  {
    title: "Order Status",
    message: "Hi {{name}}, your order {{order_id}} is...",
    time: "11:29 AM"
  },
  {
    title: "Welcome Message",
    message: "Thanks for reaching out! How can we...",
    time: "11:10 AM"
  },
  {
    title: "Payment Help",
    message: "Sure! You can complete your payment...",
    time: "10:42 AM"
  }
] as const;

export const keywordRules = [
  { keyword: "price", description: "Reply with price list" },
  { keyword: "order", description: "Reply with order process" },
  { keyword: "support", description: "Reply with support hours" }
] as const;

export const numberHealthSeries = [
  { label: "May 2", score: 52 },
  { label: "May 6", score: 68 },
  { label: "May 9", score: 55 },
  { label: "May 13", score: 71 },
  { label: "May 16", score: 84 },
  { label: "May 20", score: 70 },
  { label: "May 23", score: 58 },
  { label: "May 27", score: 76 },
  { label: "May 30", score: 88 }
] as const;
