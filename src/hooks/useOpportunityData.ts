import { useEffect, useState } from 'react';

// Summary of public/data/opportunities.json (refreshed daily by the
// "Refresh opportunities" GitHub Action). Fetched once per page load.

export interface OpportunitySummary {
  generatedAt: string;
  jobsOpenToIndia: number;
  hackathons: number;
  contests: number;
}

let cache: Promise<OpportunitySummary | null> | null = null;

const load = () => {
  cache ??= fetch('/data/opportunities.json')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) =>
      data
        ? {
            generatedAt: data.generatedAt,
            jobsOpenToIndia: data.jobs.filter((j: { openToIndia: string }) => j.openToIndia !== 'no').length,
            hackathons: data.hackathons.length,
            contests: data.contests.length,
          }
        : null
    )
    .catch(() => null);
  return cache;
};

export const useOpportunityData = () => {
  const [summary, setSummary] = useState<OpportunitySummary | null>(null);

  useEffect(() => {
    let active = true;
    load().then((s) => {
      if (active) setSummary(s);
    });
    return () => {
      active = false;
    };
  }, []);

  return summary;
};
