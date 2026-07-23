import { get, post } from "../lib/api";

interface Exercise {
  id: number;
  name: string;
  default_rest_s: number;
  muscle_group: string | null;
  equipment: string | null;
}

const muscleLabels: Record<string, string> = {
  chest: "Pectoraux", back: "Dos", shoulders: "Épaules",
  biceps: "Biceps", triceps: "Triceps", quadriceps: "Quadriceps",
  hamstrings: "Ischios", glutes: "Fessiers", calves: "Mollets",
  abs: "Abdos", traps: "Trapèzes", forearms: "Avant-bras",
};

const equipmentLabels: Record<string, string> = {
  barbell: "Barre", dumbbell: "Haltères", machine: "Machine",
  cable: "Poulie", bodyweight: "Poids du corps", kettlebell: "Kettlebell",
  "ez-bar": "EZ", smith: "Smith", bands: "Élastiques", other: "Autre",
};

export class ExerciseSearch {
  private input: HTMLInputElement;
  private results: HTMLElement;
  private selected: HTMLElement;
  private selectedName: HTMLElement;
  private filterChips: HTMLElement;
  private recentContainer: HTMLElement;
  private recentList: HTMLElement;
  private timeout = 0;
  private activeIndex = -1;
  private muscleFilter = "";
  private allExercises: Exercise[] = [];
  onSelect?: (exercise: Exercise) => void;

  constructor(input: HTMLInputElement, results: HTMLElement, selected: HTMLElement) {
    this.input = input;
    this.results = results;
    this.selected = selected;
    this.selectedName = selected.querySelector("[data-exercise-name]")!;
    this.filterChips = document.querySelector("[data-ex-filter-chips]")!;
    this.recentContainer = document.querySelector("[data-recent-exercises]")!;
    this.recentList = document.querySelector("[data-recent-list]")!;

    this.input.addEventListener("input", () => {
      clearTimeout(this.timeout);
      this.activeIndex = -1;
      this.timeout = window.setTimeout(() => this.filter(), 250);
    });

    this.input.addEventListener("focus", () => {
      if (this.input.value.length >= 1) this.filter();
    });

    this.input.addEventListener("keydown", (e) => {
      const items = this.results.querySelectorAll<HTMLElement>("[role='option']");

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          this.activeIndex = Math.min(this.activeIndex + 1, items.length - 1);
          this.highlight(items);
          break;
        case "ArrowUp":
          e.preventDefault();
          this.activeIndex = Math.max(this.activeIndex - 1, 0);
          this.highlight(items);
          break;
        case "Enter":
          e.preventDefault();
          if (this.activeIndex >= 0 && items[this.activeIndex]) {
            items[this.activeIndex].click();
          }
          break;
        case "Escape":
          this.results.hidden = true;
          this.input.setAttribute("aria-expanded", "false");
          break;
      }
    });

    document.addEventListener("click", (e) => {
      if (!this.input.closest(".exercise-picker")) {
        this.results.hidden = true;
        this.input.setAttribute("aria-expanded", "false");
      }
    });

