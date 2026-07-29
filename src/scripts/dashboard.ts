function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

document.addEventListener("DOMContentLoaded", () => {
  q("[data-dash-skeleton]")?.classList.add("hidden");
  q("[data-dash-content]")?.classList.remove("hidden");
  q("[data-no-session]")?.classList.remove("hidden");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Prêt pour une séance matinale ?" : hour < 18 ? "Prêt pour l'entraînement ?" : "Bonne séance en soirée !";
  const greetingEl = q("[data-dash-greeting]");
  if (greetingEl) greetingEl.textContent = greeting;
});
