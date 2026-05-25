import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import bcrypt from "bcryptjs";

const dbPath = join(process.cwd(), "prisma", "local.db");
mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "Company" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "plan" TEXT NOT NULL DEFAULT 'Enterprise',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'AGENT',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "passwordHash" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT NOT NULL,
  CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "WhatsAppAccount" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "label" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL UNIQUE,
  "businessName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "qualityRating" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "dailyLimit" INTEGER NOT NULL DEFAULT 10000,
  "messagesUsed24h" INTEGER NOT NULL DEFAULT 0,
  "lastSyncedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT,
  CONSTRAINT "WhatsAppAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Contact" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL UNIQUE,
  "email" TEXT,
  "tags" TEXT,
  "segment" TEXT,
  "stage" TEXT NOT NULL DEFAULT 'NEW_LEAD',
  "optedIn" BOOLEAN NOT NULL DEFAULT true,
  "doNotContact" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT,
  CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Campaign" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "templateName" TEXT NOT NULL,
  "templateVariables" JSONB,
  "targetSegment" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "scheduledAt" DATETIME,
  "sentAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT,
  "whatsappAccountId" TEXT,
  CONSTRAINT "Campaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Campaign_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsAppAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "MessageTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'MARKETING',
  "language" TEXT NOT NULL DEFAULT 'ENGLISH',
  "body" TEXT NOT NULL,
  "variables" TEXT,
  "footerText" TEXT,
  "buttonText" TEXT,
  "buttonUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT,
  CONSTRAINT "MessageTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "subject" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "assignedTo" TEXT,
  "lastMessageAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT,
  "contactId" TEXT NOT NULL,
  "whatsappAccountId" TEXT,
  CONSTRAINT "Conversation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Conversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Conversation_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsAppAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ConversationMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "body" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "conversationId" TEXT NOT NULL,
  CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "MessageLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "body" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "providerMessageId" TEXT,
  "errorMessage" TEXT,
  "sentAt" DATETIME,
  "deliveredAt" DATETIME,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT,
  "contactId" TEXT,
  "campaignId" TEXT,
  "whatsappAccountId" TEXT,
  CONSTRAINT "MessageLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MessageLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MessageLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MessageLog_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsAppAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "WebhookEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "provider" TEXT NOT NULL DEFAULT 'whatsapp',
  "eventType" TEXT,
  "payload" JSONB NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT,
  CONSTRAINT "WebhookEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AutoReplyRule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "keyword" TEXT NOT NULL,
  "response" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "matchMode" TEXT NOT NULL DEFAULT 'CONTAINS',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT,
  CONSTRAINT "AutoReplyRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CrmDeal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "value" REAL NOT NULL DEFAULT 0,
  "stage" TEXT NOT NULL DEFAULT 'NEW_LEAD',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "owner" TEXT,
  "nextAction" TEXT,
  "dueAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT,
  "contactId" TEXT NOT NULL,
  CONSTRAINT "CrmDeal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CrmDeal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AiGeneration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "prompt" TEXT NOT NULL,
  "context" TEXT,
  "output" TEXT NOT NULL,
  "model" TEXT NOT NULL DEFAULT 'mock-arbcore-ai',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT,
  CONSTRAINT "AiGeneration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AIUsage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "generationType" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'mock',
  "promptTokens" INTEGER,
  "completionTokens" INTEGER,
  "totalTokens" INTEGER,
  "usedFallback" BOOLEAN NOT NULL DEFAULT false,
  "errorMessage" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "companyId" TEXT,
  CONSTRAINT "AIUsage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Campaign_whatsappAccountId_idx" ON "Campaign"("whatsappAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "MessageTemplate_companyId_name_key" ON "MessageTemplate"("companyId", "name");
CREATE INDEX IF NOT EXISTS "MessageTemplate_companyId_idx" ON "MessageTemplate"("companyId");
CREATE INDEX IF NOT EXISTS "Conversation_contactId_idx" ON "Conversation"("contactId");
CREATE INDEX IF NOT EXISTS "Conversation_whatsappAccountId_idx" ON "Conversation"("whatsappAccountId");
CREATE INDEX IF NOT EXISTS "ConversationMessage_conversationId_idx" ON "ConversationMessage"("conversationId");
CREATE INDEX IF NOT EXISTS "MessageLog_contactId_idx" ON "MessageLog"("contactId");
CREATE INDEX IF NOT EXISTS "MessageLog_campaignId_idx" ON "MessageLog"("campaignId");
CREATE INDEX IF NOT EXISTS "MessageLog_whatsappAccountId_idx" ON "MessageLog"("whatsappAccountId");
CREATE INDEX IF NOT EXISTS "WebhookEvent_companyId_idx" ON "WebhookEvent"("companyId");
CREATE INDEX IF NOT EXISTS "WebhookEvent_provider_idx" ON "WebhookEvent"("provider");
CREATE INDEX IF NOT EXISTS "CrmDeal_contactId_idx" ON "CrmDeal"("contactId");
CREATE INDEX IF NOT EXISTS "AIUsage_companyId_idx" ON "AIUsage"("companyId");
CREATE INDEX IF NOT EXISTS "AIUsage_generationType_idx" ON "AIUsage"("generationType");
`);

const defaultCompanyId = "default-company";
const defaultUserId = "demo-admin-user";
const demoPasswordHash = bcrypt.hashSync("demo1234", 10);

function hasColumn(table, column) {
  return db
    .prepare(`PRAGMA table_info("${table}")`)
    .all()
    .some((row) => row.name === column);
}

function addColumnIfMissing(table, column, definition) {
  if (!hasColumn(table, column)) {
    db.exec(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
  }
}

addColumnIfMissing("Contact", "doNotContact", "BOOLEAN NOT NULL DEFAULT false");
addColumnIfMissing("User", "isActive", "BOOLEAN NOT NULL DEFAULT true");

[
  "WhatsAppAccount",
  "Contact",
  "Campaign",
  "Conversation",
  "MessageLog",
  "AutoReplyRule",
  "CrmDeal",
  "AiGeneration",
  "AIUsage",
  "MessageTemplate",
  "WebhookEvent"
].forEach((table) => {
  addColumnIfMissing(table, "companyId", "TEXT");
});

[
  "User",
  "WhatsAppAccount",
  "Contact",
  "Campaign",
  "Conversation",
  "MessageLog",
  "AutoReplyRule",
  "CrmDeal",
  "AiGeneration",
  "AIUsage",
  "MessageTemplate",
  "WebhookEvent"
].forEach((table) => {
  db.exec(`CREATE INDEX IF NOT EXISTS "${table}_companyId_idx" ON "${table}"("companyId")`);
});

db.prepare(
  `INSERT OR IGNORE INTO "Company" ("id", "name", "slug", "plan") VALUES (?, ?, ?, ?)`
).run(defaultCompanyId, "ARBCore AI", "arbcore-ai", "Enterprise");

db.prepare(
  `INSERT OR IGNORE INTO "User" ("id", "email", "name", "role", "passwordHash", "companyId") VALUES (?, ?, ?, ?, ?, ?)`
).run(defaultUserId, "admin@arbcore.ai", "Rasel Ahmed", "OWNER", demoPasswordHash, defaultCompanyId);

db.prepare(
  `UPDATE "User" SET "name" = ?, "role" = ?, "passwordHash" = ?, "isActive" = true, "companyId" = ? WHERE "email" = ?`
).run("Rasel Ahmed", "OWNER", demoPasswordHash, defaultCompanyId, "admin@arbcore.ai");

[
  "WhatsAppAccount",
  "Contact",
  "Campaign",
  "Conversation",
  "MessageLog",
  "AutoReplyRule",
  "CrmDeal",
  "AiGeneration",
  "AIUsage",
  "MessageTemplate",
  "WebhookEvent"
].forEach((table) => {
  db.prepare(`UPDATE "${table}" SET "companyId" = ? WHERE "companyId" IS NULL`).run(defaultCompanyId);
});

const templateSeed = [
  {
    id: "template-promo-special-offer",
    name: "Promo - Special Offer",
    category: "MARKETING",
    language: "ENGLISH",
    body: "Hi {{name}}, exclusive offer for you: {{offer}}. Shop now: {{link}}",
    variables: "{{name}},{{offer}},{{link}}",
    footerText: "ARBCore SwiftConnect",
    buttonText: "Shop Now",
    buttonUrl: "{{link}}",
    status: "APPROVED"
  },
  {
    id: "template-order-follow-up",
    name: "Order Follow-up",
    category: "UTILITY",
    language: "ENGLISH",
    body: "Hi {{name}}, checking in about your order {{order_id}}. Reply here if you need help.",
    variables: "{{name}},{{order_id}}",
    footerText: "We are here to help.",
    buttonText: "View Order",
    buttonUrl: "{{link}}",
    status: "APPROVED"
  },
  {
    id: "template-banglish-offer",
    name: "Banglish Offer",
    category: "MARKETING",
    language: "BANGLISH",
    body: "Hi {{name}}, apnar jonno special offer: {{offer}}. Details dekhte click korun {{link}}",
    variables: "{{name}},{{offer}},{{link}}",
    footerText: "ARBCore AI",
    buttonText: "Details",
    buttonUrl: "{{link}}",
    status: "DRAFT"
  }
];

for (const template of templateSeed) {
  db.prepare(
    `INSERT OR IGNORE INTO "MessageTemplate" ("id", "name", "category", "language", "body", "variables", "footerText", "buttonText", "buttonUrl", "status", "companyId") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    template.id,
    template.name,
    template.category,
    template.language,
    template.body,
    template.variables,
    template.footerText,
    template.buttonText,
    template.buttonUrl,
    template.status,
    defaultCompanyId
  );
}

db.close();

console.log(`SQLite database initialized at ${dbPath}`);
