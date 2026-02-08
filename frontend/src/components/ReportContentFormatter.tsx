import { ReactNode } from "react";

/**
 * Parse inline **bold** segments and return React nodes.
 */
function parseInlineBold(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const boldRe = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = boldRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{text.slice(lastIndex, match.index)}</span>
      );
    }
    parts.push(
      <strong key={key++} className="font-semibold text-aurora-text0">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }
  return parts.length > 0 ? parts : [text];
}

/**
 * Renders report text with markdown-ish formatting:
 * - **Title** or **1. Section:** -> headings (first = H2, rest = H3)
 * - **inline bold** within paragraphs
 * - Blank lines -> paragraph spacing
 */
export function ReportContentFormatter({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let key = 0;
  let isFirstHeading = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={key++} className="h-4" aria-hidden />);
      continue;
    }

    // Line entirely **something** or **something:** -> heading
    const headingMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (headingMatch) {
      const content = headingMatch[1];
      if (isFirstHeading) {
        elements.push(
          <h2
            key={key++}
            className="mb-6 text-lg font-semibold text-aurora-text0"
          >
            {content}
          </h2>
        );
        isFirstHeading = false;
      } else {
        elements.push(
          <h3
            key={key++}
            className="mt-8 mb-2 text-base font-semibold text-aurora-text0 first:mt-0"
          >
            {content}
          </h3>
        );
      }
      continue;
    }

    // Paragraph with optional inline bold
    elements.push(
      <p
        key={key++}
        className="text-[15px] leading-[1.7] text-aurora-text1 [&+p]:mt-3"
      >
        {parseInlineBold(trimmed)}
      </p>
    );
  }

  return <div className="report-content">{elements}</div>;
}
