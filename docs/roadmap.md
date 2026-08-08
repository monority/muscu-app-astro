# Roadmap — muscu-app

> **Roadmap vivante** — mise à jour le **2026-08-08**
> Projet : **muscu-app** — tracker de gym (Astro SSR + Alpine.js), persistance localStorage (`muscu:*`), i18n FR/EN.
> Ce fichier est la **source de vérité** pour orienter les prochaines itérations : chaque item livré bascule dans « Récemment livré », puis est retiré des prochaines priorités.

> **Note de vérification (2026-08-08)** : contrôle du code effectué avant rédaction. L'**export/import JSON (sauvegarde/restauration + export CSV)** et les **toasts** sont **déjà en place** (Réglages → section Données ; composant `Toast.astro`/API `window.showToast`). Ils sont donc listés dans « Récemment livré » et **retirés de la table P0**. Le seul correctif P0 réellement restant est le **raccourci clavier du timer**.

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

---

## P0 — Correctifs & fondations (petits, sûrs, à forte valeur)

| Élément | Effort | Valeur | Fichiers principaux | Description |
|---|---|---|---|---|
| **Raccourcis clavier timer** | S | haute | `src/pages/timer/index.astro`, `src/pages/timer/pop.astro` | `Espace` = pause/reprise, `R` = reset. Écoute `keydown` avec garde : ignorer si le focus est dans un `input`/`textarea`/`select`. Le timer n'a aujourd'hui que `@keydown.enter` sur l'input personnalisé ; les méthodes `toggle()`/`reset()` existent déjà. À appliquer aussi à la fenêtre PiP (`pop.astro`).<br><br>**Critères d'acceptation** : `Espace` bascule `pause/reprise`, `R` reset — sans conflit quand un champ est focus (`input`/`textarea`/`select`). |

> La table P0 ci-dessus ne contient plus que le travail restant : **raccourcis clavier du timer** (petit, quotidien, confort fort). Export/import JSON et toasts sont livrés (voir « ✅ Récemment livré ») et donc retirés de P0.

---

## P1 — Fonctionnalités (effort moyen, valeur claire)

| Élément | Effort | Valeur | Fichiers principaux | Description |
|---|---|---|---|---|
| **Graphique de tendance par exercice** | M | haute | `src/pages/exercices/index.astro`, `src/pages/exercices/historique.astro`, `src/pages/progression/index.astro`, `src/lib/storage.ts` (`getSessionsByExercise`), nouveau `src/lib/stats.ts` | Courbe **volume** (Σ charge×reps) et **1 RM estimé** (Epley, déjà via `calculate1RM` — `src/lib/storage.ts`) par séance, filtré par exercice. Données disponibles via `getSessionsByExercise` + `getProgressRecords` (`src/lib/storage.ts`). Rendu SVG inline (aucune dépendance, même pattern que le calendrier). Sélecteur d'exercice + zoom sur une période.<br><br>**Critères d'acceptation** : SVG inline, aucune nouvelle dépendance, responsive mobile, sélecteur d'exercice fonctionnel, au moins 2 points nécessaires pour tracer la courbe. |
| **Rappels de séance** | M | haute | nouveau `src/lib/reminders.ts`, `src/pages/calendrier.astro`, `src/pages/settings/index.astro`, `public/sw.js` | Notifications via Notification API (« C'est le moment de la séance ») programmées depuis le calendrier ou les réglages. Permission demandée au moment opportun ; rappels quotidiens/hebdomadaires (complète `weeklyGoal`). Le service worker existant (`public/sw.js`) couvre le cas hors-onglet.<br><br>**Critères d'acceptation** : Notification API + service worker enregistré ; fallback toast quand permission refusée.<br>**Dépend de** : Notification API + service worker + UX de permission. |
| **RPE / uRPE par série** | M | moyenne | `src/pages/seances/creer/index.astro`, `src/pages/seances/rapide.astro`, `src/lib/session-utils.ts`, `src/pages/progression/stats.astro` | Les champs existent déjà : `SessionSet.rpe`, `Session.rpe`/`Session.fatigue` dans `src/lib/storage.ts`. Manquent : une **saisie** simple par série (curseur ou `+/-`) et une **tendance fatigue**, facilement visible en progression.<br><br>**Critères d'acceptation** : champ RPE sur chaque série, ajustable après coup, tendance visible. |
| **Supersets programmés (alternance auto)** | M | moyenne | `src/pages/seances/creer/index.astro`, `src/lib/session-utils.ts`, `src/lib/storage.ts` (`Superset` déjà typé) | Le type `Superset` (`src/lib/storage.ts`) est déjà défini (groupes de 2+ `exerciseId`). Faire : détection auto d'une alternance A→B→A→B dans le builder (2 exercices « verrouillés »), regroupement visuel avec repos partagé, persistance dans `session.supersets`. Utile pour les circuits.<br><br>**Critères d'acceptation** : détection alterne 2 exercices, groupement visuel, dégroupement possible. |
| **Export PDF/CSV : fiche de séance** | S→M | moyenne | `src/pages/seances/detail.astro`, `src/lib/storage.ts` (réutiliser `csvEscape` (`src/lib/storage.ts`) / `exportSessionsAsCSV`), miroir `/en/` | Récap d'une séance précise : CSV en un clic (une série par ligne) et PDF via vue imprimable `window.print()` (header/footer distincts). Bouton dans la fiche détail d'une séance terminée.<br><br>**Critères d'acceptation** : génération hors-ligne, CSV déjà présent réutilisé (une série par ligne), PDF via `window.print()` sans dépendance. |

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

1. **Raccourcis clavier timer** (P0, S) — le dernier correctif restant : vite rentabilisé et visible à chaque visite.
2. **Rappels de séance** (P1, M) — la première fonction « au-delà du tracking » : notifications. Touchée chaque semaine.
3. **Graphique de tendance par exercice** (P1, M) — la vue la plus demandée en salle (volume/1RM en évolution).

> **Note** : l'Export/Import JSON constituait initialement la première priorité — **déjà livré** (2026-08-08). Le point de départ des itérations est donc d'abord le timer shortcuts, puis la séquence ci-dessus. Ordre P1 conseillé : rappels → graphique → RPE → supersets → export fiche séance ; l'ordre des trois premiers reste flexible selon les retours d'usage.

---

*Règles du jeu : dès qu'un item est terminé, il passe dans « Récemment livré » (sans doublon) et la date d'en-tête est mise à jour. Retirer des priorités les items déjà livrés pour garder la roadmap au plus court.*