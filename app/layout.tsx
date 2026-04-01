import type { Metadata } from "next";
import { Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import { WorkspaceShell } from "@/components/workspace-shell";
import "./globals.css";

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Qontai",
  description: "Interface Qontai — shell UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${sans.variable} ${mono.variable} min-h-screen bg-stone-50 font-sans text-stone-900 antialiased`}
      >
        <WorkspaceShell>{children}</WorkspaceShell>
      </body>
    </html>
  );
}
