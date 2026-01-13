import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bon Appe-Pick | Restaurant Randomizer',
  description: 'Spin. Pick. Eat. - Your personal restaurant randomizer with Google Places integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="bg-pattern" />
        {children}
      </body>
    </html>
  );
}
