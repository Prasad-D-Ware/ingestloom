import type { Metadata } from "next";
import { Geist, Geist_Mono, Berkshire_Swash, DM_Serif_Text } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const berkshireSwash = Berkshire_Swash({
  variable: "--font-berkshire-swash",
  subsets: ["latin"],
  weight: "400",
});

const dmSerifText = DM_Serif_Text({
  variable: "--font-dm-serif-text",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IngestLoom",
  description: "A Rag",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSerifText.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen w-full relative">
          {/* Crimson Depth */}
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(125% 125% at 50% 10%, #000000 40%, #2b0707 100%)",
            }}
          />
          {/* Your Content/Components */}
          {children}
        </div>
      </body>
    </html>
  );
}
