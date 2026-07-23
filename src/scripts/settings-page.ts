import { get, patch } from "../lib/api";
import { showToast } from "./toast";

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

async function loadProfile() {
  try {
    const profile = await get<{ display_name: string | null; preferred_rest_s: number }>("/api/profile");
    if (profile) {
      (q<HTMLInputElement>("#display_name")!.value = profile.display_name ?? "");
      (q<HTMLInputElement>("#preferred_rest_s")!.value = String(profile.preferred_rest_s));
    }
  } catch {
    showToast("Erreur de chargement du profil", "error");
  } finally {
    q("[data-settings-skeleton]")?.classList.add("hidden");
    q("[data-settings-form]")?.classList.remove("hidden");
  }
}

async function saveProfile() {
  const display_name = (q<HTMLInputElement>("#display_name")?.value || "").trim() || null;
  const preferred_rest_s = parseInt((q<HTMLInputElement>("#preferred_rest_s")?.value || "90"), 10);

  try {
    await patch("/api/profile", { display_name, preferred_rest_s });
    showToast("Profil mis à jour ✓", "success");
  } catch {
    showToast("Erreur lors de la sauvegarde", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  q("[data-settings-save]")?.addEventListener("click", saveProfile);
});
