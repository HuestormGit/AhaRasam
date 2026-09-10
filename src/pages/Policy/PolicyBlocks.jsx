import { Link } from "react-router-dom";

// A renderer for Strapi 5's Blocks format — the JSON tree the Rich Text (Blocks)
// editor produces. It walks that tree and returns React elements.
//
// There is no HTML anywhere in the pipeline and no dangerouslySetInnerHTML:
// what the CMS stores is structure, and structure is all that is read here.
// Node types this does not know about are dropped rather than guessed at, so a
// future editor feature degrades to missing text instead of broken markup.
//
// Deliberately hand-written rather than pulling in @strapi/blocks-react-renderer:
// this is the whole of it, and internal links have to become React Router links
// anyway, which is the one thing a stock renderer would not do.

// Anything the site itself serves. Rendered as a React Router link so a policy
// cross-reference navigates in-app instead of reloading the whole bundle.
const isInternal = (url) => url.startsWith("/");

// The only external schemes a link is allowed to carry. Everything else —
// javascript:, data:, vbscript: and any scheme invented later — falls through to
// plain text below, so a link pasted into the Admin can never become script.
const isSafeExternal = (url) => /^(?:https?:|mailto:|tel:)/i.test(url);

const Marked = ({ node }) => {
  let content = node.text;
  if (node.code) content = <code>{content}</code>;
  if (node.bold) content = <strong>{content}</strong>;
  if (node.italic) content = <em>{content}</em>;
  if (node.underline) content = <u>{content}</u>;
  if (node.strikethrough) content = <s>{content}</s>;
  return content;
};

const Inline = ({ node }) => {
  if (typeof node?.text === "string") return <Marked node={node} />;

  if (node?.type === "link") {
    const url = typeof node.url === "string" ? node.url : "";
    const label = <Children nodes={node.children} />;

    if (isInternal(url)) return <Link to={url}>{label}</Link>;

    if (isSafeExternal(url)) {
      // A new tab only for the web; mailto: and tel: hand off to the OS and a
      // target there just leaves an empty tab behind.
      const newTab = /^https?:/i.test(url);
      return (
        <a
          href={url}
          {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {label}
        </a>
      );
    }

    // Unsafe or unrecognised scheme: keep the words, drop the link.
    return label;
  }

  return null;
};

const Children = ({ nodes }) =>
  (Array.isArray(nodes) ? nodes : []).map((node, index) => (
    <Inline key={index} node={node} />
  ));

const ListItems = ({ nodes }) =>
  (Array.isArray(nodes) ? nodes : []).map((item, index) => (
    <li key={index}>
      {/* A nested list is a sibling of the item's text inside Blocks, so items
          are walked with Block rather than Children. */}
      <Children nodes={(item.children || []).filter((child) => child.type !== "list")} />
      {(item.children || [])
        .filter((child) => child.type === "list")
        .map((child, nested) => (
          <Block key={nested} node={child} />
        ))}
    </li>
  ));

const Block = ({ node }) => {
  switch (node?.type) {
    case "paragraph":
      return (
        <p>
          <Children nodes={node.children} />
        </p>
      );

    case "heading": {
      // Section headings on the page are h2 and the page title is the only h1,
      // so a heading inside body copy starts at h3 and never breaks the outline
      // however the editor levelled it in the Admin.
      const level = Math.min(Math.max(Number(node.level) || 1, 1) + 2, 6);
      const Tag = `h${level}`;
      return (
        <Tag>
          <Children nodes={node.children} />
        </Tag>
      );
    }

    case "list":
      return node.format === "ordered" ? (
        <ol>
          <ListItems nodes={node.children} />
        </ol>
      ) : (
        <ul>
          <ListItems nodes={node.children} />
        </ul>
      );

    case "quote":
      return (
        <blockquote>
          <Children nodes={node.children} />
        </blockquote>
      );

    case "code":
      return (
        <pre>
          <code>
            <Children nodes={node.children} />
          </code>
        </pre>
      );

    default:
      return null;
  }
};

const PolicyBlocks = ({ blocks }) =>
  (Array.isArray(blocks) ? blocks : []).map((node, index) => (
    <Block key={index} node={node} />
  ));

export default PolicyBlocks;
