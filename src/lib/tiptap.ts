// Converts plain markdown-ish text from Claude into TipTap ProseMirror JSON
// Matches the format already used in the hotslotz news table

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
        content: [{ type: 'text', text: line.replace('## ', '') }]
      })
      continue
    }

    // H3 heading
    if (line.startsWith('### ')) {
      content.push({
        type: 'heading',
        attrs: { level: 3, textAlign: 'left' },
        content: [{ type: 'text', text: line.replace('### ', '') }]
      })
      continue
    }

    // Bullet list items - collect consecutive ones
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: object[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            attrs: { textAlign: 'left' },
            content: [{ type: 'text', text: lines[i].replace(/^[-*] /, '') }]
          }]
        })
        i++
      }
      i-- // back up one since outer loop will increment
      content.push({ type: 'bulletList', content: items })
      continue
    }

    // Empty line - skip
    if (line.trim() === '') continue

    // Regular paragraph - handle **bold** inline
    const paraContent = parseInline(line)
    content.push({
      type: 'paragraph',
      attrs: { textAlign: 'left' },
      content: paraContent
    })
  }

  return { type: 'doc', content }
}

function parseInline(text: string): object[] {
  const nodes: object[] = []
  const boldRegex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match

  while ((match = boldRegex.exec(text)) !== null) {
    // Text before bold
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }
    // Bold text
    nodes.push({
      type: 'text',
      text: match[1],
      marks: [{ type: 'bold' }]
    })
    lastIndex = match.index + match[0].length
  }

  // Remaining text
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
