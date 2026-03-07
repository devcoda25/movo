'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Button, Card } from '@/components/ui';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Sparkles, MapPin, Star, ArrowRight, Users, Heart, ChevronRight, Search, Bell, Menu, X, Play, CheckCircle, Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuredEscorts, setFeaturedEscorts] = useState<any[]>([]);
  const [stats, setStats] = useState({ escorts: 0, clients: 0 });
  const [isLoadingEscorts, setIsLoadingEscorts] = useState(true);

  // Redirect authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.userType === 'admin') router.push('/admin/dashboard');
      else if (user.userType === 'escort') router.push('/escort/dashboard');
      else router.push('/client/dashboard');
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Fetch featured escorts and stats
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingEscorts(true);
      try {
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        let escortsCount = 0;
        let clientsCount = 0;
        const escortsData: any[] = [];

        usersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.userType === 'escort' && data.isVerified) {
            escortsCount++;
            escortsData.push({
              id: doc.id,
              fullName: data.fullName || 'Unknown',
              location: data.location || 'Uganda',
              rating: data.rating || 0,
              profilePhoto: data.profilePhoto || '',
            });
          }
          if (data.userType === 'client') {
            clientsCount++;
          }
        });

        // Sort by rating and take top 6
        escortsData.sort((a, b) => b.rating - a.rating);
        setFeaturedEscorts(escortsData.slice(0, 6));
        setStats({ escorts: escortsCount, clients: clientsCount });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingEscorts(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const features = [
    { icon: CheckCircle, title: 'Verified Profiles', desc: 'All escorts verified', gradient: 'from-green-500 to-emerald-500' },
    { icon: Star, title: '4.9★ Rating', desc: 'Top quality service', gradient: 'from-amber-500 to-orange-500' },
    { icon: Heart, title: 'Safe & Discreet', desc: 'Your privacy matters', gradient: 'from-pink-500 to-rose-500' },
  ];

  const services = [
    { name: 'Dinner Date', gradient: 'from-purple-500 to-pink-500' },
    { name: 'Escort Services', gradient: 'from-pink-500 to-rose-500' },
    { name: 'Massage', gradient: 'from-cyan-500 to-blue-500' },
    { name: 'Companionship', gradient: 'from-emerald-500 to-teal-500' },
    { name: 'Travel Companion', gradient: 'from-amber-500 to-orange-500' },
    { name: 'Party Date', gradient: 'from-violet-500 to-purple-500' },
    { name: 'Overnight', gradient: 'from-rose-500 to-pink-500' },
    { name: 'Weekend', gradient: 'from-cyan-500 to-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 md:hidden backdrop-blur-2xl bg-background/95 border-b border-white/5">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">Movo</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="p-2">
              <span className="text-sm text-primary">Sign In</span>
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background md:hidden pt-14">
          <div className="p-4 space-y-3">
            <Link href="/escorts" className="block p-4 bg-white/5 rounded-2xl" onClick={() => setMobileMenuOpen(false)}>
              <span className="font-medium">Browse Escorts</span>
            </Link>
            <Link href="/signup" className="block p-4 bg-primary rounded-2xl text-center font-medium" onClick={() => setMobileMenuOpen(false)}>
              Get Started
            </Link>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden md:fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-background/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Movo</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/escorts" className="text-white/70 hover:text-white">Browse Escorts</Link>
              <Link href="/about" className="text-white/70 hover:text-white">About</Link>
              <Link href="/contact" className="text-white/70 hover:text-white">Contact</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="rounded-full">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="rounded-full px-6">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-14 md:pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Hero Section - Mobile Optimized */}
          <section className="py-8 md:py-16 relative overflow-hidden">
            {/* Colorful background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
              <div className="absolute top-40 right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl" />
            </div>

            <div className="text-center mb-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 border border-purple-500/30 text-sm mb-6 backdrop-blur-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse" />
                <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent font-medium">Uganda's #1 Premium Platform</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="text-white">Find Your </span>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">Perfect</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Companion</span>
              </h1>

              <p className="text-white/60 text-sm md:text-lg max-w-md mx-auto mb-8">
                Connect with verified professional escorts in Uganda. Safe, discreet, and premium services.
              </p>

              {/* Mobile Search Bar */}
              <div className="md:hidden mb-6">
                <Link href="/escorts">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white/60">Search escorts in Kampala...</span>
                  </div>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/escorts">
                  <Button size="lg" className="w-full sm:w-auto rounded-2xl h-12 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Browse Escorts
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-2xl h-12 px-8 border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats - Mobile */}
            <div className="grid grid-cols-3 gap-3 md:hidden mb-6">
              {[
                { value: `${stats.escorts}+`, label: 'Escorts' },
                { value: `${stats.clients}+`, label: 'Clients' },
                { value: '4.9★', label: 'Rating' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-4 text-center">
                  <div className="text-xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-white/40">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Services Quick Links - Mobile */}
          <section className="py-4 md:py-8">
            <h2 className="text-lg font-semibold mb-4 md:hidden">Popular Services</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
              {services.map((service, i) => (
                <Link key={i} href="/escorts">
                  <div className={`flex-shrink-0 px-4 py-3 bg-gradient-to-r ${service.gradient} rounded-xl text-sm text-center text-white font-medium shadow-lg hover:scale-105 transition-transform`}>
                    {service.name}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Featured Escorts - Mobile Horizontal Scroll */}
          <section className="py-4 md:py-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Featured Escorts</h2>
              <Link href="/escorts" className="text-sm text-primary">See All</Link>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:gap-4">
              {isLoadingEscorts ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : featuredEscorts.length > 0 ? (
                featuredEscorts.map((escort, i) => (
                  <Link key={escort.id} href={`/escorts/${escort.id}`} className="flex-shrink-0 w-40 md:w-auto">
                    <Card className="overflow-hidden bg-white/5 border-0">
                      <div className="aspect-[3/4] relative">
                        {escort.profilePhoto ? (
                          <img src={escort.profilePhoto} alt={escort.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                            <Users className="w-12 h-12 text-white/30" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded-full text-xs">Verified</div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
                          <p className="font-medium text-sm">{escort.fullName}</p>
                          <div className="flex items-center justify-between text-xs text-white/70">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{escort.location}</span>
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-accent" />{escort.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-400">
                  No featured escorts yet
                </div>
              )}
            </div>
          </section>

          {/* Features - Mobile */}
          <section className="py-4 md:py-8">
            <div className="grid md:grid-cols-3 gap-3">
              {features.map((feature, i) => (
                <div key={i} className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-4 flex items-center gap-3 border border-white/5 hover:border-purple-500/30 transition-all">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{feature.title}</p>
                    <p className="text-xs text-white/50">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA - Mobile */}
          <section className="py-4 md:py-8">
            <Card className="overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 border-0 shadow-2xl shadow-purple-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <div className="p-6 text-center relative z-10">
                <h2 className="text-xl font-bold mb-2 text-white">Ready to Get Started?</h2>
                <p className="text-white/80 text-sm mb-4">Join thousands of satisfied clients</p>
                <Link href="/signup">
                  <Button className="w-full rounded-xl bg-white text-purple-600 hover:bg-white/90 font-semibold">
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </Card>
          </section>

          {/* How It Works - Desktop */}
          <section className="hidden md:block py-16">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-4 gap-8">
              {[
                { icon: Users, title: 'Create Account', desc: 'Sign up as a client' },
                { icon: Search, title: 'Browse', desc: 'Explore verified escorts' },
                { icon: Star, title: 'Book', desc: 'Select date & service' },
                { icon: Heart, title: 'Enjoy', desc: 'Meet your companion' },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-white/40 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Desktop Footer */}
      <footer className="hidden md:block border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Movo</span>
            </div>
            <p className="text-white/40 text-sm">© 2026 Movo. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Spacing */}
      <div className="h-4 md:hidden" />
    </div>
  );
}
