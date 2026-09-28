// Lazy loaders for Markdown content. Each file becomes its own small chunk,
// so a note or post is only downloaded when someone opens it.

const noteFiles = import.meta.glob('../content/notes/*.md', { query: '?raw', import: 'default' }) as Record<
  string,
  () => Promise<string>
>;

const blogFiles = import.meta.glob('../content/blog/*.md', { query: '?raw', import: 'default' }) as Record<
  string,
  () => Promise<string>
>;

export const loadNote = (slug: string) => noteFiles[`../content/notes/${slug}.md`]?.();

export const loadPost = (id: string) => blogFiles[`../content/blog/${id}.md`]?.();

export const hasPost = (id: string) => `../content/blog/${id}.md` in blogFiles;
