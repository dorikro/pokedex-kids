import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import WildEncounterOverlay from "@/components/WildEncounterOverlay";
import { LanguageProvider } from "@/lib/i18n/index";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pokédex Kids",
  description: "A fun Pokémon encyclopedia for kids!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <WildEncounterOverlay />
        </LanguageProvider>
      </body>
    </html>
  );
}
