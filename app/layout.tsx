import "./globals.css";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Water GIS",
  description:
    "Plataforma hidroquímica inteligente",

  keywords: [
    "GIS",
    "Hydrology",
    "Water Quality",
    "Hydrochemistry",
    "Catamarca",
    "Water Monitoring",
  ],

  authors: [
    {
      name: "Water GIS",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
    >
      <body
        className="
          bg-black
          text-white
          antialiased
          overflow-hidden
          font-[Inter]
        "
      >
        {children}
      </body>
    </html>
  );
}