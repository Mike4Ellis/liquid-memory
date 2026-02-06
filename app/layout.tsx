import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Liquid Memory - AI Creative Studio",
  description: "Upload images, extract AI prompts with VL models, manage your creative library, and generate new images with AI.",
  keywords: ["AI", "image generation", "prompt engineering", "creative tools", "DALL-E", "Midjourney", "Stable Diffusion"],
  authors: [{ name: "Liquid Memory Team" }],
  openGraph: {
    title: "Liquid Memory - AI Creative Studio",
    description: "Transform images into AI prompts and generate stunning visuals",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Liquid Memory - AI Creative Studio",
    description: "Transform images into AI prompts and generate stunning visuals",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="color-scheme-dark">
      <head>
        <link rel="preconnect" href="https://image.pollinations.ai" />
        <link rel="dns-prefetch" href="https://image.pollinations.ai" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0f] text-white`}
      >
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-cyan-500 text-white rounded-lg"
        >
          Skip to main content
        </a>
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
