const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// تأكد من وجود ملف المفتاح في المجلد
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function saveProductData() {
    try {
        const url = 'https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html';
        console.log('جاري سحب البيانات...');
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // تجهيز البيانات
        let image_url = $('#product_gallery img').attr('src');
        if (image_url && !image_url.startsWith('http')) {
            image_url = new URL(image_url, url).href;
        }

        // تحويل السعر من نص (مثل £51.77) إلى رقم (51.77)
        const priceText = $('.price_color').text().replace(/[^0-9.]/g, '');
        const price = parseFloat(priceText) || 0;

        // تجهيز كائن المنتج ليتطابق تماماً مع دالة isValidProduct في الـ Rules
        const productData = {
            name: $('h1').text().trim().substring(0, 100), // القواعد تشترط أقل من 100 حرف
            price: price,
            description: $('.product_page > p').first().text().trim().substring(0, 2000),
            category: 'books',
            images: [image_url],
            sellerId: 'admin_user_id', // ضع الـ ID الخاص بك هنا
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            rating: 0,
            reviews: 0,
            isNew: true,
            storeId: 'books_store_id' // اختياري حسب قواعدك
        };

        const productsRef = db.collection('products');

        // البحث باستخدام الرابط الأصلي
        const snapshot = await productsRef.where('originalUrl', '==', url).limit(1).get();

        if (snapshot.empty) {
            // إضافة المنتج مع حقل originalUrl (ليستخدمه البحث)
            const docRef = await productsRef.add({
                ...productData,
                originalUrl: url
            });
            console.log('✅ تم الحفظ بنجاح، المعرف:', docRef.id);
        } else {
            const docId = snapshot.docs[0].id;
            await productsRef.doc(docId).update({
                price: productData.price,
                // تحديث updatedAt إذا كنت ستضيفه لاحقاً
            });
            console.log('🔄 تم تحديث المنتج الموجود:', docId);
        }
    } catch (error) {
        console.error('❌ خطأ في السكربت:', error.message);
    }
}

saveProductData();

