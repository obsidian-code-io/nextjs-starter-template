import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { TopLoader } from "@/components/top-loader";
import appConfig from "@/config/app-config.json";

export const metadata: Metadata = {
  title: appConfig.app.title,
  description: appConfig.app.description,
  icons: {
    icon: appConfig.app.favicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href={appConfig.app.favicon}
          type={appConfig.app.faviconType}
        ></link>
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <QueryProvider>
          <TopLoader />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
