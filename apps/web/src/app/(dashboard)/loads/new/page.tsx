import { LoadForm } from './LoadForm';

export default function NewLoadPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">New Load</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manually enter a load. AI scoring will run automatically after creation.
        </p>
      </div>
      <LoadForm />
    </main>
  );
}
