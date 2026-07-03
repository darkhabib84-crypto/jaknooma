import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Stripe from "stripe";

// تهيئة Firebase Admin
admin.initializeApp();

// قم بضبط المفتاح السري (سنقوم بتخزينه في Firebase config لاحقاً)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-06-24.dahlia", // تأكد من مطابقة إصدار الـ API الخاص بك
});

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

