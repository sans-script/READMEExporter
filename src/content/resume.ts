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

export function getResumeTitle(): string {
  // .vcard-username also holds pronouns ("login · he/him"); the URL has only the login.
  const login = location.pathname.split("/")[1] || "github";
  return login.replace(/[^a-z0-9._-]+/gi, "-") + "-resume";
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

export function buildResume(): HTMLElement {
  document.getElementById(RESUME_ID)?.remove();

  const resume = document.createElement("div");
  resume.id = RESUME_ID;

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
  const pinned = buildPinned();
  const extras = buildSidebarExtras();
  if (readmeBox) main.append(readmeBox);
  if (pinned) side.append(pinned);
  if (extras) side.append(extras);
  body.append(...[main, side].filter((column) => column.childElementCount));
  resume.append(buildHeader(), body);

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

// A4 at 96dpi. Printers like "Microsoft Print to PDF" ignore custom @page
// sizes, so instead of growing the page we shrink the resume to fit A4.
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1110; // a little under 1123 to absorb printer rounding
const MAX_WIDTH = PAGE_WIDTH * 2.5;

// Widens the layout until its aspect ratio fits A4 (content reflows into
// more columns and gets shorter), then zooms it down to the page width.
// Returns a cleanup that restores the page.
export function fitToSinglePage(resume: HTMLElement): () => void {
  let width = PAGE_WIDTH;
  resume.style.width = width + "px";
  while (resume.offsetHeight * (PAGE_WIDTH / width) > PAGE_HEIGHT && width < MAX_WIDTH) {
    width += 40;
    resume.style.width = width + "px";
  }
  // ponytail: if even MAX_WIDTH is too tall, shrink further and leave side margins.
  const zoom = Math.min(PAGE_WIDTH / width, PAGE_HEIGHT / resume.offsetHeight);

  const style = document.createElement("style");
  style.textContent = "@page { size: A4; margin: 0; } " +
    "@media print { #" + RESUME_ID + " { zoom: " + zoom.toFixed(4) + "; } }";
  document.head.append(style);
  return () => style.remove();
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
