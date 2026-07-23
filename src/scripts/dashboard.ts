import { supabase } from "../lib/supabase";

interface SetRow {
  weight_kg: number;
  reps: number;
  exercises: { name: string };
}

interface SessionRow {
  id: number;
  started_at: string;
  ended_at: string | null;
}

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

function showContent() {
  document.querySelector("[data-dash-skeleton]")?.classList.add("hidden");
  document.querySelector("[data-dash-content]")?.classList.remove("hidden");
}

export async function loadDashboard() {
  showContent();
  const { data: activeSession } = await supabase
    .from("sessions")
    .select("id, started_at")
    .is("ended_at", null)
    .limit(1)
    .single();

  const activeCard = q("[data-active-session]");
  const emptyCard = q("[data-no-session]");
  const cta = q<HTMLAnchorElement>("[data-start-session]");

  if (activeSession) {
    activeCard?.classList.remove("hidden");
    emptyCard?.classList.add("hidden");

    const { data: sets } = await supabase
      .from("exercise_sets")
      .select("weight_kg, reps, exercises(name)")
      .eq("session_id", activeSession.id)
      .order("completed_at", { ascending: false })
      .limit(10);

    if (sets && sets.length > 0) {
      const last = sets[0] as unknown as SetRow;
      const totalSets = sets.length;
      const totalVol = sets.reduce((s: number, set: SetRow) => s + set.weight_kg * set.reps, 0);

      q("[data-active-exercise]")!.textContent = last.exercises.name;
      q("[data-active-sets]")!.textContent = String(totalSets);
      q("[data-active-volume]")!.textContent = totalVol + " kg";
    }

    if (cta) cta.href = "/session";
  } else {
    activeCard?.classList.add("hidden");
    emptyCard?.classList.remove("hidden");
    if (cta) cta.href = "/session";
  }

  const { data: recent } = await supabase
    .from("sessions")
    .select("id, started_at")
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(5);

  const list = q("[data-recent-list]");
  if (list && recent && recent.length > 0) {
    list.innerHTML = recent
      .map(
        (s: SessionRow) =>
          `<li><a href="/session/${s.id}" style="display:block;text-decoration:none;color:inherit">
            ${new Date(s.started_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })} — Séance #${s.id}
          </a></li>`,
      )
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", loadDashboard);
