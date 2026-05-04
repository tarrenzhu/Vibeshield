import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const user = await currentUser();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        {/* GitHub Repos */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            GitHub Repositories
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            No repositories connected. Install the VibeShield GitHub App to get
            started.
          </p>
          <Button variant="outline">Manage GitHub Connection</Button>
        </section>

        {/* Slack Webhook */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Slack Notifications (Pro)
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Get scan results delivered to your Slack workspace.
          </p>
          {/* TODO(human): Wire up Slack webhook URL input */}
          <Button variant="outline" disabled>
            Configure Slack
          </Button>
        </section>

        {/* API Key (Pro) */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            API Key (Pro)
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Use the VibeShield CLI to scan locally. Available on Pro plan.
          </p>
          <Button variant="outline" disabled>
            Upgrade to Pro
          </Button>
        </section>

        {/* Account */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
          <p className="text-gray-500 text-sm">
            Signed in as <strong>{user?.emailAddresses[0]?.emailAddress ?? "—"}</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
