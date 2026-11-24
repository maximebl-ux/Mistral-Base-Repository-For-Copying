import type { Metadata } from "next";
import { StoreProvider } from "@/stores/store";
import { NavBar } from "@/components/layout/NavBar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lumen — Stream films, series and creator videos",
    template: "%s | Lumen",
  },
  description:
    "Lumen is a streaming prototype: films, series and creator videos in one polished catalogue. Sample content, no paid APIs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-ink antialiased">
        <StoreProvider>
          <NavBar />
          <main id="main">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
