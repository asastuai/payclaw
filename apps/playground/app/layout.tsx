import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayClaw Playground",
  description:
    "Interactive sandbox for the PayClaw AI Agent Wallet SDK — try programmable wallet policies live in your browser.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-[#e8e8e8] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
