import React from 'react';
import { Settings, Save, Globe, Lock, Mail, CreditCard, Monitor } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black mb-1">Platform Settings</h1>
        <p className="text-gray-500">Configure global preferences, security, and integrations.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
         <div className="border-b border-gray-100 flex p-1 bg-gray-50/50 overflow-x-auto scrollbar-hide">
            {[
              { id: 'general', icon: Settings, label: 'General' },
              { id: 'security', icon: Lock, label: 'Security' },
              { id: 'payment', icon: CreditCard, label: 'Payment' },
              { id: 'email', icon: Mail, label: 'SMTP / Email' },
              { id: 'localization', icon: Globe, label: 'Localization' },
              { id: 'appearance', icon: Monitor, label: 'Appearance' },
            ].map(tab => (
              <button key={tab.id} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${tab.id === 'general' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black hover:bg-gray-100/50'}`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
         </div>

         <div className="p-6 md:p-8 space-y-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">Platform Name</label>
                <input type="text" defaultValue="Jaknooma" className="w-full max-w-md px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">Support Email</label>
                <input type="email" defaultValue="support@jaknooma.com" className="w-full max-w-md px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">Meta Description (SEO)</label>
                <textarea rows={3} defaultValue="Jaknooma is a premium multi-store aggregator..." className="w-full max-w-lg px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all resize-none"></textarea>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-4">
              <h3 className="font-bold text-lg">Firebase Configuration</h3>
              <p className="text-sm text-gray-500 mb-4">Update your frontend Firebase SDK keys.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Project ID</label>
                   <input type="text" defaultValue="jaknooma-app" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all font-mono" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Web API Key</label>
                   <input type="password" defaultValue="AIzaSyAXXXXXXX" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all font-mono" />
                 </div>
              </div>
            </div>
            
            <div className="pt-6 flex justify-end">
              <button className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                <Save className="w-5 h-5" /> Save Changes
              </button>
            </div>
         </div>
      </div>
    </div>
  );
}
