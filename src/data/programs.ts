// Hand-verified opportunity data for /opportunities.
// Seeded from github.com/vikas0799/List-of-OpenSource-Programs (data/*.yml).
// Verify every date on the official site before editing; set `approx: true`
// for dates estimated from last year's cycle. Last reviewed: 2026-09-27.

export interface Program {
  name: string;
  org: string;
  url: string;
  stipend: string;
  timeline: string;
  eligibility: string;
  paid: boolean;
  caveat?: string;
}

export interface UpcomingEvent {
  date: string; // YYYY-MM-DD; first of the month when only the month is known
  endDate?: string;
  label: string;
  url: string;
  approx?: boolean;
}

export interface ResearchProgram {
  name: string;
  host: string;
  country: string;
  url: string;
  who: string;
  note?: string;
}

export const openSourcePrograms: Program[] = [
  {
    name: 'Google Summer of Code (GSoC)',
    org: 'Google',
    url: 'https://summerofcode.withgoogle.com/',
    stipend: '$1,500–$6,600 (depends on project size and your country)',
    timeline: '2026 cycle: contributor applications Mar 16–31, coding May 25–Nov 2',
    eligibility: '18+, open to all',
    paid: true,
  },
  {
    name: 'Outreachy',
    org: 'Software Freedom Conservancy',
    url: 'https://www.outreachy.org/',
    stipend: '$7,000',
    timeline: 'Two cohorts a year (May–Aug and Dec–Mar)',
    eligibility: 'People underrepresented in tech where they live',
    paid: true,
  },
  {
    name: 'LFX Mentorship',
    org: 'Linux Foundation (CNCF, OpenSSF and more)',
    url: 'https://mentorship.lfx.linuxfoundation.org/',
    stipend: 'Up to $6,600',
    timeline: 'Three terms a year: Mar–May, Jun–Aug, Sep–Nov',
    eligibility: 'Open to all',
    paid: true,
  },
  {
    name: 'Code for GovTech – Dedicated Mentoring Program (C4GT DMP)',
    org: 'Code for GovTech',
    url: 'https://app.codeforgovtech.in/',
    stipend: '₹1,00,000',
    timeline: 'Annual 3-month summer cycle',
    eligibility: 'Students and working professionals',
    paid: true,
  },
  {
    name: 'FOSSEE Summer Fellowship',
    org: 'IIT Bombay',
    url: 'https://fossee.in/fellowship',
    stipend: 'Paid fellowship',
    timeline: 'Annual summer fellowship',
    eligibility: 'Students, primarily in India',
    paid: true,
  },
  {
    name: 'Summer of Bitcoin',
    org: 'Summer of Bitcoin',
    url: 'https://www.summerofbitcoin.org/',
    stipend: '$3,000 (paid in Bitcoin)',
    timeline: 'Annual summer program',
    eligibility: 'University students',
    paid: true,
  },
  {
    name: 'Igalia Coding Experience',
    org: 'Igalia',
    url: 'https://www.igalia.com/coding-experience/',
    stipend: '$7,000',
    timeline: 'Periodic openings',
    eligibility: 'Open to all',
    paid: true,
  },
  {
    name: 'European Summer of Code (ESoC)',
    org: 'European Summer of Code',
    url: 'https://www.esoc.dev/',
    stipend: 'Stipends available',
    timeline: '2026 cycle: batches opened Feb 18 and Mar 19',
    eligibility: 'Open worldwide, new contributors welcome',
    paid: true,
  },
  {
    name: 'Open Source Research Experience (OSRE)',
    org: 'UC Santa Cruz OSPO',
    url: 'https://ucsc-ospo.github.io/osre/',
    stipend: 'Varies, sponsored projects',
    timeline: 'Summer research program',
    eligibility: 'Undergraduate and graduate students',
    paid: true,
  },
  {
    name: 'MLH Fellowship',
    org: 'Major League Hacking',
    url: 'https://fellowship.mlh.com/',
    stipend: 'Educational stipend',
    timeline: '12-week remote cohorts',
    eligibility: '18+, students and recent graduates',
    paid: true,
    caveat: 'Recent batches have had few or no matches for applicants living in India. Check the current batch before applying.',
  },
  {
    name: 'Open Source Promotion Plan (OSPP)',
    org: 'Institute of Software, Chinese Academy of Sciences',
    url: 'https://summer.ospp.ac.cn/',
    stipend: 'Paid',
    timeline: 'Summer program (applications usually close in June)',
    eligibility: 'University students; mainly China, some international projects',
    paid: true,
  },
  {
    name: 'Season of KDE',
    org: 'KDE Community',
    url: 'https://mentorship.kde.org/sok/',
    stipend: 'Unpaid (certificate and swag)',
    timeline: 'Jan–Mar; applications close mid-January',
    eligibility: 'Students',
    paid: false,
  },
  {
    name: 'GirlScript Summer of Code (GSSoC)',
    org: 'GirlScript Foundation',
    url: 'https://gssoc.girlscript.org/',
    stipend: 'Unpaid (certificates, goodies)',
    timeline: 'Annual summer program',
    eligibility: 'Open to all, beginner-friendly',
    paid: false,
  },
  {
    name: 'Kharagpur Winter of Code (KWoC)',
    org: 'KOSS, IIT Kharagpur',
    url: 'https://kwoc.kossiitkgp.org/',
    stipend: 'Unpaid',
    timeline: 'Winter (December–January)',
    eligibility: 'Students, beginner-friendly',
    paid: false,
  },
  {
    name: 'Djangonaut Space',
    org: 'Django Community',
    url: 'https://djangonaut.space/',
    stipend: 'Unpaid (mentorship)',
    timeline: '8-week sessions, several a year',
    eligibility: 'Anyone who wants to contribute to Django',
    paid: false,
  },
];

