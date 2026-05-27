/* ============================================================
   STATScore™ Athlete Search Engine
   Full Production Replacement
   Schema-aligned to public.statscore_snapshots
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-athlete-search-engine";
  const VERSION = "v1.1-schema-aligned";

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

  function getSupabaseClient() {
    return (
      window.statscoreSupabase ||
      window.STATScoreSupabase ||
      window.supabaseClient ||
      window.supabase ||
      null
    );
  }

  function normalizeQuery(value) {
    return String(value || "").trim();
  }

  function escapeSupabaseValue(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_")
      .replace(/,/g, "\\,");
  }

  function buildOrFilter(query) {
    const q = escapeSupabaseValue(query);
    return SEARCH_COLUMNS.map((column) => `${column}.ilike.%${q}%`).join(",");
  }

  function fullName(row) {
    if (row.athlete_display_name) return row.athlete_display_name;

    const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
    return name || "Unnamed Athlete";
  }

  function normalizeRow(row) {
    return {
      snapshot_id: row.snapshot_id || "",
      athlete_id: row.athlete_id || "",
      athlete_display_name: fullName(row),
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
      ncaa_eligibility_status: row.ncaa_eligibility_status || "",
      current_gpa: row.current_gpa || "",
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

  function demoAthletes() {
    return [
      {
        athlete_id: "test-athlete-football-001",
        snapshot_id: "test-snapshot-football-001",
        athlete_display_name: "Demo Football Athlete",
        primary_sport: "football",
        primary_position: "QB",
        secondary_position: "",
        graduation_class: "2027",
        school_program: "STATScore Demo High",
        city_state: "Pensacola, FL",
        snapshot_status: "TEST_MODE",
        verification_status: "TEST_MODE",
        score_status: "TEST_PENDING",
        ncaa_eligibility_status: "TEST_PENDING"
      },
      {
        athlete_id: "test-athlete-basketball-001",
        snapshot_id: "test-snapshot-basketball-001",
        athlete_display_name: "Demo Basketball Athlete",
        primary_sport: "basketball",
        primary_position: "Guard",
        secondary_position: "",
        graduation_class: "2028",
        school_program: "STATScore Demo High",
        city_state: "Pensacola, FL",
        snapshot_status: "TEST_MODE",
        verification_status: "TEST_MODE",
        score_status: "TEST_PENDING",
        ncaa_eligibility_status: "TEST_PENDING"
      },
      {
        athlete_id: "test-athlete-baseball-001",
        snapshot_id: "test-snapshot-baseball-001",
        athlete_display_name: "Demo Baseball Athlete",
        primary_sport: "baseball",
        primary_position: "Pitcher",
        secondary_position: "",
        graduation_class: "2027",
        school_program: "STATScore Demo High",
        city_state: "Pensacola, FL",
        snapshot_status: "TEST_MODE",
        verification_status: "TEST_MODE",
        score_status: "TEST_PENDING",
        ncaa_eligibility_status: "TEST_PENDING"
      },
      {
        athlete_id: "test-athlete-track-001",
        snapshot_id: "test-snapshot-track-001",
        athlete_display_name: "Demo Track Athlete",
        primary_sport: "track",
        primary_position: "100m",
        secondary_position: "200m",
        graduation_class: "2026",
        school_program: "STATScore Demo High",
        city_state: "Pensacola, FL",
        snapshot_status: "TEST_MODE",
        verification_status: "TEST_MODE",
        score_status: "TEST_PENDING",
        ncaa_eligibility_status: "TEST_PENDING"
      }
    ];
  }

  async function searchDatabase(query) {
    const client = getSupabaseClient();

    if (!client || typeof client.from !== "function") {
      warn("Supabase client unavailable. Using demo fallback.");
      return {
        ok: true,
        status: "DEMO_FALLBACK",
        source: "DEMO",
        count: demoAthletes().length,
        results: filterDemo(query)
      };
    }

    const orFilter = buildOrFilter(query);

    const { data, error: dbError } = await client
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .or(orFilter)
      .order("updated_at", { ascending: false })
      .limit(25);

    if (dbError) {
      error("Database search failed:", dbError);
      return {
        ok: false,
        status: "SEARCH_FAILED",
        source: "DATABASE",
        count: 0,
        error: dbError,
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

  function filterDemo(query) {
    const q = normalizeQuery(query).toLowerCase();

    return demoAthletes()
      .filter((row) => {
        return [
          row.athlete_display_name,
          row.primary_sport,
          row.primary_position,
          row.secondary_position,
          row.graduation_class,
          row.school_program,
          row.city_state
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      })
      .map(normalizeRow);
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

    container.style.position = "relative";
    container.style.zIndex = "9999";
    container.style.margin = "8px 0 18px 0";
    container.style.maxWidth = "720px";
    container.style.background = "rgba(5, 8, 14, 0.96)";
    container.style.border = "1px solid rgba(255, 52, 52, 0.55)";
    container.style.boxShadow = "0 10px 30px rgba(0,0,0,.45)";
    container.style.display = "none";

    if (input && input.parentElement) {
      input.parentElement.insertAdjacentElement("afterend", container);
    } else {
      document.body.prepend(container);
    }

    return container;
  }

  function renderResults(container, response) {
    if (!container) return;

    container.innerHTML = "";
    container.style.display = "block";

    const header = document.createElement("div");
    header.style.padding = "10px 12px";
    header.style.color = "#ffffff";
    header.style.fontWeight = "900";
    header.style.letterSpacing = "0.12em";
    header.style.textTransform = "uppercase";
    header.style.borderBottom = "1px solid rgba(255,255,255,.14)";
    header.textContent = response.ok
      ? `STATScore Search Results (${response.count})`
      : "STATScore Search Failed";

    container.appendChild(header);

    if (!response.ok) {
      const fail = document.createElement("div");
      fail.style.padding = "12px";
      fail.style.color = "#ffb4b4";
      fail.textContent =
        "Search could not complete. Runtime stayed alive. Check console for schema or database details.";
      container.appendChild(fail);
      return;
    }

    if (!response.results.length) {
      const empty = document.createElement("div");
      empty.style.padding = "12px";
      empty.style.color = "#cfd8e3";
      empty.textContent = "No matching athlete records found.";
      container.appendChild(empty);
      return;
    }

    response.results.forEach((row) => {
      const item = document.createElement("button");
      item.type = "button";

      item.style.display = "block";
      item.style.width = "100%";
      item.style.textAlign = "left";
      item.style.padding = "12px";
      item.style.cursor = "pointer";
      item.style.background = "rgba(255,255,255,.035)";
      item.style.border = "0";
      item.style.borderBottom = "1px solid rgba(255,255,255,.1)";
      item.style.color = "#fff";

      const positionLine = [
        row.primary_sport,
        row.primary_position,
        row.secondary_position,
        row.graduation_class
      ]
        .filter(Boolean)
        .join(" · ");

      item.innerHTML = `
        <div style="font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#fff;">
          ${row.athlete_display_name}
        </div>
        <div style="margin-top:4px;color:#ff3434;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">
          ${positionLine || "Athlete Profile"}
        </div>
        <div style="margin-top:4px;color:#b9c4d6;">
          ${(row.school_program || "Program Pending")} · ${(row.city_state || "Location Pending")}
        </div>
        <div style="margin-top:6px;color:#9fe7ff;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">
          Verification: ${row.verification_status || "Pending"} · NCAA: ${row.ncaa_eligibility_status || "Pending"}
        </div>
      `;

      item.addEventListener("click", () => {
        const url = profileUrl(row);
        log("Routing to athlete profile:", url);
        window.location.href = url;
      });

      container.appendChild(item);
    });
  }

  async function runSearch(query, options) {
    const q = normalizeQuery(query);

    if (!q) {
      return {
        ok: false,
        status: "EMPTY_QUERY",
        source: "CLIENT",
        count: 0,
        results: []
      };
    }

    const response = await searchDatabase(q);

    log("Search Results:", response);

    if (options && options.render !== false) {
      const input = findSearchInput();
      const container = ensureResultsContainer(input);
      renderResults(container, response);
    }

    if (window.STATScoreEngineBus && typeof window.STATScoreEngineBus.emit === "function") {
      window.STATScoreEngineBus.emit("athlete_search_completed", response);
    }

    return response;
  }

  function bindSearchUI() {
    const input = findSearchInput();

    if (!input) {
      warn("Search input not found. Engine loaded in API mode only.");
      return;
    }

    const button = findSearchButton(input);
    const container = ensureResultsContainer(input);

    const execute = async () => {
      const query = normalizeQuery(input.value);
      const response = await runSearch(query, { render: true });
      renderResults(container, response);
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

    log("Search UI bound successfully.");
  }

  function init() {
    if (window.__STATSCORE_ATHLETE_SEARCH_LOADED__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_ATHLETE_SEARCH_LOADED__ = true;

    window.STATScoreAthleteSearch = {
      engine_id: ENGINE_ID,
      version: VERSION,
      table: TABLE,
      search_columns: SEARCH_COLUMNS.slice(),
      select_columns: SELECT_COLUMNS,
      search: runSearch,
      demoAthletes,
      normalizeRow,
      profileUrl,
      init
    };

    bindSearchUI();

    if (window.STATScoreEngineBus && typeof window.STATScoreEngineBus.emit === "function") {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE"
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      table: TABLE,
      schema: "primary_sport aligned"
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(); 
