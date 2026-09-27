#!/usr/bin/env node
// Fetches live jobs, hackathons and contests from public APIs into
// public/data/opportunities.json. Runs daily via
// .github/workflows/fetch-opportunities.yml. No dependencies (Node 18+).
//
// Source terms we follow:
// - Remotive: link back and credit, no sign-up wall, max 4 calls/day,
//   do not re-post their jobs to job boards (so no JobPosting markup).
// - Remote OK: link back without rel="nofollow" and credit Remote OK.
// - Jobicy: credit Jobicy and send "Apply" to the original job URL.
// We store only facts (title, company, link, dates), never descriptions.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const OUT = new URL('../public/data/opportunities.json', import.meta.url);
const UA = 'BitwiseSchoolBot/1.0 (+https://www.bitwiseschool.com/opportunities)';

const DEV_ROLE = /\b(engineer(ing)?|developer|software|programmer|front[- ]?end|back[- ]?end|full[- ]?stack|devops|sre|data (engineer|scientist|analyst)|machine learning|ml|ai|mobile|android|ios|qa|web|cloud|security|python|java(script)?|typescript|react|node(\.js)?|golang|rust)\b/i;
const FRESHER = /\b(intern(ship)?|junior|jr\.?|graduate|new grad|entry[- ]level|trainee|apprentice|fresher)\b/i;
const INDIA_OK = /\b(worldwide|anywhere|global|india|asia|apac)\b/i;
const MAX_JOBS = 400;

async function getJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// 'yes' = worldwide/India/Asia allowed, 'no' = restricted elsewhere, 'unknown' = not stated.
function openToIndia(locations) {
  const locs = locations.flat().filter(Boolean).map(String).map((s) => s.trim()).filter(Boolean);
  if (locs.length === 0) return 'unknown';
  return locs.some((l) => INDIA_OK.test(l)) ? 'yes' : 'no';
}

