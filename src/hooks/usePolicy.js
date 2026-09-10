import { useEffect, useState } from "react";
import { apiClient } from "../utils/Api";

// GET /api/policies/:slug on Strapi. Public and anonymous: policy text is meant
// to be readable without an account, so this goes through apiClient with no
// Authorization header — not customerRequest, and certainly not a browser-held
// CMS token.
const policyUrl = (slug) => `/api/policies/${encodeURIComponent(slug)}`;

// The backend answers 404 both for a slug that does not exist and for a policy
// the client has unpublished. The page treats them the same way, because for a
// visitor they are the same thing: there is nothing at this address right now.
const statusFor = (error) => (error.response?.status === 404 ? "missing" : "error");

/**
 * Loads one policy page from the CMS.
 *
 * Returns { status, policy } where status is one of loading | ready | missing |
 * error. A response that arrives but is not shaped like a policy counts as an
 * error rather than as content — half a legal page is worse than a clear
 * failure message.
 */
export const usePolicy = (slug) => {
  const [state, setState] = useState({ status: "loading", policy: null });

  useEffect(() => {
    let active = true;
    setState({ status: "loading", policy: null });

    apiClient
      .get(policyUrl(slug))
      .then(({ data }) => {
        if (!active) return;
        const policy = data?.data;

        if (!policy || typeof policy.title !== "string") {
          return setState({ status: "error", policy: null });
        }

        setState({
          status: "ready",
          policy: {
            ...policy,
            // Every list the page maps over is normalised here, so the renderer
            // below never has to defend against a malformed CMS payload.
            sections: Array.isArray(policy.sections) ? policy.sections : [],
          },
        });
      })
      .catch((error) => active && setState({ status: statusFor(error), policy: null }));

    return () => {
      active = false;
    };
  }, [slug]);

  return state;
};

/**
 * Sets the document title and meta description for as long as a page is mounted,
 * then restores what was there before.
 *
 * The app renders one HTML document (public/index.html) for every route, so this
 * is the whole SEO surface a route has. Deliberately not a library: two DOM
 * writes and an undo do not need one.
 */
export const useDocumentMeta = (title, description) => {
  useEffect(() => {
    if (!title) return undefined;

    const previousTitle = document.title;
    const tag = document.querySelector('meta[name="description"]');
    const previousDescription = tag?.getAttribute("content");

    document.title = title;
    if (tag && description) tag.setAttribute("content", description);

    return () => {
      document.title = previousTitle;
      if (tag && previousDescription != null) tag.setAttribute("content", previousDescription);
    };
  }, [title, description]);
};
