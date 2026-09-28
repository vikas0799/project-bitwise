import { Marked, Renderer, type Tokens } from 'marked';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import python from 'highlight.js/lib/languages/python';
import cpp from 'highlight.js/lib/languages/cpp';
import java from 'highlight.js/lib/languages/java';

import { diagramSizes } from '../data/diagramSizes';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('python', python);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('java', java);

// Languages tried when a code block has no language tag.
const AUTO_LANGUAGES = ['javascript', 'bash', 'json', 'xml', 'sql'];

const LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  bash: 'Terminal',
  json: 'JSON',
  xml: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
};

export interface Heading {
  id: string;
  text: string;
  depth: number;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const decodeEntities = (value: string) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const stripFrontmatter = (source: string) => source.replace(/^---\n[\s\S]*?\n---\n/, '');

// Renders trusted Markdown from src/content into HTML plus a list of headings for the table of contents.
export const renderMarkdown = (source: string): { html: string; headings: Heading[] } => {
  const headings: Heading[] = [];
  const seen = new Map<string, number>();
  const renderer = new Renderer();

  renderer.heading = function ({ tokens, depth }: Tokens.Heading) {
    const text = this.parser.parseInline(tokens);
    const base = slugify(text) || 'section';
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count ? `${base}-${count}` : base;
    if (depth === 2 || depth === 3) {
      headings.push({ id, text: decodeEntities(text.replace(/<[^>]+>/g, '')), depth });
    }
    return `<h${depth} id="${id}"><a class="heading-anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${text}</h${depth}>\n`;
  };

  renderer.code = function ({ text, lang }: Tokens.Code) {
    const requested = (lang || '').trim().toLowerCase();
    let language = requested === 'html' ? 'xml' : requested;
    let highlighted: string;

    if (language && language !== 'text' && hljs.getLanguage(language)) {
      highlighted = hljs.highlight(text, { language, ignoreIllegals: true }).value;
    } else if (!language) {
      const guess = hljs.highlightAuto(text, AUTO_LANGUAGES);
      if (guess.relevance >= 5 && guess.language) {
        highlighted = guess.value;
        language = guess.language;
      } else {
        highlighted = escapeHtml(text);
      }
    } else {
      highlighted = escapeHtml(text);
    }

    const canonical = hljs.getLanguage(language)?.name?.toLowerCase();
    const label = LABELS[language] || (canonical && LABELS[canonical]) || 'Code';
    return `<div class="code-block"><div class="code-bar"><span>${label}</span><button type="button" class="copy-btn" data-copy>Copy</button></div><pre><code class="hljs">${highlighted}</code></pre></div>\n`;
  };

  renderer.link = function ({ href, title, tokens }: Tokens.Link) {
    const text = this.parser.parseInline(tokens);
    const external = /^https?:\/\//.test(href);
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return external
      ? `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`
      : `<a href="${href}"${titleAttr} data-internal>${text}</a>`;
  };

  // Images become figures with a caption (the Markdown title), reserved space
  // for known diagrams and a link to the full-size file for zooming on phones.
  renderer.image = ({ href, title, text }: Tokens.Image) => {
    const size = diagramSizes[href];
    const dims = size ? ` width="${size[0]}" height="${size[1]}"` : '';
    const wide = size && size[0] > 600 ? ' class="wide"' : '';
    const caption = title ? `<figcaption>${escapeHtml(title)}</figcaption>` : '';
    return `<figure class="doc-figure"><a class="figure-link" href="${href}" target="_blank" rel="noopener noreferrer"><img src="${href}" alt="${escapeHtml(text)}"${dims}${wide} loading="lazy" decoding="async"></a>${caption}</figure>`;
  };

  // A paragraph holding only an image renders as the bare figure (a <figure> can't sit inside a <p>).
  renderer.paragraph = function ({ tokens }: Tokens.Paragraph) {
    const inner = this.parser.parseInline(tokens);
    return tokens.length === 1 && tokens[0].type === 'image' ? `${inner}\n` : `<p>${inner}</p>\n`;
  };

  const marked = new Marked({ renderer, gfm: true });
  const html = (marked.parse(stripFrontmatter(source)) as string)
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, '</table></div>');

  return { html, headings };
};
