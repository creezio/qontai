-- Qontai — schéma v1 (MVP) + outbox
-- Remarque: ce schéma est une base "prête à coder". La logique métier reste dans n8n.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_principal') THEN
    CREATE TYPE role_principal AS ENUM ('Collaborateur', 'Responsable_Mission', 'Organe_Executif');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_client') THEN
    CREATE TYPE type_client AS ENUM ('Personne_Physique', 'Personne_Morale');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_relation') THEN
    CREATE TYPE statut_relation AS ENUM ('En_attente', 'Active', 'Refusee', 'Rompue');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categorie_mesure') THEN
    CREATE TYPE categorie_mesure AS ENUM ('Justificatif_Sup', 'Certification_Tiers', 'Paiement_UE', 'Confirmation_Professionnel');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_document') THEN
    CREATE TYPE type_document AS ENUM ('KYC_Identite', 'Kbis', 'Statuts', 'Justificatif_Flux', 'Rapport_Atypique', 'Rapport_TRACFIN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pilier') THEN
    CREATE TYPE pilier AS ENUM ('A_Client', 'B_Activite', 'C_Localisation', 'D_Mission');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'niveau_risque') THEN
    CREATE TYPE niveau_risque AS ENUM ('Faible', 'Moyen', 'Eleve');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'niveau_vigilance') THEN
    CREATE TYPE niveau_vigilance AS ENUM ('Standard', 'Renforcee');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'critere_alerte') THEN
    CREATE TYPE critere_alerte AS ENUM ('Complexe', 'Montant_Inhabituel', 'Sans_Justification_Economique');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_operation_atypique') THEN
    CREATE TYPE statut_operation_atypique AS ENUM ('A_Traiter', 'Documentee_Cloturee', 'Escalade_TRACFIN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'motif_soupcon') THEN
    CREATE TYPE motif_soupcon AS ENUM ('Infraction_Penale', 'Financement_Terrorisme', 'Fraude_Fiscale');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_droit_communication') THEN
    CREATE TYPE statut_droit_communication AS ENUM ('En_Attente', 'Repondu');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outbox_status') THEN
    CREATE TYPE outbox_status AS ENUM ('pending', 'processing', 'done', 'error');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS utilisateur (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  nom text,
  prenom text,
  role_principal role_principal NOT NULL,
  est_expert_comptable boolean NOT NULL DEFAULT false,
  est_correspondant_tracfin boolean NOT NULL DEFAULT false,
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_client type_client NOT NULL,

  -- PP
  nom text,
  prenoms text,
  date_naissance date,
  lieu_naissance text,

  -- PM
  forme_juridique text,
  denomination text,
  numero_immatriculation text,
  adresse_siege text,

  statut_relation statut_relation NOT NULL DEFAULT 'En_attente',
  flag_ppe boolean NOT NULL DEFAULT false,
  flag_pays_risque boolean NOT NULL DEFAULT false,

  -- Relation d'affaires (Step 3)
  relation_montant_nature text,
  relation_provenance_fonds text,
  relation_destination_fonds text,
  relation_justification_economique text,
  relation_origine_fonds text,
  relation_origine_patrimoine text,

  -- Notion mirror
  notion_page_id text,
  notion_last_sync_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mandataire (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  nom text NOT NULL,
  prenoms text,
  date_naissance date,
  type_pouvoir text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS beneficiaire_effectif (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  nom text NOT NULL,
  prenoms text,
  date_naissance date,
  lieu_naissance text,
  pourcentage_detention numeric(5,2) NOT NULL DEFAULT 0,
  dispense_legale_appliquee boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT beneficiaire_effectif_pourcentage_check CHECK (pourcentage_detention >= 0 AND pourcentage_detention <= 100)
);

CREATE TABLE IF NOT EXISTS mesure_vigilance_complementaire (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  categorie_mesure categorie_mesure NOT NULL,
  est_validee boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_ged (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  uploaded_by_user_id uuid REFERENCES utilisateur(id),
  type_document type_document NOT NULL,
  storage_path text NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  date_evenement_declencheur date NOT NULL,
  date_purge_legale date NOT NULL,
  est_confidentiel_tracfin boolean NOT NULL DEFAULT false,
  notion_page_id text,
  notion_last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mission (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle_mission text NOT NULL,
  niveau_risque_par_defaut niveau_risque NOT NULL
);

CREATE TABLE IF NOT EXISTS question (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilier pilier NOT NULL,
  intitule_question text NOT NULL,
  niveau_risque_si_oui niveau_risque NOT NULL,
  est_actif boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS evaluation_risque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  created_by_user_id uuid REFERENCES utilisateur(id),
  date_evaluation timestamptz NOT NULL DEFAULT now(),
  score_calcule_machine niveau_risque NOT NULL,
  niveau_vigilance_calcule niveau_vigilance NOT NULL,
  bypass_niveau_risque_manuel niveau_risque,
  bypass_justification text,
  notion_page_id text,
  notion_last_sync_at timestamptz,
  CONSTRAINT evaluation_risque_bypass_justification_check CHECK (
    (bypass_niveau_risque_manuel IS NULL AND bypass_justification IS NULL)
    OR (bypass_niveau_risque_manuel IS NOT NULL AND bypass_justification IS NOT NULL AND length(trim(bypass_justification)) > 0)
  )
);

CREATE TABLE IF NOT EXISTS reponse_questionnaire (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES evaluation_risque(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES question(id),
  mission_id uuid REFERENCES mission(id),
  valeur_reponse boolean NOT NULL
);

CREATE TABLE IF NOT EXISTS operation_atypique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  id_utilisateur_declarant uuid REFERENCES utilisateur(id),
  date_detection timestamptz NOT NULL DEFAULT now(),
  critere_alerte critere_alerte NOT NULL,
  description_operation text NOT NULL,
  justification_origine_fonds text,
  justification_destination_fonds text,
  justification_objet text,
  justification_beneficiaire text,
  statut statut_operation_atypique NOT NULL DEFAULT 'A_Traiter',
  notion_page_id text,
  notion_last_sync_at timestamptz
);

CREATE TABLE IF NOT EXISTS declaration_tracfin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  id_expert_comptable uuid NOT NULL REFERENCES utilisateur(id),
  date_envoi timestamptz,
  motif_soupcon motif_soupcon NOT NULL,
  criteres_fraude_fiscale_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  statut_droit_communication statut_droit_communication NOT NULL DEFAULT 'En_Attente',
  notion_page_id text,
  notion_last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES utilisateur(id),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  event_type text NOT NULL,
  payload_json jsonb NOT NULL,
  status outbox_status NOT NULL DEFAULT 'pending',
  tries int NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_statut_relation ON client(statut_relation);
CREATE INDEX IF NOT EXISTS idx_eval_client_date ON evaluation_risque(client_id, date_evaluation DESC);
CREATE INDEX IF NOT EXISTS idx_op_atyp_client_statut ON operation_atypique(client_id, statut, date_detection DESC);
CREATE INDEX IF NOT EXISTS idx_doc_ged_client_purge ON document_ged(client_id, type_document, date_purge_legale);
CREATE INDEX IF NOT EXISTS idx_outbox_status_nextretry ON outbox_events(status, next_retry_at);

