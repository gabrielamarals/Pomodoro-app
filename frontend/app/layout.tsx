import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "../lib/i18n/I18nProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Foco — Pomodoro",
  description: "A focus timer and study progress tracker.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem("pomodoro-theme") || "natural";
                const resolvedTheme = savedTheme === "system"
                  ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "ember" : "natural"
                  : savedTheme;
                document.documentElement.dataset.theme = resolvedTheme;
              } catch {}
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}><I18nProvider>{children}</I18nProvider></body>
    </html>
  );
}
