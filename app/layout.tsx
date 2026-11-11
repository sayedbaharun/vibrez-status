import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

const themeBoot = `(function(){try{var s=localStorage.getItem("vibrez-theme");var dark=s==="dark"||(s!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=dark?"dark":"light";document.documentElement.classList.toggle("dark",dark);document.documentElement.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;

export const metadata: Metadata = {
  title: "SB: Today",
  description: "Private read-only status board for SB: Vibrez and personal, from Linear.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "SB Today", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(0.965 0.012 95)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.2 0.012 75)" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        {children}
      </body>
    </html>
  );
}
