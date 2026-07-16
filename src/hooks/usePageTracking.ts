// src/hooks/usePageTracking.ts
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import { analytics } from "../lib/firebase"; // تأكد من صحة مسار ملف firebase الخاص بك

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // نتحقق أولاً من أن الـ analytics تم تهيئتها بنجاح وليست null
    if (analytics) {
      // استخراج اسم القسم الرئيسي من مسار الرابط (مثال: /products/123 يعطينا products)
      const currentSection = location.pathname.split('/')[1] || 'home';

      // تسجيل الحدث المخصص في Firebase Analytics
      logEvent(analytics, 'page_view_custom', {
        page_path: location.pathname,
        page_title: document.title || 'Page',
        section: currentSection,
      });
    }
  }, [location]);
};
