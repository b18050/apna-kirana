import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lalu Kirana · लालू किराना",
  description:
    "Your neighborhood kirana store — fresh groceries, everyday essentials, slot delivery, and Cash on Delivery.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#FFFBF5] text-stone-900">
        {children}
      </body>
    </html>
  );
}
