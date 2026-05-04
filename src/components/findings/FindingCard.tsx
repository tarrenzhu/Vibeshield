import { ShieldAlert, AlertTriangle } from "lucide-react";

interface FindingCardProps {
  id: string;
  ruleId: string;
  severity: "critical" | "warning";
  title: string;
  filePath: string;
  lineStart: number;
  selected?: boolean;
  onClick?: () => void;
}

export function FindingCard({
  ruleId,
  severity,
  title,
  filePath,
  lineStart,
  selected,
  onClick,
}: FindingCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b last:border-b-0 transition-colors ${
        selected
          ? "bg-indigo-50 border-l-2 border-l-indigo-600"
          : "hover:bg-gray-50 border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {severity === "critical" ? (
          <ShieldAlert className="w-4 h-4 text-red-600" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        )}
        <span
          className={`text-xs font-semibold uppercase ${
            severity === "critical" ? "text-red-600" : "text-amber-600"
          }`}
        >
          {severity}
        </span>
        <span className="text-xs text-gray-400">{ruleId}</span>
      </div>
      <p className="text-sm font-medium text-gray-900 line-clamp-2">{title}</p>
      <p className="text-xs text-gray-400 mt-1">
        {filePath}:{lineStart}
      </p>
    </button>
  );
}
