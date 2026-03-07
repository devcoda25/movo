import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import LoadingWrapper from '@/components/LoadingWrapper';

export const metadata: Metadata = {
  title: 'Movo - Professional Escort Booking',
  description: 'Connect with professional escorts in Uganda. Safe, discreet, and premium escort services.',
  keywords: ['escort', 'dating', 'Uganda', 'booking', 'professional'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <AuthProvider>
          <LoadingWrapper>
            {children}
          </LoadingWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
