import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBSFDoE6Fuyv3eKR6GrKxISXOIE9Om48LQ",
  authDomain: "jaknooma.firebaseapp.com",
  projectId: "jaknooma",
  storageBucket: "jaknooma.firebasestorage.app",
  messagingSenderId: "215148796185",
  appId: "1:215148796185:web:ccd43a8a17896d02eb4d88",
  measurementId: "G-GGBN015JJZ"
};

// التهيئة الأساسية
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// قمنا بفصل الـ Enum ليكون تصديراً نظيفاً
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// تعديل الواجهة لتكون آمنة
interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | null; // عدلناها لتكون آمنة
    email: string | null;
    emailVerified: boolean | null;
    isAnonymous: boolean | null;
    tenantId: string | null;
    providerInfo: {
      providerId: string | null;
      email: string | null;
    }[];
  };
}

// دالة معالجة الأخطاء الآمنة
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // نقوم بجلب المستخدم الحالي "هنا" فقط عند حدوث الخطأ
  const user = auth.currentUser; 
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid || null,
      email: user?.email || null,
      emailVerified: user?.emailVerified || null,
      isAnonymous: user?.isAnonymous || null,
      tenantId: user?.tenantId || null,
      providerInfo: user?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error Detailed Info:', errInfo);
  // قمنا بحذف JSON.stringify لتسهيل قراءة الكونسول،
  // وحذف throw Error لمنع إيقاف التطبيق، إلا إذا كنت تريد ذلك.
}

