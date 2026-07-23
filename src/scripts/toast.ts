type ToastType = "success" | "error" | "info";

let counter = 0;

export function showToast(message: string, type: ToastType = "info", duration = 4000) {
  const container = document.querySelector<HTMLElement>("[data-toast-container]");

  if (!container) {
    console.warn("Toast container not found");
    return;
  }

  const id = `toast-${++counter}`;
  const toast = document.createElement("div");
  toast.id = id;
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  toast.addEventListener("click", () => dismissToast(id));

  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("toast--visible"));

  const timeout = type === "error" ? Math.max(duration, 6000) : duration;
  setTimeout(() => dismissToast(id), timeout);
}

export function dismissToast(id: string) {
  const toast = document.getElementById(id);
  if (!toast) return;

  toast.classList.remove("toast--visible");
  toast.addEventListener("transitionend", () => toast.remove(), { once: true });
}