export const upcomingEvents: UpcomingEvent[] = [
  {
    date: '2026-10-01',
    endDate: '2026-10-31',
    label: 'Hacktoberfest 2026: in-person and online "Fests" on open-source AI (no PR counting this year)',
    url: 'https://hacktoberfest.com/',
  },
  {
    date: '2026-10-01',
    label: 'DAAD WISE applications for summer 2027 internships in Germany expected to open',
    url: 'https://www.daad.in/en/',
    approx: true,
  },
  {
    date: '2026-12-01',
    endDate: '2026-12-24',
    label: '24 Pull Requests',
    url: 'https://24pullrequests.com/',
  },
  {
    date: '2026-12-01',
    label: 'ETH Zurich Student Summer Research Fellowship (CS) deadline expected',
    url: 'https://inf.ethz.ch/studies/summer-research-fellowship.html',
    approx: true,
  },
  {
    date: '2027-01-01',
    label: 'Season of KDE 2027 applications expected to close',
    url: 'https://mentorship.kde.org/sok/',
    approx: true,
  },
  {
    date: '2027-02-01',
    label: 'GSoC 2027 accepted organizations expected (pick your org early)',
    url: 'https://summerofcode.withgoogle.com/',
    approx: true,
  },
  {
    date: '2027-02-01',
    label: 'LFX Mentorship spring 2027 term applications expected',
    url: 'https://mentorship.lfx.linuxfoundation.org/',
    approx: true,
  },
  {
    date: '2027-03-01',
    label: 'GSoC 2027 contributor applications expected',
    url: 'https://summerofcode.withgoogle.com/',
    approx: true,
  },
];

export const researchPrograms: ResearchProgram[] = [
  {
    name: 'DAAD WISE (Working Internships in Science and Engineering)',
    host: 'DAAD',
    country: 'Germany',
    url: 'https://www.daad.in/en/',
    who: 'Pre-final-year BTech/BS students at DAAD partner institutes (IITs, NITs, IIITs, IISERs and others)',
    note: 'You must find a German professor who agrees to host you. Search "WISE" on the DAAD India site.',
  },
  {
    name: 'Mitacs Globalink Research Internship',
    host: 'Mitacs',
    country: 'Canada',
    url: 'https://www.mitacs.ca/our-programs/globalink-research-internship-students/',
    who: 'Undergraduates from partner countries, including India',
    note: 'Check whether the current year\'s round is open; availability has varied.',
  },
  {
    name: 'France Excellence Charpak Summer Training Scholarship',
    host: 'Campus France India',
    country: 'France',
    url: 'https://www.inde.campusfrance.org/france-excellence-charpak-summer-training-scholarship',
    who: 'Indian students for a summer stay at a French institution',
  },
  {
    name: 'S.N. Bose Scholars Program',
    host: 'IUSSTF / SERB',
    country: 'USA',
    url: 'https://iusstf.org/s-n-bose-scholars-program',
    who: 'BTech/BS and MTech/MS students in science and engineering',
    note: 'Selection is through your institute\'s nomination.',
  },
  {
    name: 'ETH Student Summer Research Fellowship (Computer Science)',
    host: 'ETH Zurich',
    country: 'Switzerland',
    url: 'https://inf.ethz.ch/studies/summer-research-fellowship.html',
    who: 'Undergraduate and master\'s students worldwide',
  },
  {
    name: 'KAUST Internships (VSRP)',
    host: 'KAUST',
    country: 'Saudi Arabia',
    url: 'https://admissions.kaust.edu.sa/study/internships',
    who: 'Undergraduate and master\'s students',
  },
  {
    name: 'OIST Research Internship',
    host: 'Okinawa Institute of Science and Technology',
    country: 'Japan',
    url: 'https://www.oist.jp/research-internship',
    who: 'Undergraduate and graduate students',
  },
  {
    name: 'Summer Research Fellowship Programme (SRFP)',
    host: 'IAS, INSA and NASI',
    country: 'India',
    url: 'https://www.ias.ac.in/Science_Education/Summer_Research_Fellowship_Programme/',
    who: 'Science and engineering students; placed with researchers across India',
  },
  {
    name: 'SURGE',
    host: 'IIT Kanpur',
    country: 'India',
    url: 'https://surge.iitk.ac.in/',
    who: 'Undergraduate students from any institute',
  },
  {
    name: 'SPARK',
    host: 'IIT Roorkee',
    country: 'India',
    url: 'https://spark.iitr.ac.in/',
    who: 'Undergraduate students from any institute',
  },
  {
    name: 'Research Fellows Program',
    host: 'Microsoft Research India',
    country: 'India',
    url: 'https://www.microsoft.com/en-us/research/academic-program/research-fellows-program-at-microsoft-research-india/',
    who: 'Graduates (BTech/MTech/MS) before a PhD',
  },
];
