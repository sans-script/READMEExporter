export type ExtensionMessage =
  | { type: "EXPORT_README_PDF" }
  | { type: "EXPORT_README_HTML" }
  | { type: "README_EXPORT_STATUS" };
