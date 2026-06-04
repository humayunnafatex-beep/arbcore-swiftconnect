export type AutoReplyTemplateMatchType = "CONTAINS" | "EXACT" | "STARTS_WITH";
export type AutoReplyTemplateChannel = "WHATSAPP" | "MESSENGER" | "BOTH";

export type AutoReplyTemplate = {
  id: string;
  category: string;
  title: string;
  description: string;
  suggestedKeyword: string;
  suggestedMatchType: AutoReplyTemplateMatchType;
  channelSuggestion: AutoReplyTemplateChannel;
  replyText: string;
};

export const autoReplyTemplates: AutoReplyTemplate[] = [
  {
    id: "price-basic",
    category: "Price",
    title: "Price Request",
    description: "Use when customers ask for product price or latest offer.",
    suggestedKeyword: "price",
    suggestedMatchType: "CONTAINS",
    channelSuggestion: "BOTH",
    replyText: "Thanks for your message. Please send the model name or product screenshot. Our team will confirm the latest price and available size shortly."
  },
  {
    id: "size-guide",
    category: "Size",
    title: "Size Help",
    description: "Ask for size details before confirming availability.",
    suggestedKeyword: "size",
    suggestedMatchType: "CONTAINS",
    channelSuggestion: "BOTH",
    replyText: "Thanks for your interest. Please share your usual shoe size or foot length. We will help you choose the right size before confirming the order."
  },
  {
    id: "order-status",
    category: "Order",
    title: "Order Status",
    description: "Use when customers ask about an existing order.",
    suggestedKeyword: "order",
    suggestedMatchType: "CONTAINS",
    channelSuggestion: "BOTH",
    replyText: "Thanks for contacting us. Please share your order ID or the phone number used for the order. Our team will check and update you shortly."
  },
  {
    id: "delivery-time",
    category: "Delivery",
    title: "Delivery Time",
    description: "Explain delivery timing and request location.",
    suggestedKeyword: "delivery",
    suggestedMatchType: "CONTAINS",
    channelSuggestion: "BOTH",
    replyText: "Delivery time depends on your location. Please share your area or full delivery address, and our team will confirm the expected delivery time."
  },
  {
    id: "cod-available",
    category: "COD",
    title: "Cash On Delivery",
    description: "Confirm cash-on-delivery availability in a simple way.",
    suggestedKeyword: "cod",
    suggestedMatchType: "CONTAINS",
    channelSuggestion: "BOTH",
    replyText: "Yes, Cash on Delivery is available for selected areas. Please share your delivery location so our team can confirm COD availability."
  },
  {
    id: "stock-check",
    category: "Stock",
    title: "Stock Check",
    description: "Ask for product details to check stock.",
    suggestedKeyword: "stock",
    suggestedMatchType: "CONTAINS",
    channelSuggestion: "BOTH",
    replyText: "Please send the product name, model, color, or screenshot. Our team will check current stock and reply as soon as possible."
  },
  {
    id: "office-hours",
    category: "Office Hours",
    title: "Office Hours",
    description: "Set expectations outside working hours.",
    suggestedKeyword: "open",
    suggestedMatchType: "CONTAINS",
    channelSuggestion: "BOTH",
    replyText: "Thanks for your message. Our team replies during business hours. If you already shared your query, we will get back to you as soon as possible."
  },
  {
    id: "product-photo",
    category: "Product Photo",
    title: "Product Photo Request",
    description: "Use when customers ask for more photos.",
    suggestedKeyword: "photo",
    suggestedMatchType: "CONTAINS",
    channelSuggestion: "BOTH",
    replyText: "Sure. Please tell us which product or model you want to see. Our team will share available photos or details shortly."
  },
  {
    id: "return-exchange",
    category: "Return/Exchange",
    title: "Return Or Exchange",
    description: "Collect order details for return or exchange support.",
    suggestedKeyword: "exchange",
    suggestedMatchType: "CONTAINS",
    channelSuggestion: "BOTH",
    replyText: "We are here to help. Please share your order ID, product photo, and issue details. Our team will review the return or exchange request."
  },
  {
    id: "complaint-support",
    category: "Complaint",
    title: "Complaint Received",
    description: "Acknowledge a customer complaint professionally.",
    suggestedKeyword: "complaint",
    suggestedMatchType: "CONTAINS",
    channelSuggestion: "BOTH",
    replyText: "We are sorry for the inconvenience. Please share your order ID, phone number, and issue details. Our support team will review and contact you shortly."
  },
  {
    id: "human-support",
    category: "Human Support",
    title: "Human Support",
    description: "Route the customer to a team member.",
    suggestedKeyword: "support",
    suggestedMatchType: "CONTAINS",
    channelSuggestion: "BOTH",
    replyText: "Thanks for reaching out. A team member will review your message and reply shortly. Please share any order ID, product name, or screenshot if available."
  },
  {
    id: "greeting-welcome",
    category: "Greeting",
    title: "Welcome Greeting",
    description: "Send a friendly greeting for common hello messages.",
    suggestedKeyword: "hello",
    suggestedMatchType: "CONTAINS",
    channelSuggestion: "BOTH",
    replyText: "Hello and welcome. Thanks for contacting us. Please tell us which product or service you are interested in, and our team will help you shortly."
  }
];

export const autoReplyTemplateCategories = [...new Set(autoReplyTemplates.map((template) => template.category))];
