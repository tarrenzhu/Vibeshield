import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-xl">VibeShield</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline" })}
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Snyk for vibe coders.
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto">
          Catch the security issues Cursor doesn&apos;t. Connect your GitHub repo,
          get plain-English explanations, and one-click Cursor prompts to fix
          every finding — even if you&apos;ve never touched security before.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className={buttonVariants({ size: "lg" })}
          >
            Connect GitHub — Free Forever
          </Link>
          <Link
            href="/pricing"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-3 gap-8">
        {[
          {
            quote: "Found a Supabase key hardcoded in 30 seconds. This should be built into Cursor.",
            name: "Sarah, Indie Hacker",
          },
          {
            quote: "My Stripe webhook wasn't verifying signatures. VibeShield caught it before I got exploited.",
            name: "Marcus, Solo Founder",
          },
          {
            quote: "We run it on every PR. Prevents the junior mistakes AI loves to make.",
            name: "Lin, Tech Lead",
          },
        ].map((t) => (
          <div key={t.name} className="p-6 rounded-xl bg-gray-50">
            <p className="text-gray-600 italic">&ldquo;{t.quote}&rdquo;</p>
            <p className="mt-3 text-sm font-semibold text-gray-900">{t.name}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} VibeShield. Built for vibe coders.
      </footer>
    </main>
  );
}
