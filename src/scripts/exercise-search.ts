import { supabase } from "../lib/supabase";

interface Exercise {
  id: number;
  name: string;
  default_rest_s: number;
}

export class ExerciseSearch {
  private input: HTMLInputElement;
  private results: HTMLElement;
  private selected: HTMLElement;
  private selectedName: HTMLElement;
  private timeout = 0;
  onSelect?: (exercise: Exercise) => void;

  constructor(input: HTMLInputElement, results: HTMLElement, selected: HTMLElement) {
    this.input = input;
    this.results = results;
    this.selected = selected;
    this.selectedName = selected.querySelector("[data-exercise-name]")!;

    this.input.addEventListener("input", () => {
      clearTimeout(this.timeout);
      this.timeout = window.setTimeout(() => this.search(), 250);
    });

    this.input.addEventListener("focus", () => {
      if (this.input.value.length >= 1) this.search();
    });

    document.addEventListener("click", (e) => {
      if (!this.input.closest(".exercise-picker")) this.results.hidden = true;
    });
  }

  setValue(name: string) {
    this.input.value = name;
    this.input.hidden = true;
    this.selected.hidden = false;
    this.selectedName.textContent = name;
    this.results.hidden = true;
  }

  reset() {
    this.input.value = "";
    this.input.hidden = false;
    this.input.focus();
    this.selected.hidden = true;
    this.results.hidden = true;
  }

  private async search() {
    const q = this.input.value.trim();
    if (q.length < 1) {
      this.results.hidden = true;
      return;
    }

    const { data } = await supabase
      .from("exercises")
      .select("id, name, default_rest_s")
      .ilike("name", `%${q}%`)
      .order("name")
      .limit(10);

    this.results.innerHTML = "";

    if (data && data.length > 0) {
      for (const ex of data) {
        const li = document.createElement("li");
        li.textContent = ex.name;
        li.addEventListener("click", () => this.select(ex));
        this.results.appendChild(li);
      }
    }

    const createLi = document.createElement("li");
    createLi.setAttribute("data-create", "");
    createLi.textContent = "➕ Créer \"" + q + "\"";
    createLi.addEventListener("click", () => this.create(q));
    this.results.appendChild(createLi);

    this.results.hidden = false;
  }

  private select(ex: Exercise) {
    this.setValue(ex.name);
    this.onSelect?.(ex);
  }

  private async create(name: string) {
    const { data } = await supabase
      .from("exercises")
      .insert({ name, default_rest_s: 90 })
      .select("id, name, default_rest_s")
      .single();

    if (data) {
      this.setValue(data.name);
      this.onSelect?.(data);
    }
  }
}
