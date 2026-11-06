// Paper size in inches, as Page.printToPDF expects.
export type Paper = { width: number; height: number };

export type ExtensionMessage =
  | { type: "EXPORT_README_PDF" }
  | { type: "EXPORT_README_HTML" }
  | { type: "README_EXPORT_STATUS" }
  | { type: "PRINT_TAB_TO_PDF"; paper: Paper };

export type PrintToPdfResponse = { data: string } | { error: string };
