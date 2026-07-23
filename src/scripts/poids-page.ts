import { get, post, patch, del } from "../lib/api";
import { lineChart, type LinePoint } from "../lib/chart";
import { showToast } from "./toast";
import type { BodyWeight } from "../lib/types";

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

let editingId: number | null = null;

async function save() {
  const weight_kg = parseFloat((q<HTMLInputElement>("#weight_kg")?.value || ""));
  if (isNaN(weight_kg) || weight_kg <= 0) {
    showToast("Poids invalide", "error");
    return;
  }

  const measured_at = q<HTMLInputElement>("#measured_at")?.value || undefined;
  const notes = (q<HTMLInputElement>("#weight_notes")?.value || "").trim() || null;

  try {
    if (editingId !== null) {
      await patch(`/api/poids/${editingId}`, { weight_kg, measured_at, notes });
      showToast("Entrée modifiée ✓", "success");
    } else {
      await post("/api/poids", { weight_kg, measured_at, notes });
      showToast("Poids enregistré ✓", "success");
    }
    resetForm();
    await load();
  } catch {
    showToast("Erreur lors de l'enregistrement", "error");
  }
}

function startEdit(entry: BodyWeight) {
  editingId = entry.id;
  q<HTMLInputElement>("#weight_kg")!.value = String(entry.weight_kg);
  const d = new Date(entry.measured_at);
  q<HTMLInputElement>("#measured_at")!.value = d.toISOString().slice(0, 10);
  q<HTMLInputElement>("#weight_notes")!.value = entry.notes ?? "";
  q("[data-po-save]")!.textContent = "Mettre à jour";
  q("[data-po-edit-hint]")!.classList.remove("hidden");
  q("#weight_kg")?.focus();
}

async function handleDelete(id: number) {
  if (!confirm("Supprimer cette entrée ?")) return;
  try {
    await del(`/api/poids/${id}`);
    showToast("Entrée supprimée ✓", "success");
    if (editingId === id) resetForm();
    await load();
  } catch {
    showToast("Erreur lors de la suppression", "error");
  }
}

function resetForm() {
  editingId = null;
  q<HTMLInputElement>("#weight_kg")!.value = "";
  q<HTMLInputElement>("#measured_at")!.value = new Date().toISOString().slice(0, 10);
  q<HTMLInputElement>("#weight_notes")!.value = "";
  q("[data-po-save]")!.textContent = "Enregistrer";
  q("[data-po-edit-hint]")!.classList.add("hidden");
}

async function load() {
  q("[data-po-skeleton]")?.classList.remove("hidden");
  q("[data-po-error]")!.hidden = true;

  try {
    const entries = await get<BodyWeight[]>("/api/poids?limit=100");
    q("[data-po-skeleton]")?.classList.add("hidden");

    if (!entries || entries.length === 0) {
      q("[data-po-content]")!.hidden = true;
      q("[data-po-empty]")!.classList.remove("hidden");
      return;
    }

    q("[data-po-empty]")!.classList.add("hidden");
    q("[data-po-content]")!.classList.remove("hidden");

    renderChart(entries);
    renderList(entries);
  } catch (err) {
    q("[data-po-skeleton]")?.classList.add("hidden");
    showError(err instanceof Error ? err.message : "Erreur de chargement");
  }
}

function renderChart(entries: BodyWeight[]) {
  const sorted = [...entries].reverse();
  const points: LinePoint[] = sorted.map((e) => ({
    label: new Date(e.measured_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    value: e.weight_kg,
  }));
  q("[data-po-chart]")!.innerHTML = lineChart(points, 600, 240);
}

function renderList(entries: BodyWeight[]) {
  const list = q<HTMLElement>("[data-po-list]")!;
  list.innerHTML = entries
    .map(
      (e) => `<li class="po-list-item" data-id="${e.id}">
      <div class="po-list-main">
        <span class="po-list-weight">${e.weight_kg.toFixed(1)} kg</span>
        <span class="po-list-date">${new Date(e.measured_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
        ${e.notes ? `<span class="po-list-notes">${e.notes}</span>` : ""}
      </div>
      <div class="po-list-actions">
        <button type="button" data-po-edit="${e.id}" aria-label="Modifier">✎</button>
        <button type="button" data-po-delete="${e.id}" aria-label="Supprimer">✕</button>
      </div>
    </li>`,
    )
    .join("");

  list.querySelectorAll("[data-po-edit]").forEach((btn) => {
    const id = parseInt((btn as HTMLElement).getAttribute("data-po-edit")!, 10);
    const entry = entries.find((e) => e.id === id);
    if (entry) btn.addEventListener("click", () => startEdit(entry));
  });

  list.querySelectorAll("[data-po-delete]").forEach((btn) => {
    btn.addEventListener("click", () =>
      handleDelete(parseInt((btn as HTMLElement).getAttribute("data-po-delete")!, 10)),
    );
  });
}

function showError(msg: string) {
  const el = q<HTMLElement>("[data-po-error]");
  if (el) {
    el.innerHTML = `<div class="error-state" role="alert" aria-live="polite">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="width:3.2rem;height:3.2rem;color:var(--accent)"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      <h2 style="margin:0;font-size:1.6rem;font-weight:700;color:var(--text)">Erreur</h2>
      <p style="margin:0;font-size:1.3rem;color:var(--muted)">${msg}</p>
      <button class="error-retry" type="button" style="min-height:3.8rem;padding:0.6rem 1.6rem;border:1px solid hsl(24 100% 55% / 0.45);border-radius:var(--radius-md);background:var(--accent);color:var(--accent-foreground);font:inherit;font-size:1.3rem;font-weight:700;cursor:pointer">Réessayer</button>
    </div>`;
    el.hidden = false;
    el.querySelector(".error-retry")?.addEventListener("click", () => { el.hidden = true; load(); });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  q<HTMLInputElement>("#measured_at")!.value = new Date().toISOString().slice(0, 10);
  q("[data-po-save]")?.addEventListener("click", save);
  q("[data-po-cancel]")?.addEventListener("click", resetForm);
  load();
});
