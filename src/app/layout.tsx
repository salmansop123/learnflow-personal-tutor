import type { Metadata } from "next";
import localFont from "next/font/local";

import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/providers/Toaster";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "LearnFlow AI-Powered Personal Tutor",
  description:
    "LearnFlow helps students study smarter with AI tutoring, notes, quizzes, and study planning.",
  openGraph: {
    title: "LearnFlow AI-Powered Personal Tutor",
    description:
      "Study smarter with AI tutoring, notes, quizzes, and structured study plans.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LearnFlow AI-Powered Personal Tutor",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LearnFlow AI-Powered Personal Tutor",
    description:
      "Study smarter with AI tutoring, notes, quizzes, and structured study plans.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <ThemeProvider>
          <SessionProvider>
            {children}
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
