import { findReadme, getReadmeTitle } from "./detector";
import { buildResume, getResumeTitle, isProfilePage, waitForImages } from "./resume";

let printing = false;

export async function exportReadme(): Promise<void> {
  if (printing) return;

  const profile = isProfilePage();
  const readme = profile ? null : findReadme();
  if (!profile && !readme) {
    window.alert("No rendered GitHub README was found on this page.");
    return;
  }

  printing = true;
  const previousTitle = document.title;
  const exportTitle = readme ? getReadmeTitle(readme) : getResumeTitle();

  if (profile) {
    const resume = buildResume();
    document.body.classList.add("readme-exporter-printing");
    await waitForImages(resume);
  }

  document.title = exportTitle;

  const restore = () => {
    document.title = previousTitle;
    document.body.classList.remove("readme-exporter-printing");
    document.getElementById("readme-exporter-resume")?.remove();
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
