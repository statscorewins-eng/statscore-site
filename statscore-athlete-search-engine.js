/* ============================================================
   STATScore™ Athlete Search Engine
   FULL PRODUCTION REPLACEMENT
   Phase 1 Runtime + Flow Stabilization
   Purpose:
   Search → Resolve Athlete Snapshot → Route to player-profile.html
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-athlete-search-engine";
  const VERSION = "v2.0-profile-router";
  const TABLE = "statscore_snapshots";

  const SEARCH_COLUMNS = [
    "athlete_display_name",
    "first_name",
    "last_name",
    "school_program",
    "city_state",
    "primary_sport",
    "primary_position",
    "secondary_position",
    "graduation_class"
  ];

  const SELECT_COLUMNS = [
    "snapshot_id",
    "athlete_id",
    "snapshot_status",
    "verification_status",
    "score_status",
    "first_name",
    "last_name",
    "athlete_display_name",
    "graduation_class",
    "city_state",
    "school_program",
    "primary_sport",
    "primary_position",
    "secondary_position",
    "current_gpa",
    "ncaa_eligibility_status",
    "highlight_url",
    "game_film_url",
    "recruiting_profile_url",
    "headshot_public_url",
    "created_at",
    "updated_at"
  ].join(",");

  function log(message, payload) {
    console.log(`[STATScore Athlete Search] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Athlete Search] ${message}`, payload || "");
  }

  function error(message, payload) {
    console.error(`[STATScore Athlete Search] ${message}`, payload || "");
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function lower(value) {
    return normalize(value).toLowerCase();
  }

  function getSupabaseClient() {
    if (window.STATScoreSupabase && typeof window.STATScoreSupabase.from === "function") {
      return window.STATScoreSupabase;
    }

    if (window.statscoreSupabase && typeof window.statscoreSupabase.from === "function") {
      return window.statscoreSupabase;
    }

    if (window.supabaseClient && typeof window.supabaseClient.from === "function") {
      return window.supabaseClient;
    }

    if (window.STATSCORE_SUPABASE_CLIENT && typeof window.STATSCORE_SUPABASE_CLIENT.from === "function") {
      return window.STATSCORE_SUPABASE_CLIENT;
    }

    return null;
  }

  function buildOrFilter(query) {
    const q = normalize(query).replace(/,/g, "\\,");
    return SEARCH_COLUMNS.map((column) => `${column}.ilike.%${q}%`).join(",");
  }

  function displayName(row) {
    if (row.athlete_display_name) return row.athlete_display_name;

    const joined = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
    return joined || "Unnamed Athlete";
  }

  function normalizeRow(row) {
    return {
      snapshot_id: row.snapshot_id || "",
      athlete_id: row.athlete_id || "",
      athlete_display_name: displayName(row),
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      graduation_class: row.graduation_class || "",
      city_state: row.city_state || "",
      school_program: row.school_program || "",
      primary_sport: row.primary_sport || "",
      primary_position: row.primary_position || "",
      secondary_position: row.secondary_position || "",
      snapshot_status: row.snapshot_status || "",
      verification_status: row.verification_status || "",
      score_status: row.score_status || "",
      current_gpa: row.current_gpa || "",
      ncaa_eligibility_status: row.ncaa_eligibility_status || "",
      highlight_url: row.highlight_url || "",
      game_film_url: row.game_film_url || "",
      recruiting_profile_url: row.recruiting_profile_url || "",
      headshot_public_url: row.headshot_public_url || "",
      created_at: row.created_at || "",
      updated_at: row.updated_at || ""
    };
  }

  function profileUrl(row) {
    const params = new URLSearchParams();

    if (row.snapshot_id) params.set("snapshot_id", row.snapshot_id);
    if (row.athlete_id) params.set("athlete_id", row.athlete_id);

    return `player-profile.html?${params.toString()}`;
  }

  function findSearchInput() {
    return (
      document.querySelector("[data-statscore-athlete-search]") ||
      document.querySelector("#statscore-athlete-search") ||
      document.querySelector("#athlete-search") ||
      document.querySelector('input[placeholder*="Search athlete"]') ||
      document.querySelector('input[placeholder*="athlete"]') ||
      document.querySelector('input[type="search"]')
    );
  }

  function findSearchButton(input) {
    return (
      document.querySelector("[data-statscore-athlete-search-button]") ||
      document.querySelector("#statscore-athlete-search-button") ||
      document.querySelector("#athlete-search-button") ||
      (input && input.parentElement ? input.parentElement.querySelector("button") : null)
    );
  }

  function ensureResultsContainer(input) {
    let container =
      document.querySelector("[data-statscore-athlete-search-results]") ||
      document.querySelector("#statscore-athlete-search-results");

    if (container) return container;

    container = document.createElement("div");
    container.id = "statscore-athlete-search-results";
    container.setAttribute("data-statscore-athlete-search-results", "true");
    container.style.display = "none";
    container.style.position = "relative";
    container.style.zIndex = "9999";
    container.style.maxWidth = "760px";
    container.style.margin = "8px 0 18px 0";
    container.style.background = "rgba(5,8,14,.97)";
    container.style.border = "1px solid rgba(255,52,52,.65)";
    container.style.boxShadow = "0 12px 32px rgba(0,0,0,.5)";
    container.style.color = "#fff";

    if (input && input.parentElement) {
      input.parentElement.insertAdjacentElement("afterend", container);
    } else {
      document.body.prepend(container);
    }

    return container;
  }

  function clearResults() {
    const container =
      document.querySelector("[data-statscore-athlete-search-results]") ||
      document.querySelector("#statscore-athlete-search-results");

    if (container) {
      container.innerHTML = "";
      container.style.display = "none";
    }
  }

  function renderNoMatch(container, query) {
    container.innerHTML = "";
    container.style.display = "block";

    container.innerHTML = `
      <div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.14);font-weight:900;letter-spacing:.12em;text-transform:uppercase;">
        STATScore Search
      </div>
      <div style="padding:16px;color:#cfd8e3;">
        No athlete profile matched: <strong>${query}</strong>
      </div>
    `;
  }

  function renderError(container, message) {
    container.innerHTML = "";
    container.style.display = "block";

    container.innerHTML = `
      <div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.14);font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#ff3434;">
        STATScore Search Error
      </div>
      <div style="padding:16px;color:#ffb4b4;">
        ${message}
      </div>
    `;
  }

  function renderMultiple(container, results) {
    container.innerHTML = "";
    container.style.display = "block";

    const header = document.createElement("div");
    header.style.padding = "14px 16px";
    header.style.borderBottom = "1px solid rgba(255,255,255,.14)";
    header.style.fontWeight = "900";
    header.style.letterSpacing = ".12em";
    header.style.textTransform = "uppercase";
    header.textContent = `STATScore Search Results (${results.length})`;
    container.appendChild(header);

    results.forEach((row) => {
      const button = document.createElement("button");
      button.type = "button";

      button.style.display = "block";
      button.style.width = "100%";
      button.style.textAlign = "left";
      button.style.padding = "14px 16px";
      button.style.background = "rgba(255,255,255,.035)";
      button.style.border = "0";
      button.style.borderBottom = "1px solid rgba(255,255,255,.1)";
      button.style.color = "#fff";
      button.style.cursor = "pointer";

      const line = [
        row.primary_sport,
        row.primary_position,
        row.secondary_position,
        row.graduation_class
      ].filter(Boolean).join(" · ");

      button.innerHTML = `
        <div style="font-weight:900;letter-spacing:.08em;text-transform:uppercase;">
          ${row.athlete_display_name}
        </div>
        <div style="margin-top:5px;color:#ff3434;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">
          ${line || "Athlete Profile"}
        </div>
        <div style="margin-top:5px;color:#b9c4d6;">
          ${(row.school_program || "Program Pending")} · ${(row.city_state || "Location Pending")}
        </div>
        <div style="margin-top:6px;color:#9fe7ff;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">
          Verification: ${row.verification_status || "Pending"} · NCAA: ${row.ncaa_eligibility_status || "Pending"}
        </div>
      `;

      button.addEventListener("click", function () {
        routeToProfile(row);
      });

      container.appendChild(button);
    });
  }

  function routeToProfile(row) {
    if (!row || (!row.snapshot_id && !row.athlete_id)) {
      error("Cannot route. Athlete row missing snapshot_id and athlete_id.", row);
      return;
    }

    const url = profileUrl(row);
    log("Routing to player profile:", url);

    if (window.STATScoreEngineBus && typeof window.STATScoreEngineBus.emit === "function") {
      window.STATScoreEngineBus.emit("athlete_profile_route_requested", {
        engine: ENGINE_ID,
        snapshot_id: row.snapshot_id,
        athlete_id: row.athlete_id,
        url
      });
    }

    window.location.href = url;
  }

  async function searchLiveDatabase(query) {
    const client = getSupabaseClient();

    if (!client) {
      return {
        ok: false,
        status: "SUPABASE_CLIENT_UNAVAILABLE",
        source: "CLIENT",
        count: 0,
        results: []
      };
    }

    const { data, error: dbError } = await client
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .or(buildOrFilter(query))
      .order("updated_at", { ascending: false })
      .limit(20);

    if (dbError) {
      return {
        ok: false,
        status: "DATABASE_SEARCH_FAILED",
        source: "DATABASE",
        error: dbError,
        count: 0,
        results: []
      };
    }

    const results = Array.isArray(data) ? data.map(normalizeRow) : [];

    return {
      ok: true,
      status: "SEARCH_COMPLETE",
      source: "DATABASE",
      count: results.length,
      results
    };
  }

  function exactSort(query, results) {
    const q = lower(query);

    return results.slice().sort((a, b) => {
      const aName = lower(a.athlete_display_name);
      const bName = lower(b.athlete_display_name);

      if (aName === q && bName !== q) return -1;
      if (bName === q && aName !== q) return 1;

      if (aName.startsWith(q) && !bName.startsWith(q)) return -1;
      if (bName.startsWith(q) && !aName.startsWith(q)) return 1;

      return aName.localeCompare(bName);
    });
  }

  async function runSearch(query, options) {
    const q = normalize(query);
    const input = findSearchInput();
    const container = ensureResultsContainer(input);

    if (!q) {
      renderError(container, "Enter an athlete name, school, sport, class, or position.");
      return {
        ok: false,
        status: "EMPTY_QUERY",
        source: "CLIENT",
        count: 0,
        results: []
      };
    }

    const response = await searchLiveDatabase(q);

    log("Search response:", response);

    if (!response.ok) {
      if (response.status === "SUPABASE_CLIENT_UNAVAILABLE") {
        renderError(
          container,
          "Supabase client unavailable. Live athlete search cannot run until the STATScore Supabase client is exposed on this page."
        );
      } else {
        renderError(container, "Database search failed. Check console for details.");
        error("Database search failed:", response.error || response);
      }

      return response;
    }

    const results = exactSort(q, response.results);

    if (!results.length) {
      renderNoMatch(container, q);
      return response;
    }

    if (results.length === 1 || lower(results[0].athlete_display_name) === lower(q)) {
      clearResults();
      routeToProfile(results[0]);
      return response;
    }

    renderMultiple(container, results);
    return response;
  }

  function bindSearchUI() {
    const input = findSearchInput();

    if (!input) {
      warn("Search input not found. Engine loaded API-only.");
      return;
    }

    const button = findSearchButton(input);

    const execute = function () {
      runSearch(input.value);
    };

    if (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        execute();
      });
    }

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        execute();
      }
    });

    log("Search UI bound. Mode: search-to-profile router.");
  }

  function init() {
    if (window.__STATSCORE_ATHLETE_SEARCH_ENGINE_V2__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_ATHLETE_SEARCH_ENGINE_V2__ = true;

    window.STATScoreAthleteSearch = {
      engine_id: ENGINE_ID,
      version: VERSION,
      table: TABLE,
      search_columns: SEARCH_COLUMNS.slice(),
      select_columns: SELECT_COLUMNS,
      search: runSearch,
      routeToProfile,
      profileUrl,
      normalizeRow
    };

    bindSearchUI();

    if (window.STATScoreEngineBus && typeof window.STATScoreEngineBus.emit === "function") {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        mode: "SEARCH_TO_PROFILE_ROUTER"
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      mode: "SEARCH_TO_PROFILE_ROUTER"
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(); 
