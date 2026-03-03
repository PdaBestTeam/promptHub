import AppHeader from "@/components/layouts/app-header";
import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <AppHeader />
      {children}
    </div>
  );
}
