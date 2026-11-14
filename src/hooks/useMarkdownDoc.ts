import { useEffect, useMemo, useState } from 'react';
import { renderMarkdown } from '../lib/markdown';

type Loader = (key: string) => Promise<string> | undefined;

// Downloads a Markdown file with `load` and renders it. `failed` turns true when
// there is no file for `key` or it could not be downloaded.
export const useMarkdownDoc = (key: string | undefined, load: Loader) => {
  const [source, setSource] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSource(null);
    setFailed(false);
    if (!key) return;
    const loader = load(key);
    if (!loader) {
      setFailed(true);
      return;
    }
    let active = true;
    loader.then(
      (text) => active && setSource(text),
      () => active && setFailed(true)
    );
    return () => {
      active = false;
    };
  }, [key, load]);

  const rendered = useMemo(() => (source ? renderMarkdown(source) : null), [source]);
  return { rendered, failed };
};
