import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Upzella",
  description: "Hiring Copilot for your team",
};

export default function InterviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"><body><div >{children}</div></body></html>
  );
}
