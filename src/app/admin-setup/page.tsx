'use client';

import { useState } from 'react';
import { auth, db, COLLECTIONS } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { Sparkles, Shield, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminSetupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // Sign in to get the UID
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Set user as admin
      await setDoc(doc(db, COLLECTIONS.USERS, uid), {
        email,
        userType: 'admin',
        fullName: 'Admin',
        location: 'Kampala',
        profilePhoto: '',
        bio: 'Platform Administrator',
        isVerified: true,
      }, { merge: true });

      setMessage(`✅ Success! User ${email} is now an admin.`);
    } catch (err: any) {
      setError(err.message || 'Failed to set admin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/10" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold font-display">Movo</span>
          </Link>
        </div>

        <Card className="glass-card">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Setup</h1>
                <p className="text-sm text-muted-foreground">Make yourself an admin</p>
              </div>
            </div>
            
            <form onSubmit={handleSetup} className="space-y-4">
              <Input
                type="email"
                label="Your Email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              <Input
                type="password"
                label="Your Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  {error}
                </div>
              )}

              {message && (
                <div className="p-3 text-sm text-green-500 bg-green-500/10 rounded-lg">
                  {message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                rightIcon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
              >
                Set as Admin
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-primary hover:underline">
                Go to Login
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          1. Sign up with an email first<br/>
          2. Then come here to make yourself admin
        </p>
      </div>
    </div>
  );
}
