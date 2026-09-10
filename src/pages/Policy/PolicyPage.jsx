import { Link } from "react-router-dom";
import { usePolicy, useDocumentMeta } from "../../hooks/usePolicy";
import PolicyBlocks from "./PolicyBlocks";
import "./Policy.scss";

// The four legal pages, in the order the footer lists them. This is the routing
// side of the contract: Strapi constrains a policy page's `slug` to exactly
// these four values, so a client can retitle or rewrite a policy freely but
// cannot move it to an address the site does not serve.
//
// `label` is the short footer wording; `fallbackTitle` is only ever shown before
// the CMS answers, or when it cannot. Live titles come from Strapi.
export const POLICY_LINKS = [
  {
    slug: "shipping-policy",
    path: "/shipping-policy",
    label: "Shipping & Delivery",
    fallbackTitle: "Shipping & Delivery Policy",
  },
  {
    slug: "refund-policy",
    path: "/refund-policy",
    label: "Cancellation, Return & Refund",
    fallbackTitle: "Cancellation, Return & Refund Policy",
  },
  {
    slug: "privacy-policy",
    path: "/privacy-policy",
    label: "Privacy Policy",
    fallbackTitle: "Privacy Policy",
  },
  {
    slug: "terms-and-conditions",
    path: "/terms-and-conditions",
    label: "Terms & Conditions",
    fallbackTitle: "Terms & Conditions",
  },
];

// The app has no /contact route: "Contact" in the header scrolls to the contact
// section of the homepage, and this is how App.js routes that from elsewhere.
const CONTACT_PATH = "/?scroll=Contact";

// Matches the Account page's date handling: anything that is not a real date
// renders as nothing rather than as "Invalid Date".
const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

const PolicyMeta = ({ effectiveDate, lastReviewedDate, updatedAt }) => {
  const effective = formatDate(effectiveDate);
  // lastReviewedDate is the client's own statement about the policy; updatedAt is
  // the CMS's record of the last save. Prefer the deliberate one, fall back to
  // the factual one, so a legal page is never left undated.
  const updated = formatDate(lastReviewedDate) || formatDate(updatedAt);

  const parts = [
    effective && `Effective ${effective}`,
    updated && `Last updated ${updated}`,
  ].filter(Boolean);

  return parts.length ? <p className="policy-meta">{parts.join(" · ")}</p> : null;
};

const PolicyHelp = ({ slug }) => (
  <aside className="policy-help" aria-labelledby="policy-help-title">
    <h2 id="policy-help-title">Need help?</h2>
    <p>
      If anything here is unclear, or you have a question about an order,{" "}
      <Link to={CONTACT_PATH}>contact us</Link> and we will help.
    </p>
    <p className="policy-related-label">Other policies</p>
    <ul className="policy-related">
      {POLICY_LINKS.filter((policy) => policy.slug !== slug).map((policy) => (
        <li key={policy.slug}>
          <Link to={policy.path}>{policy.fallbackTitle}</Link>
        </li>
      ))}
    </ul>
  </aside>
);

const PolicyShell = ({ title, children }) => (
  <main className="policy-page">
    <div className="container">
      <article className="policy-article">
        {/* The only h1 on the page; the header carries none. */}
        <h1>{title}</h1>
        {children}
      </article>
    </div>
  </main>
);

/**
 * One legal page, rendered from Strapi.
 *
 * All four routes render this component with a different slug — the content,
 * the headings, the order of the sections and the SEO metadata all come from the
 * CMS, so changing a policy is an edit in Strapi Admin and not a deploy.
 */
const PolicyPage = ({ slug }) => {
  const { status, policy } = usePolicy(slug);
  const known = POLICY_LINKS.find((entry) => entry.slug === slug);
  const heading = policy?.title || known?.fallbackTitle || "Policy";

  useDocumentMeta(
    policy?.seoTitle || `${heading} | Aha Rasam`,
    policy?.seoDescription
  );

  if (status === "loading") {
    return (
      <PolicyShell title={heading}>
        <p className="policy-status" role="status">
          Loading…
        </p>
      </PolicyShell>
    );
  }

  // Never a blank page: an unpublished or missing policy still renders a heading,
  // an explanation and a way out.
  if (status !== "ready") {
    return (
      <PolicyShell title={heading}>
        <p className="policy-status" role="alert">
          {status === "missing"
            ? "This policy isn’t available right now. Please check back shortly, or get in touch and we will send it to you."
            : "We couldn’t load this page just now. Please refresh to try again, or get in touch if it keeps happening."}
        </p>
        <PolicyHelp slug={slug} />
      </PolicyShell>
    );
  }

  return (
    <PolicyShell title={heading}>
      {policy.intro && <p className="policy-intro">{policy.intro}</p>}
      <PolicyMeta
        effectiveDate={policy.effectiveDate}
        lastReviewedDate={policy.lastReviewedDate}
        updatedAt={policy.updatedAt}
      />

      <div className="policy-body">
        {policy.sections.map((section, index) => (
          <section className="policy-section" key={`${section.heading}-${index}`}>
            <h2>{section.heading}</h2>
            <PolicyBlocks blocks={section.body} />
          </section>
        ))}
      </div>

      <PolicyHelp slug={slug} />
    </PolicyShell>
  );
};

export default PolicyPage;
