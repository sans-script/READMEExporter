const README_SELECTOR = "#readme";

export function findReadme(): HTMLElement | null {
  const candidate = document.querySelector<HTMLElement>(README_SELECTOR);
  if (!candidate || !candidate.isConnected) return null;

  const renderedSelector = ".markdown-body, article, [data-testid='readme']";
  const hasRenderedContent =
    candidate.matches(renderedSelector) || candidate.querySelector(renderedSelector);

  return hasRenderedContent ? candidate : null;
}

export function getReadmeTitle(readme: HTMLElement): string {
  const heading = readme.querySelector<HTMLElement>(
    ".Box-header, [data-testid='readme-header'], h1",
  );
  const headingClone = heading?.cloneNode(true) as HTMLElement | undefined;
  headingClone?.querySelector("#readme-exporter-controls")?.remove();
  const headingText = headingClone?.innerText.trim();
  const repository = location.pathname.split("/").filter(Boolean).slice(0, 2).join("-");

  return sanitizeFilename(headingText || repository || "github-readme");
}

function sanitizeFilename(value: string): string {
  return value
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "github-readme";
}
