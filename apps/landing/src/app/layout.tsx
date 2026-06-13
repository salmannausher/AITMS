import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LoadPilot — AI Dispatch Copilot for Small Carriers',
  description:
    'One dispatcher. 3× the trucks. LoadPilot parses broker emails, scores loads with AI, and sends WhatsApp assignments in one click.',
  openGraph: {
    title: 'LoadPilot — AI Dispatch Copilot for Small Carriers',
    description:
      'Stop drowning in broker emails. LoadPilot handles the grunt work so you can focus on moving freight.',
    url: 'https://getloadpilot.com',
    siteName: 'LoadPilot',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
