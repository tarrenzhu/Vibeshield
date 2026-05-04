import Link from "next/link";
import { FolderGit2, Clock } from "lucide-react";

interface RepoCardProps {
  name: string;
  fullName: string;
  criticalCount: number;
  warningCount: number;
  lastScanAt: string | null;
}

export function RepoCard({
  name,
  fullName,
  criticalCount,
  warningCount,
  lastScanAt,
}: RepoCardProps) {
  return (
    <Link
      href={`/repos/${encodeURIComponent(fullName)}`}
      className="block bg-white rounded-xl border p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        <FolderGit2 className="w-5 h-5 text-gray-400" />
        <span className="font-semibold text-gray-900">{name}</span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        {criticalCount > 0 && (
          <span className="inline-flex items-center gap-1 text-sm text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            {criticalCount} Critical
          </span>
        )}
        {warningCount > 0 && (
          <span className="inline-flex items-center gap-1 text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            {warningCount} Warning
          </span>
        )}
        {criticalCount === 0 && warningCount === 0 && (
          <span className="text-sm text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            Clean
          </span>
        )}
      </div>

      {lastScanAt ? (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          Last scan: {new Date(lastScanAt).toLocaleDateString()}
        </div>
      ) : (
        <div className="text-xs text-gray-400">Not scanned yet</div>
      )}
    </Link>
  );
}
