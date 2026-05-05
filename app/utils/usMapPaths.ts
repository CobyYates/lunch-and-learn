// Build a flat list of US-state SVG paths from us-atlas TopoJSON, projected
// with d3-geo's Albers USA projection (handles AK/HI insets so they don't end
// up off-canvas). Returns one path per state, fitted to the slide's 960×600
// viewBox.
//
// The topojson + d3-geo dependency lazy-loads via dynamic import so unrelated
// slides don't pay for the ~115 KB JSON or ~50 KB d3-geo bundle. First call
// pays the cost; subsequent calls hit the cached result.

export interface StatePath {
  id: string;   // USPS 2-letter code (e.g. "CA")
  fips: string; // FIPS code from us-atlas (e.g. "06")
  name: string;
  d: string;    // SVG path data
}

// FIPS → USPS lookup. us-atlas tags each state feature with the FIPS code in
// `id`; author content uses USPS codes, so we translate here once.
const FIPS_TO_USPS: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

let cached: StatePath[] | null = null;
let pending: Promise<StatePath[]> | null = null;

export function getUsStatePaths(width = 960, height = 600): Promise<StatePath[]> {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;

  pending = (async () => {
    const [{ geoAlbersUsa, geoPath }, { feature }, statesTopoMod] = await Promise.all([
      import("d3-geo"),
      import("topojson-client"),
      import("us-atlas/states-10m.json"),
    ]);

    const topo = (statesTopoMod as { default?: unknown }).default ?? statesTopoMod;
    const fc = feature(
      topo as Parameters<typeof feature>[0],
      (topo as { objects: { states: unknown } }).objects.states as Parameters<typeof feature>[1],
    ) as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>;

    const projection = geoAlbersUsa().fitSize([width, height], fc);
    const path = geoPath(projection);

    cached = fc.features
      .map((f) => {
        const fips = String(f.id ?? "");
        return {
          id: FIPS_TO_USPS[fips] ?? fips,
          fips,
          name: f.properties?.name ?? fips,
          d: path(f) ?? "",
        };
      })
      .filter((s) => s.d);

    return cached;
  })();

  return pending;
}
