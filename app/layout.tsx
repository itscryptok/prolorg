import type { Metadata, Viewport } from "next";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import Splash from "@/components/Splash";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { FilterPanelProvider } from "@/components/FilterPanelContext";
import "./globals.css";

const DESCRIPTION =
  "AiProlice — the AI pro marketplace. Hire an AI pro for forensic analysis, genealogy traces, lab discovery, market advantage, a personal AI tutor, technical project development, or skilled data collection and analysis. Hire an AI pro. Not the AI. Here's why.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Hire an AI pro | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "AiProlice",
    "hire AI pro",
    "AI pro marketplace",
    "forensic AI analysis",
    "genealogy trace",
    "lab discovery",
    "market advantage",
    "personal AI tutor",
    "technical project developer",
    "AI data analyst",
    "data collector",
  ],
  alternates: { canonical: SITE_URL },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Hire an AI pro`,
    description: DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Hire an AI pro`,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6f747a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_NAME,
        alternateName: SITE_TAGLINE,
        url: SITE_URL,
        description: DESCRIPTION,
        logo: `${SITE_URL}/apple-touch-icon.png`,
        sameAs: ["https://x.com/aiprolice"],
      },
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: DESCRIPTION,
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        {/* Apply saved day/night theme before first paint (no flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('prolorg-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();",
          }}
        />
        {/* Hero visual preload for fastest first paint */}
        <link rel="preload" href="/hero-glow.svg" as="image" type="image/svg+xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Splash />
        <FilterPanelProvider>
          <SiteHeader />
          <main>{children}</main>
        </FilterPanelProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
