import type { Paper } from "../shared/types";

// Builds a resume-style document from a GitHub profile page by cloning the
// rendered nodes (keeping GitHub's classes, icons and fonts) into a new skeleton.

export const RESUME_ID = "readme-exporter-resume";

// Page chrome that should never appear in the resume.
const STRIP_SELECTOR = [
  "#readme-exporter-controls",
  "button",
  "clipboard-copy",
  ".zeroclipboard-container",
  ".pinned-item-handle",
  "[itemprop='localTime']",
  "include-fragment",
].join(",");

// GitHub hides responsive duplicates with these; A4 print width falls in the
// "md" range, so they would hide content unpredictably.
const RESPONSIVE_CLASS = /^(d-none|d-(sm|md|lg|xl)-(none|block|flex)|hide-(sm|md|lg|xl))$/;

const SIDEBAR_SECTIONS = ["Achievements", "Highlights", "Organizations"];

export function isProfilePage(): boolean {
  return Boolean(document.querySelector(".js-profile-editable-area .vcard-details, .vcard-names"));
}

export function getResumeTitle(readmeOnly = false): string {
  // .vcard-username also holds pronouns ("login · he/him"); the URL has only the login.
  const login = location.pathname.split("/")[1] || "github";
  return login.replace(/[^a-z0-9._-]+/gi, "-") + (readmeOnly ? "-readme" : "-resume");
}

function clone<T extends Element>(selector: string, root: ParentNode = document): T | null {
  const element = root.querySelector<T>(selector);
  return element ? (element.cloneNode(true) as T) : null;
}

function section(...content: (Node | null)[]): HTMLElement | null {
  const nodes = content.filter((node): node is Node => node !== null);
  if (!nodes.length) return null;
  const wrapper = document.createElement("section");
  wrapper.className = "rx-section";
  wrapper.append(...nodes);
  return wrapper;
}

function buildHeader(): HTMLElement {
  const header = document.createElement("header");
  header.className = "rx-header";

  const avatar = clone<HTMLImageElement>("img.avatar-user");
  if (avatar) {
    avatar.className = "rx-avatar";
    avatar.removeAttribute("width");
    avatar.removeAttribute("height");
  }

  const identity = document.createElement("div");
  identity.className = "rx-identity";
  identity.append(
    ...[clone(".vcard-names"), clone(".user-profile-bio")].filter((node): node is Element => node !== null),
  );
  const followers = document.querySelector(".js-profile-editable-area a[href$='?tab=followers']")?.parentElement;
  if (followers) identity.append(followers.cloneNode(true));

  const contact = document.createElement("div");
  contact.className = "rx-contact";
  const details = clone(".js-profile-editable-area .vcard-details");
  if (details) contact.append(details);

  if (avatar) header.append(avatar);
  header.append(identity, contact);
  return header;
}

function buildPinned(): HTMLElement | null {
  const items = Array.from(document.querySelectorAll(".js-pinned-items-reorder-container .pinned-item-list-item"));
  if (!items.length) return null;
  const grid = document.createElement("div");
  grid.className = "rx-pinned";
  for (const item of items) grid.append(item.cloneNode(true));
  return section(grid);
}

function buildSidebarExtras(): HTMLElement | null {
  const seen = new Set<string>();
  const row = document.createElement("div");
  row.className = "rx-extras";

  for (const heading of Array.from(document.querySelectorAll<HTMLElement>(".Layout-sidebar h2"))) {
    const name = heading.textContent?.trim() ?? "";
    if (!SIDEBAR_SECTIONS.includes(name) || seen.has(name)) continue;
    seen.add(name);
    const block = heading.parentElement?.cloneNode(true) as HTMLElement | undefined;
    if (block) {
      block.className = "rx-extra";
      row.append(block);
    }
  }

  return row.childElementCount ? section(row) : null;
}

