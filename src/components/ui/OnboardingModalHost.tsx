"use client";

import dynamic from "next/dynamic";

const OnboardingModal = dynamic(() => import("@/components/ui/OnboardingModal"), {
  ssr: false,
});

export default function OnboardingModalHost() {
  return <OnboardingModal />;
}
