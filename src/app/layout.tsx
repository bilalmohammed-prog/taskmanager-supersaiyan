import "./globals.css";
import Providers from "./Providers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "Task Manager App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
