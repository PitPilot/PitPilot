import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Sign In | PitPilot",
  description: "Sign in or create an account to start scouting with AI-powered strategy tools.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-shell">
      <Navbar />
      <div className="flex min-h-screen flex-col pt-16">
        <div className="marketing-content flex-1">
          {children}
        </div>
        <SiteFooter />
      </div>
    </div>
  );
}
