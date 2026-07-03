import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Edit2, ShieldAlert, Ban, Mail, CheckCircle2 } from 'lucide-react';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // جلب المستخدمين من Firebase
  const fetchUsers = async () => {
    const db = getFirestore();
    const querySnapshot = await getDocs(collection(db, "users"));
    const userData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUsers(userData);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // وظيفة تغيير حالة المستخدم (Ban/Unban)
  const toggleUserStatus = async (id: string, currentStatus: string) => {
    try {
      const db = getFirestore();
      const newStatus = currentStatus === 'Active' ? 'Banned' : 'Active';
      await updateDoc(doc(db, "users", id), { status: newStatus });
      // تحديث الحالة محلياً في الجدول
      setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error("خطأ في تحديث الحالة:", error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-1">Users</h1>
          <p className="text-gray-500">Manage {users.length} registered users.</p>
        </div>
      </div>

      <div className="flex gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 font-medium pl-6">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-black text-sm">{user.name || "Unknown"}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-bold uppercase text-gray-600">
                    {user.role || 'Customer'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      {user.status === 'Active' ? (
                        <><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-sm font-medium text-green-700">Active</span></>
                      ) : (
                        <><Ban className="w-4 h-4 text-red-500" /><span className="text-sm font-medium text-red-700">Banned</span></>
                      )}
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button 
                      onClick={() => toggleUserStatus(user.id, user.status)}
                      title={user.status === 'Active' ? "Ban User" : "Unban User"}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      {user.status === 'Active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

