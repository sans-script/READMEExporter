// Paper size in inches, as Page.printToPDF expects.
export type Paper = { width: number; height: number };

export type ExtensionMessage =
  | { type: "EXPORT_README_PDF" }
  | { type: "EXPORT_README_HTML" }
  | { type: "README_EXPORT_STATUS" }
  // PDF export runs in three steps so the page can be measured in print media:
  // begin (attach debugger, emulate print) → content fits layout → print → end.
  | { type: "PDF_BEGIN" }
  | { type: "PDF_PRINT"; paper: Paper; scale: number }
  | { type: "PDF_END" };

export type PdfResponse = { ok: true; data?: string } | { ok: false; error: string };
