'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AdminSidebar from '@/components/layouts/AdminSidebar';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Bell, X, Save, Loader2 } from 'lucide-react';
import { Service } from '@/types';

export default function AdminServicesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    else if (!isLoading && isAuthenticated && user?.userType === 'client') router.push('/client/dashboard');
    else if (!isLoading && isAuthenticated && user?.userType === 'escort') router.push('/escort/dashboard');
    else if (!isLoading && isAuthenticated && user?.userType !== 'admin') router.push('/');
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.SERVICES));
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const toggleService = async (id: string) => {
    const service = services.find(s => s.id === id);
    if (!service) return;
    
    try {
      const { updateDocument } = await import('@/lib/firebase');
      await updateDocument('services', id, { isActive: !service.isActive });
    } catch (error) {
      // Mock update
    }
    setServices(services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const handleAddService = async () => {
    if (!formData.name.trim()) return;
    
    const newService = {
      name: formData.name,
      description: formData.description,
      isActive: true,
      createdAt: new Date(),
    };

    try {
      const { createDocument } = await import('@/lib/firebase');
      await createDocument('services', Date.now().toString(), newService);
    } catch (error) {
      // Mock add
      setServices([...services, { id: Date.now().toString(), ...newService } as Service]);
    }
    
    setShowAddModal(false);
    setFormData({ name: '', description: '' });
    loadServices();
  };

  const handleEditService = async () => {
    if (!selectedService || !formData.name.trim()) return;
    
    try {
      const { updateDocument } = await import('@/lib/firebase');
      await updateDocument('services', selectedService.id, {
        name: formData.name,
        description: formData.description,
      });
    } catch (error) {
      // Mock update
    }
    
    setServices(services.map(s => s.id === selectedService.id ? { ...s, name: formData.name, description: formData.description } : s));
    setShowEditModal(false);
    setSelectedService(null);
    setFormData({ name: '', description: '' });
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) return;
    
    try {
      const { deleteDocument } = await import('@/lib/firebase');
      await deleteDocument('services', id);
    } catch (error) {
      // Mock delete
    }
    
    setServices(services.filter(s => s.id !== id));
  };

  const openEditModal = (service: Service) => {
    setSelectedService(service);
    setFormData({ name: service.name, description: service.description });
    setShowEditModal(true);
  };

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
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Manage Services</h1>
            <p className="text-white/40">{services.filter(s => s.isActive).length} active services</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5 text-white/60" />
            </button>
            <Button 
              leftIcon={<Plus className="w-4 h-4" />} 
              className="rounded-2xl"
              onClick={() => setShowAddModal(true)}
            >
              Add Service
            </Button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} className={`bg-white/5 border-white/5 transition-all ${!service.isActive ? 'opacity-50' : 'hover:bg-white/10'}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">{service.name}</h3>
                    <p className="text-sm text-white/50 mt-1">{service.description}</p>
                  </div>
                  <button onClick={() => toggleService(service.id)} className="ml-2">
                    {service.isActive ? 
                      <ToggleRight className="w-8 h-8 text-green-400" /> : 
                      <ToggleLeft className="w-8 h-8 text-white/30" />
                    }
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 rounded-xl border-white/10 hover:bg-white/10"
                    onClick={() => openEditModal(service)}
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-xl text-red-400 hover:text-red-300"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-background rounded-3xl border border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">Add New Service</h2>
              <button onClick={() => { setShowAddModal(false); setFormData({ name: '', description: '' }); }} className="p-2 hover:bg-white/10 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service Name</label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Massage, Dinner Date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea 
                  className="w-full h-24 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the service..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddModal(false); setFormData({ name: '', description: '' }); }}>Cancel</Button>
              <Button className="flex-1" onClick={handleAddService}>
                <Save className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-background rounded-3xl border border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">Edit Service</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedService(null); setFormData({ name: '', description: '' }); }} className="p-2 hover:bg-white/10 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service Name</label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Massage, Dinner Date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea 
                  className="w-full h-24 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the service..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowEditModal(false); setSelectedService(null); setFormData({ name: '', description: '' }); }}>Cancel</Button>
              <Button className="flex-1" onClick={handleEditService}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
