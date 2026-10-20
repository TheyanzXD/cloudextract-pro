import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CloudExtract Pro - Production Serverless Uploader & Auto Extractor",
  description:
    "Production-ready streaming archive uploader and serverless auto extractor built for Vercel. Direct multipart blob uploads, zero client memory footprint, zip-slip & zip-bomb protection.",
  keywords: [
    "Next.js",
    "Vercel Blob",
    "Auto Extractor",
    "Zip Extractor",
    "Streaming Extractor",
    "Serverless Extraction",
    "Folder Upload",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col bg-zinc-950 text-white selection:bg-neon-cyan/20 selection:text-neon-cyan`}>
        <ToastProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
