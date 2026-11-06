import { findReadme, getReadmeTitle } from "./detector";
import {
  buildRepoReadme,
  buildResume,
  defaultPaper,
  fitToPage,
  fitToWidth,
  getResumeTitle,
  isProfilePage,
  PAGED_MARGIN_IN,
  waitForImages,
} from "./resume";
import type { ExtensionMessage, Paper, PdfResponse } from "../shared/types";

let printing = false;

function downloadPdf(base64: string, filename: string): void {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// The background worker renders the tab with DevTools Page.printToPDF.
async function pdfStep(message: ExtensionMessage): Promise<string | undefined> {
  const response = (await chrome.runtime.sendMessage(message)) as PdfResponse;
  if (!response.ok) throw new Error(response.error);
  return response.data;
}

type PdfJob = {
  build: () => HTMLElement;
  // Returns the print scale; called while print media is emulated.
  fit: (doc: HTMLElement, paper: Paper) => number;
  marginIn: number;
  filename: string;
};

async function exportPdf(job: PdfJob): Promise<void> {
  if (printing) return;
  printing = true;

  const doc = job.build();
  document.body.classList.add("readme-exporter-printing");
  // Chrome lays out at the CSS @page size, so it must match the paper exactly.
  const paper = defaultPaper();
  const pageStyle = document.createElement("style");
  // Chrome leaves @page margins unpainted; give them the page's own background
  // so a dark theme has no visible frame around the content.
  const background = getComputedStyle(doc).backgroundColor;
  pageStyle.textContent = "@page { size: " + paper.width + "in " + paper.height + "in !important; margin: " +
    job.marginIn + "in !important; background: " + background + " !important; }";
  document.head.append(pageStyle);
  try {
    await waitForImages(doc);
    await pdfStep({ type: "PDF_BEGIN" });
    const scale = job.fit(doc, paper);
    const data = await pdfStep({ type: "PDF_PRINT", paper, scale });
    if (!data) throw new Error("The PDF renderer returned no data.");
    downloadPdf(data, job.filename + ".pdf");
  } catch (error) {
    window.alert("PDF export failed: " + (error instanceof Error ? error.message : String(error)));
  } finally {
    await pdfStep({ type: "PDF_END" }).catch(() => undefined);
    pageStyle.remove();
    document.body.classList.remove("readme-exporter-printing");
    doc.remove();
    printing = false;
  }
}

// Profile: the resume (or just the profile README) on exactly one page.
export function exportProfilePdf(readmeOnly = false): Promise<void> {
  return exportPdf({
    build: () => buildResume(readmeOnly),
    fit: fitToPage,
    marginIn: 0,
    filename: getResumeTitle(readmeOnly),
  });
}

// Profile → resume; repository → its README across as many pages as needed.
export async function exportReadme(): Promise<void> {
  if (isProfilePage()) return exportProfilePdf();

  const readme = findReadme();
  if (!readme) {
    window.alert("No rendered GitHub README was found on this page.");
    return;
  }
  return exportPdf({
    build: () => buildRepoReadme(readme),
    fit: fitToWidth,
    marginIn: PAGED_MARGIN_IN,
    filename: getReadmeTitle(readme),
  });
}
