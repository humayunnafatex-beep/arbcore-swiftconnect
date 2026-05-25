import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARBCore SwiftConnect",
  description: "AI-powered WhatsApp marketing, CRM, and customer automation dashboard"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
