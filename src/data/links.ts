// Useful external links, grouped by what students use them for.
// Checked on 2026-09-28.

export interface UsefulLink {
  name: string;
  url: string;
  description: string;
}

export interface LinkGroup {
  id: string;
  title: string;
  links: UsefulLink[];
}

export const linkGroups: LinkGroup[] = [
  {
    id: 'dsa',
    title: 'DSA and coding practice',
    links: [
      { name: 'LeetCode', url: 'https://leetcode.com/', description: 'The standard platform for interview problems.' },
      { name: "Striver's A2Z DSA Sheet", url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/', description: 'A step-by-step DSA sheet from takeUforward.' },
      { name: 'NeetCode Roadmap', url: 'https://neetcode.io/roadmap', description: 'Patterns-based problem roadmap with video solutions.' },
      { name: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/', description: 'Articles and practice problems for every CS topic.' },
      { name: 'InterviewBit', url: 'https://www.interviewbit.com/', description: 'Structured interview preparation tracks.' },
      { name: 'Codeforces', url: 'https://codeforces.com/', description: 'Competitive programming contests every week.' },
      { name: 'CodeChef', url: 'https://www.codechef.com/', description: 'Contests and practice, popular in India.' },
      { name: 'AtCoder', url: 'https://atcoder.jp/', description: 'Well-designed contests, great for beginners.' },
    ],
  },
  {
    id: 'web',
    title: 'Web development',
    links: [
      { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/', description: 'The reference for HTML, CSS and JavaScript.' },
      { name: 'javascript.info', url: 'https://javascript.info/', description: 'A modern, in-depth JavaScript tutorial.' },
      { name: 'React docs', url: 'https://react.dev/learn', description: 'Official React tutorial and reference.' },
      { name: 'Node.js Learn', url: 'https://nodejs.org/en/learn', description: 'Official Node.js guides.' },
      { name: 'Express', url: 'https://expressjs.com/', description: 'Express.js documentation and guides.' },
      { name: 'MongoDB University', url: 'https://learn.mongodb.com/', description: 'Free official MongoDB courses.' },
      { name: '100xDevs Projects', url: 'https://projects.100xdevs.com/', description: 'Project-based web development tracks.' },
      { name: 'The Odin Project', url: 'https://www.theodinproject.com/', description: 'A free full-stack curriculum.' },
      { name: 'freeCodeCamp', url: 'https://www.freecodecamp.org/', description: 'Free courses and certifications.' },
      { name: 'roadmap.sh', url: 'https://roadmap.sh/', description: 'Visual roadmaps for every developer role.' },
    ],
  },
  {
    id: 'cs',
    title: 'CS fundamentals and system design',
    links: [
      { name: 'CS50x', url: 'https://cs50.harvard.edu/x/', description: "Harvard's free introduction to computer science." },
      { name: 'OSTEP (free OS book)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', description: 'Operating Systems: Three Easy Pieces.' },
      { name: 'SQLBolt', url: 'https://sqlbolt.com/', description: 'Interactive SQL lessons.' },
      { name: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', description: 'The most popular open system design guide.' },
      { name: 'ByteByteGo', url: 'https://bytebytego.com/', description: 'Visual explanations of system design concepts.' },
      { name: 'Gate Smashers (YouTube)', url: 'https://www.youtube.com/@GateSmashers', description: 'OS, DBMS and CN explained in Hindi.' },
      { name: 'Neso Academy (YouTube)', url: 'https://www.youtube.com/@nesoacademy', description: 'Detailed CS fundamentals lectures.' },
      { name: 'Tech Interview Handbook', url: 'https://www.techinterviewhandbook.org/', description: 'Free guide to coding interviews and resumes.' },
    ],
  },
  {
    id: 'ai',
    title: 'AI and machine learning',
    links: [
      { name: 'Hugging Face Learn', url: 'https://huggingface.co/learn', description: 'Free courses on LLMs, agents and more.' },
      { name: 'DeepLearning.AI short courses', url: 'https://www.deeplearning.ai/short-courses/', description: 'Short, practical GenAI courses.' },
      { name: 'Anthropic courses', url: 'https://github.com/anthropics/courses', description: 'Prompting and tool-use courses from Anthropic.' },
      { name: 'Claude docs', url: 'https://docs.claude.com/', description: 'Guides for building with Claude models.' },
      { name: 'OpenAI Cookbook', url: 'https://cookbook.openai.com/', description: 'Examples and guides for building with LLMs.' },
      { name: 'Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html', description: "Andrej Karpathy's course, from scratch to GPT." },
      { name: 'fast.ai', url: 'https://course.fast.ai/', description: 'Practical deep learning for coders.' },
      { name: 'Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', description: "Google's free ML fundamentals course." },
      { name: 'Kaggle Learn', url: 'https://www.kaggle.com/learn', description: 'Short hands-on data science lessons.' },
    ],
  },
  {
    id: 'hackathons',
    title: 'Hackathons and contests',
    links: [
      { name: 'Devpost', url: 'https://devpost.com/hackathons', description: 'Online and in-person hackathons worldwide.' },
      { name: 'Major League Hacking', url: 'https://mlh.io/', description: 'Student hackathon league and events.' },
      { name: 'Devfolio', url: 'https://devfolio.co/hackathons', description: "India's hackathon platform." },
      { name: 'Unstop hackathons', url: 'https://unstop.com/hackathons', description: 'College and company hackathons in India.' },
      { name: 'HackerEarth challenges', url: 'https://www.hackerearth.com/challenges/', description: 'Hiring challenges and hackathons.' },
      { name: 'Kaggle competitions', url: 'https://www.kaggle.com/competitions', description: 'Data science and ML competitions.' },
    ],
  },
  {
    id: 'jobs',
    title: 'Jobs and internships',
    links: [
      { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/', description: 'The largest job board; set alerts for fresher roles.' },
      { name: 'Wellfound', url: 'https://wellfound.com/jobs', description: 'Startup jobs, formerly AngelList Talent.' },
      { name: 'Work at a Startup (YC)', url: 'https://www.workatastartup.com/', description: 'Jobs at Y Combinator companies.' },
      { name: 'Internshala', url: 'https://internshala.com/', description: 'Internships and fresher jobs in India.' },
      { name: 'Naukri', url: 'https://www.naukri.com/', description: "India's biggest job portal." },
      { name: 'Instahyre', url: 'https://www.instahyre.com/', description: 'Curated tech jobs in India.' },
      { name: 'Cutshort', url: 'https://cutshort.io/', description: 'Tech jobs matched by skills.' },
      { name: 'Indeed India', url: 'https://in.indeed.com/', description: 'Large job search engine.' },
      { name: 'Unstop jobs', url: 'https://unstop.com/jobs', description: 'Jobs and internships for students.' },
      { name: 'HN: Who is hiring?', url: 'https://news.ycombinator.com/submitted?id=whoishiring', description: 'Monthly hiring threads, many remote startup roles.' },
      { name: 'Remote OK', url: 'https://remoteok.com/', description: 'Remote jobs worldwide.' },
      { name: 'We Work Remotely', url: 'https://weworkremotely.com/', description: 'Remote jobs board.' },
      { name: 'Himalayas', url: 'https://himalayas.app/jobs', description: 'Remote jobs with timezone filters.' },
    ],
  },
  {
    id: 'open-source',
    title: 'Open source',
    links: [
      { name: 'Google Summer of Code', url: 'https://summerofcode.withgoogle.com/', description: 'Paid open-source mentorship every summer.' },
      { name: 'LFX Mentorship', url: 'https://mentorship.lfx.linuxfoundation.org/', description: 'Linux Foundation mentorships, three terms a year.' },
      { name: 'Outreachy', url: 'https://www.outreachy.org/', description: 'Paid internships for underrepresented groups in tech.' },
      { name: 'Good First Issues', url: 'https://goodfirstissues.com/', description: 'Beginner-friendly issues across GitHub.' },
      { name: 'Up For Grabs', url: 'https://up-for-grabs.net/', description: 'Projects looking for new contributors.' },
      { name: 'First Contributions', url: 'https://github.com/firstcontributions/first-contributions', description: 'Make your first pull request, step by step.' },
    ],
  },
  {
    id: 'research',
    title: 'Research',
    links: [
      { name: 'CSRankings', url: 'https://csrankings.org/', description: 'Find active CS professors and labs by research area.' },
      { name: 'Google Scholar', url: 'https://scholar.google.com/', description: "Search papers and see a professor's recent work." },
      { name: 'arXiv: cs.AI', url: 'https://arxiv.org/list/cs.AI/recent', description: 'The latest AI research papers.' },
    ],
  },
  {
    id: 'career',
    title: 'Student perks and resumes',
    links: [
      { name: 'GitHub Student Developer Pack', url: 'https://education.github.com/pack', description: 'Free tools and credits with your college email.' },
      { name: 'Overleaf CV templates', url: 'https://www.overleaf.com/gallery/tagged/cv', description: 'Clean LaTeX resume templates.' },
    ],
  },
];
