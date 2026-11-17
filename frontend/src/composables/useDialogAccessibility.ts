import { nextTick, onBeforeUnmount, watch, type Ref } from "vue";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function useDialogAccessibility(
  dialog: Ref<HTMLElement | null>,
  open: Readonly<Ref<boolean>>,
  onEscape?: () => void
) {
  let previousFocus: HTMLElement | null = null;
  let activeDialog: HTMLElement | null = null;

  function focusableElements(element: HTMLElement) {
    return Array.from(element.querySelectorAll<HTMLElement>(focusableSelector))
      .filter(item => !item.hasAttribute("hidden") && item.getAttribute("aria-hidden") !== "true");
  }

  function onKeydown(event: KeyboardEvent) {
    if (!activeDialog) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onEscape?.();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusableElements(activeDialog);
    if (!items.length) {
      event.preventDefault();
      activeDialog.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || !activeDialog.contains(document.activeElement))) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !activeDialog.contains(document.activeElement))) {
      event.preventDefault();
      first?.focus();
    }
  }

  function onFocusIn(event: FocusEvent) {
    if (!activeDialog || !(event.target instanceof Node) || activeDialog.contains(event.target)) return;
    const items = focusableElements(activeDialog);
    (items[0] ?? activeDialog).focus();
  }

  function activate() {
    activeDialog = dialog.value;
    if (!activeDialog) return;
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    activeDialog.addEventListener("keydown", onKeydown);
    document.addEventListener("focusin", onFocusIn);
    const initial = activeDialog.querySelector<HTMLElement>("[data-dialog-initial-focus]") ?? focusableElements(activeDialog)[0];
    (initial ?? activeDialog).focus();
  }

  function deactivate() {
    activeDialog?.removeEventListener("keydown", onKeydown);
    document.removeEventListener("focusin", onFocusIn);
    activeDialog = null;
    if (previousFocus?.isConnected) previousFocus.focus();
    previousFocus = null;
  }

  watch(open, async isOpen => {
    if (!isOpen) {
      deactivate();
      return;
    }
    await nextTick();
    activate();
  }, { flush: "post", immediate: true });

  onBeforeUnmount(deactivate);
}
