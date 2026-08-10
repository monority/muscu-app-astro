# Roadmap — muscu-app

> **Roadmap vivante** — mise à jour le **2026-08-10**
> Projet : **muscu-app** — tracker de gym (Astro SSR + Alpine.js), persistance localStorage (`muscu:*`), i18n FR/EN.
> Ce fichier est la **source de vérité** pour orienter les prochaines itérations : chaque item livré bascule dans « Récemment livré », puis est retiré des prochaines priorités.

> **Note de vérification (2026-08-10)** : contrôle du code effectué avant rédaction. En place en amont : **export/import JSON (sauvegarde/restauration + export CSV)** (Réglages → section Données) et **toasts** (`Toast.astro`/API `window.showToast`). Depuis : **raccourcis clavier du timer**, puis l'ensemble du **P1** (tendance par exercice, rappels de séance, RPE/uRPE par série, supersets, fiche de séance imprimable + CSV), puis la **sync WebDAV** (sauvegarde/restauration), puis les **benchmarks V1** (opt-in + données de référence locales étiquetées, aucune collecte serveur), puis le **tableau de bord restauré** (retour au layout pré-refonte : objectif hebdo + bande KPIs + séances récentes + empty state, polish shadcn — la refonte hero/insights/onboarding a été **rejetée**), la **nav accordéon responsive** (persistance `muscu:nav:collapsed`) et la **typographie Inter**. La table **P0 est supprimée** (aucun item restant) et le **P1 est vide** — tout figure dans « ✅ Récemment livré ».

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
| Sync WebDAV (backup / restore) | Sauvegarde/restauration du `localStorage` vers un serveur WebDAV : credentials dans les réglages, push / pull / test de connexion, restauration avec confirmation, dernier-écrit-gagne (last-write-wins). Wire-format : snapshot `AppDataSnapshot`. **Google Drive reste expérimental (OAuth) — non implémenté**. | `src/lib/sync.ts`, `src/pages/settings/index.astro`, `src/i18n/{fr,en}/settings.ts` (bloc sync), tests `src/lib/__tests__/sync.test.ts` |
| Répartition volume par groupe musculaire | Camembert des volumes Σ (charge×reps) par groupe musculaire sur la période (semaine/mois/tout), SVG inline (aucune dépendance), tooltip volume + %. Convention : séries terminées des séances `completed` uniquement, muscle snapshot du `SessionExercise`. | `src/pages/progression/stats.astro`, `src/lib/volume-stats.ts`, tests `src/lib/__tests__/volume-stats.test.ts` |
| MRV automatique (charge prescrite) — **V1** (progression linéaire) | Bouton ⚡ dans la cellule poids d'une série du builder : charge suggérée depuis l'historique, appliquée **uniquement sur clic** (jamais d'écrasement silencieux), toast + tooltip localisés (fr/en). **Formule V1 documentée + testée** (`MRV_FORMULA`) : base = top set (max poids) de la **dernière séance terminée** (repli `lastLoad`) ; facteur répétitions ±4 % / pas de 2 reps (clamp ±10 %) ; RPE ≥ 8,5 → +2,5 %, ≤ 6,5 → −2,5 % ; plafond **95 % du 1RM Epley** ; arrondi à 2,5 kg (1,25 configurable). V2 (algorithme intelligent) reste en P2. | `src/lib/mrv.ts` (`MRV_FORMULA`, `suggestLoad`, `suggestLoadSuggestion`), `src/pages/seances/creer/index.astro`, `src/i18n/{fr,en}/builder.ts`, tests `src/lib/__tests__/mrv.test.ts` |
| Benchmarks V1 (commu) — **données de référence locales** | Table **1RM estimé (Epley) vs percentiles p50/p75/p90** par exercice (séances terminées uniquement), badge de bande « ≥ 75ᵉ » + surlignage, opt-in anonyme `settings.benchmarksOptIn` (**intention seulement — AUCUN envoi réseau**, note « données locales »). Source **étiquetée non-communautaire** (`benchmarks-data.ts` : standards d'entraînement, `DATA_STATUS='reference'`), upload anonyme futur dépend de déploiement Supabase + politique de confidentialité. | `src/lib/benchmarks.ts`, `src/lib/benchmarks-data.ts`, `src/pages/progression/stats.astro` (+ miroir `/en/`), `src/i18n/{fr,en}/stats.ts` (clés benchmarks), `src/lib/storage.ts` (`Settings.benchmarksOptIn`), tests `src/lib/__tests__/benchmarks.test.ts` |
| Tableau de bord restauré (accueil) | Retour au **layout pré-refonte** : CTA séance + timer, carte objectif hebdo (anneau + barre), bande KPIs (volume / séances / PRs / série), séances récentes, empty state premier lancement. Polish shadcn (pills, cartes) — la refonte hero/insights/onboarding (edac935) a été **rejetée**. | `src/pages/index.astro` (+ fr/en shim auto), `src/i18n/{fr,en}/dashboard.ts` |
| Nav accordéon (responsive) | Groupes de nav repliables/dépliables (ex. « Progression ») : état partagé sidebar desktop ↔ drawer mobile, persisté sous `muscu:nav:collapsed`, chevron rotatif, auto-expansion du groupe actif. | `src/components/layout/AppShell.astro`, `src/components/layout/Sidebar.astro`, `src/layouts/AppLayout.astro`, `src/lib/nav-icons.ts` |
| Typographie Inter | **Inter** remplace **Barlow** (+ Barlow Condensed) : tokens `--font-display` / `--font-body` inchangés (`tokens.css`), `globals.css` @import + letter-spacing titres, fiche d'impression (`print.astro`), pop timer (`pop.astro`, `timer-widget.ts`), settings à-propos. | `src/styles/{globals,tokens}.css`, `src/pages/seances/print.astro`, `src/pages/timer/pop.astro`, `src/lib/timer-widget.ts` |

---

## P2 — À explorer (large / stratégique)

| Élément | Effort | Valeur | Fichiers principaux | Description |
|---|---|---|---|---|
| **MRV — V2 (algorithme intelligent)** | M | moyenne | `src/lib/mrv.ts` (V1 livrée), `src/pages/seances/creer/index.astro`, `src/lib/session-utils.ts` | **V1 = progression linéaire livrée** (voir « ✅ Récemment livré »). Reste : modèle de calcul avancé (progression non-linéaire, néo-RPE / vélocité, fatigue sessionnelle…) pour affiner la charge prescrite.<br><br>**Critères d'acceptation (V2)** : algorithme documenté et testé.<br>**Dépend de** : modèle de calcul v2 à définir. |
| **Communauté / benchmarks** | L | haute | back-end Astro SSR + base de données (base : `docs/supabase-schema.sql`), `src/lib/auth.ts` | Comparer son volume/1RM à un recueil anonyme. Nécessite SQL + auth + politique de confidentialité — gros morceau, à ne pas lancer avant P1.<br><br>**Critères d'acceptation** : opt-in anonyme (aucune donnée personnelle), comparaison volume/1RM.<br>**Dépend de** : SQL (`docs/supabase-schema.sql`) + auth + politique de confidentialité.<br><br>**Progression — V1 benchmarks locaux livrée** : opt-in `settings.benchmarksOptIn` (intention seulement, aucun envoi réseau), table 1RM (Epley) vs **données de référence étiquetées** (`src/lib/benchmarks-data.ts` — standards d'entraînement, PAS une cohorte réelle, remplaçables dès la sync serveur). **Upload anonyme serveur dépend de** déploiement Supabase + base de données + politique de confidentialité. |

---

## Priorité conseillée

P0 et P1 sont **entièrement livrés**. En P2 : « Répartition volume par groupe musculaire » **livrée**, « MRV automatique » **livrée en V1**, et **« Communauté / benchmarks » livrée en V1 locale** (opt-in + source de référence étiquetée). Il reste :

1. **Communauté / benchmarks — upload anonyme serveur** (P2, L) — la partie collection/upload serveur (SQL + auth + confidentialité) ; à lancer en dernier.
2. *(optionnel)* **MRV V2 (algorithme intelligent)** (P2, M) — suite naturelle de la V1 livrée, à porter selon les retours d'usage.

> **Note** : aucun de ces items ne dépend d'un autre (la sync WebDAV déjà livrée couvrait la portabilité entre devices).

---

*Règles du jeu : dès qu'un item est terminé, il passe dans « Récemment livré » (sans doublon) et la date d'en-tête est mise à jour. Retirer des priorités les items déjà livrés pour garder la roadmap au plus court.*