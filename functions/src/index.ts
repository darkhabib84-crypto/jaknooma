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

// إعداد تطبيق Express للتعامل مع مسارات الـ API
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// 1. نقطة النهاية الخاصة بالبحث (AI Search Agent) مع تفعيل البحث الحقيقي في Firestore
app.get("/search-agent", async (req, res) => {
  const keyword = (req.query.q as string || "").toLowerCase().trim();
  
  if (!keyword) {
    return res.status(400).json({ success: false, message: "Keyword is required" });
  }

  try {
    logger.info(`AI Search Agent searching for: ${keyword}`);

    // جلب المنتجات من مجموعة products في Firestore والبحث فيها بمرونة
    const snapshot = await admin.firestore().collection("products").get();
    const products: any[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const name = (data.name || data.title || "").toLowerCase();
      const category = (data.category || "").toLowerCase();
      const storeName = (data.storeName || "").toLowerCase();

      // مطابقة مرنة للبحث داخل الاسم، القسم، أو اسم المتجر
      if (
        name.includes(keyword) || 
        category.includes(keyword) || 
        storeName.includes(keyword)
      ) {
        products.push({
          id: doc.id,
          ...data
        });
      }
    });

    return res.json({
      success: true,
      products: products
    });
  } catch (error: any) {
    logger.error(`Search Agent Error: ${error.message}`);
    return res.status(500).json({ success: false, products: [], message: error.message });
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
    return res.status(400).send(`Webhook Error: ${err.message}`);
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

  return res.json({ received: true });
});
