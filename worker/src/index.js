const API_ROOT = "https://api.sportmonks.com/v3/football";
const DEFAULT_INCLUDES = "participants;league;state;scores;venue";

class ProxyError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "").split(",").map((v) => v.trim()).filter(Boolean);
}
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function shiftDate(value, days) {
  const date = new Date(value + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
function dayDistance(from, to) {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000);
}
function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}
function statusCode(fixture) {
  const state = fixture?.state || {};
  const code = String(state.state || state.short_name || "").toUpperCase();
  const id = Number(state.id || fixture?.state_id);
  const map = {
    INPLAY_1ST_HALF: "1H", INPLAY_2ND_HALF: "2H", INPLAY_ET: "ET",
    EXTRA_TIME: "ET", PEN_LIVE: "P", BREAK: "BT", POSTPONED: "PST",
    POSTP: "PST", CANCELLED: "CANC", CANCL: "CANC",
    AFTER_EXTRA_TIME: "AET", PENALTIES: "PEN"
  };
  if (map[code]) return map[code];
  if (code) return code;
  if (id === 1) return "NS";
  if (id === 2) return "1H";
  if (id === 3) return "HT";
  if (id === 4) return "BT";
  if (id === 5) return "FT";
  if (id === 6) return "2H";
  if (id === 7) return "AET";
  if (id === 8) return "PEN";
  if (id === 10) return "PST";
  if (id === 12) return "CANC";
  return "TBD";
}
function fixtureDate(fixture) {
  if (Number.isFinite(Number(fixture?.starting_at_timestamp))) {
    return new Date(Number(fixture.starting_at_timestamp) * 1000).toISOString();
  }
  const raw = String(fixture?.starting_at || "");
  if (!raw) return "";
  return raw.includes("T") ? raw : raw.replace(" ", "T") + "Z";
}
function scoreFor(scores, participant) {
  const entries = asArray(scores);
  const current = entries.filter((entry) => String(entry.description || "").toUpperCase() === "CURRENT");
  const selected = current.find((entry) => String(entry.score?.participant || "").toLowerCase() === participant);
  const value = selected?.score?.goals;
  return value === null || value === undefined || value === "" ? null : Number(value);
}
function normalizeFixture(fixture) {
  const participants = asArray(fixture?.participants);
  const home = participants.find((p) => String(p.meta?.location || "").toLowerCase() === "home") || participants[0] || {};
  const away = participants.find((p) => String(p.meta?.location || "").toLowerCase() === "away")
    || participants.find((p) => p.id !== home.id) || {};
  const league = fixture?.league || {};
  const venue = fixture?.venue || {};
  const state = fixture?.state || {};
  const short = statusCode(fixture);
  return {
    fixture: {
      id: Number(fixture.id),
      date: fixtureDate(fixture),
      status: { short, long: state.name || state.short_name || short },
      venue: { id: venue.id || fixture.venue_id || null, name: venue.name || null }
    },
    league: {
      id: league.id || fixture.league_id || null,
      name: league.name || "Competición " + (fixture.league_id || ""),
      country: league.country?.name || league.country_name || "",
      logo: league.image_path || league.logo || ""
    },
    teams: {
      home: { id: Number(home.id) || home.id, name: home.name || "Local", logo: home.image_path || "" },
      away: { id: Number(away.id) || away.id, name: away.name || "Visitante", logo: away.image_path || "" }
    },
    goals: { home: scoreFor(fixture.scores, "home"), away: scoreFor(fixture.scores, "away") },
    _source: "sportmonks"
  };
}
async function sportmonksGet(path, params, env) {
  const url = new URL(API_ROOT + path);
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { "Authorization": env.SPORTMONKS_TOKEN, "Accept": "application/json" }
  });
  let payload;
  try { payload = await response.json(); }
  catch { throw new ProxyError(response.status || 502, "Sportmonks devolvió una respuesta que no es JSON."); }
  if (!response.ok) {
    if (response.status === 401) throw new ProxyError(502, "Sportmonks rechazó el token. Revisa el secreto SPORTMONKS_TOKEN.");
    if (response.status === 403) throw new ProxyError(403, "Tu suscripción Sportmonks no tiene acceso a esta liga o recurso.");
    if (response.status === 429) throw new ProxyError(429, "Se alcanzó el límite de solicitudes de Sportmonks. Intenta más tarde.");
    throw new ProxyError(502, payload?.message || "No fue posible consultar Sportmonks.");
  }
  if (payload?.message && payload?.error) throw new ProxyError(502, "Sportmonks devolvió un error al procesar la consulta.");
  return payload;
}
function paginationOf(payload) {
  return payload?.pagination || payload?.meta?.pagination || { current_page: 1, per_page: 50, has_more: false };
}
function isFinished(fixture) {
  const code = statusCode(fixture);
  const id = Number(fixture?.state?.id || fixture?.state_id);
  return ["FT", "AET", "PEN", "AFTER_EXTRA_TIME", "PENALTIES"].includes(code) || [5, 7, 8].includes(id);
}
async function getFixtures(requestUrl, env) {
  const from = requestUrl.searchParams.get("from") || "";
  const to = requestUrl.searchParams.get("to") || "";
  const page = Math.max(1, Math.min(1000, Number(requestUrl.searchParams.get("page") || 1)));
  const perPage = Math.max(1, Math.min(50, Number(requestUrl.searchParams.get("per_page") || 50)));
  if (!isDate(from) || !isDate(to)) throw new ProxyError(400, "Indica fechas válidas en formato YYYY-MM-DD.");
  const span = dayDistance(from, to);
  if (span < 0) throw new ProxyError(400, "La fecha inicial no puede ser posterior a la fecha final.");
  if (span > 99) throw new ProxyError(400, "Sportmonks permite consultas de hasta 100 días por rango.");
  const payload = await sportmonksGet("/fixtures/between/" + from + "/" + to,
    { include: DEFAULT_INCLUDES, per_page: perPage, page, order: "asc" }, env);
  return { data: asArray(payload.data).map(normalizeFixture), pagination: paginationOf(payload), meta: payload.meta || {} };
}
async function getTeamRecent(requestUrl, env) {
  const teamId = Number(requestUrl.searchParams.get("team_id"));
  const before = requestUrl.searchParams.get("before") || "";
  const limit = Math.max(5, Math.min(10, Number(requestUrl.searchParams.get("limit") || 10)));
  if (!Number.isSafeInteger(teamId) || teamId <= 0) throw new ProxyError(400, "team_id debe ser un identificador numérico válido.");
  if (!isDate(before)) throw new ProxyError(400, "before debe ser una fecha válida en formato YYYY-MM-DD.");
  const collected = new Map();
  for (let windowIndex = 0; windowIndex < 4 && collected.size < limit; windowIndex++) {
    const end = shiftDate(before, -1 - (windowIndex * 100));
    const start = shiftDate(end, -99);
    for (let page = 1; page <= 5 && collected.size < limit; page++) {
      const payload = await sportmonksGet("/fixtures/between/" + start + "/" + end + "/" + teamId,
        { include: DEFAULT_INCLUDES, per_page: 50, page, order: "desc" }, env);
      for (const rawFixture of asArray(payload.data)) {
        const fixture = normalizeFixture(rawFixture);
        const containsTeam = Number(fixture.teams.home.id) === teamId || Number(fixture.teams.away.id) === teamId;
        if (!containsTeam || !isFinished(rawFixture)) continue;
        if (fixture.goals.home === null || fixture.goals.away === null) continue;
        collected.set(String(fixture.fixture.id), fixture);
      }
      if (!paginationOf(payload).has_more) break;
    }
  }
  const response = [...collected.values()]
    .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date))
    .slice(0, limit);
  return { response, count: response.length, team_id: teamId };
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = allowedOrigins(env);
    if (!origin || !allowed.includes(origin)) {
      return new Response(JSON.stringify({ error: "Origen no autorizado." }), {
        status: 403, headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method !== "GET") return json({ error: "Método no permitido." }, 405, origin);
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ ok: true, provider: "Sportmonks", configured: Boolean(env.SPORTMONKS_TOKEN), version: "1.0.0" }, 200, origin);
    }
    if (!env.SPORTMONKS_TOKEN) {
      return json({ error: "Falta configurar el secreto SPORTMONKS_TOKEN en Cloudflare." }, 503, origin);
    }
    try {
      if (url.pathname === "/fixtures") return json(await getFixtures(url, env), 200, origin);
      if (url.pathname === "/team-recent") return json(await getTeamRecent(url, env), 200, origin);
      return json({ error: "Ruta no encontrada." }, 404, origin);
    } catch (error) {
      const status = Number(error?.status) || 500;
      const message = error instanceof ProxyError ? error.message : "Error interno del proxy. Revisa los registros de Cloudflare.";
      return json({ error: message }, status, origin);
    }
  }
};
