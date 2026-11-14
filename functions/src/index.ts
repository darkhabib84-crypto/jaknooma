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

// أسعار الصرف المعتمدة لتحويل مدفوعات Stripe إلى العملة الأساسية للمنصة (AED)
const FX_RATES_TO_AED: Record<string, number> = {
  AED: 1,
  USD: 3.67,
  EUR: 3.98,
  GBP: 4.65,
  SAR: 0.98,
};

function computeActualStripeAmounts(amountTotalMinorUnits: number | null | undefined, currencyRaw: string | null | undefined) {
  const minorUnits = typeof amountTotalMinorUnits === "number" && Number.isFinite(amountTotalMinorUnits)
    ? amountTotalMinorUnits
    : 0;
  const originalCurrency = (currencyRaw || "aed").toUpperCase();
  // العملات ذات الكسر العشري (مثل USD و AED تقسم على 100)
  const originalAmount = Number((minorUnits / 100).toFixed(2));
  const rate = FX_RATES_TO_AED[originalCurrency] ?? 1;
  const amountInAED = Number((originalAmount * rate).toFixed(2));

  return {
    amount_total: minorUnits,
    originalAmount,
    originalCurrency,
    amount: amountInAED,
    currency: "AED",
  };
}

// نقطة نهاية للتحقق من جلسة Stripe وإرجاع المبلغ الفعلي المدفوع بدقة
app.get("/verify-stripe-session", async (req, res) => {
  const sessionId = (req.query.session_id as string || "").trim();
  if (!sessionId) {
    return res.status(400).json({ success: false, message: "session_id is required" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const rawMinor = session.amount_total ?? session.amount_subtotal ?? 0;
    const amounts = computeActualStripeAmounts(rawMinor, session.currency);

    // التحقق من عدم تكرار تسجيل نفس الجلسة
    const existingSnap = await admin
      .firestore()
      .collection("payments")
      .where("stripeSessionId", "==", session.id)
      .limit(1)
      .get();

    const paymentPayload = {
      stripeSessionId: session.id,
      userId: session.client_reference_id || session.metadata?.userId || "anonymous",
      userEmail: session.customer_details?.email || session.customer_email || "",
      userName: session.customer_details?.name || "",
      productId: session.metadata?.productId || session.client_reference_id || null,
      productName: session.metadata?.productName || "VIP Listing",
      ...amounts,
      status: session.payment_status === "paid" ? "completed" : (session.payment_status || "completed"),
      type: session.metadata?.type || "VIP",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    let docId = "";
    if (existingSnap.empty) {
      const ref = await admin.firestore().collection("payments").add(paymentPayload);
      docId = ref.id;
    } else {
      docId = existingSnap.docs[0].id;
      await existingSnap.docs[0].ref.update({
        ...amounts,
        status: paymentPayload.status,
      });
    }

    // تفعيل حالة VIP للمنتج المرتبط إن وجد
    const targetProductId = session.metadata?.productId || session.client_reference_id;
    if (targetProductId && session.payment_status === "paid") {
      await admin
        .firestore()
        .collection("products")
        .doc(targetProductId)
        .update({ isVIP: true, isVip: true })
        .catch(() => {});
    }

    return res.json({
      success: true,
      paymentId: docId,
      ...amounts,
      status: paymentPayload.status,
    });
  } catch (error: any) {
    logger.error(`Verify Stripe Session Error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
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

  // معالجة الدفع الناجح والتقاط القيمة الفعلية المدفوعة من استجابة Stripe (amount_total)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const rawMinor = session.amount_total ?? session.amount_subtotal ?? 0;
    const amounts = computeActualStripeAmounts(rawMinor, session.currency);

    const existingSnap = await admin
      .firestore()
      .collection("payments")
      .where("stripeSessionId", "==", session.id)
      .limit(1)
      .get();

    const paymentRecord = {
      stripeSessionId: session.id,
      userId: session.client_reference_id || session.metadata?.userId || "anonymous",
      userEmail: session.customer_details?.email || session.customer_email || "",
      userName: session.customer_details?.name || "",
      productId: session.metadata?.productId || session.client_reference_id || null,
      productName: session.metadata?.productName || "VIP Listing",
      ...amounts, // يخزن amount الفعلي بالدرهم (مثلاً 3.67 درهم عند دفع 1 دولار) بالإضافة إلى amount_total و originalAmount
      status: "completed",
      type: session.metadata?.type || "VIP",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (existingSnap.empty) {
      await admin.firestore().collection("payments").add(paymentRecord);
    } else {
      await existingSnap.docs[0].ref.update(paymentRecord);
    }

    const targetProductId = session.metadata?.productId || session.client_reference_id;
    if (targetProductId) {
      await admin
        .firestore()
        .collection("products")
        .doc(targetProductId)
        .update({ isVIP: true, isVip: true })
        .catch(() => {});
    }

    logger.info(`Payment saved to Firestore with actual paid amount: ${amounts.amount} AED (${amounts.originalAmount} ${amounts.originalCurrency})`);
  } else if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const rawMinor = intent.amount_received ?? intent.amount ?? 0;
    const amounts = computeActualStripeAmounts(rawMinor, intent.currency);

    await admin.firestore().collection("payments").add({
      stripePaymentIntentId: intent.id,
      userId: intent.metadata?.userId || intent.metadata?.client_reference_id || "anonymous",
      userEmail: intent.receipt_email || intent.metadata?.userEmail || "",
      productName: intent.metadata?.productName || intent.description || "VIP Listing",
      ...amounts,
      status: "completed",
      type: intent.metadata?.type || "VIP",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return res.json({ received: true });
});