// readmeOnly keeps just the bordered README box, spanning the full sheet.
export function buildResume(readmeOnly = false): HTMLElement {
  document.getElementById(RESUME_ID)?.remove();

  const resume = document.createElement("div");
  resume.id = RESUME_ID;
  if (readmeOnly) resume.classList.add("rx-readme-only");

  // Visitors see .profile-readme; the profile owner gets a different wrapper.
  const readme = clone(".profile-readme article.markdown-body, #user-profile-frame article.markdown-body");
  let readmeBox: HTMLElement | null = null;
  if (readme) {
    readmeBox = document.createElement("div");
    readmeBox.className = "rx-readme-box";
    readmeBox.append(readme);
  }
  // README in the main column; projects and badges in a side column that
  // wraps below the README when the page is narrow.
  const main = document.createElement("div");
  main.className = "rx-main";
  const side = document.createElement("div");
  side.className = "rx-side";
  const body = document.createElement("div");
  body.className = "rx-body";
  if (readmeBox) main.append(readmeBox);
  if (!readmeOnly) {
    const pinned = buildPinned();
    const extras = buildSidebarExtras();
    if (pinned) side.append(pinned);
    if (extras) side.append(extras);
  }
  body.append(...[main, side].filter((column) => column.childElementCount));
  if (!readmeOnly) resume.append(buildHeader());
  resume.append(body);

  return finalize(resume);
}

// Strips page chrome, un-hides responsive duplicates and mounts the document.
function finalize(resume: HTMLElement): HTMLElement {
  resume.querySelectorAll(STRIP_SELECTOR).forEach((element) => element.remove());
  for (const element of [resume, ...Array.from(resume.querySelectorAll("*"))]) {
    for (const name of Array.from(element.classList)) {
      if (RESPONSIVE_CLASS.test(name)) element.classList.remove(name);
    }
    if (element instanceof HTMLImageElement) element.loading = "eager";
  }
  document.body.append(resume);
  return resume;
}

// Repository README: the rendered markdown in a bordered box, printed across
// as many pages as it needs (a long README squeezed onto one page is unreadable).
export function buildRepoReadme(source: HTMLElement): HTMLElement {
  document.getElementById(RESUME_ID)?.remove();

  const resume = document.createElement("div");
  resume.id = RESUME_ID;
  resume.classList.add("rx-readme-only", "rx-paged");
  const markdown = source.querySelector(".markdown-body") ?? source;
  const readmeBox = document.createElement("div");
  readmeBox.className = "rx-readme-box";
  const article = markdown.cloneNode(true) as HTMLElement;
  article.removeAttribute("id"); // print.css targets #readme
  readmeBox.append(article);
  resume.append(readmeBox);
  return finalize(resume);
}

const A4: Paper = { width: 8.27, height: 11.69 };
const LETTER: Paper = { width: 8.5, height: 11 };

// ponytail: paper follows the browser locale (Letter for US/Canada); add a
// setting if someone needs the other size.
export function defaultPaper(): Paper {
  return /^en-(US|CA)$/i.test(navigator.language) ? LETTER : A4;
}

// Widens the layout until its aspect ratio matches the paper (content reflows
// into the side column and gets shorter) and returns the print scale that
// makes the whole resume fill exactly one page.
export function fitToPage(resume: HTMLElement, paper: Paper): number {
  const pageWidth = paper.width * 96;
  const pageHeight = paper.height * 96 - 2; // keep clear of rounding into a 2nd page
  const maxWidth = pageWidth * 2.5;

  // Measure the rendered box: content with a min-content width can make the
  // resume wider than the width we ask for.
  const tooTall = () => resume.offsetHeight * (pageWidth / resume.offsetWidth) > pageHeight;
  let width = pageWidth;
  resume.style.width = width + "px";
  while (tooTall() && width < maxWidth) {
    width += 20;
    resume.style.width = width + "px";
  }
  // ponytail: if even maxWidth is too tall, shrink further and leave side margins.
  return Math.min(pageWidth / resume.offsetWidth, pageHeight / resume.offsetHeight);
}

// Layout width for paged READMEs: close to GitHub's README column, so text
// prints at roughly 75% of on-screen size.
const PAGED_WIDTH = 1000;
export const PAGED_MARGIN_IN = 0.4;

// Scale for a multi-page document: the layout keeps a fixed width and is
// scaled to the paper's printable width; height flows onto further pages.
export function fitToWidth(resume: HTMLElement, paper: Paper): number {
  resume.style.width = PAGED_WIDTH + "px";
  return ((paper.width - 2 * PAGED_MARGIN_IN) * 96) / resume.offsetWidth;
}

export function waitForImages(root: HTMLElement, timeoutMs = 4000): Promise<void> {
  const pending = Array.from(root.querySelectorAll("img"))
    .filter((image) => !image.complete)
    .map((image) => new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    }));
  return Promise.race([
    Promise.all(pending).then(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
}
