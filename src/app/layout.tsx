import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ChapterhouseShell } from "@/components/chapterhouse-shell";
import { CouncilPopover } from "@/components/council-popover";
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
  title: "Chapterhouse",
  description:
    "Internal operating system for research, briefs, documents, and execution.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Apply stored theme before first paint — prevents flash */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var t=localStorage.getItem('chapterhouse-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
        }}
      />
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <ChapterhouseShell>{children}</ChapterhouseShell>
        <CouncilPopover />
      </body>
    </html>
  );
}
