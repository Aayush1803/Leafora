import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://veyra-lilac-three.vercel.app"
  ),
  title: {
    default: "LEAFORA — Crop Analysis",
    template: "%s | LEAFORA",
  },
  description:
    "Precision crop-disease analysis. Upload a leaf image and receive a structured diagnosis powered by the 211-class LEAFORA custom CNN.",
  keywords: ["crop disease", "plant analysis", "leaf diagnosis", "agricultural AI"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/leafora-logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "LEAFORA — Crop Analysis",
    description: "Precision crop-disease image analysis.",
    type: "website",
    images: [
      {
        url: "/leafora-logo.png",
        width: 1024,
        height: 1024,
        alt: "LEAFORA Crop Analysis",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
