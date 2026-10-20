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
  title: {
    default: "VEYRA — Crop Analysis",
    template: "%s | VEYRA",
  },
  description:
    "Precision crop-disease analysis. Upload a leaf image and receive a structured diagnosis powered by the 211-class VEYRA custom CNN.",
  keywords: ["crop disease", "plant analysis", "leaf diagnosis", "agricultural AI"],
  openGraph: {
    title: "VEYRA — Crop Analysis",
    description: "Precision crop-disease image analysis.",
    type: "website",
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
