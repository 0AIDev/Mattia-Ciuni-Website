"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import geoIds from "./geo-ids.json";

/**
 * La mappa del mondo nella dashboard analytics.
 *
 * Niente immagini, niente tile, niente servizi esterni: i confini arrivano da
 * world-atlas (TopoJSON pubblico servito da /admin/geo/), la proiezione da
 * d3-geo, disegnati in un SVG locale. I dati sono gli eventi del sito aggregati
 * per paese nella vista `analytics_geo` (CF-IPCountry, alpha-2): l'intensità del
 * riempimento è il numero di visitatori del periodo.
 *
 * world-atlas identifica i paesi con l'ISO numerico, gli eventi portano
 * l'alpha-2: `geo-ids.json` (generato una volta da world-countries con
 * `scripts/geo-ids.json` nel repo) fa da ponte fra i due codici.
 *
 * La dashboard è dietro autenticazione: nessun peso per il sito pubblico, che
 * non tocca mai questo chunk né il file dei confini.
 */

type GeoRow = Record<string, unknown>;

type Props = { rows: GeoRow[] };

const ISO_NAME_OVERRIDES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  RU: "Russia",
  KR: "South Korea",
  KP: "North Korea",
  TW: "Taiwan",
  AE: "United Arab Emirates",
  VA: "Vatican City",
  BO: "Bolivia",
  VE: "Venezuela",
  TZ: "Tanzania",
  MD: "Moldova",
  SY: "Syria",
  LA: "Laos",
  IR: "Iran",
  VN: "Vietnam",
  CZ: "Czechia",
  CD: "DR Congo",
  CI: "Côte d'Ivoire",
  HK: "Hong Kong",
  MO: "Macao",
  PS: "Palestine",
};

function countryName(code: string): string {
  return ISO_NAME_OVERRIDES[code] || code;
}

export function WorldMap({ rows }: Props) {
  const [borders, setBorders] = useState<FeatureCollection<Geometry, { name?: string }> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(720);

  const countries = useMemo(() => {
    const map = new Map<string, { views: number; visitors: number }>();
    for (const row of rows) {
      const code = String(row.country || "").toUpperCase();
      if (!/^[A-Z]{2}$/.test(code)) continue;
      const current = map.get(code) || { views: 0, visitors: 0 };
      map.set(code, { views: current.views + Number(row.views || 0), visitors: current.visitors + Number(row.visitors || 0) });
    }
    return map;
  }, [rows]);

  const maxVisitors = Math.max(1, ...Array.from(countries.values(), (value) => value.visitors));

  // I confini si caricano una volta per mount: serviti dalla stessa origine,
  // no CORS, no richieste verso terzi.
  useEffect(() => {
    let cancelled = false;
    fetch("/admin/geo/countries-110m.json", { cache: "force-cache" })
      .then((response) => (response.ok ? response.json() : null))
      .then((topology: Topology | null) => {
        if (cancelled || !topology) return;
        const collection = feature(topology, (topology.objects as Record<string, GeometryCollection>).countries) as unknown as FeatureCollection<Geometry, { name?: string }>;
        setBorders(collection);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.floor(entries[0]?.contentRect.width || 720);
      if (next > 100) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const height = Math.round(width * 0.5);
  const projection = useMemo(
    () => geoEqualEarth().fitExtent([[6, 6], [width - 6, height - 6]], { type: "Sphere" } as never),
    [width, height],
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  return (
    <div ref={containerRef}>
      <svg role="img" aria-label="Visitors by country" viewBox={`0 0 ${width} ${height}`} className="block w-full">
        <rect width={width} height={height} fill="#f7f7f5" rx={12} />
        {borders ? (
          <g>
            {borders.features.map((countryFeature, index) => {
              // L'id TopoJSON è l'ISO numerico (stringa o numero): lo si porta a
              // alpha-2 con la tabella generata, e quello decide il riempimento.
              const rawId = (countryFeature as unknown as { id?: string | number }).id;
              const numeric = String(rawId ?? "").padStart(3, "0");
              const alpha2 = (geoIds as Record<string, string>)[numeric] || "";
              const row = alpha2 ? countries.get(alpha2) : undefined;
              const visitors = row?.visitors || 0;
              const intensity = visitors ? 0.18 + (visitors / maxVisitors) * 0.82 : 0;
              const name = (countryFeature as { properties?: { name?: string } }).properties?.name || alpha2;
              return (
                <path
                  key={`${numeric}-${index}`}
                  d={path(countryFeature) || ""}
                  fill={visitors ? `rgba(17, 17, 17, ${intensity.toFixed(3)})` : "#e3e3e0"}
                  stroke="#ffffff"
                  strokeWidth={0.4}
                >
                  <title>{alpha2 ? `${countryName(alpha2)}: ${visitors} visitors, ${row?.views || 0} views` : name}</title>
                </path>
              );
            })}
          </g>
        ) : (
          <text x={width / 2} y={height / 2} textAnchor="middle" fontSize={13} fill="#777">Loading map…</text>
        )}
      </svg>
      {countries.size ? (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#555]">
          {Array.from(countries.entries()).sort((a, b) => b[1].visitors - a[1].visitors).slice(0, 8).map(([code, value]) => (
            <span key={code}><strong className="font-medium text-[#111]">{countryName(code)}</strong> {value.visitors} visitors · {value.views} views</span>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-[#777]">
          No country data yet. It fills in as events arrive; if it stays empty after real traffic, run the 000005 analytics_geo migration.
        </p>
      )}
    </div>
  );
}
