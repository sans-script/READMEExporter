const README_SELECTOR = "#readme";

export function findReadme(): HTMLElement | null {
  const candidate = document.querySelector<HTMLElement>(README_SELECTOR);
  if (candidate?.isConnected) {
    const renderedSelector = ".markdown-body, article, [data-testid='readme']";
    const hasRenderedContent =
      candidate.matches(renderedSelector) || candidate.querySelector(renderedSelector);
    if (hasRenderedContent) return candidate;
  }

  // Profile READMEs render inside .profile-readme; current repository pages
  // (and markdown file views) render a bare article.markdown-body with no #readme.
  return document.querySelector<HTMLElement>(".profile-readme article.markdown-body, article.markdown-body");
}

// "owner-repo-README" on repositories; the first heading elsewhere.
export function getReadmeTitle(readme: HTMLElement): string {
  const repository = location.pathname.split("/").filter(Boolean).slice(0, 2).join("-");
  if (repository.includes("-")) return sanitizeFilename(repository + "-README");

  const heading = readme.querySelector<HTMLElement>(".Box-header, [data-testid='readme-header'], h1");
  return sanitizeFilename(heading?.innerText.trim() || repository || "github-readme");
}

function sanitizeFilename(value: string): string {
  return value
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "github-readme";
}
