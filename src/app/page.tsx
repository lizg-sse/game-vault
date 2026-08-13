import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-6 py-20">
      <div>
        <h1 className="text-5xl font-bold tracking-tight text-zinc-50">
          Spurs <span className="text-[var(--spurs-silver)]">Vault</span>
        </h1>
        <p className="mt-3 text-lg text-zinc-400">
          Games and trivia from 50 years of San Antonio basketball.
        </p>
      </div>

      <ul>
        <li>
          <Link
            href="/higher-lower"
            className="group flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[var(--spurs-silver)]/50 hover:bg-white/[0.06]"
          >
            <span>
              <span className="block text-xl font-bold text-zinc-50">Higher / Lower</span>
              <span className="mt-1 block text-sm text-zinc-400">
                Two Spurs, one stat. Pick the bigger number and keep your streak alive.
              </span>
            </span>
            <span className="text-2xl text-zinc-600 transition group-hover:translate-x-1 group-hover:text-[var(--spurs-silver)]">
              →
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
