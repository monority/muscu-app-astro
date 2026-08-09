# Roadmap — muscu-app

> **Roadmap vivante** — mise à jour le **2026-08-09**
> Projet : **muscu-app** — tracker de gym (Astro SSR + Alpine.js), persistance localStorage (`muscu:*`), i18n FR/EN.
> Ce fichier est la **source de vérité** pour orienter les prochaines itérations : chaque item livré bascule dans « Récemment livré », puis est retiré des prochaines priorités.

> **Note de vérification (2026-08-09)** : contrôle du code effectué avant rédaction. En place en amont : **export/import JSON (sauvegarde/restauration + export CSV)** (Réglages → section Données) et **toasts** (`Toast.astro`/API `window.showToast`). Depuis : **raccourcis clavier du timer**, puis l'ensemble du **P1** (tendance par exercice, rappels de séance, RPE/uRPE par série, supersets, fiche de séance imprimable + CSV). La table **P0 est supprimée** (aucun item restant) et le **P1 est vide** — tout figure dans « ✅ Récemment livré ».

---

## Convention

- **Effort** : S = petit (≤ ½ journée) · M = moyen (1–3 jours) · L = large (une semaine et +).
- **Valeur** : haute = visible et utile au quotidien · moyenne = utile en phase avancée ou de confort.
- **Fichiers principaux** : chemins FR ; chaque page FR a son miroir `/en/` (sous `src/pages/en/`, non re-listé). Les libellés i18n vivent dans `src/i18n/fr|en/`.

---

## ✅ Récemment livré

