import { db } from '../lib/firebase'; // تأكد من مسار الاستيراد الصحيح
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export const fetchImages = async () => {
  try {
    // سنفترض أن اسم الـ Collection هو "images"
    const q = query(collection(db, "images"), orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    
    // تحويل البيانات لمصفوفة كما اتفقنا
    const images = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return images;
  } catch (error) {
    console.error("Error fetching images: ", error);
    return [];
  }
};

