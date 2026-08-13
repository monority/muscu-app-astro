interface Window {
  showToast: (message: string, variant?: string) => void;
  Alpine: any;
}

interface AlpineMagicThis {
  $el: HTMLElement;
  $root: HTMLElement;
  $refs: Record<string, HTMLElement | undefined>;
  $nextTick: (callback: () => void) => void;
}
