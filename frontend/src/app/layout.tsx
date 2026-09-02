import type { Metadata } from "next";
import { AuthProvider } from "@/lib/authContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revora AI — Agentic Commerce & Revenue Recovery",
  description: "Autonomous Agentic Commerce Growth & Revenue Recovery Platform for Modern Merchants.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-revora-bg text-slate-100 antialiased selection:bg-revora-razor selection:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
