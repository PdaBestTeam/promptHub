import AppHeader from "@/components/layouts/app-header";
import OnboardingModal from "@/components/ui/OnboardingModal";
import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <AppHeader />
      <OnboardingModal />
      {children}
    </div>
  );
}
