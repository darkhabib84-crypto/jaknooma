import { 
  CarFront, Home, Briefcase, Tv, Sofa, Shirt, Sparkles, Baby, 
  Bike, Gamepad2, BookOpen, PawPrint, Wrench, Utensils, HeartPulse, 
  Download, Users, LayoutGrid, LayoutList, LucideIcon 
} from 'lucide-react';

export interface SubCategory {
  en: string;
  ar: string;
}

export interface CategoryItem {
  id: string;
  name: { en: string; ar: string };
  iconName: string;
  value: string;
  sub?: SubCategory[];
}

export const iconMap: Record<string, LucideIcon> = {
  CarFront, Home, Briefcase, Tv, Sofa, Shirt, Sparkles, Baby, 
  Bike, Gamepad2, BookOpen, PawPrint, Wrench, Utensils, HeartPulse, 
  Download, Users, LayoutGrid, LayoutList
};

export function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || LayoutGrid;
}

export const defaultCategories: CategoryItem[] = [
  { id: '1', name: { en: 'All Categories', ar: 'جميع الأقسام' }, iconName: 'LayoutGrid', value: '' },
  { 
    id: '2',
    name: { en: 'Cars & Automotive Brands', ar: 'السيارات والعلامات التجارية' }, 
    iconName: 'CarFront', 
    value: 'Cars & Automotive Brands', 
    sub: [
      { en: 'Acura', ar: 'أكيورا' }, { en: 'Alfa Romeo', ar: 'ألفا روميو' }, { en: 'Aston Martin', ar: 'أستون مارتن' },
      { en: 'Audi', ar: 'أودي' }, { en: 'Bentley', ar: 'بنتلي' }, { en: 'BMW', ar: 'بي إم دبليو' },
      { en: 'Bugatti', ar: 'بوجاتي' }, { en: 'Buick', ar: 'بويك' }, { en: 'Cadillac', ar: 'كاديلاك' },
      { en: 'Chery', ar: 'شيري' }, { en: 'Chevrolet', ar: 'شيفروليه' }, { en: 'Chrysler', ar: 'كرايسلر' },
      { en: 'Citroën', ar: 'سيتروين' }, { en: 'Dodge', ar: 'دودج' }, { en: 'Ferrari', ar: 'فيراري' },
      { en: 'Fiat', ar: 'فيات' }, { en: 'Ford', ar: 'فورد' }, { en: 'Geely', ar: 'جيلي' },
      { en: 'GMC', ar: 'جي إم سي' }, { en: 'Honda', ar: 'هوندا' }, { en: 'Hummer', ar: 'همر' },
      { en: 'Hyundai', ar: 'هيونداي' }, { en: 'Infiniti', ar: 'إنفينيتي' }, { en: 'Jaguar', ar: 'جاكوار' },
      { en: 'Jeep', ar: 'جيب' }, { en: 'Kia', ar: 'كيا' }, { en: 'Lamborghini', ar: 'لامبورغيني' },
      { en: 'Land Rover', ar: 'لاند روفر' }, { en: 'Lexus', ar: 'لكزس' }, { en: 'Lincoln', ar: 'لينكولن' },
      { en: 'Lotus', ar: 'لوتس' }, { en: 'Mazda', ar: 'مازدا' }, { en: 'McLaren', ar: 'ماكلارين' },
      { en: 'Mercedes-Benz', ar: 'مرسيدس بنز' }, { en: 'Mini', ar: 'ميني' }, { en: 'Mitsubishi', ar: 'ميتسوبيشي' },
      { en: 'Nissan', ar: 'نيسان' }, { en: 'Opel', ar: 'أوبل' }, { en: 'Peugeot', ar: 'بيجو' },
      { en: 'Porsche', ar: 'بورشه' }, { en: 'Rolls-Royce', ar: 'رولز رويس' }, { en: 'Renault', ar: 'رينو' },
      { en: 'Seat', ar: 'سيات' }, { en: 'Skoda', ar: 'سكودا' }, { en: 'Smart', ar: 'سمارت' },
      { en: 'Subaru', ar: 'سوبارو' }, { en: 'Suzuki', ar: 'سوزوكي' }, { en: 'Tesla', ar: 'تسلا' },
      { en: 'Toyota', ar: 'تويوتا' }, { en: 'Volkswagen', ar: 'فولكس واجن' }, { en: 'Volvo', ar: 'فولفو' }
    ] 
  },
  { 
    id: '3',
    name: { en: 'Property', ar: 'العقارات' }, 
    iconName: 'Home', 
    value: 'Property', 
    sub: [
      { en: 'Apartments for Sale', ar: 'شقق للبيع' }, { en: 'Villas for Sale', ar: 'فلل للبيع' },
      { en: 'Townhouses', ar: 'تاون هاوس' }, { en: 'Penthouses', ar: 'بنتهاوس' },
      { en: 'Lands', ar: 'أراضي' }, { en: 'Commercial Properties', ar: 'عقارات تجارية' },
      { en: 'Offices', ar: 'مكاتب' }, { en: 'Shops', ar: 'محلات' },
      { en: 'Warehouses', ar: 'مستودعات' }, { en: 'Apartments for Rent', ar: 'شقق للإيجار' },
      { en: 'Villas for Rent', ar: 'فلل للإيجار' }, { en: 'Rooms for Rent', ar: 'غرف للإيجار' },
      { en: 'Shared Accommodation', ar: 'سكن مشترك' }, { en: 'Short Term Rentals', ar: 'إيجار يومي' },
      { en: 'New Projects', ar: 'مشاريع جديدة' }
    ] 
  },
  { 
    id: '4',
    name: { en: 'Jobs', ar: 'الوظائف' }, 
    iconName: 'Briefcase', 
    value: 'Jobs', 
    sub: [
      { en: 'IT Jobs', ar: 'وظائف تقنية' }, { en: 'Engineering Jobs', ar: 'وظائف هندسة' },
      { en: 'Sales Jobs', ar: 'وظائف مبيعات' }, { en: 'Marketing Jobs', ar: 'وظائف تسويق' },
      { en: 'Accounting Jobs', ar: 'وظائف محاسبة' }, { en: 'Customer Service Jobs', ar: 'وظائف خدمة عملاء' },
      { en: 'Driver Jobs', ar: 'وظائف سائقين' }, { en: 'Restaurant Jobs', ar: 'وظائف مطاعم' },
      { en: 'Hotel Jobs', ar: 'وظائف فنادق' }, { en: 'Medical Jobs', ar: 'وظائف طبية' },
      { en: 'Education Jobs', ar: 'وظائف تعليم' }, { en: 'Remote Jobs', ar: 'وظائف عن بعد' },
      { en: 'Internships', ar: 'تدريب' }, { en: 'Part Time Jobs', ar: 'وظائف دوام جزئي' },
      { en: 'Full Time Jobs', ar: 'وظائف دوام كامل' }
    ] 
  },
  { 
    id: '5',
    name: { en: 'Electronics', ar: 'الإلكترونيات' }, 
    iconName: 'Tv', 
    value: 'Electronics', 
    sub: [
      { en: 'Mobile Phones', ar: 'هواتف' }, { en: 'iPhone', ar: 'آيفون' },
      { en: 'Samsung Phones', ar: 'سامسونج' }, { en: 'Xiaomi Phones', ar: 'شاومي' },
      { en: 'Laptops', ar: 'لابتوبات' }, { en: 'Desktop Computers', ar: 'أجهزة كمبيوتر' },
      { en: 'Monitors', ar: 'شاشات' }, { en: 'Printers', ar: 'طابعات' },
      { en: 'Tablets', ar: 'أجهزة لوحية' }, { en: 'Smart Watches', ar: 'ساعات ذكية' },
      { en: 'Headphones', ar: 'سماعات' }, { en: 'Cameras', ar: 'كاميرات' },
      { en: 'TVs', ar: 'تلفزيونات' }, { en: 'Gaming Consoles', ar: 'أجهزة ألعاب' },
      { en: 'PlayStation', ar: 'بلايستيشن' }, { en: 'Xbox', ar: 'إكس بوكس' },
      { en: 'Nintendo', ar: 'نينتندو' }, { en: 'Electronic Accessories', ar: 'إكسسوارات إلكترونية' },
      { en: 'Home Appliances', ar: 'أجهزة منزلية' }
    ] 
  },
  { 
    id: '6',
    name: { en: 'Home & Furniture', ar: 'المنزل والأثاث' }, 
    iconName: 'Sofa', 
    value: 'Home & Furniture', 
    sub: [
      { en: 'Bedroom Furniture', ar: 'أثاث غرفة النوم' }, { en: 'Living Room Furniture', ar: 'أثاث غرفة المعيشة' },
      { en: 'Office Furniture', ar: 'أثاث مكتبي' }, { en: 'Tables', ar: 'طاولات' },
      { en: 'Chairs', ar: 'كراسي' }, { en: 'Cabinets', ar: 'خزائن' },
      { en: 'Mattresses', ar: 'مراتب' }, { en: 'Home Decor', ar: 'ديكور المنزل' },
      { en: 'Curtains', ar: 'ستائر' }, { en: 'Carpets', ar: 'سجاد' },
      { en: 'Lighting', ar: 'إنارة' }, { en: 'Kitchenware', ar: 'أدوات مطبخ' },
      { en: 'Kitchen Appliances', ar: 'أجهزة مطبخ' }, { en: 'Cleaning Supplies', ar: 'أدوات تنظيف' },
      { en: 'Garden Supplies', ar: 'أدوات حدائق' }
    ] 
  },
  { 
    id: '7',
    name: { en: 'Fashion', ar: 'الموضة' }, 
    iconName: 'Shirt', 
    value: 'Fashion', 
    sub: [
      { en: 'Men\'s Fashion', ar: 'أزياء رجالية' }, { en: 'Shirts', ar: 'قمصان' },
      { en: 'T-Shirts', ar: 'تيشيرتات' }, { en: 'Pants', ar: 'بناطيل' },
      { en: 'Jeans', ar: 'جينز' }, { en: 'Jackets', ar: 'جاكيتات' },
      { en: 'Men\'s Shoes', ar: 'أحذية رجالية' }, { en: 'Watches', ar: 'ساعات' },
      { en: 'Women\'s Fashion', ar: 'أزياء نسائية' }, { en: 'Dresses', ar: 'فساتين' },
      { en: 'Abayas', ar: 'عبايات' }, { en: 'Women\'s Tops', ar: 'قمصان نسائية' },
      { en: 'Women\'s Pants', ar: 'بناطيل نسائية' }, { en: 'Bags', ar: 'حقائب' },
      { en: 'Women\'s Shoes', ar: 'أحذية نسائية' }, { en: 'Jewelry', ar: 'مجوهرات' },
      { en: 'Women\'s Watches', ar: 'ساعات نسائية' }, { en: 'Kids Fashion', ar: 'أزياء الأطفال' },
      { en: 'Kids Clothing', ar: 'ملابس أطفال' }, { en: 'Kids Shoes', ar: 'أحذية أطفال' }
    ] 
  },
  { 
    id: '8',
    name: { en: 'Beauty & Personal Care', ar: 'الجمال والعناية' }, 
    iconName: 'Sparkles', 
    value: 'Beauty & Personal Care', 
    sub: [
      { en: 'Perfumes', ar: 'عطور' }, { en: 'Makeup', ar: 'مكياج' },
      { en: 'Skincare', ar: 'عناية بالبشرة' }, { en: 'Hair Care', ar: 'عناية بالشعر' },
      { en: 'Shaving Tools', ar: 'أدوات حلاقة' }, { en: 'Spa Products', ar: 'منتجات سبا' },
      { en: 'Contact Lenses', ar: 'عدسات لاصقة' }
    ] 
  },
  { 
    id: '9',
    name: { en: 'Baby & Kids', ar: 'الأطفال والرضع' }, 
    iconName: 'Baby', 
    value: 'Baby & Kids', 
    sub: [
      { en: 'Strollers', ar: 'عربات أطفال' }, { en: 'Baby Car Seats', ar: 'مقاعد سيارات أطفال' },
      { en: 'Toys', ar: 'ألعاب أطفال' }, { en: 'Diapers', ar: 'حفاضات' },
      { en: 'Feeding Supplies', ar: 'رضاعة' }, { en: 'Baby Beds', ar: 'أسرّة أطفال' },
      { en: 'Baby Clothing', ar: 'ملابس رضع' }
    ] 
  },
  { 
    id: '10',
    name: { en: 'Sports & Outdoors', ar: 'الرياضة والأنشطة' }, 
    iconName: 'Bike', 
    value: 'Sports & Outdoors', 
    sub: [
      { en: 'Sports Equipment', ar: 'معدات رياضية' }, { en: 'Fitness Equipment', ar: 'أجهزة رياضية' },
      { en: 'Bicycles', ar: 'دراجات هوائية' }, { en: 'Camping Gear', ar: 'معدات تخييم' },
      { en: 'Fishing Equipment', ar: 'معدات صيد' }, { en: 'Swimming Gear', ar: 'معدات سباحة' },
      { en: 'Sportswear', ar: 'ملابس رياضية' }
    ] 
  },
  { 
    id: '11',
    name: { en: 'Gaming & Entertainment', ar: 'الألعاب والترفيه' }, 
    iconName: 'Gamepad2', 
    value: 'Gaming & Entertainment', 
    sub: [
      { en: 'Video Games', ar: 'ألعاب فيديو' }, { en: 'PC Games', ar: 'ألعاب PC' },
      { en: 'PlayStation Games', ar: 'ألعاب بلايستيشن' }, { en: 'Xbox Games', ar: 'ألعاب إكس بوكس' },
      { en: 'Gaming Chairs', ar: 'كراسي ألعاب' }, { en: 'VR Headsets', ar: 'نظارات VR' }
    ] 
  },
  { 
    id: '12',
    name: { en: 'Books & Education', ar: 'الكتب والتعليم' }, 
    iconName: 'BookOpen', 
    value: 'Books & Education', 
    sub: [
      { en: 'Books', ar: 'كتب' }, { en: 'Educational Books', ar: 'كتب دراسية' },
      { en: 'Novels', ar: 'روايات' }, { en: 'Children\'s Books', ar: 'كتب أطفال' },
      { en: 'Online Courses', ar: 'دورات تعليمية' }, { en: 'School Supplies', ar: 'أدوات مدرسية' }
    ] 
  },
  { 
    id: '13',
    name: { en: 'Pets', ar: 'الحيوانات الأليفة' }, 
    iconName: 'PawPrint', 
    value: 'Pets', 
    sub: [
      { en: 'Dogs', ar: 'كلاب' }, { en: 'Cats', ar: 'قطط' },
      { en: 'Birds', ar: 'طيور' }, { en: 'Fish', ar: 'أسماك' },
      { en: 'Pet Food', ar: 'طعام الحيوانات' }, { en: 'Cages', ar: 'أقفاص' },
      { en: 'Pet Toys', ar: 'ألعاب حيوانات' }
    ] 
  },
  { 
    id: '14',
    name: { en: 'Services', ar: 'الخدمات' }, 
    iconName: 'Wrench', 
    value: 'Services', 
    sub: [
      { en: 'Cleaning Services', ar: 'خدمات تنظيف' }, { en: 'Moving Services', ar: 'نقل أثاث' },
      { en: 'Home Maintenance', ar: 'صيانة منازل' }, { en: 'Plumbing', ar: 'سباكة' },
      { en: 'Electrical Services', ar: 'كهرباء' }, { en: 'AC Services', ar: 'تكييف' },
      { en: 'Web Design', ar: 'تصميم مواقع' }, { en: 'App Development', ar: 'تطوير تطبيقات' },
      { en: 'Digital Marketing', ar: 'تسويق إلكتروني' }, { en: 'Photography', ar: 'تصوير' },
      { en: 'Translation Services', ar: 'ترجمة' }
    ] 
  },
  { 
    id: '15',
    name: { en: 'Food & Grocery', ar: 'الطعام والبقالة' }, 
    iconName: 'Utensils', 
    value: 'Food & Grocery', 
    sub: [
      { en: 'Vegetables', ar: 'خضروات' }, { en: 'Fruits', ar: 'فواكه' },
      { en: 'Meat', ar: 'لحوم' }, { en: 'Seafood', ar: 'أسماك' },
      { en: 'Beverages', ar: 'مشروبات' }, { en: 'Sweets', ar: 'حلويات' },
      { en: 'Bakery', ar: 'مخبوزات' }, { en: 'Coffee', ar: 'قهوة' },
      { en: 'Tea', ar: 'شاي' }
    ] 
  },
  { 
    id: '16',
    name: { en: 'Health', ar: 'الصحة' }, 
    iconName: 'HeartPulse', 
    value: 'Health', 
    sub: [
      { en: 'Vitamins', ar: 'فيتامينات' }, { en: 'Medical Devices', ar: 'أجهزة طبية' },
      { en: 'Health Equipment', ar: 'معدات صحية' }, { en: 'Healthcare Products', ar: 'منتجات العناية الصحية' }
    ] 
  },
  { 
    id: '17',
    name: { en: 'Digital Products', ar: 'المنتجات الرقمية' }, 
    iconName: 'Download', 
    value: 'Digital Products', 
    sub: [
      { en: 'Subscriptions', ar: 'اشتراكات' }, { en: 'Gaming Gift Cards', ar: 'بطاقات ألعاب' },
      { en: 'Software', ar: 'برامج' }, { en: 'Design Templates', ar: 'قوالب تصميم' },
      { en: 'E-Books', ar: 'كتب إلكترونية' }
    ] 
  },
  { 
    id: '18',
    name: { en: 'Community', ar: 'المجتمع' }, 
    iconName: 'Users', 
    value: 'Community', 
    sub: [
      { en: 'Events', ar: 'فعاليات' }, { en: 'Travel & Tourism', ar: 'سفر وسياحة' },
      { en: 'Lost & Found', ar: 'مفقودات' }, { en: 'Activities', ar: 'أنشطة' }
    ] 
  }
];
