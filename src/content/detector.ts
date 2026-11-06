const README_SELECTOR = "#readme";

export function findReadme(): HTMLElement | null {
  const candidate = document.querySelector<HTMLElement>(README_SELECTOR);
  if (candidate?.isConnected) {
    const renderedSelector = ".markdown-body, article, [data-testid='readme']";
    const hasRenderedContent =
      candidate.matches(renderedSelector) || candidate.querySelector(renderedSelector);
    if (hasRenderedContent) return candidate;
  }

  // GitHub profile READMEs use a different DOM structure from repository READMEs.
  // The profile page renders the README as an article inside .profile-readme.
  return document.querySelector<HTMLElement>(".profile-readme article.markdown-body");
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
