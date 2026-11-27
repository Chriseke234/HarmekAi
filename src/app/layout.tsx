import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Newsreader } from "next/font/google";
import "./globals.css";

const displayFont = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Harmek AI — Your Business, Always Within Reach",
    template: "%s | Harmek AI",
  },
  description:
    "Independent customer engagement platform by ChrisBuilds. Manage enquiries, structure business knowledge, and hand off seamlessly to human staff.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} dark`}
    >
      <body className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] antialiased selection:bg-white/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
