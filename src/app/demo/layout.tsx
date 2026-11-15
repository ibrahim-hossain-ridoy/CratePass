import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DB-36V Battery Pack · Digital Product Passport (Concept Demo)",
  description:
    "Mobile-first concept demo of an EU Digital Product Passport for the fictional Demo Brand DB-36V Battery Pack.",
};

export default function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
