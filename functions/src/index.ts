import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import Stripe from "stripe";
import express from "express";
import cors from "cors";

// Server-side secrets for Sign in with Apple Token Revocation (.p8 private key)
// Never exposed to client code.
const appleTeamIdSecret = defineSecret("APPLE_TEAM_ID");
const appleKeyIdSecret = defineSecret("APPLE_KEY_ID");
const appleClientIdSecret = defineSecret("APPLE_CLIENT_ID");
const applePrivateKeySecret = defineSecret("APPLE_PRIVATE_KEY");

// تهيئة Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

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

/**
 * Generates an ES256 client_secret JWT signed with the Apple .p8 private key
 * stored in server-side Cloud Functions secrets (never in client code).
 */
function generateAppleClientSecret(params: {
  teamId: string;
  keyId: string;
  clientId: string;
  privateKeyPem: string;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "ES256",
    kid: params.keyId,
    typ: "JWT",
  };
  const payload = {
    iss: params.teamId,
    iat: now,
    exp: now + 300, // 5 minutes validity
    aud: "https://appleid.apple.com",
    sub: params.clientId,
  };

  const base64UrlEncode = (input: Buffer | string) =>
    Buffer.from(input)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const normalizedKey = params.privateKeyPem.replace(/\\n/g, "\n").trim();
  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key: normalizedKey,
    dsaEncoding: "ieee-p1363",
  });

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

/**
 * Exchanges an Apple authorization_code (if provided) and revokes the Apple token
 * via https://appleid.apple.com/auth/revoke as required by Apple Guideline 5.1.1(v).
 */
async function revokeAppleTokenServerSide(options: {
  authorizationCode?: string;
  refreshToken?: string;
  accessToken?: string;
}): Promise<{ attempted: boolean; revoked: boolean; reason?: string }> {
  const teamId = (appleTeamIdSecret.value() || process.env.APPLE_TEAM_ID || "").trim();
  const keyId = (appleKeyIdSecret.value() || process.env.APPLE_KEY_ID || "").trim();
  const clientId = (appleClientIdSecret.value() || process.env.APPLE_CLIENT_ID || "com.jaknooma.app").trim();
  const privateKeyPem = (applePrivateKeySecret.value() || process.env.APPLE_PRIVATE_KEY || "").trim();

  if (!teamId || !keyId || !privateKeyPem) {
    logger.warn("Apple .p8 secrets (APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY) are not configured yet.");
    return {
      attempted: false,
      revoked: false,
      reason: "apple_secrets_not_configured",
    };
  }

  const clientSecret = generateAppleClientSecret({
    teamId,
    keyId,
    clientId,
    privateKeyPem,
  });

  let tokenToRevoke = options.refreshToken || options.accessToken || "";
  let tokenTypeHint: "refresh_token" | "access_token" = options.refreshToken
    ? "refresh_token"
    : "access_token";

  if (!tokenToRevoke && options.authorizationCode) {
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: options.authorizationCode,
      grant_type: "authorization_code",
    });

    const tokenResp = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    if (tokenResp.ok) {
      const tokenJson = (await tokenResp.json()) as {
        refresh_token?: string;
        access_token?: string;
      };
      if (tokenJson.refresh_token) {
        tokenToRevoke = tokenJson.refresh_token;
        tokenTypeHint = "refresh_token";
      } else if (tokenJson.access_token) {
        tokenToRevoke = tokenJson.access_token;
        tokenTypeHint = "access_token";
      }
    } else {
      const errText = await tokenResp.text();
      logger.warn(`Apple auth/token exchange returned ${tokenResp.status}: ${errText}`);
    }
  }

  if (!tokenToRevoke) {
    return {
      attempted: true,
      revoked: false,
      reason: "no_apple_token_or_authorization_code_provided",
    };
  }

  const revokeParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    token: tokenToRevoke,
    token_type_hint: tokenTypeHint,
  });

  const revokeResp = await fetch("https://appleid.apple.com/auth/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: revokeParams.toString(),
  });

  if (!revokeResp.ok) {
    const errText = await revokeResp.text();
    throw new Error(`Apple token revocation failed (${revokeResp.status}): ${errText}`);
  }

  return { attempted: true, revoked: true };
}

function extractStoragePathFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  try {
    const match = url.match(/\/o\/([^?]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch {
    // ignore malformed URL
  }
  return null;
}

/**
 * 3. Server-Side Account & Personal Data Deletion Endpoint (Apple 5.1.1(v) & Google Play)
 * Strictly deletes user data FIRST, anonymizes legal accounting records, and deletes the Firebase Auth user LAST.
 */
app.post("/delete-account", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Missing or invalid Authorization Bearer token",
    });
  }

  const idToken = authHeader.slice("Bearer ".length).trim();
  let decodedToken: admin.auth.DecodedIdToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken, true);
  } catch (err: any) {
    logger.error("verifyIdToken failed on /delete-account:", err?.message);
    return res.status(401).json({
      success: false,
      message: "Unauthorized or expired session token. Please sign in again.",
    });
  }

  const uid = decodedToken.uid;
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  try {
    const userRecord = await admin.auth().getUser(uid);
    const providers = userRecord.providerData.map((p) => p.providerId);
    const isAppleUser = providers.includes("apple.com");

    // Step 1: If user signed in with Apple, revoke Sign in with Apple token via server-side .p8 key
    let appleRevocationResult: { attempted: boolean; revoked: boolean; reason?: string } = {
      attempted: false,
      revoked: false,
    };
    if (isAppleUser) {
      appleRevocationResult = await revokeAppleTokenServerSide({
        authorizationCode: req.body?.appleAuthorizationCode,
        refreshToken: req.body?.appleRefreshToken,
        accessToken: req.body?.appleAccessToken,
      });
    }

    // Step 2: Delete user's products/ads and collect all image storage paths
    const productsSnap = await db.collection("products").where("sellerId", "==", uid).get();
    const storagePathsToDelete = new Set<string>();
    let deletedProductsCount = 0;

    for (const prodDoc of productsSnap.docs) {
      const prodData = prodDoc.data();
      if (Array.isArray(prodData.images)) {
        for (const imgUrl of prodData.images) {
          const parsedPath = extractStoragePathFromUrl(imgUrl);
          if (parsedPath) {
            storagePathsToDelete.add(parsedPath);
          }
        }
      }
      await prodDoc.ref.delete();
      deletedProductsCount++;
    }

    // Step 3: Delete all files in Firebase Storage under products/{uid}/ and referenced paths
    let deletedImagesCount = 0;
    try {
      const [filesByPrefix] = await bucket.getFiles({ prefix: `products/${uid}/` });
      for (const file of filesByPrefix) {
        storagePathsToDelete.add(file.name);
      }
    } catch (storageListErr: any) {
      logger.warn(`Storage prefix listing warning for products/${uid}/: ${storageListErr?.message}`);
    }

    for (const storagePath of storagePathsToDelete) {
      try {
        await bucket.file(storagePath).delete({ ignoreNotFound: true });
        deletedImagesCount++;
      } catch (fileDelErr: any) {
        logger.warn(`Failed to delete storage object ${storagePath}: ${fileDelErr?.message}`);
      }
    }

    // Step 4: Delete user's wishlists, cart items, and reviews
    const collectionsByUserId = ["wishlist", "cart", "reviews"];
    for (const colName of collectionsByUserId) {
      const snap = await db.collection(colName).where("userId", "==", uid).get();
      for (const docSnap of snap.docs) {
        await docSnap.ref.delete();
      }
    }

    // Delete /users/{uid}/wishlists subcollection
    const subWishlistsSnap = await db.collection("users").doc(uid).collection("wishlists").get();
    for (const subDoc of subWishlistsSnap.docs) {
      await subDoc.ref.delete();
    }

    // Step 5: Anonymize legal accounting/payment records in /payments & /orders (keep amounts for tax/accounting law, scrub PII)
    const anonymizedId = `deleted_${crypto.createHash("sha256").update(uid).digest("hex").slice(0, 12)}`;
    const paymentsSnap = await db.collection("payments").where("userId", "==", uid).get();
    let anonymizedPaymentsCount = 0;
    for (const payDoc of paymentsSnap.docs) {
      await payDoc.ref.update({
        userId: anonymizedId,
        userEmail: "[deleted]",
        userName: "Deleted User",
        anonymizedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      anonymizedPaymentsCount++;
    }

    const ordersBuyerSnap = await db.collection("orders").where("userId", "==", uid).get();
    for (const ordDoc of ordersBuyerSnap.docs) {
      await ordDoc.ref.update({
        userId: anonymizedId,
        userEmail: "[deleted]",
        userName: "Deleted User",
        anonymizedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const ordersSellerSnap = await db.collection("orders").where("sellerId", "==", uid).get();
    for (const ordDoc of ordersSellerSnap.docs) {
      await ordDoc.ref.update({
        sellerId: anonymizedId,
        sellerEmail: "[deleted]",
        sellerName: "Deleted User",
        anonymizedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Step 6: Delete user profile document /users/{uid} and /admins/{uid}
    await db.collection("users").doc(uid).delete();
    await db.collection("admins").doc(uid).delete().catch(() => {});

    // Step 7: Revoke refresh tokens & delete Firebase Auth user LAST so any earlier failure can be safely retried
    await admin.auth().revokeRefreshTokens(uid);
    await admin.auth().deleteUser(uid);

    logger.info(
      `Account ${uid} permanently deleted. Ads removed: ${deletedProductsCount}, images removed: ${deletedImagesCount}, payments anonymized: ${anonymizedPaymentsCount}`
    );

    return res.json({
      success: true,
      deletedProductsCount,
      deletedImagesCount,
      anonymizedPaymentsCount,
      appleRevocation: appleRevocationResult,
    });
  } catch (error: any) {
    logger.error(`Account deletion failed for ${uid}: ${error?.message}`);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to complete server-side account deletion",
    });
  }
});

// تصدير دالة الـ API لتعمل مع توجيه /api/** في firebase.json
export const api = onRequest(
  {
    secrets: [
      appleTeamIdSecret,
      appleKeyIdSecret,
      appleClientIdSecret,
      applePrivateKeySecret,
    ],
  },
  app
);

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
