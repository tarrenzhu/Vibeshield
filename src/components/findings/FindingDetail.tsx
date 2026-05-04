"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ShieldAlert, AlertTriangle, GitPullRequest } from "lucide-react";

interface FindingDetailProps {
  finding: {
    id: string;
    ruleId: string;
    severity: "critical" | "warning";
    title: string;
    filePath: string;
    lineStart: number;
    lineEnd: number;
    codeSnippet: string;
    explanationMd: string;
    fixPromptMd: string;
    status: string;
    isPro?: boolean;
  };
  onMarkFalsePositive?: () => void;
}

export function FindingDetail({
  finding,
  onMarkFalsePositive,
}: FindingDetailProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(finding.fixPromptMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Severity + Rule */}
      <div className="flex items-center gap-2">
        {finding.severity === "critical" ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <ShieldAlert className="w-3 h-3" />
            Critical
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <AlertTriangle className="w-3 h-3" />
            Warning
          </span>
        )}
        <span className="text-xs text-gray-400">{finding.ruleId}</span>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900">{finding.title}</h2>

      {/* File location */}
      <p className="text-sm text-gray-500">
        {finding.filePath}:{finding.lineStart}–{finding.lineEnd}
      </p>

      {/* Explanation */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          🔍 What&apos;s wrong
        </h3>
        <div
          className="prose prose-sm text-gray-600"
          dangerouslySetInnerHTML={{ __html: finding.explanationMd }}
        />
      </div>

      {/* Code Snippet */}
      {finding.codeSnippet && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            📝 Affected Code
          </h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-sm overflow-x-auto">
            <code>{finding.codeSnippet}</code>
          </pre>
        </div>
      )}

      {/* Fix Prompt */}
      <div className="bg-indigo-50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-indigo-700 mb-2">
          🛠️ How to fix in 30 seconds
        </h3>
        <ol className="text-sm text-indigo-800 space-y-1 list-decimal list-inside mb-4">
          <li>Copy the prompt below</li>
          <li>Paste it into Cursor Chat</li>
          <li>Review the changes and push</li>
        </ol>
        <pre className="bg-white rounded-lg p-3 text-xs text-gray-700 border border-indigo-200 overflow-x-auto mb-3">
          <code>{finding.fixPromptMd}</code>
        </pre>
        <Button
          size="sm"
          onClick={handleCopyPrompt}
          className={copied ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" /> Copy Cursor Prompt
            </>
          )}
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t">
        <Button
          variant="outline"
          disabled={!finding.isPro}
          title={
            finding.isPro
              ? "Auto-fix with a PR"
              : "Upgrade to Pro to use Auto-Fix"
          }
        >
          <GitPullRequest className="w-4 h-4 mr-1" />
          Auto-Fix PR {!finding.isPro && "(Pro)"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onMarkFalsePositive}>
          Mark as False Positive
        </Button>
      </div>
    </div>
  );
}
