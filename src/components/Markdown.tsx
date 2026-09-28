import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import 'highlight.js/styles/github-dark.css';

// Shows HTML produced by renderMarkdown(): handles copy buttons and keeps
// internal links inside the single-page app.
const Markdown = ({ html }: { html: string }) => {
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    const copyButton = target.closest<HTMLButtonElement>('[data-copy]');
    if (copyButton) {
      const code = copyButton.closest('.code-block')?.querySelector('code');
      if (code) {
        navigator.clipboard?.writeText(code.textContent ?? '').then(
          () => {
            copyButton.textContent = 'Copied';
            setTimeout(() => (copyButton.textContent = 'Copy'), 1500);
          },
          () => {
            copyButton.textContent = 'Press Ctrl+C';
          }
        );
      }
      return;
    }

    const link = target.closest<HTMLAnchorElement>('a[data-internal]');
    if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      const href = link.getAttribute('href') ?? '';
      if (href.startsWith('/')) {
        event.preventDefault();
        navigate(href);
      }
    }
  };

  return <div className="doc" onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default Markdown;
