import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync("lib/ai-auto-reply.ts", "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022
  }
}).outputText).toString("base64")}`;
const {
  AI_HANDOFF_MARKER,
  buildAiAutoReplyPrompt,
  detectAiEscalation,
  interpretAiReply,
  isAiAutoReplyEnabled
} = await import(moduleUrl);

// Feature flag: off unless explicitly enabled and a key is present.
assert.equal(isAiAutoReplyEnabled({ AI_AUTO_REPLY_ENABLED: "true", OPENAI_API_KEY: "sk-test" }), true);
assert.equal(isAiAutoReplyEnabled({ AI_AUTO_REPLY_ENABLED: "TRUE", OPENAI_API_KEY: "sk-test" }), true);
assert.equal(isAiAutoReplyEnabled({ AI_AUTO_REPLY_ENABLED: "false", OPENAI_API_KEY: "sk-test" }), false);
assert.equal(isAiAutoReplyEnabled({ AI_AUTO_REPLY_ENABLED: "true", OPENAI_API_KEY: "" }), false);
assert.equal(isAiAutoReplyEnabled({}), false);

// Escalation: complaints, payments, refunds, and requests for a person go to staff.
assert.equal(detectAiEscalation("আমার অর্ডার ভাঙা এসেছে").escalate, true);
assert.equal(detectAiEscalation("I want a refund").reason, "refund");
assert.equal(detectAiEscalation("bkash e taka pathiyechi").reason, "payment");
assert.equal(detectAiEscalation("I already paid by bKash").reason, "payment");
assert.equal(detectAiEscalation("manager er sathe kotha bolte chai").reason, "human_request");
assert.equal(detectAiEscalation("দাম কত?").escalate, false);
assert.equal(detectAiEscalation("price koto").escalate, false);

// Reply interpretation: the handoff marker and empty output never reach the customer.
assert.deepEqual(interpretAiReply(`  ${AI_HANDOFF_MARKER}  `), { action: "handoff" });
assert.deepEqual(interpretAiReply(""), { action: "handoff" });
assert.deepEqual(interpretAiReply("   "), { action: "handoff" });
assert.deepEqual(interpretAiReply("  Delivery 2-3 days.  "), { action: "reply", text: "Delivery 2-3 days." });
assert.equal(interpretAiReply("x".repeat(2000)).text.length, 1000);

// Prompt: includes only the supplied facts, products, and this customer's orders.
const prompt = buildAiAutoReplyPrompt("WHATSAPP", "দাম কত?", {
  knowledgeFacts: [{ category: "delivery", title: "Dhaka", content: "Next day delivery" }],
  products: [{ name: "Solm8 Stride", price: 2500, availableSizes: "40, 41", stockNote: "" }],
  customerOrders: [{
    orderNumber: "A-1",
    modelName: "Stride",
    size: "41",
    quantity: 1,
    totalAmount: 2600,
    paymentStatus: "COD",
    orderStatus: "SHIPPED"
  }],
  history: [{ direction: "OUTBOUND", body: "Hello" }]
});
assert.match(prompt, /Latest customer message: দাম কত\?/);
assert.match(prompt, /Solm8 Stride \(BDT 2500, sizes: 40, 41\)/);
assert.match(prompt, /Order A-1, Stride, size 41, qty 1, total BDT 2600, payment COD, status SHIPPED/);
assert.match(prompt, /Business: Hello/);
assert.match(prompt, /\[delivery\] Dhaka: Next day delivery/);
assert.doesNotMatch(prompt, /notes|internal/i);

const emptyPrompt = buildAiAutoReplyPrompt("MESSENGER", "hi", {
  knowledgeFacts: [],
  products: [],
  customerOrders: [],
  history: []
});
assert.match(emptyPrompt, /Business facts: none configured/);
assert.match(emptyPrompt, /Active products: none/);
assert.match(emptyPrompt, /This customer's orders: none/);

console.log("AI auto reply tests passed.");
