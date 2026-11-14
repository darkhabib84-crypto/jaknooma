import React, { useState, useEffect } from 'react';
import { Search, Ban, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';
import { isRtlLanguage } from '../../lib/i18n';
import toast from 'react-hot-toast';

const SUPER_ADMIN_EMAILS = ['dark.habib84@gmail.com', 'admin@jaknooma.com'];

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);

  const isSuperAdminEmail = (email?: string) =>
    Boolean(email && SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase()));

  const resolveUserRole = (u: any): 'ADMIN' | 'SELLER' | 'CUSTOMER' => {
    if (isSuperAdminEmail(u.email)) return 'ADMIN';
    const raw = String(u.role || '').toUpperCase();
    if (raw === 'ADMIN' || raw === 'SUPER_ADMIN') return 'ADMIN';
    if (raw === 'SELLER' || raw === 'VENDOR') return 'SELLER';
    return 'CUSTOMER';
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userData: any[] = querySnapshot.docs.map(d => {
        const data = d.data();
        const role = resolveUserRole(data);
        return {
          id: d.id,
          ...data,
          email: data.email || '',
          status: data.status || 'Active',
          name: data.name || data.displayName || (isSuperAdminEmail(data.email) ? 'Jaknooma Super Admin' : data.email?.split('@')[0] || 'Unknown'),
          role,
        };
      });

      // Ensure dark.habib84@gmail.com is always present and marked as ADMIN
      const hasPrimaryAdmin = userData.some(
        u => u.email?.toLowerCase() === 'dark.habib84@gmail.com'
      );
      if (!hasPrimaryAdmin) {
        userData.unshift({
          id: 'super_admin_habib',
          name: 'Habib (Super Admin)',
          email: 'dark.habib84@gmail.com',
          role: 'ADMIN',
          status: 'Active',
        });
      } else {
        // Also persist ADMIN role in Firestore if it wasn't set yet
        const adminDoc = userData.find(u => u.email?.toLowerCase() === 'dark.habib84@gmail.com');
        if (adminDoc && adminDoc.id !== 'super_admin_habib') {
          updateDoc(doc(db, 'users', adminDoc.id), { role: 'ADMIN' }).catch(() => {});
        }
      }

      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(isRtl ? 'تعذر تحميل قائمة المستخدمين' : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userItem: any, newRole: 'ADMIN' | 'SELLER' | 'CUSTOMER') => {
    if (isSuperAdminEmail(userItem.email) && newRole !== 'ADMIN') {
      toast.error(
        isRtl
          ? 'لا يمكن تخفيض صلاحية المالك الأساسي للمنصة (dark.habib84@gmail.com)'
          : 'Cannot downgrade primary Super Admin (dark.habib84@gmail.com)'
      );
      return;
    }

    try {
      setUsers(prev =>
        prev.map(u => (u.id === userItem.id ? { ...u, role: newRole } : u))
      );
      if (userItem.id !== 'super_admin_habib') {
        await setDoc(doc(db, 'users', userItem.id), { role: newRole }, { merge: true });
      }
      toast.success(
        isRtl
          ? `تم تحديث صلاحية المستخدم إلى ${newRole}`
          : `Updated role to ${newRole}`
      );
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(isRtl ? 'فشل تحديث الصلاحية' : 'Failed to update user role');
    }
  };

  const toggleUserStatus = async (userItem: any) => {
    if (isSuperAdminEmail(userItem.email)) {
      toast.error(isRtl ? 'لا يمكن حظر حساب الأدمن الرئيسي' : 'Cannot ban Super Admin account');
      return;
    }
    const currentStatus = userItem.status || 'Active';
    const statusToSet = currentStatus === 'Banned' ? 'Active' : 'Banned';
    try {
      await updateDoc(doc(db, 'users', userItem.id), { status: statusToSet });
      setUsers(users.map(u => (u.id === userItem.id ? { ...u, status: statusToSet } : u)));
      toast.success(
        statusToSet === 'Banned'
          ? isRtl ? 'تم حظر المستخدم' : 'User has been banned'
          : isRtl ? 'تم تفعيل حساب المستخدم' : 'User has been activated'
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(isRtl ? 'فشل تحديث حالة المستخدم' : 'Failed to update user status');
    }
  };

  const filteredUsers = users.filter(
    u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-1">{t('Users')}</h1>
          <p className="text-gray-500 text-sm">
            {isRtl
              ? `إدارة ${users.length} مستخدم مسجل وتخصيص صلاحيات الأدمن والبائعين.`
              : `Manage ${users.length} registered users and role permissions.`}
          </p>
        </div>
      </div>

      <div className="flex gap-4 shrink-0">
        <div className="relative flex-1">
          <Search
            className={`w-5 h-5 absolute ${
              isRtl ? 'right-3.5' : 'left-3.5'
            } top-1/2 -translate-y-1/2 text-gray-400`}
          />
          <input
            type="text"
            placeholder={isRtl ? 'ابحث بالاسم أو البريد الإلكتروني أو الصلاحية...' : 'Search by name, email, or role...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full ${
              isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'
            } py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all`}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
        {/* Smooth horizontal scroll container for mobile so STATUS and ACTIONS are never cut off */}
        <div className="overflow-x-auto flex-1 w-full custom-scrollbar">
          <table className="w-full text-start border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/70 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 font-semibold text-start ps-6">{t('User')}</th>
                <th className="p-4 font-semibold text-start">{t('Role')}</th>
                <th className="p-4 font-semibold text-start">{t('Status')}</th>
                <th className="p-4 font-semibold text-end pe-6">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 text-sm">
                    {isRtl ? 'جاري تحميل المستخدمين...' : 'Loading users...'}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 text-sm">
                    {t('No results found')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem) => {
                  const status = userItem.status || 'Active';
                  const role = resolveUserRole(userItem);
                  const isSuper = isSuperAdminEmail(userItem.email);

                  return (
                    <tr key={userItem.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 ps-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                              role === 'ADMIN'
                                ? 'bg-black text-[#D4AF37] border border-[#D4AF37]/40'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {role === 'ADMIN' ? 'AD' : userItem.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-black text-sm flex items-center gap-2">
                              <span>{userItem.name || 'Unknown'}</span>
                              {role === 'ADMIN' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black text-[#D4AF37] border border-[#D4AF37]/40 tracking-wider uppercase">
                                  <ShieldCheck className="w-3 h-3" />
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-gray-500 text-xs mt-0.5" dir="ltr">
                              {userItem.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <select
                            value={role}
                            disabled={isSuper}
                            onChange={(e) =>
                              handleRoleChange(userItem, e.target.value as 'ADMIN' | 'SELLER' | 'CUSTOMER')
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                              role === 'ADMIN'
                                ? 'bg-amber-50/80 text-[#9A6F18] border-[#D4AF37]/50'
                                : role === 'SELLER'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            } ${isSuper ? 'opacity-95 cursor-default' : ''}`}
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="SELLER">SELLER</option>
                            <option value="CUSTOMER">CUSTOMER</option>
                          </select>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50">
                          {status === 'Active' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="text-emerald-700">{isRtl ? 'نشط (Active)' : 'Active'}</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-4 h-4 text-red-500 shrink-0" />
                              <span className="text-red-700">{isRtl ? 'محظور (Banned)' : 'Banned'}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="p-4 pe-6 text-end whitespace-nowrap">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 px-2">
                            <UserCheck className="w-4 h-4 text-[#D4AF37]" />
                            <span>{isRtl ? 'حساب محمي' : 'Protected'}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(userItem)}
                            title={status === 'Active' ? 'Ban User' : 'Unban User'}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              status === 'Active'
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {status === 'Active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
