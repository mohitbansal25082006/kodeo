import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-bg text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  );
}