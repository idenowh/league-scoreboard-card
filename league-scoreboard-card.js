/**
 * League Scoreboard Card for Home Assistant
 *
 * Shows whole-league scoreboards (fed by ESPN scoreboard template sensors) and
 * your Team Tracker teams, styled like Team Tracker cards.
 *
 *   mode: full     — every game, logo + name / score / name + logo, status underneath
 *   mode: compact  — live + today's games, abbreviations, a row limit, tap to open a page
 *
 * No build step, no dependencies. MIT licence.
 */

const LSC_VERSION = "0.2.0";

const LSC_STYLES = `
  :host { display: block; }
  ha-card { overflow: hidden; }
  ha-card.tappable { cursor: pointer; }
  ha-card.tappable:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }

  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px 6px;
    font-size: 15px; font-weight: 600; letter-spacing: 0.02em;
    color: var(--primary-text-color);
  }
  .header .chev { color: var(--secondary-text-color); font-size: 18px; line-height: 1; }

  .body { padding: 6px 12px 12px; display: flex; flex-direction: column; gap: 8px; }
  .empty { padding: 10px 4px; color: var(--secondary-text-color); font-size: 14px; }
  .warn { padding: 8px 4px; color: var(--error-color, #db4437); font-size: 13px; }

  .group-label {
    margin: 6px 4px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--secondary-text-color);
  }

  /* ---------- full mode: one tile per game ---------- */
  .game {
    border: 1px solid var(--divider-color, rgba(127,127,127,0.25));
    border-radius: 12px;
    padding: 10px 12px 8px;
    background: var(--lsc-tile-background, transparent);
  }
  .game.live { border-color: var(--primary-color); box-shadow: inset 3px 0 0 var(--primary-color); }
  .game.fav { background: var(--lsc-fav-background, rgba(127,127,127,0.06)); }

  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 10px;
  }
  .team { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .team.home { justify-content: flex-end; text-align: right; }
  .team .text { display: flex; flex-direction: column; min-width: 0; }
  .team .name {
    font-size: 14px; font-weight: 600; line-height: 1.25; color: var(--primary-text-color);
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .team .rank { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); margin-right: 3px; }
  .team .record { font-size: 12px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  .team.loser .name, .team.loser .record { opacity: 0.55; }

  .logo { width: 36px; height: 36px; object-fit: contain; flex: none; }
  .logo-fallback {
    width: 36px; height: 36px; border-radius: 50%; flex: none;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff; background: var(--secondary-text-color);
  }

  .score {
    display: flex; align-items: baseline; gap: 6px;
    font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums;
    color: var(--primary-text-color);
  }
  .score .loser { opacity: 0.5; }
  .score .dash { font-size: 18px; font-weight: 400; color: var(--secondary-text-color); }
  .score.pre { font-size: 15px; font-weight: 600; color: var(--secondary-text-color); }

  .status {
    margin-top: 6px; text-align: center;
    font-size: 13px; color: var(--secondary-text-color);
    font-variant-numeric: tabular-nums;
  }
  .status .live { color: var(--primary-color); font-weight: 700; }
  .status .dot {
    display: inline-block; width: 7px; height: 7px; border-radius: 50%;
    background: var(--error-color, #db4437); margin-right: 5px; vertical-align: 1px;
    animation: lsc-pulse 1.6s ease-in-out infinite;
  }
  @keyframes lsc-pulse { 50% { opacity: 0.35; } }
  @media (prefers-reduced-motion: reduce) { .status .dot { animation: none; } }

  /* ---------- compact mode: two-line rows ---------- */
  .compact { gap: 2px; }
  .crow {
    display: grid; grid-template-columns: 44px minmax(0, 1fr);
    align-items: center; gap: 8px;
    padding: 6px 4px;
    border-bottom: 1px solid var(--divider-color, rgba(127,127,127,0.2));
  }
  .crow:last-of-type { border-bottom: none; }
  .chip {
    justify-self: start;
    font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--secondary-text-color);
    border: 1px solid var(--divider-color, rgba(127,127,127,0.3));
    border-radius: 6px; padding: 2px 5px; max-width: 44px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .chip.fav { color: var(--primary-color); border-color: var(--primary-color); }
  .cmain { display: flex; flex-direction: column; align-items: center; min-width: 0; }
  .cline {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 15px; font-weight: 600; color: var(--primary-text-color);
    font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .cline .logo, .cline .logo-fallback { width: 20px; height: 20px; font-size: 8px; }
  .cline .abbr.loser, .cline .num.loser { opacity: 0.5; }
  .cline .sep { color: var(--secondary-text-color); font-weight: 400; }
  .cstatus { font-size: 12px; color: var(--secondary-text-color); margin-top: 1px; }
  .cstatus .live { color: var(--primary-color); font-weight: 700; }
  .more { padding: 6px 4px 0; font-size: 12px; font-style: italic; color: var(--secondary-text-color); text-align: center; }

  /* ---------- embedded (inside another card) ---------- */
  ha-card.embedded { background: transparent; border: none; box-shadow: none; border-radius: 0; }
  ha-card.embedded .header { padding: 0 0 6px; }
  ha-card.embedded .body { padding: 0; }

  /* ---------- counter style: Counter Panel rows ---------- */
  ha-card.counter { font-family: var(--cp-font-body, "Work Sans", system-ui, sans-serif); }
  .header.counter {
    justify-content: flex-start; gap: 7px; color: var(--secondary-text-color);
    font-family: var(--cp-font-display, "Barlow Condensed", "Arial Narrow", sans-serif);
    font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
  }
  .header.counter .chev { margin-left: auto; }
  .clist { gap: 0; }
  .crow2 {
    display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
    padding: 4px 0; font-size: 12.5px; color: var(--primary-text-color);
  }
  .crow2 .teams { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .crow2.upcoming .teams { color: var(--secondary-text-color); }
  .crow2 .loser { opacity: 0.6; }
  .crow2 .star { color: var(--primary-color); margin-right: 4px; }
  .crow2 .tag {
    flex: none; font-family: var(--cp-font-mono, "IBM Plex Mono", ui-monospace, monospace);
    font-size: 11px; font-variant-numeric: tabular-nums;
  }
  .crow2 .tag.final { color: var(--cp-sage, #7FA07A); }
  .crow2 .tag.live { color: var(--cp-amber, #D9A441); }
  .crow2 .tag.pre { color: var(--cp-blue, #6C93AD); }
`;

function lscEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function lscSafeUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url) ? url : "";
}

function lscColor(c) {
  if (!c || typeof c !== "string") return "";
  const hex = c.replace(/^#/, "");
  return /^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex) ? `#${hex}` : "";
}

function lscLocalDay(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function lscStripRank(s) {
  return String(s ?? "").replace(/^#\d+\s+/, "");
}

class LeagueScoreboardCard extends HTMLElement {
  static getStubConfig(hass) {
    const found = Object.keys(hass?.states || {}).find(
      (id) => id.startsWith("sensor.") && Array.isArray(hass.states[id].attributes?.games)
    );
    return { entity: found || "sensor.nfl_scoreboard", mode: "full" };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    const leagues = [];
    if (config.entity) leagues.push(config.entity);
    if (Array.isArray(config.entities)) leagues.push(...config.entities);
    const teams = Array.isArray(config.teams) ? config.teams : [];
    if (!leagues.length && !teams.length) {
      throw new Error("Set 'entity', 'entities' or 'teams'");
    }
    const mode = config.mode === "compact" ? "compact" : "full";
    const style = config.style === "counter" ? "counter" : "default";
    this._config = {
      mode,
      style,
      embedded: config.embedded === true,
      title: config.title,
      names: config.names || (style === "counter" ? "short" : mode === "compact" ? "abbr" : "full"),
      filter: config.filter || (mode === "compact" ? "today" : "all"),
      max: config.max === undefined || config.max === null || !Number.isFinite(Number(config.max))
        ? (mode === "compact" ? 5 : 0)
        : Number(config.max),
      show_records: config.show_records !== false,
      show_tv: config.show_tv !== false,
      show_league_labels: config.show_league_labels,
      favorites: (config.favorites || []).map((f) => String(f).toUpperCase()),
      empty_text: config.empty_text,
      tap_action: config.tap_action,
      leagues: leagues.map((l) => (typeof l === "string" ? { entity: l } : l)),
      teams: teams.map((t) => (typeof t === "string" ? { entity: t } : t)),
    };
    this._lastStates = null;
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    const ids = this._entityIds();
    const changed = !this._lastStates || ids.some((id) => this._lastStates[id] !== hass.states[id]);
    if (!changed) return;
    this._lastStates = Object.fromEntries(ids.map((id) => [id, hass.states[id]]));
    this._render();
  }

  connectedCallback() {
    // Re-render every 5 minutes so "today" rolls over at midnight even if no sensor changes.
    this._timer = setInterval(() => this._hass && this._config && this._render(), 5 * 60 * 1000);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
  }

  getCardSize() {
    const n = this._lastCount ?? 3;
    return this._config?.mode === "compact" ? 1 + Math.min(n, this._config.max || n) : 1 + n * 2;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _entityIds() {
    return [...this._config.leagues, ...this._config.teams].map((e) => e.entity);
  }

  // ---------- data ----------

  _side(prefix, g) {
    const abbr = g[`${prefix}_abbr`] || lscStripRank(g[prefix]);
    return {
      abbr,
      full: g[`${prefix}_full`] || lscStripRank(g[`${prefix}_name`]) || abbr,
      short: g[`${prefix}_short`] || abbr,
      rank: g[`${prefix}_rank`] ?? (String(g[prefix] || "").match(/^#(\d+)/)?.[1] ?? null),
      logo: g[`${prefix}_logo`],
      color: g[`${prefix}_color`],
      record: g[`${prefix}_record`],
      score: g[`${prefix}_score`],
    };
  }

  _leagueGames(spec, warnings) {
    const st = this._hass.states[spec.entity];
    if (!st) { warnings.push(`Entity not found: ${spec.entity}`); return []; }
    const games = Array.isArray(st.attributes.games) ? st.attributes.games : [];
    const label = spec.label || st.attributes.friendly_name?.replace(/\s*scoreboard\s*$/i, "") || spec.entity;
    return games.map((g) => ({
      label,
      fav: false,
      state: g.state,
      detail: g.detail || "",
      tv: g.tv || "",
      date: g.date || null,
      day: g.day || (g.date ? lscLocalDay(g.date) : ""),
      away: this._side("away", g),
      home: this._side("home", g),
    }));
  }

  _teamGame(spec, warnings) {
    const st = this._hass.states[spec.entity];
    if (!st) { warnings.push(`Entity not found: ${spec.entity}`); return null; }
    const s = String(st.state || "").toUpperCase();
    if (!["PRE", "IN", "POST"].includes(s)) return null; // BYE, NOT_FOUND, unavailable
    const a = st.attributes;
    const colors = Array.isArray(a.team_colors) ? a.team_colors : [];
    const oppColors = Array.isArray(a.opponent_colors) ? a.opponent_colors : [];
    const mine = {
      abbr: a.team_abbr, full: a.team_name || a.team_abbr, short: a.team_name || a.team_abbr,
      rank: a.team_rank && Number(a.team_rank) <= 25 ? a.team_rank : null,
      logo: a.team_logo, color: colors[0], record: a.team_record, score: a.team_score,
    };
    const opp = {
      abbr: a.opponent_abbr, full: a.opponent_name || a.opponent_abbr, short: a.opponent_name || a.opponent_abbr,
      rank: a.opponent_rank && Number(a.opponent_rank) <= 25 ? a.opponent_rank : null,
      logo: a.opponent_logo, color: oppColors[0], record: a.opponent_record, score: a.opponent_score,
    };
    const isHome = String(a.team_homeaway || "").toLowerCase() === "home";
    const state = s.toLowerCase();
    let detail = "";
    if (state === "in") detail = a.clock || "Live";
    else if (state === "post") detail = "Final";
    else {
      const d = a.date ? new Date(a.date) : null;
      detail = d && !Number.isNaN(d.getTime())
        ? d.toLocaleString([], { weekday: "short", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" })
        : (a.kickoff_in || "");
    }
    return {
      label: spec.label || a.league || "★",
      fav: true,
      state,
      detail,
      tv: a.tv_network || "",
      date: a.date || null,
      day: a.date ? lscLocalDay(a.date) : "",
      away: isHome ? opp : mine,
      home: isHome ? mine : opp,
    };
  }

  _collect() {
    const warnings = [];
    const today = lscLocalDay(new Date());
    const teamGames = this._config.teams.map((t) => this._teamGame(t, warnings)).filter(Boolean);
    const pairKey = (g) => [g.away.abbr, g.home.abbr].map((x) => String(x).toUpperCase()).sort().join("|");
    const taken = new Set(teamGames.map(pairKey));

    let leagueGames = [];
    for (const spec of this._config.leagues) {
      leagueGames.push(...this._leagueGames(spec, warnings));
    }
    // Drop league rows already shown as one of your teams, mark favourites.
    leagueGames = leagueGames.filter((g) => !taken.has(pairKey(g)));
    const favs = this._config.favorites;
    for (const g of leagueGames) {
      if (favs.includes(String(g.away.abbr).toUpperCase()) || favs.includes(String(g.home.abbr).toUpperCase())) g.fav = true;
    }

    const keep = (g) => this._config.filter !== "today" || g.state === "in" || g.day === today;
    const orderOf = (g) => ({ in: 0, pre: 1, post: 2 }[g.state] ?? 3);
    const time = (g) => (g.date ? new Date(g.date).getTime() || 0 : 0);
    const sorter = (x, y) =>
      orderOf(x) - orderOf(y) ||
      (x.state === "post" ? time(y) - time(x) : time(x) - time(y));

    const teams = teamGames.filter(keep).sort(sorter);
    const rest = leagueGames.filter(keep).sort(sorter);
    return { warnings, teams, rest };
  }

  // ---------- render helpers ----------

  _name(side) {
    const n = this._config.names;
    if (n === "abbr") return side.abbr;
    if (n === "short") return side.short || side.abbr;
    return side.full || side.abbr;
  }

  _logo(side) {
    const url = lscSafeUrl(side.logo);
    if (url) {
      return `<img class="logo" src="${lscEscape(url)}" alt="" loading="lazy" data-abbr="${lscEscape(String(side.abbr || "").slice(0, 4))}" data-color="${lscEscape(lscColor(side.color))}">`;
    }
    const bg = lscColor(side.color);
    return `<div class="logo-fallback"${bg ? ` style="background:${bg}"` : ""}>${lscEscape(String(side.abbr || "").slice(0, 4))}</div>`;
  }

  _winner(g) {
    if (g.state !== "post") return null;
    const a = Number(g.away.score), h = Number(g.home.score);
    if (!Number.isFinite(a) || !Number.isFinite(h) || a === h) return null;
    return a > h ? "away" : "home";
  }

  _statusHtml(g) {
    const parts = [];
    if (g.state === "in") parts.push(`<span class="live"><span class="dot"></span>${lscEscape(g.detail)}</span>`);
    else parts.push(lscEscape(g.detail));
    if (this._config.show_tv && g.tv && g.state !== "post") parts.push(lscEscape(g.tv));
    return parts.join(" · ");
  }

  _fullTile(g) {
    const win = this._winner(g);
    const team = (side, which) => {
      const loser = win && win !== which ? " loser" : "";
      const rank = side.rank ? `<span class="rank">#${lscEscape(side.rank)}</span>` : "";
      const record = this._config.show_records && side.record
        ? `<span class="record">${lscEscape(side.record)}</span>` : "";
      const text = `<div class="text"><span class="name">${rank}${lscEscape(this._name(side))}</span>${record}</div>`;
      return which === "away"
        ? `<div class="team away${loser}">${this._logo(side)}${text}</div>`
        : `<div class="team home${loser}">${text}${this._logo(side)}</div>`;
    };
    const score = g.state === "pre"
      ? `<div class="score pre">@</div>`
      : `<div class="score"><span class="${win === "home" ? "loser" : ""}">${lscEscape(g.away.score)}</span><span class="dash">–</span><span class="${win === "away" ? "loser" : ""}">${lscEscape(g.home.score)}</span></div>`;
    const cls = ["game", g.state === "in" ? "live" : "", g.fav ? "fav" : ""].filter(Boolean).join(" ");
    return `<div class="${cls}">
      <div class="row">${team(g.away, "away")}${score}${team(g.home, "home")}</div>
      <div class="status">${this._statusHtml(g)}</div>
    </div>`;
  }

  _compactRow(g) {
    const win = this._winner(g);
    const side = (s, which) =>
      `<span class="abbr${win && win !== which ? " loser" : ""}">${s.rank ? `#${lscEscape(s.rank)} ` : ""}${lscEscape(this._name(s))}</span>`;
    const mid = g.state === "pre"
      ? `<span class="sep">@</span>`
      : `<span class="num${win === "home" ? " loser" : ""}">${lscEscape(g.away.score)}</span><span class="sep">–</span><span class="num${win === "away" ? " loser" : ""}">${lscEscape(g.home.score)}</span>`;
    return `<div class="crow">
      <span class="chip${g.fav ? " fav" : ""}" title="${g.fav ? "Your team" : ""}">${lscEscape(g.label)}</span>
      <div class="cmain">
        <div class="cline">${this._logo(g.away)}${side(g.away, "away")}${mid}${side(g.home, "home")}${this._logo(g.home)}</div>
        <div class="cstatus">${this._statusHtml(g)}</div>
      </div>
    </div>`;
  }

  /** One plain row, Counter Panel style: "Cowboys 21 – 17 Eagles ........ FINAL" */
  _counterRow(g) {
    const win = this._winner(g);
    const name = (s, which) => {
      const n = `${s.rank ? `#${s.rank} ` : ""}${this._name(s)}`;
      return `<span class="${win && win !== which ? "loser" : ""}">${lscEscape(n)}</span>`;
    };
    const mid = g.state === "pre" ? " vs " : ` ${lscEscape(g.away.score)} – ${lscEscape(g.home.score)} `;
    let tag, cls;
    if (g.state === "post") { tag = "FINAL"; cls = "final"; }
    else if (g.state === "in") { tag = String(g.detail || "LIVE").toUpperCase(); cls = "live"; }
    else {
      const d = g.date ? new Date(g.date) : null;
      if (d && !Number.isNaN(d.getTime())) {
        const today = lscLocalDay(d) === lscLocalDay(new Date());
        const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        tag = today ? t : `${d.toLocaleDateString([], { weekday: "short" })} ${t}`;
      } else tag = g.detail || "";
      cls = "pre";
    }
    return `<div class="crow2${g.state === "pre" ? " upcoming" : ""}">
      <span class="teams">${g.fav ? '<span class="star">★</span>' : ""}${name(g.away, "away")}${mid}${name(g.home, "home")}</span>
      <span class="tag ${cls}">${lscEscape(tag)}</span></div>`;
  }

  // ---------- render ----------

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const cfg = this._config;
    const { warnings, teams, rest } = this._collect();
    const compact = cfg.mode === "compact";
    const all = [...teams, ...rest];
    const limit = cfg.max > 0 ? cfg.max : all.length;
    const shown = all.slice(0, limit);
    const extra = all.length - shown.length;
    this._lastCount = shown.length;

    const tappable = cfg.tap_action && cfg.tap_action.action && cfg.tap_action.action !== "none";
    const counter = cfg.style === "counter";
    const trophy = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M5 5H3v2a4 4 0 0 0 4 4M19 5h2v2a4 4 0 0 1-4 4"/><path d="M10 15h4v2h-4zM9 21h6M11 17v4"/></svg>`;
    const header = !cfg.title ? "" : counter
      ? `<div class="header counter">${trophy}<span>${lscEscape(cfg.title)}</span>${tappable ? '<span class="chev">›</span>' : ""}</div>`
      : `<div class="header"><span>${lscEscape(cfg.title)}</span>${tappable ? '<span class="chev">›</span>' : ""}</div>`;

    let body = warnings.map((w) => `<div class="warn">${lscEscape(w)}</div>`).join("");
    if (!shown.length) {
      body += `<div class="empty">${lscEscape(cfg.empty_text || (cfg.filter === "today" ? "No live games or games today." : "No games this week."))}</div>`;
    } else if (counter) {
      body += shown.map((g) => this._counterRow(g)).join("");
    } else if (compact) {
      body += shown.map((g) => this._compactRow(g)).join("");
    } else {
      const labels = cfg.show_league_labels ?? (cfg.leagues.length + (cfg.teams.length ? 1 : 0) > 1);
      let prev = null;
      for (const g of shown) {
        const groupName = g.fav && teams.includes(g) ? "My teams" : g.label;
        if (labels && groupName !== prev) {
          body += `<div class="group-label">${lscEscape(groupName)}</div>`;
          prev = groupName;
        }
        body += this._fullTile(g);
      }
    }
    if (extra > 0) {
      body += `<div class="more">+${extra} more${tappable ? " — tap to see all" : ""}</div>`;
    }

    this.shadowRoot.innerHTML = `
      <style>${LSC_STYLES}</style>
      <ha-card class="${[tappable ? "tappable" : "", cfg.embedded ? "embedded" : "", counter ? "counter" : ""].filter(Boolean).join(" ")}" ${tappable ? 'role="button" tabindex="0"' : ""}>
        ${header}
        <div class="body${compact ? " compact" : ""}${counter ? " clist" : ""}">${body}</div>
      </ha-card>`;

    // Swap any logo that fails to load for a coloured badge with the team abbreviation.
    this.shadowRoot.querySelectorAll("img.logo").forEach((img) => {
      img.addEventListener("error", () => {
        const badge = document.createElement("div");
        badge.className = "logo-fallback";
        badge.textContent = img.dataset.abbr || "";
        if (img.dataset.color) badge.style.background = img.dataset.color;
        img.replaceWith(badge);
      }, { once: true });
    });

    if (tappable) {
      const card = this.shadowRoot.querySelector("ha-card");
      card.addEventListener("click", () => this._handleTap());
      card.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); this._handleTap(); }
      });
    }
  }

  _handleTap() {
    const action = this._config.tap_action || {};
    if (action.action === "navigate" && action.navigation_path) {
      history.pushState(null, "", action.navigation_path);
      window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
    } else if (action.action === "more-info") {
      const entityId = action.entity || this._config.leagues[0]?.entity || this._config.teams[0]?.entity;
      this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId } }));
    } else if (action.action === "url" && action.url_path) {
      window.open(action.url_path, "_blank", "noopener");
    }
  }
}

if (!customElements.get("league-scoreboard-card")) {
  customElements.define("league-scoreboard-card", LeagueScoreboardCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "league-scoreboard-card",
    name: "League Scoreboard Card",
    description: "Whole-league scoreboards and your Team Tracker teams, in full or compact form.",
    preview: false,
  });
  console.info(`%c LEAGUE-SCOREBOARD-CARD %c v${LSC_VERSION} `, "background:#C97A46;color:#fff;font-weight:700", "");
}
