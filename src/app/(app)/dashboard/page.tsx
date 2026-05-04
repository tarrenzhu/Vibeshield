import { currentUser } from "@clerk/nextjs/server";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RepoCard } from "@/components/dashboard/RepoCard";
import { ShieldAlert, AlertTriangle, FolderGit2, CheckCircle2 } from "lucide-react";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hello, {user?.firstName ?? "there"} 👋
          </h1>
          <p className="text-gray-500 mt-1">Your security overview</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Critical"
          value={0}
          icon={ShieldAlert}
          color="text-red-600"
          bg="bg-red-50"
        />
        <KpiCard
          title="Warnings"
          value={0}
          icon={AlertTriangle}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <KpiCard
          title="Repos Scanned"
          value={0}
          icon={FolderGit2}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <KpiCard
          title="Fixed This Week"
          value={0}
          icon={CheckCircle2}
          color="text-green-600"
          bg="bg-green-50"
        />
      </div>

      {/* Empty State */}
      <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
        <FolderGit2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No repos connected yet
        </h3>
        <p className="text-gray-500 mb-4 max-w-md mx-auto">
          Connect a GitHub repository to start scanning for security issues
          in your AI-generated code.
        </p>
        {/* TODO(human): Wire up GitHub App install URL */}
        <a
          href="#"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FolderGit2 className="w-4 h-4" />
          Connect GitHub Repo
        </a>
      </div>
    </div>
  );
}
