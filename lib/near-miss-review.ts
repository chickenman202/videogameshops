/**
 * The nine shop pairs that sit within 40 meters but were not auto-merged
 * on the first import. Each decision is recorded after the import runs.
 * A pair is "merged" only when both source ids landed on the same listing.
 */

export type NearMissDecision = {
  label: string;
  meters: number;
  ids: [string, string];
  decision: "merged" | "kept_separate";
  reason: string;
};

type ReviewedPair = {
  label: string;
  meters: number;
  ids: [string, string];
  mergeReason: string;
  separateReason: string;
};

const REVIEWED_PAIRS: ReviewedPair[] = [
  {
    label: "FunTrade and GameStop in Billings",
    meters: 20,
    ids: ["gameroute:gameroute/1459", "osm:way/1363234827"],
    mergeReason: "These rows were folded into one listing.",
    separateReason:
      "Different shop names. The nearby GameStop row has no street address, so it stays its own listing.",
  },
  {
    label: "CGR Games and Classic Games Revisited in Doylestown",
    meters: 6,
    ids: ["osm:way/387026089", "gameroute:gameroute/1699"],
    mergeReason:
      "Same address, 46 East State Street in Doylestown, and CGR matches the initials of Classic Games Revisited. Website and address come from those two rows.",
    separateReason: "These rows stayed as two listings.",
  },
  {
    label: "Backlight Gamez and Revival Games in Idaho Falls",
    meters: 4,
    ids: ["osm:node/9546408211", "gameroute:gameroute/1226"],
    mergeReason: "These rows were folded into one listing.",
    separateReason:
      "Same building at 540 2nd Street, but the names do not match and neither row has a website that ties them together.",
  },
  {
    label: "Dial Up Games and Gameroom Lincoln in Lincoln",
    meters: 11,
    ids: ["osm:node/11380818069", "gameroute:gameroute/1463"],
    mergeReason: "These rows were folded into one listing.",
    separateReason:
      "Same street address, but the names differ and the websites differ (dialupgames.com and thisisgameroom.com).",
  },
  {
    label: "Mega Media Xchange Madison and Preplayed East",
    meters: 7,
    ids: ["gameroute:gameroute/1950", "osm:node/956781246"],
    mergeReason: "These rows were folded into one listing.",
    separateReason:
      "Different names. Preplayed East has no street address, and Mega Media Xchange is listed in Madison while Preplayed East is listed in Maple Bluff.",
  },
  {
    label: "GameStar and GameTime in McMinnville",
    meters: 5,
    ids: ["osm:node/12908842545", "gameroute:gameroute/1691"],
    mergeReason: "These rows were folded into one listing.",
    separateReason:
      "The names are different, GameStar has no street address, and the rows do not share a website.",
  },
  {
    label: "On the Draw and Player's Choice Video Games in Pottstown",
    meters: 22,
    ids: ["osm:node/13683336201", "gameroute:gameroute/1714"],
    mergeReason: "These rows were folded into one listing.",
    separateReason: "Neighbors, not the same shop. On the Draw is at 214 East High Street and Player's Choice is at 216.",
  },
  {
    label: "Gamestersbay and Level Up Racine in Racine",
    meters: 21,
    ids: ["osm:node/10676647698", "gameroute:gameroute/1944"],
    mergeReason: "These rows were folded into one listing.",
    separateReason:
      "Different names and different websites (gamestersbay.us and levelupracine.com). Gamestersbay's address is only \"6th Street\".",
  },
  {
    label: "Game Mechanix and Retro Fix in West Monroe",
    meters: 5,
    ids: ["gameroute:gameroute/1327", "osm:node/9108042931"],
    mergeReason: "These rows were folded into one listing.",
    separateReason:
      "Same suite at 3212 Cypress Street #2, but the names do not match and the rows do not share a website.",
  },
];

type ReviewRow = {
  source: string | null;
  source_id: string | null;
  alternate_source_ids: string[] | null;
};

export function reviewNearMisses(rows: ReviewRow[]): NearMissDecision[] {
  const home = new Map<string, number>();
  rows.forEach((row, index) => {
    if (row.source && row.source_id) home.set(`${row.source}:${row.source_id}`, index);
    for (const alt of row.alternate_source_ids ?? []) home.set(alt, index);
  });
  return REVIEWED_PAIRS.map((pair) => {
    const left = home.get(pair.ids[0]);
    const right = home.get(pair.ids[1]);
    const merged = left != null && left === right;
    return {
      label: pair.label,
      meters: pair.meters,
      ids: pair.ids,
      decision: merged ? "merged" : "kept_separate",
      reason: merged ? pair.mergeReason : pair.separateReason,
    };
  });
}
