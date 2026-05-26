/* ============================================================
   STATScore™ Athlete Search Engine
   File: statscore-athlete-search-engine.js
   Version: STATSCORE-ATHLETE-SEARCH-ENGINE-V1
   Purpose:
   Role-aware athlete discovery, test-mode lookup,
   snapshot search, controlled visibility search,
   recruiter-safe athlete locating, and demo search support.
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const AthleteSearchEngine = {

    version: "STATSCORE-ATHLETE-SEARCH-ENGINE-V1",

    TEST_MODE_KEY: "statscore_test_mode",

    SEARCH_STATUS: {
      READY: "READY",
      EMPTY_QUERY: "EMPTY_QUERY",
      NO_RESULTS: "NO_RESULTS",
      RESULTS_READY: "RESULTS_READY",
      DB_UNAVAILABLE: "DB_UNAVAILABLE",
      SEARCH_FAILED: "SEARCH_FAILED",
      SAFE_MODE: "SAFE_MODE"
    },

    nowISO() {
      return new Date().toISOString();
    },

    core() {
      return window.STATScoreCore || null;
    },

    data() {
      return window.STATScoreData || null;
    },

    roleAccess() {
      return window.STATScoreRoleAccess || null;
    },

    safe(value, fallback = "") {
      return this.core()?.safe?.(value, fallback) ?? (value || fallback);
    },

    lower(value) {
      return String(value || "").trim().toLowerCase();
    },

    normalizeQuery(query) {
      return String(query || "")
        .trim()
        .replace(/\s+/g, " ");
    },

    isTestMode(context = {}) {
      const url = new URLSearchParams(window.location.search);

      return !!(
        context.test_mode === true ||
        window.STATScore?.TestMode?.active === true ||
        url.get("test_mode") === "true" ||
        localStorage.getItem(this.TEST_MODE_KEY) === "true"
      );
    },

    enableTestMode() {
      window.STATScore.TestMode = window.STATScore.TestMode || {};
      window.STATScore.TestMode.active = true;
      localStorage.setItem(this.TEST_MODE_KEY, "true");

      return {
        ok: true,
        status: "TEST_MODE_ENABLED",
        enabled_at: this.nowISO()
      };
    },

    disableTestMode() {
      window.STATScore.TestMode = window.STATScore.TestMode || {};
      window.STATScore.TestMode.active = false;
      localStorage.removeItem(this.TEST_MODE_KEY);

      return {
        ok: true,
        status: "TEST_MODE_DISABLED",
        disabled_at: this.nowISO()
      };
    },

    demoAthletes() {
      return [
        {
          athlete_id: "test-athlete-football-001",
          snapshot_id: "test-snapshot-football-001",
          athlete_display_name: "Demo Football Athlete",
          sport: "football",
          position: "QB",
          graduation_class: "2027",
          school: "STATScore Demo High",
          city_state: "Pensacola, FL",
          visibility_state: "CONTROLLED_PUBLIC",
          verification_status: "TEST_MODE",
          score_status: "TEST_PENDING",
          profile_url: "player-profile.html?snapshot_id=test-snapshot-football-001&test_mode=true"
        },
        {
          athlete_id: "test-athlete-basketball-001",
          snapshot_id: "test-snapshot-basketball-001",
          athlete_display_name: "Demo Basketball Athlete",
          sport: "basketball",
          position: "PG",
          graduation_class: "2027",
          school: "STATScore Demo High",
          city_state: "Pensacola, FL",
          visibility_state: "CONTROLLED_PUBLIC",
          verification_status: "TEST_MODE",
          score_status: "TEST_PENDING",
          profile_url: "player-profile.html?snapshot_id=test-snapshot-basketball-001&test_mode=true"
        },
        {
          athlete_id: "test-athlete-baseball-001",
          snapshot_id: "test-snapshot-baseball-001",
          athlete_display_name: "Demo Baseball Athlete",
          sport: "baseball",
          position: "Pitcher",
          graduation_class: "2027",
          school: "STATScore Demo High",
          city_state: "Pensacola, FL",
          visibility_state: "CONTROLLED_PUBLIC",
          verification_status: "TEST_MODE",
          score_status: "TEST_PENDING",
          profile_url: "player-profile.html?snapshot_id=test-snapshot-baseball-001&test_mode=true"
        },
        {
          athlete_id: "test-athlete-track-001",
          snapshot_id: "test-snapshot-track-001",
          athlete_display_name: "Demo Track Athlete",
          sport: "track",
          position: "100m / 200m",
          graduation_class: "2027",
          school: "STATScore Demo High",
          city_state: "Pensacola, FL",
          visibility_state: "CONTROLLED_PUBLIC",
          verification_status: "TEST_MODE",
          score_status: "TEST_PENDING",
          profile_url: "player-profile.html?snapshot_id=test-snapshot-track-001&test_mode=true"
        }
      ];
    },

    matchDemoAthlete(athlete, filters = {}) {
      const query = this.lower(filters.query);
      const sport = this.lower(filters.sport);
      const position = this.lower(filters.position);
      const classYear = this.lower(filters.graduation_class);
      const school = this.lower(filters.school);
      const cityState = this.lower(filters.city_state);

      const haystack = [
        athlete.athlete_display_name,
        athlete.sport,
        athlete.position,
        athlete.graduation_class,
        athlete.school,
        athlete.city_state,
        athlete.snapshot_id,
        athlete.athlete_id
      ].map(v => this.lower(v)).join(" ");

      if (query && !haystack.includes(query)) return false;
      if (sport && this.lower(athlete.sport) !== sport) return false;
      if (position && !this.lower(athlete.position).includes(position)) return false;
      if (classYear && this.lower(athlete.graduation_class) !== classYear) return false;
      if (school && !this.lower(athlete.school).includes(school)) return false;
      if (cityState && !this.lower(athlete.city_state).includes(cityState)) return false;

      return true;
    },

    searchDemoAthletes(filters = {}, context = {}) {
      const results = this.demoAthletes()
        .filter(athlete => this.matchDemoAthlete(athlete, filters))
        .map(athlete => this.filterResultByRole(athlete, context.role || "athlete"));

      return {
        ok: true,
        status: results.length ? this.SEARCH_STATUS.RESULTS_READY : this.SEARCH_STATUS.NO_RESULTS,
        source: "TEST_MODE",
        count: results.length,
        results,
        generated_at: this.nowISO()
      };
    },

    getDbClient() {
      return this.core()?.getClient?.() || this.data()?.getClient?.() || null;
    },

    buildDbQuery(db, filters = {}, context = {}) {
      let query = db
        .from("statscore_snapshots")
        .select("*")
        .limit(Number(context.limit || 25));

      const q = this.normalizeQuery(filters.query);

      if (q) {
        query = query.or([
          `athlete_display_name.ilike.%${q}%`,
          `first_name.ilike.%${q}%`,
          `last_name.ilike.%${q}%`,
          `sport.ilike.%${q}%`,
          `position.ilike.%${q}%`,
          `school.ilike.%${q}%`,
          `city_state.ilike.%${q}%`,
          `snapshot_id.eq.${q}`,
          `athlete_id.eq.${q}`
        ].join(","));
      }

      if (filters.sport) {
        query = query.ilike("sport", `%${filters.sport}%`);
      }

      if (filters.position) {
        query = query.ilike("position", `%${filters.position}%`);
      }

      if (filters.graduation_class) {
        query = query.eq("graduation_class", String(filters.graduation_class));
      }

      if (filters.school) {
        query = query.ilike("school", `%${filters.school}%`);
      }

      if (filters.city_state) {
        query = query.ilike("city_state", `%${filters.city_state}%`);
      }

      query = query.order("created_at", { ascending: false });

      return query;
    },

    filterResultByRole(record = {}, role = "athlete") {
      const r = this.lower(role);

      const publicBase = {
        athlete_id: record.athlete_id || null,
        snapshot_id: record.snapshot_id || null,
        athlete_display_name: record.athlete_display_name || "Athlete",
        sport: record.sport || "",
        position: record.position || "",
        graduation_class: record.graduation_class || "",
        school: record.school || "",
        city_state: record.city_state || "",
        visibility_state: record.visibility_state || record.profile_visibility || "CONTROLLED",
        verification_status: record.verification_status || "PENDING",
        score_status: record.score_status || "PENDING",
        profile_url:
          record.profile_url ||
          `player-profile.html?snapshot_id=${encodeURIComponent(record.snapshot_id || "")}`
      };

      if (r === "recruiter") {
        return {
          ...publicBase,
          contact_status: "REQUEST_REQUIRED",
          extended_access: "CONTROLLED"
        };
      }

      if (r === "coach") {
        return {
          ...publicBase,
          coach_context: "VISIBLE_IF_ASSIGNED_OR_PUBLIC"
        };
      }

      if (r === "counselor") {
        return {
          ...publicBase,
          academic_review_visible: true
        };
      }

      if (r === "evaluator") {
        return {
          ...publicBase,
          evaluator_review_visible: true
        };
      }

      if (r === "program" || r === "admin") {
        return {
          ...record,
          profile_url: publicBase.profile_url
        };
      }

      return publicBase;
    },

    async search(filters = {}, context = {}) {
      const normalizedFilters = {
        ...filters,
        query: this.normalizeQuery(filters.query)
      };

      if (
        !normalizedFilters.query &&
        !normalizedFilters.sport &&
        !normalizedFilters.position &&
        !normalizedFilters.graduation_class &&
        !normalizedFilters.school &&
        !normalizedFilters.city_state
      ) {
        return {
          ok: false,
          status: this.SEARCH_STATUS.EMPTY_QUERY,
          source: "NONE",
          count: 0,
          results: [],
          message: "Enter a name, sport, position, class year, school, city/state, athlete ID, or snapshot ID."
        };
      }

      if (this.isTestMode(context)) {
        return this.searchDemoAthletes(normalizedFilters, context);
      }

      const db = this.getDbClient();

      if (!db) {
        return {
          ok: false,
          status: this.SEARCH_STATUS.DB_UNAVAILABLE,
          source: "DATABASE",
          count: 0,
          results: [],
          message: "Database unavailable. Athlete search is in safe mode."
        };
      }

      try {
        const { data, error } = await this.buildDbQuery(db, normalizedFilters, context);

        if (error) {
          console.error("STATScore athlete search failed:", error);

          return {
            ok: false,
            status: this.SEARCH_STATUS.SEARCH_FAILED,
            source: "DATABASE",
            count: 0,
            results: [],
            error,
            message: "Athlete search failed. Review database table/column alignment."
          };
        }

        const role = context.role || "athlete";

        const results = (data || []).map(record =>
          this.filterResultByRole(record, role)
        );

        return {
          ok: true,
          status: results.length ? this.SEARCH_STATUS.RESULTS_READY : this.SEARCH_STATUS.NO_RESULTS,
          source: "DATABASE",
          count: results.length,
          results,
          generated_at: this.nowISO()
        };

      } catch (error) {
        console.error("STATScore athlete search exception:", error);

        return {
          ok: false,
          status: this.SEARCH_STATUS.SEARCH_FAILED,
          source: "DATABASE",
          count: 0,
          results: [],
          error,
          message: "Athlete search encountered an exception."
        };
      }
    },

    async searchBySnapshotId(snapshotId, context = {}) {
      return await this.search(
        { query: snapshotId },
        context
      );
    },

    renderSearchBox(targetId, options = {}) {
      const el = document.getElementById(targetId);
      if (!el) return;

      el.innerHTML = `
        <div class="athlete-search-box">
          <div class="search-kicker">STATScore Athlete Search</div>
          <input id="statscoreAthleteSearchInput" type="text" placeholder="Search athlete, sport, position, school, class year, or snapshot ID" />
          <div class="search-row">
            <select id="statscoreAthleteSearchRole">
              <option value="athlete">Athlete</option>
              <option value="parent">Parent</option>
              <option value="coach">Coach</option>
              <option value="counselor">Counselor</option>
              <option value="recruiter">Recruiter</option>
              <option value="evaluator">Evaluator</option>
              <option value="program">Program</option>
              <option value="admin">Admin</option>
            </select>
            <button id="statscoreAthleteSearchBtn" type="button">Search</button>
          </div>
          <div id="statscoreAthleteSearchResults"></div>
        </div>
      `;

      const btn = document.getElementById("statscoreAthleteSearchBtn");

      btn?.addEventListener("click", async () => {
        const input = document.getElementById("statscoreAthleteSearchInput");
        const role = document.getElementById("statscoreAthleteSearchRole");
        const resultTarget = document.getElementById("statscoreAthleteSearchResults");

        resultTarget.innerHTML = `<p>Searching...</p>`;

        const report = await this.search(
          { query: input?.value || "" },
          {
            role: role?.value || options.role || "athlete",
            test_mode: options.test_mode
          }
        );

        this.renderResults("statscoreAthleteSearchResults", report);
      });
    },

    renderResults(targetId, report) {
      const el = document.getElementById(targetId);
      if (!el) return;

      if (!report?.ok || !report.results?.length) {
        el.innerHTML = `
          <div class="athlete-search-empty">
            <strong>${report?.status || "NO_RESULTS"}</strong>
            <p>${report?.message || "No athletes found."}</p>
          </div>
        `;
        return;
      }

      el.innerHTML = `
        <div class="athlete-search-summary">
          ${report.count} athlete result${report.count === 1 ? "" : "s"} found.
        </div>

        ${report.results.map(result => `
          <div class="athlete-search-card">
            <strong>${this.safe(result.athlete_display_name, "Athlete")}</strong>
            <span>${this.safe(result.sport, "Sport")} • ${this.safe(result.position, "Position")} • Class ${this.safe(result.graduation_class, "--")}</span>
            <span>${this.safe(result.school, "School")} • ${this.safe(result.city_state, "City/State")}</span>
            <span>Visibility: ${this.safe(result.visibility_state, "CONTROLLED")}</span>
            <a href="${result.profile_url}">Open Profile</a>
          </div>
        `).join("")}
      `;
    },

    explain(report) {
      if (!report) return "No athlete search report available.";

      return [
        `Status: ${report.status}`,
        `Source: ${report.source}`,
        `Results: ${report.count}`
      ].join(" | ");
    }

  };

  window.STATScore.AthleteSearchEngine = AthleteSearchEngine;

  console.info("[STATScore] Athlete Search Engine Loaded:", AthleteSearchEngine.version);

})(); 
