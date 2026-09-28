const TOPICS = [
  'C++',
  'Java',
  'Python',
  'JavaScript',
  'React',
  'Node.js',
  'Express',
  'MongoDB',
  'SQL',
  'Git & GitHub',
  'Linux',
  'Data Structures',
  'Algorithms',
  'DBMS',
  'Operating Systems',
  'Computer Networks',
  'REST APIs',
  'Tailwind CSS',
];

// Endless, slowly scrolling strip of topics. Pauses on hover.
const TechMarquee = () => (
  <section aria-label="Topics you will learn" className="border-y border-slate-200/70 bg-white/70 py-7 backdrop-blur">
    <p className="mb-5 px-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
      Languages, tools and CS fundamentals you'll work with
    </p>
    <div className="group relative overflow-clip-safe mask-fade-x">
      <ul className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {[...TOPICS, ...TOPICS].map((topic, index) => (
          <li
            key={`${topic}-${index}`}
            aria-hidden={index >= TOPICS.length}
            className="mr-3 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {topic}
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default TechMarquee;
