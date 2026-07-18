import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Chat bubbles are dense, so headings stay small and spacing tight — Atlas's
// markdown should read like a chat reply, not a document.
const components: Components = {
  p: ({ children }) => <p className="not-first:mt-2">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="not-first:mt-2 list-disc space-y-1 pl-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="not-first:mt-2 list-decimal space-y-1 pl-4">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-0.5 marker:text-muted-foreground">{children}</li>,
  h1: ({ children }) => (
    <h3 className="not-first:mt-3 mb-1 text-row-title font-semibold">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="not-first:mt-3 mb-1 text-row-title font-semibold">{children}</h3>
  ),
  h3: ({ children }) => (
    <h3 className="not-first:mt-3 mb-1 text-row-title font-semibold">{children}</h3>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium underline">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-foreground/10 px-1 py-0.5 text-[13px] tabular-nums">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="not-first:mt-2 overflow-x-auto rounded-md bg-foreground/10 p-2.5 text-[13px]">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="not-first:mt-2 border-l-2 pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-2.5 border-border" />,
  table: ({ children }) => (
    <div className="not-first:mt-2 overflow-x-auto">
      <table className="w-full border-collapse text-meta tabular-nums">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b px-2 py-1 text-left font-medium">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-border/50 px-2 py-1">{children}</td>,
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}
