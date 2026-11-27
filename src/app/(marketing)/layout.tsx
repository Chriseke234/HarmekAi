"use client";

import { usePathname } from "next/navigation";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div
      className={
        isHome
          ? "flex min-h-screen flex-col bg-[#050C10]"
          : "flex min-h-screen flex-col bg-[#0A0A0A]"
      }
    >
      <MarketingNavbar />
      <main className={isHome ? "flex-1" : "flex-1 pt-16"}>{children}</main>
      <MarketingFooter />
    </div>
  );
}
