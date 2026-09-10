import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import express from "express";
import cors from "cors";

// تهيئة Firebase Admin
admin.initializeApp();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-06-24.dahlia",
});

// إعداد تطبيق Express للتعامل مع مسارات الـ API (مثل /api/search-agent)
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// 1. نقطة النهاية الخاصة بالبحث (AI Search Agent)
app.get("/search-agent", async (req, res) => {
  const keyword = req.query.q as string;
  
  if (!keyword) {
    res.status(400).json({ success: false, message: "Keyword is required" });
    return;
  }

  try {
    logger.info(`AI Search Agent searching for: ${keyword}`);

    // يمكنك هنا إضافة منطق البحث الخارجي (سحب البيانات أو استدعاء API المتاجر)
    // كمثال تجريبي حالياً لضمان عودة استجابة صحيحة بصيغة JSON:
    const products: any[] = [];

    res.json({
      success: true,
      products: products
    });
  } catch (error: any) {
    logger.error(`Search Agent Error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

// تصدير دالة الـ API لتعمل مع توجيه /api/** في firebase.json
export const api = onRequest(app);

// 2. نقطة النهاية الخاصة بـ Stripe Webhook
export const stripeWebhook = onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig as string, webhookSecret as string);
  } catch (err: any) {
    logger.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // معالجة الدفع الناجح
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    await admin.firestore().collection("payments").add({
      userId: session.client_reference_id || "anonymous",
      userEmail: session.customer_details?.email,
      productName: session.metadata?.productName || "Product",
      amount: (session.amount_total || 0) / 100,
      currency: session.currency,
      status: "completed",
      type: "purchase",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    logger.info("Payment saved to Firestore successfully");
  }

  res.json({ received: true });
});
