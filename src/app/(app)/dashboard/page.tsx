"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ShieldAlert, AlertTriangle, FolderGit2, CheckCircle2, Search, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const [repoUrl, setRepoUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const handleScan = async () => {
    if (!repoUrl.trim()) return;
    setScanning(true);
    setScanResult(null);

    try {
      const res = await fetch("/api/trigger-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch (e: any) {
      setScanResult({ error: e.message });
    } finally {
      setScanning(false);
    }
  };

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

      {/* Scan Now */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          🔍 Scan a GitHub Repository
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter a public GitHub repository URL to scan for AI-generated security issues.
        </p>

        <div className="flex gap-3">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
          />
          <button
            onClick={handleScan}
            disabled={scanning || !repoUrl.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {scanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {scanning ? "Scanning..." : "Scan Now"}
          </button>
        </div>

        {scanResult && (
          <div
            className={`mt-4 p-4 rounded-lg text-sm ${
              scanResult.error
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {scanResult.error ? (
              <p>❌ {scanResult.error}</p>
            ) : (
              <div>
                <p className="font-medium">✅ {scanResult.message}</p>
                {(scanResult as any).note && (
                  <p className="mt-1 text-green-600">{(scanResult as any).note}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
        <FolderGit2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No repos connected yet
        </h3>
        <p className="text-gray-500 mb-4 max-w-md mx-auto">
          Scan a repo above to start checking your AI-generated code for
          security issues.
        </p>
      </div>
    </div>
  );
}
