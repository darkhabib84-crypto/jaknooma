import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Store, Plus, Edit2, Trash2, Power, Search, UploadCloud, Loader2, Save, X, GripVertical, Download, Upload, Webhook } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast, { Toaster } from 'react-hot-toast';

export interface StoreData {
  id: string;
  name: string;
  logo: string;
  status: 'active' | 'disabled';
  apiUrl: string;
  apiKey: string;
  supportedLanguages: string[];
  productTypes: string[];
  type: 'marketplace' | 'local' | 'affiliate' | 'used';
  priority: number;
  clicks: number;
  searches: number;
  productsImported: number;
  activeUsers: number;
  createdAt: any;
  updatedAt: any;
}

const DEFAULT_STORE: Partial<StoreData> = {
  name: '',
  logo: '',
  status: 'active',
  apiUrl: '',
  apiKey: '',
  supportedLanguages: ['en'],
  productTypes: ['both'],
  type: 'marketplace',
  priority: 0,
};

export default function AdminStoreManager() {
  const { user, isAdmin } = useAuth();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Partial<StoreData> | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    
    const q = query(collection(db, 'stores'), orderBy('priority', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreData));
      setStores(storeData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'stores');
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(stores);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Optimistic update
    setStores(items);
    
    // Update priorities in DB
    try {
      await Promise.all(items.map((item: any, index) => 
        updateDoc(doc(db, 'stores', item.id), { priority: index, updatedAt: serverTimestamp() })
      ));
      toast.success('Order saved');
    } catch (error) {
      toast.error('Failed to save order');
      handleFirestoreError(error, OperationType.UPDATE, 'stores');
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore?.name || !editingStore?.type) return;
    setIsSaving(true);
    
    try {
      let logoUrl = editingStore.logo || '';
      if (logoFile) {
        const storageRef = ref(storage, `stores/${Date.now()}_${logoFile.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, logoFile);
        logoUrl = await getDownloadURL(uploadTask.ref);
      }
      
      const storeRef = editingStore.id ? doc(db, 'stores', editingStore.id) : doc(collection(db, 'stores'));
      
      const payload: any = {
        name: editingStore.name,
        logo: logoUrl,
        status: editingStore.status || 'active',
        apiUrl: editingStore.apiUrl || '',
        apiKey: editingStore.apiKey || '',
        supportedLanguages: editingStore.supportedLanguages || ['en'],
        productTypes: editingStore.productTypes || ['both'],
        type: editingStore.type || 'marketplace',
        priority: editingStore.priority ?? stores.length,
        updatedAt: serverTimestamp()
      };
      
      if (!editingStore.id) {
        payload.createdAt = serverTimestamp();
        payload.clicks = 0;
        payload.searches = 0;
        payload.productsImported = 0;
        payload.activeUsers = 0;
      }
      
      if (editingStore.id) {
         await updateDoc(storeRef, payload);
         toast.success('Store updated');
      } else {
         await setDoc(storeRef, payload);
         toast.success('Store created');
      }
      
      setIsModalOpen(false);
      setEditingStore(null);
      setLogoFile(null);
      setLogoPreview('');
    } catch (error: any) {
      toast.error(error.message || 'Error saving store');
      handleFirestoreError(error, editingStore?.id ? OperationType.UPDATE : OperationType.CREATE, 'stores');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'stores', id));
        toast.success(`Deleted ${name}`);
      } catch (error) {
        toast.error('Error deleting store');
        handleFirestoreError(error, OperationType.DELETE, 'stores');
      }
    }
  };

  const toggleStatus = async (store: StoreData) => {
    try {
      await updateDoc(doc(db, 'stores', store.id), {
        status: store.status === 'active' ? 'disabled' : 'active',
        updatedAt: serverTimestamp()
      });
      toast.success(`${store.name} ${store.status === 'active' ? 'disabled' : 'activated'}`);
    } catch (error) {
      toast.error('Error updating status');
      handleFirestoreError(error, OperationType.UPDATE, 'stores');
    }
  };

  const openNewStoreModal = () => {
    setEditingStore({ ...DEFAULT_STORE, priority: stores.length });
    setLogoFile(null);
    setLogoPreview('');
    setIsModalOpen(true);
  };
  
  const openEditModal = (store: StoreData) => {
    setEditingStore({ ...store });
    setLogoFile(null);
    setLogoPreview(store.logo);
    setIsModalOpen(true);
  };

  const openApiModal = (store: StoreData) => {
    setEditingStore({ ...store });
    setIsApiModalOpen(true);
  };

  const handleSaveApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore?.id) return;
    setIsSaving(true);
    
    try {
      await updateDoc(doc(db, 'stores', editingStore.id), {
        apiUrl: editingStore.apiUrl || '',
        apiKey: editingStore.apiKey || '',
        updatedAt: serverTimestamp()
      });
      toast.success('API Configuration updated');
      setIsApiModalOpen(false);
      setEditingStore(null);
    } catch (error: any) {
      toast.error(error.message || 'Error saving API configuration');
      handleFirestoreError(error, OperationType.UPDATE, 'stores');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stores, null, 2));
    const dt = document.createElement('a');
    dt.setAttribute("href", dataStr);
    dt.setAttribute("download", "stores_export.json");
    dt.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
           for (const store of data) {
              const { id, ...rest } = store;
              // Clean or normalize data
              const payload = {
                ...rest,
                priority: stores.length + 1,
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
              };
              await setDoc(doc(collection(db, 'stores')), payload);
           }
           toast.success("Stores imported successfully!");
        }
      } catch (err) {
        toast.error("Failed to import file");
        handleFirestoreError(err, OperationType.CREATE, 'stores');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRefresh = () => {
    setLoading(true);
    // the snapshot updates naturally, but for UI feedback:
    setTimeout(() => {
      setLoading(false);
      toast.success("Cache refreshed");
    }, 500);
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F9F8F6]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-red-100 max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <Store className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">You must be a Super Admin or Store Manager to access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FBFBFB]">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Header Options */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111827]">Store Management</h1>
            <p className="text-[#6B7280] mt-1">Manage global vendors, affiliates, and marketplace integrations.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button onClick={handleRefresh} className="p-2 text-[#4B5563] hover:bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] transition-colors" title="Refresh Data">
              <Store className="w-5 h-5" />
            </button>
            <label className="p-2 text-[#4B5563] hover:bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] transition-colors cursor-pointer" title="Import JSON">
              <Upload className="w-5 h-5" />
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button onClick={handleExport} className="p-2 text-[#4B5563] hover:bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] transition-colors" title="Export JSON">
              <Download className="w-5 h-5" />
            </button>
            <button onClick={openNewStoreModal} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm whitespace-nowrap">
              <Plus className="w-5 h-5" />
              Add New Store
            </button>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Stores', value: stores.length },
            { label: 'Active Affiliates', value: stores.filter(s => s.type === 'affiliate' && s.status === 'active').length },
            { label: 'API Integrations', value: stores.filter(s => s.apiUrl).length },
            { label: 'Total Clicks', value: stores.reduce((acc, s) => acc + (s.clicks || 0), 0) }
          ].map(stat => (
            <div key={stat.label} className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
              <p className="text-[#6B7280] text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-[#111827]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-t-2xl border border-[#E5E7EB] border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input 
              type="text" 
              placeholder="Search stores by name, type, or status..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D1D5DB] focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
            />
           </div>
           <div className="flex gap-2">
             <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Active: {stores.filter(s => s.status === 'active').length}</span>
             <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">Total: {stores.length}</span>
           </div>
        </div>

        {/* Store List / Drag & Drop */}
        <div className="bg-white rounded-b-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          {loading ? (
             <div className="flex justify-center items-center p-12">
               <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
             </div>
          ) : stores.length === 0 ? (
             <div className="text-center p-12 text-[#6B7280]">
               <Store className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No stores found. Add your first store to get started.</p>
             </div>
          ) : (
             <DragDropContext onDragEnd={handleDragEnd}>
               <Droppable droppableId="store-list">
                 {(provided) => (
                   <ul {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-[#E5E7EB]">
                     {filteredStores.map((store, index) => (
                       // @ts-ignore
                       <Draggable key={store.id} draggableId={store.id} index={index}>
                         {(provided, snapshot) => (
                           <li 
                             ref={provided.innerRef}
                             {...provided.draggableProps}
                             className={`flex items-center p-4 gap-4 transition-colors ${snapshot.isDragging ? 'bg-[#F3F4F6] shadow-lg ring-1 ring-[#2563EB]/50' : 'hover:bg-[#F9FAFB]'}`}
                           >
                              <div {...provided.dragHandleProps} className="text-[#9CA3AF] hover:text-[#4B5563] cursor-grab">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              
                              <div className="w-12 h-12 bg-[#F3F4F6] rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-[#E5E7EB]">
                                {store.logo ? (
                                  <img src={store.logo} alt={store.name} className="w-full h-full object-contain p-1" />
                                ) : (
                                  <Store className="w-6 h-6 text-[#9CA3AF]" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <h3 className="font-bold text-[#111827] flex items-center gap-2">
                                    {store.name}
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      store.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {store.status}
                                    </span>
                                  </h3>
                                  <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                                    <span className="capitalize border border-[#E5E7EB] px-2 py-0.5 rounded bg-white">{store.type}</span>
                                    <span>Added {new Date(store.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}</span>
                                    <span className="hidden md:inline">URL: {store.apiUrl || 'N/A'}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-right hidden lg:block mr-4 text-xs space-y-0.5">
                                    <p><span className="text-[#9CA3AF]">Clicks:</span> <span className="font-medium text-[#374151]">{store.clicks || 0}</span></p>
                                    <p><span className="text-[#9CA3AF]">Products:</span> <span className="font-medium text-[#374151]">{store.productsImported || 0}</span></p>
                                  </div>
                                  
                                  <label className="relative inline-flex items-center cursor-pointer mr-2" title={store.status === 'active' ? 'Disable Store' : 'Enable Store'}>
                                    <input 
                                      type="checkbox" 
                                      className="sr-only"
                                      checked={store.status === 'active'}
                                      onChange={() => toggleStatus(store)}
                                    />
                                    <div className={`w-11 h-6 rounded-full transition-colors ${store.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}>
                                      <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${store.status === 'active' ? 'translate-x-6' : 'translate-x-1'}`}></div>
                                    </div>
                                  </label>

                                  <button onClick={() => openApiModal(store)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="API Configuration">
                                    <Webhook className="w-5 h-5" />
                                  </button>
                                  <button onClick={() => openEditModal(store)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Store">
                                    <Edit2 className="w-5 h-5" />
                                  </button>
                                  <button onClick={() => handleDelete(store.id, store.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Store">
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                           </li>
                         )}
                       </Draggable>
                     ))}
                     {provided.placeholder}
                   </ul>
                 )}
               </Droppable>
             </DragDropContext>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {isModalOpen && editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
              <h2 className="text-xl font-bold text-[#111827]">
                {editingStore.id ? 'Edit Store' : 'Add New Store'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#9CA3AF] hover:text-[#4B5563] transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="store-form" onSubmit={handleSaveStore} className="space-y-6">
                
                {/* Logo & Name Area */}
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-[#F3F4F6] rounded-2xl border-2 border-dashed border-[#D1D5DB] flex flex-col relative overflow-hidden group">
                    {(logoPreview || logoFile) ? (
                      <img src={logoFile ? URL.createObjectURL(logoFile) : logoPreview} alt="Logo" className="w-full h-full object-contain p-2 bg-white" />
                    ) : (
                      <div className="m-auto flex flex-col items-center justify-center text-[#9CA3AF]">
                        <UploadCloud className="w-8 h-8 mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-center px-2">Upload Logo</span>
                      </div>
                    )}
                    <label className="absolute inset-0 cursor-pointer bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <span className="text-white text-[10px] font-bold uppercase">Change</span>
                       <input 
                         type="file" 
                         accept="image/*"
                         className="hidden" 
                         onChange={(e) => {
                           if (e.target.files?.[0]) setLogoFile(e.target.files[0]);
                         }}
                       />
                    </label>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-[#374151] mb-1">Store Name *</label>
                       <input 
                         type="text" 
                         required
                         value={editingStore.name || ''}
                         onChange={e => setEditingStore({...editingStore, name: e.target.value})}
                         className="w-full border border-[#D1D5DB] rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                         placeholder="e.g. Amazon, BestBuy..."
                       />
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-[#374151] mb-1">Store Type *</label>
                          <select 
                            value={editingStore.type || 'marketplace'}
                            onChange={e => setEditingStore({...editingStore, type: e.target.value as any})}
                             className="w-full border border-[#D1D5DB] rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                          >
                            <option value="marketplace">Marketplace</option>
                            <option value="local">Local Store</option>
                            <option value="affiliate">Affiliate Store</option>
                            <option value="used">Used Products</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-[#374151] mb-1">Status</label>
                          <select 
                            value={editingStore.status || 'active'}
                            onChange={e => setEditingStore({...editingStore, status: e.target.value as any})}
                             className="w-full border border-[#D1D5DB] rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                          >
                            <option value="active">Active</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </div>
                     </div>
                  </div>
                </div>

                <hr className="border-[#E5E7EB]" />
                
                {/* Configuration */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Configuration</h3>
                  <div>
                     <label className="block text-sm font-medium text-[#374151] mb-1">Supported Products</label>
                     <select 
                       value={editingStore.productTypes?.[0] || 'both'}
                       onChange={e => setEditingStore({...editingStore, productTypes: [e.target.value]})}
                       className="w-full border border-[#D1D5DB] rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                     >
                       <option value="both">New & Used</option>
                       <option value="new">New Only</option>
                       <option value="used">Used Only</option>
                     </select>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-[#E5E7EB] flex justify-end gap-3 bg-[#F9FAFB] rounded-b-2xl">
               <button 
                 type="button" 
                 onClick={() => setIsModalOpen(false)}
                 className="px-5 py-2.5 text-[#374151] font-medium hover:bg-[#E5E7EB] rounded-xl transition-colors"
               >
                 Cancel
               </button>
               <button 
                 form="store-form"
                 type="submit" 
                 disabled={isSaving}
                 className="px-5 py-2.5 bg-[#2563EB] text-white font-medium hover:bg-[#1D4ED8] rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
               >
                 {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                 Save Store
               </button>
            </div>
          </div>
        </div>
      )}

      {/* API Configuration Modal */}
      {isApiModalOpen && editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                   <Webhook className="w-5 h-5" />
                 </div>
                 <h2 className="text-xl font-bold text-[#111827]">
                   API Configuration • {editingStore.name}
                 </h2>
              </div>
              <button onClick={() => setIsApiModalOpen(false)} className="text-[#9CA3AF] hover:text-[#4B5563] transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-[#4B5563] mb-6">
                 Setup external data synchronization or webhooks for this specific store.
                 These credentials will be injected into server-side functions.
              </p>
              <form id="api-form" onSubmit={handleSaveApi} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">API Endpoint URL</label>
                  <input 
                    type="url" 
                    value={editingStore.apiUrl || ''}
                    onChange={e => setEditingStore({...editingStore, apiUrl: e.target.value})}
                    className="w-full border border-[#D1D5DB] rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all font-mono text-sm"
                    placeholder="https://api.example.com/v1"
                  />
                  <p className="text-xs text-[#6B7280] mt-1">Leave blank to use the store's default scraping method (if available).</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">API Secret / Token (Optional)</label>
                  <input 
                    type="password" 
                    value={editingStore.apiKey || ''}
                    onChange={e => setEditingStore({...editingStore, apiKey: e.target.value})}
                    className="w-full border border-[#D1D5DB] rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all font-mono text-sm"
                    placeholder="sk_live_xxxxxxxxx"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-[#E5E7EB] flex justify-end gap-3 bg-[#F9FAFB] rounded-b-2xl">
               <button 
                 type="button" 
                 onClick={() => setIsApiModalOpen(false)}
                 className="px-5 py-2.5 text-[#374151] font-medium hover:bg-[#E5E7EB] rounded-xl transition-colors"
               >
                 Cancel
               </button>
               <button 
                 form="api-form"
                 type="submit" 
                 disabled={isSaving}
                 className="px-5 py-2.5 bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED] rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
               >
                 {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                 Save API Settings
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
