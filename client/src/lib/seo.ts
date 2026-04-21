const DOMAIN = "https://worthlyai.app";

interface SeoOptions {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

export function applySeo({ title, description, canonical, noindex = false }: SeoOptions) {
  if (title) document.title = title;

  upsertMeta("description", description ?? "");
  upsertMeta("robots", noindex ? "noindex, nofollow" : "index, follow");

  // canonical
  let link = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = canonical ?? DOMAIN + window.location.pathname;

  // OG tags
  upsertOg("og:title", title ?? document.title);
  upsertOg("og:description", description ?? "");
  upsertOg("og:url", canonical ?? DOMAIN + window.location.pathname);
}

function upsertMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertOg(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}
