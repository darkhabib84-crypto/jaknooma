import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white w-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black mb-8 transition-colors">
           <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
           {t('Back')}
        </button>
        
        <h1 className="text-4xl font-serif font-bold text-black mb-6">{t('Terms & Conditions')}</h1>
        <div className="prose prose-sm max-w-none text-gray-600 prose-headings:text-black prose-a:text-[#D4AF37]">
          <p className="mb-4">
            Welcome to Jaknooma. By using our website and services, you agree to comply with and be bound by the following terms and conditions.
          </p>
          
          <h2 className="text-xl font-bold mt-8 mb-4">1. Agreement to Terms</h2>
          <p className="mb-4">
            By registering, accessing or using any of our services, you agree to be legally bound by these terms. We do not take legal responsibility for external affiliate products.
          </p>
          
          <h2 className="text-xl font-bold mt-8 mb-4">2. Liability Limitation</h2>
          <p className="mb-4">
            Jaknooma operates as an aggregator. We are NOT legally responsible for the products, delivery, quality, or any issues arising from purchases made on third-party affiliate websites (e.g., Amazon, Shein, Temu, AliExpress, Dubizzle, eBay). Users assume full legal responsibility by accessing or using the affiliate links provided. 
          </p>
          
          <h2 className="text-xl font-bold mt-8 mb-4">3. User Responsibility</h2>
          <p className="mb-4">
            Users must verify the authenticity, legality, and safety of any affiliate products directly with the seller before making a purchase. Any disputes must be handled directly with the respective third-party platform.
          </p>
          
          <p className="mt-12 text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
