import { Check } from "lucide-react";

export default function BillingPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing</h1>

      <div className="max-w-2xl">
        <section className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
              Beta
            </span>
            <h2 className="text-lg font-semibold text-gray-900">
              Free Plan — Everything Included
            </h2>
          </div>
          <p className="text-gray-600 text-sm">
            VibeShield is completely free during beta. All features are unlocked.
            Paid plans will be introduced once we ship a stable product.
          </p>
        </section>

        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What you get (all free for now)
          </h2>
          <div className="space-y-3">
            {[
              "Unlimited scans across all repos",
              "Plain-English security explanations",
              "Cursor one-click fix prompts",
              "Slack & Discord notifications",
              "GitHub PR comments",
              "Auto-Fix PR generation",
              "Priority support",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 py-2 border-b last:border-b-0"
              >
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
