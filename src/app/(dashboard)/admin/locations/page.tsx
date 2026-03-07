'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AdminSidebar from '@/components/layouts/AdminSidebar';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { MapPin, Plus, Edit2, Trash2, Search, Loader2, X, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface Location {
  id: string;
  name: string;
  region: string;
  isActive: boolean;
  createdAt?: any;
}

export default function AdminLocationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({ name: '', region: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
    else if (!authLoading && isAuthenticated && user?.userType === 'client') router.push('/client/dashboard');
    else if (!authLoading && isAuthenticated && user?.userType === 'escort') router.push('/escort/dashboard');
    else if (!authLoading && isAuthenticated && user?.userType !== 'admin') router.push('/');
  }, [user, isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user?.userType === 'admin') fetchLocations();
  }, [user]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      // Fetch all and sort in memory to avoid index requirement
      const snapshot = await getDocs(collection(db, COLLECTIONS.LOCATIONS));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Location[];
      
      // Sort in memory by name
      setLocations(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.region.trim()) return;
    
    setSaving(true);
    try {
      if (editingLocation) {
        await updateDoc(doc(db, COLLECTIONS.LOCATIONS, editingLocation.id), {
          name: formData.name.trim(),
          region: formData.region.trim(),
        });
      } else {
        await addDoc(collection(db, COLLECTIONS.LOCATIONS), {
          name: formData.name.trim(),
          region: formData.region.trim(),
          isActive: true,
          createdAt: new Date(),
        });
      }
      setShowModal(false);
      setEditingLocation(null);
      setFormData({ name: '', region: '' });
      fetchLocations();
    } catch (error) {
      console.error('Error saving location:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (location: Location) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.LOCATIONS, location.id), {
        isActive: !location.isActive,
      });
      fetchLocations();
    } catch (error) {
      console.error('Error toggling location:', error);
    }
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.LOCATIONS, locationId));
      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const openEditModal = (location: Location) => {
    setEditingLocation(location);
    setFormData({ name: location.name, region: location.region });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingLocation(null);
    setFormData({ name: '', region: '' });
    setShowModal(true);
  };

  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by region
  const groupedLocations = filteredLocations.reduce((acc, loc) => {
    if (!acc[loc.region]) acc[loc.region] = [];
    acc[loc.region].push(loc);
    return acc;
  }, {} as Record<string, Location[]>);

  if (authLoading || !user || user.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen lg:ml-72 pb-24">
      <AdminSidebar onLogout={logout} />
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Locations</h1>
            <p className="text-gray-400">Manage service locations</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Location</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search locations..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm">Total Locations</p>
            <p className="text-2xl font-bold text-white">{locations.length}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm">Active</p>
            <p className="text-2xl font-bold text-green-400">
              {locations.filter(l => l.isActive).length}
            </p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm">Regions</p>
            <p className="text-2xl font-bold text-primary">
              {Object.keys(groupedLocations).length}
            </p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm">Inactive</p>
            <p className="text-2xl font-bold text-red-400">
              {locations.filter(l => !l.isActive).length}
            </p>
          </div>
        </div>

        {/* Locations List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No locations found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedLocations).map(([region, regionLocations]) => (
              <div key={region} className="space-y-3">
                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {region}
                  <span className="text-sm text-gray-400 font-normal">
                    ({regionLocations.length} {regionLocations.length === 1 ? 'location' : 'locations'})
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regionLocations.map((location) => (
                    <div
                      key={location.id}
                      className={`bg-white/5 rounded-2xl p-4 border border-white/10 ${
                        !location.isActive ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate">{location.name}</h4>
                          <p className="text-gray-400 text-sm">{location.region}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(location)}
                            className="p-2 hover:bg-white/10 rounded-xl"
                          >
                            <Edit2 className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(location.id)}
                            className="p-2 hover:bg-red-500/20 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          onClick={() => handleToggleActive(location)}
                          className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${
                            location.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {location.isActive ? (
                            <>
                              <Check className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" /> Inactive
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingLocation ? 'Edit Location' : 'Add New Location'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-2">Location Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Kololo, Ntinda, Bugolobi"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2">Region</label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
              required
            >
              <option value="">Select a region</option>
              <option value="Kampala">Kampala</option>
              <option value="Wakiso">Wakiso</option>
              <option value="Mukono">Mukono</option>
              <option value="Entebbe">Entebbe</option>
              <option value="Jinja">Jinja</option>
              <option value="Mbarara">Mbarara</option>
              <option value="Gulu">Gulu</option>
              <option value="Lira">Lira</option>
              <option value="Kasese">Kasese</option>
              <option value="Mbale">Mbale</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : editingLocation ? (
                'Update Location'
              ) : (
                'Add Location'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
