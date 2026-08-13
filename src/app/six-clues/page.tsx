import type { Metadata } from "next";
import { Game } from "@/components/six-clues/Game";

export const metadata: Metadata = {
  title: "Six Clues — Spurs Vault",
  description:
    "One San Antonio Spur a day, revealed a clue at a time. The fewer clues you take, the more points you keep.",
};

export default function Page() {
  return <Game />;
}
