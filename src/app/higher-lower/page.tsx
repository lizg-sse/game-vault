import type { Metadata } from "next";
import HigherLower from "@/components/higher-lower";

export const metadata: Metadata = {
  title: "Higher / Lower — Spurs Vault",
  description:
    "Two San Antonio Spurs, one stat. Pick the bigger number and keep your streak alive.",
};

export default function Page() {
  return <HigherLower />;
}
