import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  return (
    <div className={`min-h-[calc(100vh-64px)] bg-white w-full overflow-y-auto ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black mb-8 transition-colors">
           <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
           {isAr ? 'رجوع' : 'Back'}
        </button>
        
        <h1 className="text-4xl font-serif font-bold text-black mb-6">
          {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
        </h1>
        
        <div className="prose prose-sm max-w-none text-gray-600 prose-headings:text-black prose-a:text-[#D4AF37] space-y-4 leading-relaxed">
          <p>
            {isAr
              ? 'أهلاً بك في منصة جكنومة (Jaknooma). من خلال استخدامك لموقعنا وخدماتنا، فإنك توافق على الالتزام بهذه الشروط والأحكام وتعتبر ملزماً بها قانونياً.'
              : 'Welcome to Jaknooma. By using our website and services, you agree to comply with and be bound by the following terms and conditions.'}
          </p>
          
          <h2 className="text-xl font-bold mt-8 mb-2">
            {isAr ? '1. طبيعة المنصة وإخلاء المسؤولية' : '1. Nature of the Platform & Disclaimer'}
          </h2>
          <p>
            {isAr
              ? 'تعمل منصة جكنومة (Jaknooma) كمنصة إعلانية ومجمعة للعروض ومنظومة تسوق بالعمولة (Affiliate Platform). نحن لا نقوم ببيع أو تصنيع أو شحن أي من المنتجات المعروضة على الموقع بشكل مباشر. جميع المعاملات المالية، عمليات الشراء، والشحن تتم حصرياً عبر المتاجر الخارجية الأصلية والشريكة (مثل أمازون، شي إن، تيمو، علي إكسبريس، دوبيزل، إيبي، وغيرها).'
              : 'Jaknooma operates as an aggregator and affiliate marketing platform. We do not sell, manufacture, or ship products directly. All transactions, purchases, and fulfillment occur exclusively on third-party partner websites (e.g., Amazon, Shein, Temu, AliExpress, Dubizzle, eBay).'}
          </p>
          
          <h2 className="text-xl font-bold mt-8 mb-2">
            {isAr ? '2. الأسعار وتوفر المخزون' : '2. Pricing & Inventory Availability'}
          </h2>
          <p>
            {isAr
              ? 'تخضع الأسعار، وتوفر المخزون، والعروض، وتفاصيل الشحن للتغيير المستمر من قِبل المتاجر الأصلية المعروضة لديها المنتجات. جكنومة لا تتحمل أي مسؤولية قانونية أو مالية عن أي اختلاف في الأسعار، نفاذ الكميات، أو تأخر الشحن من قِبل تلك المتاجر.'
              : 'Prices, stock availability, offers, and shipping details are subject to constant change by the respective third-party retailers. Jaknooma assumes no legal or financial responsibility for price discrepancies, out-of-stock items, or shipping delays from external merchants.'}
          </p>

          <h2 className="text-xl font-bold mt-8 mb-2">
            {isAr ? '3. جودة المنتجات وسياسات الاسترجاع' : '3. Product Quality & Return Policies'}
          </h2>
          <p>
            {isAr
              ? 'أي مشاكل تتعلق بجودة المنتجات، العيوب المصنعية، طلبات الاسترجاع، الاستبدال، أو استرداد الأموال يجب أن تُوجه مباشرة إلى المتجر الخارجي الذي تمت عملية الشراء فيه. لا تملك جكنومة أي سيطرة على سياسات تلك المتاجر ولا تتحمل مسؤوليتها القانونية.'
              : 'Any issues regarding product quality, manufacturing defects, returns, exchanges, or refunds must be directed entirely to the merchant where the purchase was made. Jaknooma has no control over or liability for third-party policies.'}
          </p>

          <h2 className="text-xl font-bold mt-8 mb-2">
            {isAr ? '4. مسؤولية المستخدم' : '4. User Responsibility'}
          </h2>
          <p>
            {isAr
              ? 'يتحمل المستخدم المسؤولية الكاملة عند النقر على الروابط الخارجية أو إتمام عمليات الشراء عبر شركاء التسوق بالعمولة. يجب على المستخدم التحقق من كافة تفاصيل المنتجات والشروط الخاصة بالمتجر الخارجي قبل إتمام أي معاملة.'
              : 'Users assume full responsibility when interacting with or purchasing through affiliate links. Users must verify all product details and merchant terms directly before completing any transaction.'}
          </p>
          
          <p className="mt-12 text-sm text-gray-400">
            {isAr ? `آخر تحديث: ${new Date().toLocaleDateString('ar-AE')}` : `Last updated: ${new Date().toLocaleDateString()}`}
          </p>
        </div>
      </div>
    </div>
  );
}
