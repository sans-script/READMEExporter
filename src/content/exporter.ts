import { findReadme, getReadmeTitle } from "./detector";

let printing = false;

export function exportReadme(): void {
  if (printing) return;

  const readme = findReadme();
  if (!readme) {
    window.alert("No rendered GitHub README was found on this page.");
    return;
  }

  printing = true;
  const previousTitle = document.title;
  const exportTitle = getReadmeTitle(readme);

  document.title = exportTitle;

  const restore = () => {
    document.title = previousTitle;
    printing = false;
    window.removeEventListener("afterprint", restore);
  };

  window.addEventListener("afterprint", restore, { once: true });

  // Let the browser finish applying the print stylesheet before opening
  // the native print dialog.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => window.print());
  });

  // Some browser/platform combinations do not reliably dispatch afterprint
  // when the print dialog is cancelled. The next visibility transition is
  // a secondary restoration path.
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible" && printing) {
      restore();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
}
