export default function Home() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-stone-600">
          Shell UI repris de <span className="font-medium">notion-fiduciaire</span> (sidebar, onglets, breadcrumb).
        </p>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-700">
            Projet <span className="font-mono">qontai</span> prêt. Prochaine étape: pages métier.
          </p>
        </div>
      </div>
    </div>
  );
}
