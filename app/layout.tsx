import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Port Congestion Intelligence Platform',
  description: 'Real-time global AIS vessel tracking with congestion scoring and dynamic D&D pricing recommendations for 5 major world ports.',
  keywords: 'AIS, port congestion, demurrage, detention, maritime, shipping, vessel tracking',
  openGraph: {
    title: 'Port Congestion Intelligence Platform',
    description: 'Live global AIS vessel tracking with congestion scoring and D&D pricing',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${inter.className} bg-[#0a0f1a] text-slate-100`}>
        {children}
      </body>
    </html>
  );
}
