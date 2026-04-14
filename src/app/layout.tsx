import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tuition Tracker",
  description: "Track classes, 12-class cycles, and payments.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