| Livraison | Détail | Fichiers |
|---|---|---|
| Export / Import JSON (backup) | Sauvegarde `muscu-backup-YYYY-MM-DD.json`, restauration par import de fichier, reset complet. Couvre toutes les clés `muscu:*` + `muscu-settings`. | `src/lib/storage.ts` (`exportAllData`, `importAllData`, `resetAllData`), `src/pages/settings/index.astro` |
| Export CSV (toutes séances) | Une ligne par série (date, exercice, charge, reps, 1RM Epley estimé) — prêt pour tableur. | `src/lib/storage.ts` (`exportSessionsAsCSV`), `src/pages/settings/index.astro` |
| Feedback toasts | API globale `window.showToast(msg, 'success'\|'error'\|'info'\|'warning')` utilisée sur réglages, exercices, backup, reset. | `src/components/ui/Toast.astro` |
| Actions rapides séance + undo dernière série | Menu d'actions rapides avec annulation de la dernière série. | `src/pages/seances/rapide.astro`, `src/lib/session-utils.ts` |
| Recherche rapide (commande) | Palette `/` + `Ctrl/Cmd+K` : recherche + navigation rapides. | `src/components/layout/QuickSearch.astro` |
| Modèles de séance (auto-création) | Template généré automatiquement à la création d'une séance. | `src/lib/templates.ts`, `src/pages/seances/creer/index.astro` |
| Tailles de plaques du calculateur | Inventaire barre : 25, 20, 15, 10, 5, 2,5, 2, 1,5, 1,25, 1 kg · haltères : 10, 7,5, 5, 4, 3, 2,5, 2, 1,5, 1,25, 1, 0,5 kg. Les petites plaques 1 / 1,25 / 1,5 / 2 kg ont été ajoutées à l'inventaire barre (déjà présentes côté haltères). | `src/pages/calculateur.astro` |
| Fix z-index des menus | Menus déroulants toujours au-dessus du contenu : `z-50` sur le menu `Dropdown.astro`, suppression du hover `.sess__card:hover:not(:has(.sess__menu))` qui recouvrait le menu. | `src/components/ui/Dropdown.astro`, `src/pages/seances/index.astro` |
| Raccourcis clavier du timer | `Espace` = pause/reprise, `R` = reset, avec garde `keydown` (ignoré si focus dans un `input`/`textarea`/`select`). Appliqué à la fenêtre principale et à la PiP. | `src/pages/timer/index.astro`, `src/pages/timer/pop.astro` |
| Graphique de tendance par exercice | Courbe **volume** (Σ charge×reps) et **1 RM estimé** (Epley) par séance, filtré par exercice. Rendu SVG inline (aucune dépendance), sélecteur d'exercice + zoom sur une période, responsive mobile. | `src/pages/exercices/tendance.astro` (+ miroir `/en/`), `src/i18n/{fr,en}/tendance.ts` |
| Rappels de séance | Notifications via Notification API (« C'est le moment de la séance ») configurées depuis les réglages (quotidien/hebdomadaire). Fallback toast quand la permission est refusée. | `src/components/params/ReminderSettings.astro`, `src/lib/storage.ts` (`ReminderSettings`) |
| RPE / uRPE par série | Saisie compacte RPE/uRPE par série (pas de 0,5, 10→4) dans le builder, ajustable après coup ; badge et tendance fatigue dans la fiche séance. | `src/pages/seances/creer/index.astro`, `src/lib/storage.ts` (`RPE_OPTIONS`), `src/pages/seances/detail.astro` |
| Supersets (détection auto) | Détection auto d'une alternance A→B→A→B dans le builder (2 exercices consécutifs), groupement visuel avec repos partagé, dégroupement possible, persistance `Session.supersets` + colonne `Superset` du CSV. | `src/pages/seances/creer/index.astro`, `src/pages/seances/detail.astro`, `src/lib/storage.ts` (`Session.supersets`, colonne CSV `Superset`) |
| Fiche de séance imprimable + CSV par séance | Récap d'une séance précise : vue imprimable `window.print()` (header/footer distincts) et CSV en un clic (une série par ligne). Bouton dans la fiche détail. | `src/pages/seances/print.astro` (+ miroir `/en/`), `src/lib/storage.ts` (`sessionsToCsv` / `exportSessionAsCsv`) |

---

## P2 — À explorer (large / stratégique)

| Élément | Effort | Valeur | Fichiers principaux | Description |
|---|---|---|---|---|
| **Sync compte (WebDAV / Google Drive)** | L | haute | nouveau `src/lib/sync.ts`, `src/pages/settings/index.astro`, `src/lib/auth.ts` | Le `localStorage` est local au navigateur et au device (aucune portabilité, perdu hors navigation privée). Sync = sauvegarde + restauration automatique. WebDAV = le plus simple à maintenir (pas de backend à tenir) ; GDrive expérimental (OAuth). Réutiliser le format de snapshot `AppDataSnapshot` (`src/lib/storage.ts`) comme wire-format.<br><br>**Critères d'acceptation** : sauvegarde puis restauration complètes vérifiées.<br>**Dépend de** : API WebDAV/GDrive, flux OAuth si applicable. |
| **MRV automatique (charge prescrite)** | L | moyenne | nouveau `src/lib/mrv.ts` (placeholder « Joker »), `src/pages/seances/creer/index.astro`, `src/lib/session-utils.ts` | « Joker » = placeholder d'algorithme : à terme, proposer la charge d'une série à partir de l'historique (1RM estimé, RPE). V1 simple d'abord (progression linéaire depuis les `ProgressRecord` — `src/lib/storage.ts`), algorithme intelligent en v2.<br><br>**Critères d'acceptation** : formule documentée et testée.<br>**Dépend de** : modèle de calcul à définir (V1 : progression linéaire, V2 : algorithme). |
| **Répartition volume par groupe musculaire** | M | moyenne | `src/pages/progression/stats.astro`, nouveau `src/lib/volume-stats.ts` | Camembert des volumes Σ par groupe musculaire sur la période (semaine/mois). Données : `getSessions` + mapping muscles du catalogue. SVG inline, même pattern que les autres chart.<br><br>**Critères d'acceptation** : répartition par muscle, tooltip (volume + %), période semaine/mois. |
| **Communauté / benchmarks** | L | haute | back-end Astro SSR + base de données (base : `docs/supabase-schema.sql`), `src/lib/auth.ts` | Comparer son volume/1RM à un recueil anonyme. Nécessite SQL + auth + politique de confidentialité — gros morceau, à ne pas lancer avant P1.<br><br>**Critères d'acceptation** : opt-in anonyme (aucune donnée personnelle), comparaison volume/1RM.<br>**Dépend de** : SQL (`docs/supabase-schema.sql`) + auth + politique de confidentialité. |

---

## Priorité conseillée

P0 et P1 sont **entièrement livrés** — plus aucun correctif ni fonctionnalité courte en attente. Les prochaines itérations ouvrent le **P2** ci-dessus :

1. **Sync compte (WebDAV / Google Drive)** (P2, L) — la seule brique P2 à valeur « haute » : sauvegarde/restauration automatique, débloque la portabilité entre devices. Indépendante des autres items P2.
2. **Répartition volume par groupe musculaire** (P2, M) — le plus petit P2, exploite directement les données déjà collectées (volume par muscle, période semaine/mois).
3. **MRV automatique (charge prescrite)** (P2, L) — capitalise sur la tendance 1RM/RPE déjà en place (trend chart + RPE/uRPE par série).
4. **Communauté / benchmarks** (P2, L) — le plus gros morceau (SQL + auth + confidentialité) ; à lancer en dernier et seulement une fois la sync stable.

> **Note** : l'ordre des trois premiers reste flexible selon les retours d'usage ; rien ne bloque la sync, car elle ne dépend d'aucun des items 2–4.

---

*Règles du jeu : dès qu'un item est terminé, il passe dans « Récemment livré » (sans doublon) et la date d'en-tête est mise à jour. Retirer des priorités les items déjà livrés pour garder la roadmap au plus court.*