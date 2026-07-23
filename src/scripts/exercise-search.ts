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
  private activeIndex = -1;
  onSelect?: (exercise: Exercise) => void;

  constructor(input: HTMLInputElement, results: HTMLElement, selected: HTMLElement) {
    this.input = input;
    this.results = results;
    this.selected = selected;
    this.selectedName = selected.querySelector("[data-exercise-name]")!;

    this.input.addEventListener("input", () => {
      clearTimeout(this.timeout);
      this.activeIndex = -1;
      this.timeout = window.setTimeout(() => this.search(), 250);
    });

    this.input.addEventListener("focus", () => {
      if (this.input.value.length >= 1) this.search();
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
  }

  reset() {
    this.input.value = "";
    this.input.hidden = false;
    this.input.focus();
    this.selected.hidden = true;
    this.results.hidden = true;
    this.input.setAttribute("aria-expanded", "false");
  }

  private async search() {
    const q = this.input.value.trim();
    if (q.length < 1) {
      this.results.hidden = true;
      this.input.setAttribute("aria-expanded", "false");
      return;
    }

    const { data } = await supabase
      .from("exercises")
      .select("id, name, default_rest_s")
      .ilike("name", `%${q}%`)
      .order("name")
      .limit(10);

    this.results.innerHTML = "";
    let optIndex = 0;

    if (data && data.length > 0) {
      for (const ex of data) {
        const li = document.createElement("li");
        li.id = `ex-opt-${ex.id}`;
        li.setAttribute("role", "option");
        li.textContent = ex.name;
        li.addEventListener("click", () => this.select(ex));
        this.results.appendChild(li);
        optIndex++;
      }
    }

    const createLi = document.createElement("li");
    createLi.id = "ex-opt-create";
    createLi.setAttribute("role", "option");
    createLi.setAttribute("data-create", "");
    createLi.textContent = `➕ Créer "${q}"`;
    createLi.addEventListener("click", () => this.create(q));
    this.results.appendChild(createLi);

    this.results.hidden = false;
    this.input.setAttribute("aria-expanded", "true");
    this.activeIndex = -1;
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
