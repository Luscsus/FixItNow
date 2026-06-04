import { useEffect } from "react";

interface SEOOptions {
  title?: string;
  description?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogUrl?: string;
  canonical?: string;
}

const SITE_NAME = "FixItNow";
const DEFAULT_TITLE = `${SITE_NAME} — Report it. Track it. Fixed.`;
const DEFAULT_DESC =
  "FixItNow connects you with trusted local service providers. Report issues, track progress, and get things fixed — fast.";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function removeLink(rel: string) {
  document.querySelector(`link[rel="${rel}"]`)?.remove();
}

export function useSEO({
  title,
  description,
  robots,
  ogTitle,
  ogDescription,
  ogType = "website",
  ogUrl,
  canonical,
}: SEOOptions = {}) {
  useEffect(() => {
    const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const pageDesc = description ?? DEFAULT_DESC;
    const pageUrl = ogUrl ?? window.location.href;

    document.title = pageTitle;

    setMeta("description", pageDesc);
    setMeta("robots", robots ?? "index, follow");

    setMeta("og:type", ogType, "property");
    setMeta("og:site_name", SITE_NAME, "property");
    setMeta("og:title", ogTitle ?? pageTitle, "property");
    setMeta("og:description", ogDescription ?? pageDesc, "property");
    setMeta("og:url", pageUrl, "property");

    setMeta("twitter:title", ogTitle ?? pageTitle);
    setMeta("twitter:description", ogDescription ?? pageDesc);

    if (canonical) {
      setLink("canonical", canonical);
    } else {
      removeLink("canonical");
    }

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, robots, ogTitle, ogDescription, ogType, ogUrl, canonical]);
}
