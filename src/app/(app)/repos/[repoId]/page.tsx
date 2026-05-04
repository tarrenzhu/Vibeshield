export default async function RepoDetailPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Repo: {repoId}</h1>
      <p className="text-gray-500 mt-2">
        Scan results will appear here after your first scan completes.
      </p>
    </div>
  );
}
