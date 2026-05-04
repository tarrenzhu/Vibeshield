import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, LayoutDashboard, FolderGit2, Settings, CreditCard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r p-6 flex flex-col">
        <Link href="/dashboard" className="flex items-center gap-2 mb-8">
          <Shield className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-xl">VibeShield</span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink href="/settings" icon={Settings} label="Settings" />
          <SidebarLink href="/billing" icon={CreditCard} label="Billing" />
        </nav>

        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "outline", className: "w-full" })}
        >
          <FolderGit2 className="w-4 h-4 mr-2" />
          + Connect Repo
        </Link>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
