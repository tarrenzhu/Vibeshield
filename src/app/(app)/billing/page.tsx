import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function BillingPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing</h1>

      <div className="max-w-2xl">
        {/* Current Plan */}
        <section className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Current Plan: <span className="text-indigo-600">Free</span>
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            1 repo · 5 scans/month · Basic security rules
          </p>
          <div className="flex gap-3">
            <Button>Upgrade to Pro</Button>
            <Button variant="outline">Manage Subscription</Button>
          </div>
        </section>

        {/* Plan Comparison */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Features</h2>
          <div className="space-y-3">
            {[
              { feature: "Unlimited scans", free: false, pro: true },
              { feature: "Cursor fix prompts", free: false, pro: true },
              { feature: "Slack notifications", free: false, pro: true },
              { feature: "Auto-Fix PR", free: false, pro: true },
              { feature: "5 repos", free: false, pro: true },
              { feature: "Plain-English reports", free: true, pro: true },
              { feature: "GitHub PR comments", free: false, pro: true },
            ].map((f) => (
              <div
                key={f.feature}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <span className="text-sm text-gray-700">{f.feature}</span>
                <div className="flex gap-6">
                  <span className={`text-sm w-12 text-center ${f.free ? "text-green-600" : "text-gray-300"}`}>
                    {f.free ? <Check className="w-4 h-4 inline" /> : "—"}
                  </span>
                  <span className="text-sm w-12 text-center text-green-600">
                    {f.pro ? <Check className="w-4 h-4 inline" /> : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
