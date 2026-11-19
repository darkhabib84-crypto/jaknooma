"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const stripe_1 = __importDefault(require("stripe"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Server-side secrets for Sign in with Apple Token Revocation (.p8 private key)
// Never exposed to client code.
const appleTeamIdSecret = (0, params_1.defineSecret)("APPLE_TEAM_ID");
const appleKeyIdSecret = (0, params_1.defineSecret)("APPLE_KEY_ID");
const appleClientIdSecret = (0, params_1.defineSecret)("APPLE_CLIENT_ID");
const applePrivateKeySecret = (0, params_1.defineSecret)("APPLE_PRIVATE_KEY");
// تهيئة Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-06-24.dahlia",
});
// إعداد تطبيق Express للتعامل مع مسارات الـ API
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
// 1. نقطة النهاية الخاصة بالبحث (AI Search Agent) مع تفعيل البحث الحقيقي في Firestore
app.get("/search-agent", async (req, res) => {
    const keyword = (req.query.q || "").toLowerCase().trim();
    if (!keyword) {
        return res.status(400).json({ success: false, message: "Keyword is required" });
    }
    try {
        logger.info(`AI Search Agent searching for: ${keyword}`);
        // جلب المنتجات من مجموعة products في Firestore والبحث فيها بمرونة
        const snapshot = await admin.firestore().collection("products").get();
        const products = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const name = (data.name || data.title || "").toLowerCase();
            const category = (data.category || "").toLowerCase();
            const storeName = (data.storeName || "").toLowerCase();
            // مطابقة مرنة للبحث داخل الاسم، القسم، أو اسم المتجر
            if (name.includes(keyword) ||
                category.includes(keyword) ||
                storeName.includes(keyword)) {
                products.push(Object.assign({ id: doc.id }, data));
            }
        });
        return res.json({
            success: true,
            products: products
        });
    }
    catch (error) {
        logger.error(`Search Agent Error: ${error.message}`);
        return res.status(500).json({ success: false, products: [], message: error.message });
    }
});
// أسعار الصرف المعتمدة لتحويل مدفوعات Stripe إلى العملة الأساسية للمنصة (AED)
const FX_RATES_TO_AED = {
    AED: 1,
    USD: 3.67,
    EUR: 3.98,
    GBP: 4.65,
    SAR: 0.98,
};
function computeActualStripeAmounts(amountTotalMinorUnits, currencyRaw) {
    var _a;
    const minorUnits = typeof amountTotalMinorUnits === "number" && Number.isFinite(amountTotalMinorUnits)
        ? amountTotalMinorUnits
        : 0;
    const originalCurrency = (currencyRaw || "aed").toUpperCase();
    // العملات ذات الكسر العشري (مثل USD و AED تقسم على 100)
    const originalAmount = Number((minorUnits / 100).toFixed(2));
    const rate = (_a = FX_RATES_TO_AED[originalCurrency]) !== null && _a !== void 0 ? _a : 1;
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const sessionId = (req.query.session_id || "").trim();
    if (!sessionId) {
        return res.status(400).json({ success: false, message: "session_id is required" });
    }
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const rawMinor = (_b = (_a = session.amount_total) !== null && _a !== void 0 ? _a : session.amount_subtotal) !== null && _b !== void 0 ? _b : 0;
        const amounts = computeActualStripeAmounts(rawMinor, session.currency);
        // التحقق من عدم تكرار تسجيل نفس الجلسة
        const existingSnap = await admin
            .firestore()
            .collection("payments")
            .where("stripeSessionId", "==", session.id)
            .limit(1)
            .get();
        const paymentPayload = Object.assign(Object.assign({ stripeSessionId: session.id, userId: session.client_reference_id || ((_c = session.metadata) === null || _c === void 0 ? void 0 : _c.userId) || "anonymous", userEmail: ((_d = session.customer_details) === null || _d === void 0 ? void 0 : _d.email) || session.customer_email || "", userName: ((_e = session.customer_details) === null || _e === void 0 ? void 0 : _e.name) || "", productId: ((_f = session.metadata) === null || _f === void 0 ? void 0 : _f.productId) || session.client_reference_id || null, productName: ((_g = session.metadata) === null || _g === void 0 ? void 0 : _g.productName) || "VIP Listing" }, amounts), { status: session.payment_status === "paid" ? "completed" : (session.payment_status || "completed"), type: ((_h = session.metadata) === null || _h === void 0 ? void 0 : _h.type) || "VIP", createdAt: admin.firestore.FieldValue.serverTimestamp() });
        let docId = "";
        if (existingSnap.empty) {
            const ref = await admin.firestore().collection("payments").add(paymentPayload);
            docId = ref.id;
        }
        else {
            docId = existingSnap.docs[0].id;
            await existingSnap.docs[0].ref.update(Object.assign(Object.assign({}, amounts), { status: paymentPayload.status }));
        }
        // تفعيل حالة VIP للمنتج المرتبط إن وجد
        const targetProductId = ((_j = session.metadata) === null || _j === void 0 ? void 0 : _j.productId) || session.client_reference_id;
        if (targetProductId && session.payment_status === "paid") {
            await admin
                .firestore()
                .collection("products")
                .doc(targetProductId)
                .update({ isVIP: true, isVip: true })
                .catch(() => { });
        }
        return res.json(Object.assign(Object.assign({ success: true, paymentId: docId }, amounts), { status: paymentPayload.status }));
    }
    catch (error) {
        logger.error(`Verify Stripe Session Error: ${error.message}`);
        return res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * Generates an ES256 client_secret JWT signed with the Apple .p8 private key
 * stored in server-side Cloud Functions secrets (never in client code).
 */
function generateAppleClientSecret(params) {
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
    const base64UrlEncode = (input) => Buffer.from(input)
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
async function revokeAppleTokenServerSide(options) {
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
    let tokenTypeHint = options.refreshToken
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
            const tokenJson = (await tokenResp.json());
            if (tokenJson.refresh_token) {
                tokenToRevoke = tokenJson.refresh_token;
                tokenTypeHint = "refresh_token";
            }
            else if (tokenJson.access_token) {
                tokenToRevoke = tokenJson.access_token;
                tokenTypeHint = "access_token";
            }
        }
        else {
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
function extractStoragePathFromUrl(url) {
    if (!url || typeof url !== "string")
        return null;
    try {
        const match = url.match(/\/o\/([^?]+)/);
        if (match && match[1]) {
            return decodeURIComponent(match[1]);
        }
    }
    catch (_a) {
        // ignore malformed URL
    }
    return null;
}
/**
 * 3. Server-Side Account & Personal Data Deletion Endpoint (Apple 5.1.1(v) & Google Play)
 * Strictly deletes user data FIRST, anonymizes legal accounting records, and deletes the Firebase Auth user LAST.
 */
app.post("/delete-account", async (req, res) => {
    var _a, _b, _c;
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Missing or invalid Authorization Bearer token",
        });
    }
    const idToken = authHeader.slice("Bearer ".length).trim();
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(idToken, true);
    }
    catch (err) {
        logger.error("verifyIdToken failed on /delete-account:", err === null || err === void 0 ? void 0 : err.message);
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
        let appleRevocationResult = {
            attempted: false,
            revoked: false,
        };
        if (isAppleUser) {
            appleRevocationResult = await revokeAppleTokenServerSide({
                authorizationCode: (_a = req.body) === null || _a === void 0 ? void 0 : _a.appleAuthorizationCode,
                refreshToken: (_b = req.body) === null || _b === void 0 ? void 0 : _b.appleRefreshToken,
                accessToken: (_c = req.body) === null || _c === void 0 ? void 0 : _c.appleAccessToken,
            });
        }
        // Step 2: Delete user's products/ads and collect all image storage paths
        const productsSnap = await db.collection("products").where("sellerId", "==", uid).get();
        const storagePathsToDelete = new Set();
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
        }
        catch (storageListErr) {
            logger.warn(`Storage prefix listing warning for products/${uid}/: ${storageListErr === null || storageListErr === void 0 ? void 0 : storageListErr.message}`);
        }
        for (const storagePath of storagePathsToDelete) {
            try {
                await bucket.file(storagePath).delete({ ignoreNotFound: true });
                deletedImagesCount++;
            }
            catch (fileDelErr) {
                logger.warn(`Failed to delete storage object ${storagePath}: ${fileDelErr === null || fileDelErr === void 0 ? void 0 : fileDelErr.message}`);
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
        await db.collection("admins").doc(uid).delete().catch(() => { });
        // Step 7: Revoke refresh tokens & delete Firebase Auth user LAST so any earlier failure can be safely retried
        await admin.auth().revokeRefreshTokens(uid);
        await admin.auth().deleteUser(uid);
        logger.info(`Account ${uid} permanently deleted. Ads removed: ${deletedProductsCount}, images removed: ${deletedImagesCount}, payments anonymized: ${anonymizedPaymentsCount}`);
        return res.json({
            success: true,
            deletedProductsCount,
            deletedImagesCount,
            anonymizedPaymentsCount,
            appleRevocation: appleRevocationResult,
        });
    }
    catch (error) {
        logger.error(`Account deletion failed for ${uid}: ${error === null || error === void 0 ? void 0 : error.message}`);
        return res.status(500).json({
            success: false,
            message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to complete server-side account deletion",
        });
    }
});
// تصدير دالة الـ API لتعمل مع توجيه /api/** في firebase.json
exports.api = (0, https_1.onRequest)({
    secrets: [
        appleTeamIdSecret,
        appleKeyIdSecret,
        appleClientIdSecret,
        applePrivateKeySecret,
    ],
}, app);
// 2. نقطة النهاية الخاصة بـ Stripe Webhook
exports.stripeWebhook = (0, https_1.onRequest)(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    }
    catch (err) {
        logger.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // معالجة الدفع الناجح والتقاط القيمة الفعلية المدفوعة من استجابة Stripe (amount_total)
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const rawMinor = (_b = (_a = session.amount_total) !== null && _a !== void 0 ? _a : session.amount_subtotal) !== null && _b !== void 0 ? _b : 0;
        const amounts = computeActualStripeAmounts(rawMinor, session.currency);
        const existingSnap = await admin
            .firestore()
            .collection("payments")
            .where("stripeSessionId", "==", session.id)
            .limit(1)
            .get();
        const paymentRecord = Object.assign(Object.assign({ stripeSessionId: session.id, userId: session.client_reference_id || ((_c = session.metadata) === null || _c === void 0 ? void 0 : _c.userId) || "anonymous", userEmail: ((_d = session.customer_details) === null || _d === void 0 ? void 0 : _d.email) || session.customer_email || "", userName: ((_e = session.customer_details) === null || _e === void 0 ? void 0 : _e.name) || "", productId: ((_f = session.metadata) === null || _f === void 0 ? void 0 : _f.productId) || session.client_reference_id || null, productName: ((_g = session.metadata) === null || _g === void 0 ? void 0 : _g.productName) || "VIP Listing" }, amounts), { status: "completed", type: ((_h = session.metadata) === null || _h === void 0 ? void 0 : _h.type) || "VIP", createdAt: admin.firestore.FieldValue.serverTimestamp() });
        if (existingSnap.empty) {
            await admin.firestore().collection("payments").add(paymentRecord);
        }
        else {
            await existingSnap.docs[0].ref.update(paymentRecord);
        }
        const targetProductId = ((_j = session.metadata) === null || _j === void 0 ? void 0 : _j.productId) || session.client_reference_id;
        if (targetProductId) {
            await admin
                .firestore()
                .collection("products")
                .doc(targetProductId)
                .update({ isVIP: true, isVip: true })
                .catch(() => { });
        }
        logger.info(`Payment saved to Firestore with actual paid amount: ${amounts.amount} AED (${amounts.originalAmount} ${amounts.originalCurrency})`);
    }
    else if (event.type === "payment_intent.succeeded") {
        const intent = event.data.object;
        const rawMinor = (_l = (_k = intent.amount_received) !== null && _k !== void 0 ? _k : intent.amount) !== null && _l !== void 0 ? _l : 0;
        const amounts = computeActualStripeAmounts(rawMinor, intent.currency);
        await admin.firestore().collection("payments").add(Object.assign(Object.assign({ stripePaymentIntentId: intent.id, userId: ((_m = intent.metadata) === null || _m === void 0 ? void 0 : _m.userId) || ((_o = intent.metadata) === null || _o === void 0 ? void 0 : _o.client_reference_id) || "anonymous", userEmail: intent.receipt_email || ((_p = intent.metadata) === null || _p === void 0 ? void 0 : _p.userEmail) || "", productName: ((_q = intent.metadata) === null || _q === void 0 ? void 0 : _q.productName) || intent.description || "VIP Listing" }, amounts), { status: "completed", type: ((_r = intent.metadata) === null || _r === void 0 ? void 0 : _r.type) || "VIP", createdAt: admin.firestore.FieldValue.serverTimestamp() }));
    }
    return res.json({ received: true });
});
//# sourceMappingURL=index.js.map