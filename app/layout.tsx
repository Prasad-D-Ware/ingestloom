import type { Metadata } from "next";
import { Berkshire_Swash ,Lobster, DM_Serif_Text } from "next/font/google";
import "./globals.css";


const lobster = Lobster({
  variable: "--font-lobster",
  subsets: ["latin"],
  weight: "400",
});

const dmSerifText = DM_Serif_Text({
  variable: "--font-dm-serif-text",
  subsets: ["latin"],
  weight: "400",
});

const berkshireSwash = Berkshire_Swash({
  variable: "--font-berkshire-swash",
  subsets: ["latin"],
  weight: "400",
});


export const metadata: Metadata = {
  title: "IngestLoom",
  description: "IngestLoom is a powerful Retrieval-Augmented Generation (RAG) application that allows you to seamlessly ingest, index, and chat with your documents, text data, and web content using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${dmSerifText.variable} ${lobster.variable} antialiased`}
        suppressHydrationWarning
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
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
