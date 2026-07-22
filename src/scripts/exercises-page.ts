import { supabase } from "../lib/supabase";

function q<T = HTMLElement>(s: string): T | null {
  return document.querySelector<T>(s);
}

interface Exercise {
  id: number;
  name: string;
  category: string | null;
  default_rest_s: number;
}

let currentFilter = "all";

async function load() {
  let query = supabase.from("exercises").select("*").order("name");
  if (currentFilter !== "all") {
    query = query.eq("category", currentFilter);
  }
  const { data } = await query;
  render(data ?? []);
}

function render(exercises: Exercise[]) {
  const list = q<HTMLElement>("[data-ex-list]")!;
  const search = (q<HTMLInputElement>("[data-ex-search]")?.value || "").toLowerCase();

  const filtered = exercises.filter((ex) => ex.name.toLowerCase().includes(search));

  if (filtered.length === 0) {
    list.innerHTML = `<li class="ex-empty">Aucun exercice trouvé</li>`;
    return;
  }

  list.innerHTML = filtered
    .map(
      (ex) =>
        `<li>
          <div>
            <span class="ex-name">${ex.name}</span>
            ${ex.category ? `<span class="ex-category">${ex.category}</span>` : ""}
          </div>
          <span class="ex-rest">${ex.default_rest_s}s</span>
          <button class="ex-delete" type="button" data-del="${ex.id}">Suppr.</button>
        </li>`,
    )
    .join("");

  list.querySelectorAll("[data-del]").forEach((btn) =>
    btn.addEventListener("click", () => deleteEx(parseInt((btn as HTMLElement).getAttribute("data-del")!, 10))),
  );
}

async function deleteEx(id: number) {
  if (!confirm("Supprimer cet exercice ?")) return;
  await supabase.from("exercises").delete().eq("id", id);
  load();
}

document.addEventListener("DOMContentLoaded", () => {
  load();

  q("[data-ex-search]")?.addEventListener("input", () => load());

  q("[data-ex-categories]")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-cat]") as HTMLElement | null;
    if (!btn) return;
    document.querySelectorAll("[data-cat]").forEach((c) => c.removeAttribute("data-active"));
    btn.setAttribute("data-active", "");
    currentFilter = btn.getAttribute("data-cat")!;
    load();
  });

  q("[data-ex-add]")?.addEventListener("click", () => {
    q("[data-ex-add-form]")?.classList.remove("hidden");
  });

  q("[data-ex-cancel]")?.addEventListener("click", () => {
    q("[data-ex-add-form]")?.classList.add("hidden");
  });

  q("[data-ex-save]")?.addEventListener("click", async () => {
    const name = (q<HTMLInputElement>("[data-ex-name]")?.value || "").trim();
    const category = (q<HTMLSelectElement>("[data-ex-category]")?.value || "").trim() || null;
    const rest = parseInt((q<HTMLInputElement>("[data-ex-rest]")?.value || "90"), 10);

    if (!name) return;

    await supabase.from("exercises").insert({ name, category, default_rest_s: rest });
    (q<HTMLInputElement>("[data-ex-name]")!.value = "");
    (q<HTMLSelectElement>("[data-ex-category]")!.value = "");
    (q<HTMLInputElement>("[data-ex-rest]")!.value = "90");
    q("[data-ex-add-form]")?.classList.add("hidden");
    load();
  });
});
