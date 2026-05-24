import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeUrl(url = '') {
  const value = String(url).trim();
  if (/^(https?:|data:image\/)/i.test(value)) return value;
  if (value.startsWith('/')) return value;
  return '';
}

function renderMath(tex, displayMode) {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
    });
  } catch {
    return displayMode
      ? `<pre class="tm-math-err">${escapeHtml(tex)}</pre>`
      : `<code>${escapeHtml(tex)}</code>`;
  }
}

export function markdownMathToHtml(markdown = '') {
  const mathParts = [];
  const images = [];
  const stashMath = (latex, displayMode) => {
    const id = mathParts.length;
    mathParts.push({ latex, displayMode });
    return `@@MATH_${id}@@`;
  };
  const stashImage = (alt, url) => {
    const id = images.length;
    images.push({ alt, url });
    return `@@IMAGE_${id}@@`;
  };

  let work = String(markdown)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => stashImage(alt, url))
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => stashMath(tex.trim(), true))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => stashMath(tex.trim(), true))
    .replace(/\$(?!\s)([^\n$]+?)(?<!\s)\$(?!\d)/g, (_, tex) => stashMath(tex, false))
    .replace(/\\\(([^\n]+?)\\\)/g, (_, tex) => stashMath(tex, false));

  let html = escapeHtml(work)
    .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?]|$)/g, '$1<em>$2</em>');

  html = html.replace(/(?:^|\n)((?:- .+\n?)+)/g, (_, list) => {
    const items = list.trim().split('\n').map((line) => `<li>${line.replace(/^- /, '')}</li>`).join('');
    return `\n<ul>${items}</ul>`;
  });

  html = html.replace(/(?:^|\n)((?:\d+\.\s.+\n?)+)/g, (_, list) => {
    const items = list.trim().split('\n').map((line) => `<li>${line.replace(/^\d+\.\s/, '')}</li>`).join('');
    return `\n<ol>${items}</ol>`;
  });

  html = html.split(/\n{2,}/).map((part) => {
    if (/^\s*<(h\d|ul|ol|table|pre|img|div)/.test(part)) return part;
    return `<p>${part.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  html = html.replace(/@@MATH_(\d+)@@/g, (_, n) => {
    const item = mathParts[Number(n)];
    if (!item) return '';
    const rendered = renderMath(item.latex, item.displayMode);
    return item.displayMode ? `<div class="tm-math-block">${rendered}</div>` : rendered;
  });

  html = html.replace(/@@IMAGE_(\d+)@@/g, (_, n) => {
    const item = images[Number(n)];
    if (!item) return '';
    const src = safeUrl(item.url);
    if (!src) return '';
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(item.alt)}" class="tm-md-img" loading="lazy" />`;
  });

  return html;
}

export default function MarkdownMath({ children, className = '' }) {
  const html = React.useMemo(() => markdownMathToHtml(children || ''), [children]);
  return (
    <div
      className={`markdown-math ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
