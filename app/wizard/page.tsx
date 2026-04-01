export default function WizardPage() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Entrée en relation (wizard)</h1>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-700">
            À implémenter: Étapes 1 → 6 (KYC/KYB → pièces → relation d’affaires → scoring → escalade → décision).
          </p>
          <ul className="mt-3 list-disc pl-5 text-sm text-stone-600 space-y-1">
            <li>Step 1: Client + mandataires + bénéficiaires effectifs</li>
            <li>Step 2: Pièces + métadonnées + hard stop non-présence</li>
            <li>Step 3: Relation d’affaires (4 champs requis + conditionnels PPE/pays)</li>
            <li>Step 4: Scoring ARPEC (4 piliers + propagation + bypass)</li>
            <li>Step 5: Escalade organe exécutif</li>
            <li>Step 6: Acceptation horodatée ou refus bloquant</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

