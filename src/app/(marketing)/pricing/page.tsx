import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Shield, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "1 GitHub repo",
      "5 scans per month",
      "Plain-English explanations",
      "Basic security rules",
    ],
    cta: "Get Started",
    href: "/dashboard",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    features: [
      "5 GitHub repos",
      "Unlimited scans",
      "Cursor fix prompts",
      "Slack notifications",
      "PR comments",
      "History & trends",
    ],
    cta: "Start Pro",
    href: "/billing",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    features: [
      "25 repos",
      "5 team seats",
      "Auto-Fix PR",
      "Team dashboard",
      "SSO",
      "Priority support",
    ],
    cta: "Start Team",
    href: "/billing",
    highlighted: false,
  },
];

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

      <section className="max-w-5xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-extrabold text-center text-gray-900">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-center text-gray-500">
          Start free. Upgrade when you&apos;re ready.
        </p>

        <div className="mt-12 grid grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-2xl border p-8",
                plan.highlighted
                  ? "border-indigo-600 ring-2 ring-indigo-600"
                  : "border-gray-200"
              )}
            >
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-500">{plan.period}</span>
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={cn(
                  buttonVariants(plan.highlighted ? {} : { variant: "outline" }),
                  "mt-8 w-full"
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
