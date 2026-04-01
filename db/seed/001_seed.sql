-- Qontai — seed v1 (MVP)
-- NOTE: mots de passe à remplacer par des vrais hashes via n8n (login workflow) en prod.

INSERT INTO utilisateur (email, nom, prenom, role_principal, est_expert_comptable, est_correspondant_tracfin, password_hash)
VALUES
  ('collab@qontai.local', 'Collab', 'User', 'Collaborateur', false, false, NULL),
  ('resp@qontai.local', 'Responsable', 'Mission', 'Responsable_Mission', false, false, NULL),
  ('exec@qontai.local', 'Organe', 'Executif', 'Organe_Executif', false, false, NULL),
  ('ec@qontai.local', 'Expert', 'Comptable', 'Responsable_Mission', true, true, NULL)
ON CONFLICT (email) DO NOTHING;

-- Missions (Pilier D)
INSERT INTO mission (libelle_mission, niveau_risque_par_defaut)
VALUES
  ('Etablissement des paies et déclarations sociales', 'Faible'),
  ('Tenue de comptabilité / comptes annuels', 'Moyen'),
  ('Déclarations fiscales personnelles', 'Moyen'),
  ('Création ou reprise d’entité', 'Eleve'),
  ('Evolutions juridiques et capitalistiques', 'Eleve'),
  ('Montages fiscaux complexes', 'Eleve'),
  ('Gestion de patrimoine', 'Eleve'),
  ('Recherche de financement / gestion de trésorerie', 'Eleve'),
  ('Mandat de paiement / recouvrement de créances', 'Eleve'),
  ('Comptes de campagne', 'Eleve')
ON CONFLICT DO NOTHING;

