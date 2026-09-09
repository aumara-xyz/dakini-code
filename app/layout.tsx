import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dakini Code',
  description: 'A curved calligraphic study suspended in space. Rotate, unfold, and return.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
