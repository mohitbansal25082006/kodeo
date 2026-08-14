import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ThemeScript, ThemeProvider } from "@/lib/themes/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KODEO — Build together. Code anywhere.",
    template: "%s · KODEO",
  },
  description:
    "KODEO is a collaborative cloud development environment for modern teams. One workspace. One environment. One place to build.",
  keywords: [
    "KODEO",
    "cloud IDE",
    "collaborative coding",
    "online code editor",
    "real-time collaboration",
    "cloud development environment",
  ],
  metadataBase: new URL("https://kodeo.dev"),
  openGraph: {
    title: "KODEO — Build together. Code anywhere.",
    description:
      "A collaborative cloud development environment for modern teams.",
    siteName: "KODEO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KODEO — Build together. Code anywhere.",
    description:
      "A collaborative cloud development environment for modern teams.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Logged-out visitors get null here and ThemeScript/ThemeProvider
  // fall back to localStorage, then the KODEO Dark default — this call
  // is cheap (cookie-cache hit in the common case) and lets logged-in
  // users see their chosen theme applied server-side on the very first
  // response, including on the public landing page now that theming
  // is wired up at the root instead of only inside the (app) group.
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const initialThemeId = session?.user?.themeId ?? null;

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript initialThemeId={initialThemeId} />
      </head>
      <body className="bg-bg text-primary font-sans antialiased">
        <ThemeProvider initialThemeId={initialThemeId}>{children}</ThemeProvider>
      </body>
    </html>
  );
}