    this.loadExercises();
  }

  private async loadExercises() {
    const data = await get<Exercise[]>("/api/exercises");
    this.allExercises = data ?? [];
    this.buildFilterChips();
    this.buildRecent();
  }

  private buildFilterChips() {
    const muscles = [...new Set(this.allExercises.map((e) => e.muscle_group).filter(Boolean) as string[])];
    if (muscles.length === 0) {
      this.filterChips.hidden = true;
      return;
    }
    this.filterChips.hidden = false;
    const order = ["chest", "back", "shoulders", "biceps", "triceps", "quadriceps", "hamstrings", "glutes", "calves", "abs", "traps", "forearms"];
    const sorted = order.filter((m) => muscles.includes(m));
    this.filterChips.innerHTML = `<button class="ex-filter-chip" type="button" data-filter-muscle="" data-active>Tous</button>`;
    for (const m of sorted) {
      const btn = document.createElement("button");
      btn.className = "ex-filter-chip";
      btn.type = "button";
      btn.setAttribute("data-filter-muscle", m);
      btn.textContent = muscleLabels[m] || m;
      this.filterChips.appendChild(btn);
    }
    this.filterChips.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("[data-filter-muscle]") as HTMLElement | null;
      if (!btn) return;
      this.filterChips.querySelectorAll("[data-filter-muscle]").forEach((c) => c.removeAttribute("data-active"));
      btn.setAttribute("data-active", "");
      this.muscleFilter = btn.getAttribute("data-filter-muscle") || "";
      this.filter();
    });
  }

  private async buildRecent() {
    const recent = this.getRecentIds();
    if (recent.length === 0) {
      this.recentContainer.hidden = true;
      return;
    }
    const recentExercises = recent
      .map((id) => this.allExercises.find((e) => e.id === id))
      .filter(Boolean) as Exercise[];
    if (recentExercises.length === 0) {
      this.recentContainer.hidden = true;
      return;
    }
    this.recentContainer.hidden = false;
    this.recentList.innerHTML = "";
    for (const ex of recentExercises) {
      const btn = document.createElement("button");
      btn.className = "recent-exercise-btn";
      btn.type = "button";
      btn.textContent = ex.name;
      btn.addEventListener("click", () => this.select(ex));
      this.recentList.appendChild(btn);
    }
  }

  private getRecentIds(): number[] {
    try {
      const stored = localStorage.getItem("recent_exercises");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private addRecentId(id: number) {
    let ids = this.getRecentIds().filter((i) => i !== id);
    ids.unshift(id);
    if (ids.length > 5) ids = ids.slice(0, 5);
    localStorage.setItem("recent_exercises", JSON.stringify(ids));
  }

  private highlight(items: NodeListOf<HTMLElement>) {
    items.forEach((el, i) => {
      if (i === this.activeIndex) {
        el.setAttribute("aria-selected", "true");
        el.classList.add("highlighted");
        el.scrollIntoView({ block: "nearest" });
      } else {
        el.removeAttribute("aria-selected");
        el.classList.remove("highlighted");
      }
    });
    this.input.setAttribute("aria-activedescendant", items[this.activeIndex]?.id ?? "");
  }

  setValue(name: string) {
    this.input.value = name;
    this.input.hidden = true;
    this.selected.hidden = false;
    this.selectedName.textContent = name;
    this.results.hidden = true;
    this.input.setAttribute("aria-expanded", "false");
    this.recentContainer.hidden = true;
  }

  reset() {
    this.input.value = "";
    this.input.hidden = false;
    this.input.focus();
    this.selected.hidden = true;
    this.results.hidden = true;
    this.input.setAttribute("aria-expanded", "false");
    this.recentContainer.hidden = false;
    this.buildRecent();
  }

  private async filter() {
    const q = this.input.value.trim().toLowerCase();
    let filtered = this.allExercises;

    if (this.muscleFilter) {
      filtered = filtered.filter((e) => e.muscle_group === this.muscleFilter);
    }

    if (q.length > 0) {
      filtered = filtered.filter((e) => e.name.toLowerCase().includes(q));
    }

    if (q.length < 1 && !this.muscleFilter) {
      this.results.hidden = true;
      this.input.setAttribute("aria-expanded", "false");
      return;
    }

    this.results.innerHTML = "";

    if (filtered.length > 0) {
      for (const ex of filtered) {
        const li = document.createElement("li");
        li.id = `ex-opt-${ex.id}`;
        li.setAttribute("role", "option");
        li.innerHTML = `<div class="ex-result-name">${ex.name}</div>`;
        if (ex.muscle_group || ex.equipment) {
          const meta = document.createElement("div");
          meta.className = "ex-result-meta";
          if (ex.muscle_group) {
            const badge = document.createElement("span");
            badge.className = "ex-result-badge muscle";
            badge.textContent = muscleLabels[ex.muscle_group] || ex.muscle_group;
            meta.appendChild(badge);
          }
          if (ex.equipment) {
            const badge = document.createElement("span");
            badge.className = "ex-result-badge equipment";
            badge.textContent = equipmentLabels[ex.equipment] || ex.equipment;
            meta.appendChild(badge);
          }
          li.appendChild(meta);
        }
        li.addEventListener("click", () => this.select(ex));
        this.results.appendChild(li);
      }
    } else if (q.length > 0) {
      const createLi = document.createElement("li");
      createLi.id = "ex-opt-create";
      createLi.setAttribute("role", "option");
      createLi.setAttribute("data-create", "");
      createLi.textContent = `➕ Créer "${q}"`;
      createLi.addEventListener("click", () => this.create(q));
      this.results.appendChild(createLi);
    }

    this.results.hidden = false;
    this.input.setAttribute("aria-expanded", "true");
    this.activeIndex = -1;
  }

  private select(ex: Exercise) {
    this.addRecentId(ex.id);
    this.setValue(ex.name);
    this.onSelect?.(ex);
  }

  private async create(name: string) {
    const data = await post<Exercise>("/api/exercises", { name, default_rest_s: 90 });
    if (data) {
      this.setValue(data.name);
      this.allExercises.push(data);
      this.buildFilterChips();
      this.onSelect?.(data);
    }
  }
}
