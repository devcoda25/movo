'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AdminSidebar from '@/components/layouts/AdminSidebar';
import { Search, Plus, X, Loader2, UserPlus, MapPin, Phone, Mail, ArrowUpCircle } from 'lucide-react';
import { User } from '@/types';

const UGANDA_LOCATIONS = ['Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu', 'Lira', 'Masaka', 'Kasese', 'Mbale', 'Soroti', 'Fort Portal', 'Other'];

export default function AdminClientsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseModal, setResponseModal] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' });
  const [clientToUpgrade, setClientToUpgrade] = useState<User | null>(null);
  const [formData, setFormData] = useState({ username: '', email: '', phone: '', location: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    else if (!isLoading && isAuthenticated && user?.userType === 'client') router.push('/client/dashboard');
    else if (!isLoading && isAuthenticated && user?.userType === 'escort') router.push('/escort/dashboard');
    else if (!isLoading && isAuthenticated && user?.userType !== 'admin') router.push('/');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { getDocuments } = await import('@/lib/firebase');
      const data = await getDocuments('users');
      const filteredData = (data as User[]).filter((u: User) => u.userType === 'client');
      setClients(filteredData);
    } catch (error) {
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const showResponse = (title: string, message: string, type: 'success' | 'error') => {
    setResponseModal({ title, message, type });
    setShowResponseModal(true);
  };

  const handleAddClient = async () => {
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      showResponse('Validation Error', 'Please fill in required fields', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userType: 'client', dateOfBirth: '', bio: '' }),
      });
      const result = await response.json();
      if (!response.ok) {
        showResponse('Error', result.error || 'Failed to create user', 'error');
        return;
      }
      showResponse('Success', 'Client created successfully!', 'success');
      setShowAddModal(false);
      setFormData({ username: '', email: '', phone: '', location: '', password: '' });
      loadClients();
    } catch (error) {
      showResponse('Error', 'Failed to create user.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpgradeToEscort = async () => {
    if (!clientToUpgrade) return;
    try {
      const { updateDocument } = await import('@/lib/firebase');
      await updateDocument('users', clientToUpgrade.id, { userType: 'escort', isVerified: false });
      showResponse('Success', `${clientToUpgrade.fullName} is now an escort!`, 'success');
    } catch (error) {
      // continue
    }
    setClients(clients.filter(c => c.id !== clientToUpgrade.id));
    setShowUpgradeModal(false);
    setClientToUpgrade(null);
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { deleteDocument } = await import('@/lib/firebase');
      await deleteDocument('users', clientId);
    } catch (error) { /* continue */ }
    setClients(clients.filter(c => c.id !== clientId));
  };

  const filteredClients = clients.filter(c =>
    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || !user || user.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar onLogout={handleLogout} />
      <main className="lg:ml-72 p-4 lg:p-8 pb-24">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Clients</h1>
            <p className="text-slate-400">{clients.length} registered</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add Client</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400">No clients found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <div key={client.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {client.fullName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{client.fullName}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{client.location || 'No location'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Phone className="w-3 h-3" />
                      <span>{client.phone || 'No phone'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => { setClientToUpgrade(client); setShowUpgradeModal(true); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    <span className="text-sm">Promote</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Add New Client</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-700 rounded-xl">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Location</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select location</option>
                  {UGANDA_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <button
                onClick={handleAddClient}
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && clientToUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <ArrowUpCircle className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Promote to Escort?</h3>
            <p className="text-slate-400 text-center mb-4">
              {clientToUpgrade.fullName} will become an escort and need verification.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowUpgradeModal(false); setClientToUpgrade(null); }}
                className="flex-1 py-3 bg-slate-700 text-white font-medium rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradeToEscort}
                className="flex-1 py-3 bg-purple-500 text-white font-medium rounded-xl"
              >
                Promote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              responseModal.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              {responseModal.type === 'success' ? (
                <Plus className="w-6 h-6 text-emerald-400" />
              ) : (
                <X className="w-6 h-6 text-red-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">{responseModal.title}</h3>
            <p className="text-slate-400 text-center mb-4">{responseModal.message}</p>
            <button
              onClick={() => setShowResponseModal(false)}
              className="w-full py-3 bg-slate-700 text-white font-medium rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
