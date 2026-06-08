type Params = { params: { id: string } };

export default function LoadDetailPage({ params }: Params) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Load</h1>
      <p className="mt-2 text-sm text-muted-foreground font-mono">{params.id}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        Full load detail view — coming soon.
      </p>
    </main>
  );
}
