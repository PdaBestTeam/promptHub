import AppHeader from "@/components/layouts/app-header";
import type { ReactNode } from "react";
import OnboardingModalHost from "@/components/ui/OnboardingModalHost";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <AppHeader />
      <OnboardingModalHost />
      {children}
    </div>
  );
}
