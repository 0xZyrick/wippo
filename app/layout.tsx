import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";

export const metadata: Metadata = {
  title: "Wippo | Home of making",
  description:
    "Log real project updates. Share one clean public ledger. Built for makers who ship in public.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png" }],
  },
  openGraph: {
    title: "Wippo | Home of making",
    description: "A public ledger built for makers. Log updates. Share one link.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full antialiased">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
