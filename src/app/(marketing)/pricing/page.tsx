import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Shield, Check } from "lucide-react";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-xl">VibeShield</span>
        </Link>
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "outline" })}
        >
          Sign In
        </Link>
      </nav>

      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <span className="px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-700 rounded-full">
          Free Beta
        </span>
        <h1 className="mt-6 text-4xl font-extrabold text-gray-900">
          Everything is free during beta
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          We're building the best security companion for vibe coders.
          Paid plans will come once the product is stable.
        </p>

        <div className="mt-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 p-8 text-left">
          <h3 className="text-lg font-semibold text-gray-900">What you get</h3>
          <ul className="mt-6 space-y-3">
            {[
              "Unlimited repos & scans",
              "All 10 security rules",
              "Plain-English explanations",
              "One-click Cursor fix prompts",
              "Slack & Discord notifications",
              "GitHub PR comments",
              "Auto-Fix PR generation",
              "Priority support",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center mt-8 w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </main>
  );
}
