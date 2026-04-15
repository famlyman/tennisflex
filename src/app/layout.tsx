import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PWARegistration } from "@/components/PWARegistration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tennis-Flex | Flexible Tennis Leagues",
  description: "Multi-tenant tennis platform where coordinators create seasons and players compete on their own schedules. Powered by the Tennis-Flex Rating (TFR) system.",
  icons: {
    icon: "/logo-192.png",
    apple: "/logo-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}