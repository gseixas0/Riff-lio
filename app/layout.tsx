import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Fraunces carries the whole visual identity: an old-style serif with optical
 * sizing plus SOFT and WONK axes, so headings can be warm and slightly quirky
 * rather than the default sans every dark UI ships with. next/font only
 * downloads the axes declared here, so they have to be listed to be usable.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Riffólio",
    template: "%s · Riffólio",
  },
  description:
    "Portfólio pessoal de músicas que estou aprendendo no violão e no baixo, com tablatura interativa e player sincronizado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* First tab stop on every page: jump past the chrome straight to content. */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-neon focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-stage"
        >
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
