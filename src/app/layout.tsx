import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manolis Booking",
  description: "Restaurant reservation management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-body bg-void text-white antialiased">{children}</body>
    </html>
  );
}
