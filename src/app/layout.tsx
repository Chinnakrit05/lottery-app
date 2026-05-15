import type { Metadata } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { UIPreferencesProvider } from '@/contexts/ui-preferences';
import { Toaster } from 'sonner';

const notoThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-thai',
});

export const metadata: Metadata = {
  title: 'Love Number',
  description: 'Love Number — ระบบจัดการหวย Desktop',
};

// Inline script applied before React hydrates — prevents flash of wrong size
const noFlashFontScale = `
(function() {
  try {
    var s = localStorage.getItem('ui-font-scale');
    if (s && ['sm','md','lg','xl'].indexOf(s) !== -1) {
      document.documentElement.setAttribute('data-font-scale', s);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning className={notoThai.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashFontScale }} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <UIPreferencesProvider>
            {children}
            <Toaster position="top-right" richColors closeButton expand visibleToasts={5} />
          </UIPreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
