// Converts markdown from Claude into TipTap ProseMirror JSON
// Handles: ## headings, ### headings, **bold**, [link](url), bullet lists

export function textToTiptap(text: string): object {
  const lines = text.split('\n')
  const content: object[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // H2 heading
    if (line.startsWith('## ')) {
      content.push({
        type: 'heading',
        attrs: { level: 2, textAlign: 'left' },
        content: parseInline(line.replace('## ', ''))
      })
      continue
    }

    // H3 heading
    if (line.startsWith('### ')) {
      content.push({
        type: 'heading',
        attrs: { level: 3, textAlign: 'left' },
        content: parseInline(line.replace('### ', ''))
      })
      continue
    }

    // Bullet list items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: object[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            attrs: { textAlign: 'left' },
            content: parseInline(lines[i].replace(/^[-*] /, ''))
          }]
        })
        i++
      }
      i--
      content.push({ type: 'bulletList', content: items })
      continue
    }

    // Empty line - skip
    if (line.trim() === '') continue

    // Regular paragraph
    content.push({
      type: 'paragraph',
      attrs: { textAlign: 'left' },
      content: parseInline(line)
    })
  }

  return { type: 'doc', content }
}

// Parses inline markdown: **bold** and [link text](url)
function parseInline(text: string): object[] {
  const nodes: object[] = []
  // Combined regex: matches **bold** or [text](url)
  const inlineRegex = /\*\*(.*?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
  let lastIndex = 0
  let match

  while ((match = inlineRegex.exec(text)) !== null) {
    // Plain text before this match
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }

    if (match[1] !== undefined) {
      // **bold**
      nodes.push({
        type: 'text',
        text: match[1],
        marks: [{ type: 'bold' }]
      })
    } else if (match[2] !== undefined && match[3] !== undefined) {
      // [link text](url)
      nodes.push({
        type: 'text',
        text: match[2],
        marks: [{ type: 'link', attrs: { href: match[3], target: '_blank', rel: 'noopener noreferrer' } }]
      })
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining plain text
  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text }]
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
