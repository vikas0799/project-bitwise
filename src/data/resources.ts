import { BookOpen, Compass, GraduationCap, Lightbulb, Link2, ListChecks, Newspaper, Sparkles, type LucideIcon } from 'lucide-react';
import { allNotes } from './notes';
import { totalProblems } from './dsaSheet';
import { projectIdeas } from './projects';
import { linkGroups } from './links';

export interface ResourceItem {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const linkCount = linkGroups.reduce((sum, group) => sum + group.links.length, 0);

// Shown in the Resources menu, the /resources hub and on the home page.
export const resources: ResourceItem[] = [
  { to: '/notes', title: 'Interview notes', description: `${allNotes.length} notes: DSA with diagrams, JavaScript, backend, OS, CN, DBMS, system design`, icon: BookOpen },
  { to: '/dsa-sheet', title: 'DSA sheet', description: `${totalProblems} problems by topic, with progress tracking`, icon: ListChecks },
  { to: '/projects', title: 'Project ideas', description: `${projectIdeas.length} resume-worthy projects, from beginner to AI`, icon: Lightbulb },
  { to: '/blog/ai-job-profiles', title: 'AI job profiles', description: 'Forward Deployed, GenAI and Applied AI engineer roles explained', icon: Sparkles },
  { to: '/blog/student-perks', title: 'Student perks', description: 'Free tools and credits your college email unlocks', icon: GraduationCap },
  { to: '/links', title: 'Useful links', description: `${linkCount} sites: Devpost, job boards, practice and AI courses`, icon: Link2 },
  { to: '/opportunities', title: 'Opportunities portal', description: 'Open-source programs, remote jobs and hackathons, updated every 3 days', icon: Compass },
  { to: '/blog', title: 'Blog', description: 'Guides for learning to code and getting hired', icon: Newspaper },
];