const iso = (value) => {
  const d = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const stripHtml = (s) => String(s ?? '').replace(/<[^>]*>/g, '').trim();

const sources = {
  async remotive() {
    const data = await getJson('https://remotive.com/api/remote-jobs?category=software-dev');
    return data.jobs.map((j) => ({
      id: `remotive-${j.id}`,
      title: j.title,
      company: j.company_name,
      url: j.url,
      location: j.candidate_required_location || '',
      openToIndia: openToIndia([j.candidate_required_location]),
      fresher: FRESHER.test(j.title),
      postedAt: iso(j.publication_date),
    }));
  },

  async remoteok() {
    const data = await getJson('https://remoteok.com/api');
    return data
      .filter((j) => j && j.id && j.position)
      .filter((j) => DEV_ROLE.test(j.position) || (j.tags || []).some((t) => DEV_ROLE.test(t)))
      .map((j) => ({
        id: `remoteok-${j.id}`,
        title: j.position,
        company: j.company,
        url: j.url,
        location: j.location || '',
        openToIndia: openToIndia([j.location]),
        fresher: FRESHER.test(j.position),
        postedAt: iso(j.date),
      }));
  },

  async himalayas() {
    const jobs = [];
    let cursor = '';
    for (let page = 0; page < 3; page++) {
      const data = await getJson(`https://himalayas.app/jobs/api?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
      jobs.push(...data.jobs);
      if (!data.nextCursor) break;
      cursor = data.nextCursor;
    }
    return jobs
      .filter((j) => DEV_ROLE.test(j.title))
      .map((j) => ({
        id: `himalayas-${j.guid}`,
        title: j.title,
        company: j.companyName,
        url: j.applicationLink || j.guid,
        location: (j.locationRestrictions || []).join(', ') || 'Worldwide',
        openToIndia: (j.locationRestrictions || []).length === 0 ? 'yes' : openToIndia([j.locationRestrictions]),
        fresher: FRESHER.test(j.title) || (j.seniority || []).some((s) => /entry|junior|intern/i.test(s)),
        postedAt: iso(j.pubDate),
      }));
  },

  async jobicy() {
    const data = await getJson('https://jobicy.com/api/v2/remote-jobs?count=100&industry=dev');
    return (data.jobs || []).map((j) => ({
      id: `jobicy-${j.id}`,
      title: stripHtml(j.jobTitle),
      company: j.companyName,
      url: j.url,
      location: j.jobGeo || '',
      openToIndia: openToIndia([j.jobGeo]),
      fresher: FRESHER.test(j.jobTitle) || /entry|junior/i.test(j.jobLevel || ''),
      postedAt: iso(j.pubDate),
    }));
  },

  async devpost() {
    const hackathons = [];
    for (let page = 1; page <= 8; page++) {
      const data = await getJson(`https://devpost.com/api/hackathons?status[]=upcoming&status[]=open&page=${page}`);
      hackathons.push(...data.hackathons);
      if (data.hackathons.length === 0) break;
    }
    return hackathons
      .filter((h) => !h.invite_only)
      .map((h) => ({
        id: `devpost-${h.id}`,
        title: h.title,
        organizer: h.organization_name || '',
        url: h.url,
        location: h.displayed_location?.location || 'Online',
        dates: h.submission_period_dates || '',
        state: h.open_state,
        prize: stripHtml(h.prize_amount),
        themes: (h.themes || []).map((t) => t.name).slice(0, 4),
      }));
  },

  async codeforces() {
    const data = await getJson('https://codeforces.com/api/contest.list?gym=false');
    return data.result
      .filter((c) => c.phase === 'BEFORE')
      .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
      .slice(0, 20)
      .map((c) => ({
        id: `codeforces-${c.id}`,
        title: c.name,
        url: `https://codeforces.com/contests/${c.id}`,
        startsAt: iso(c.startTimeSeconds),
        durationHours: Math.round((c.durationSeconds / 3600) * 10) / 10,
        platform: 'Codeforces',
      }));
  },
};

const SOURCE_INFO = {
  remotive: { name: 'Remotive', url: 'https://remotive.com', kind: 'jobs' },
  remoteok: { name: 'Remote OK', url: 'https://remoteok.com', kind: 'jobs' },
  himalayas: { name: 'Himalayas', url: 'https://himalayas.app', kind: 'jobs' },
  jobicy: { name: 'Jobicy', url: 'https://jobicy.com', kind: 'jobs' },
  devpost: { name: 'Devpost', url: 'https://devpost.com', kind: 'hackathons' },
  codeforces: { name: 'Codeforces', url: 'https://codeforces.com', kind: 'contests' },
};

async function main() {
  let previous = null;
  try {
    previous = JSON.parse(await readFile(OUT, 'utf8'));
  } catch {
    // first run
  }

  const out = { generatedAt: new Date().toISOString(), sources: [], jobs: [], hackathons: [], contests: [] };

  for (const [key, fetcher] of Object.entries(sources)) {
    const info = SOURCE_INFO[key];
    try {
      const items = (await fetcher()).map((item) => ({ ...item, source: info.name }));
      out[info.kind].push(...items);
      out.sources.push({ ...info, ok: true, count: items.length });
      console.log(`${info.name}: ${items.length}`);
    } catch (err) {
      // Keep yesterday's items for this source rather than showing nothing.
      const kept = (previous?.[info.kind] || []).filter((item) => item.source === info.name);
      out[info.kind].push(...kept);
      out.sources.push({ ...info, ok: false, count: kept.length, error: String(err.message || err) });
      console.error(`${info.name}: FAILED (${err.message || err}), kept ${kept.length} previous items`);
    }
  }

  // Newest first, drop duplicates (same title + company from two boards).
  const seen = new Set();
  out.jobs = out.jobs
    .filter((j) => j.title && j.url)
    .sort((a, b) => String(b.postedAt).localeCompare(String(a.postedAt)))
    .filter((j) => {
      const key = `${j.title}|${j.company}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_JOBS);

  await mkdir(new URL('.', OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(out, null, 1) + '\n');
  console.log(`Wrote ${out.jobs.length} jobs, ${out.hackathons.length} hackathons, ${out.contests.length} contests`);

  if (out.sources.every((s) => !s.ok)) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
