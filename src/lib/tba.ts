const TBA_BASE_URL = "https://www.thebluealliance.com/api/v3";

async function tbaFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.TBA_API_KEY;
  if (!apiKey) {
    throw new Error("TBA_API_KEY environment variable is not set");
  }

  const res = await fetch(`${TBA_BASE_URL}${path}`, {
    headers: {
      "X-TBA-Auth-Key": apiKey,
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!res.ok) {
    throw new Error(`TBA API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// TBA API types
export interface TBAEvent {
  key: string;
  name: string;
  year: number;
  city: string;
  state_prov: string;
  country: string;
  start_date: string;
  end_date: string;
}

export interface TBATeam {
  key: string;
  team_number: number;
  nickname: string;
  city: string;
  state_prov: string;
}

export interface TBAMatch {
  key: string;
  comp_level: string;
  match_number: number;
  set_number: number;
  alliances: {
    red: {
      team_keys: string[];
      score: number;
    };
    blue: {
      team_keys: string[];
      score: number;
    };
  };
}

export interface TBAEventRankings {
  rankings: Array<{
    rank: number;
    team_key: string;
  }>;
}

function parseTeamNumber(teamKey: string): number {
  return parseInt(teamKey.replace("frc", ""), 10);
}

export async function fetchEvent(eventKey: string): Promise<TBAEvent> {
  return tbaFetch<TBAEvent>(`/event/${eventKey}`);
}

export async function fetchEventTeams(eventKey: string): Promise<TBATeam[]> {
  return tbaFetch<TBATeam[]>(`/event/${eventKey}/teams`);
}

export async function fetchEventMatches(eventKey: string): Promise<TBAMatch[]> {
  return tbaFetch<TBAMatch[]>(`/event/${eventKey}/matches`);
}

export async function fetchEventRankings(eventKey: string): Promise<
  Array<{ rank: number; teamNumber: number }>
> {
  const data = await tbaFetch<TBAEventRankings>(`/event/${eventKey}/rankings`);
  if (!data?.rankings) return [];
  return data.rankings
    .map((ranking) => ({
      rank: ranking.rank,
      teamNumber: parseTeamNumber(ranking.team_key),
    }))
    .filter((ranking) => !Number.isNaN(ranking.teamNumber));
}

export function parseMatchAlliance(teamKeys: string[]): number[] {
  return teamKeys.map(parseTeamNumber);
}
