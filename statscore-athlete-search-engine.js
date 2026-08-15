/* ============================================================
   STATS-CORE™ GOVERNED ATHLETE SEARCH / ACCESS ROUTER

   File:
   statscore-athlete-search-engine.js

   Version:
   STATSCORE-ATHLETE-SEARCH-V3-GOVERNED-ACCESS-ROUTER

   Owner:
   Stream 5 — Professional Operations / Professional Workspace

   Classification:
   Professional Workspace Discovery / Governed Route Authority

   Purpose:
   Allow an authenticated professional workspace to locate athletes
   already within that professional's lawful relationship/scope and
   route to the shared Stream 3 athlete intelligence presentation.

   Constitutional Boundaries:

   Stream 1:
   Authenticated identity / session.

   Stream 2:
   Athlete source truth.

   Stream 3:
   Shared athlete intelligence presentation.

   Stream 4:
   Professional role/context intake.

   Stream 5:
   Professional workspace organization, discovery, and governed action.

   Stream 6:
   Disclosure / communication governance where applicable.

   Stream 8:
   Runtime support.

   Stream 10:
   Professional trust / certification authority.

   Doctrine:

   Search ≠ Athlete Authority

   Search ≠ Intelligence Calculation

   Certification ≠ Athlete Access

   Athlete Existence ≠ Professional Permission

   RLS ≠ Constitutional Authorization

   Missing Access Authority ≠ Permission To Search

   Minimum Necessary Disclosure SHALL be preserved.

============================================================ */

(function () {
  "use strict";


  /* ==========================================================
     ENGINE IDENTITY
  ========================================================== */

  const ENGINE_ID =
    "statscore-athlete-search-engine";


  const VERSION =
    "STATSCORE-ATHLETE-SEARCH-V3-GOVERNED-ACCESS-ROUTER";


  const OWNER_STREAM =
    "STREAM_5_PROFESSIONAL_OPERATIONS";


  const SOURCE_TABLE =
    "statscore_snapshots";


  /* ==========================================================
     MINIMUM SEARCH PROJECTION

     Intentionally excludes:
     - GPA
     - NCAA eligibility
     - media URLs
     - recruiting URLs
     - academic detail
     - evidence detail
     - scoring intelligence

     Those belong to governed destination pages after access.
  ========================================================== */

  const SELECT_COLUMNS = [
    "snapshot_id",
    "athlete_id",
    "athlete_display_name",
    "first_name",
    "last_name",
    "graduation_class",
    "school_program",
    "city_state",
    "primary_sport",
    "primary_position",
    "secondary_position",
    "verification_status",
    "updated_at"
  ].join(",");


  const SEARCH_COLUMNS = Object.freeze([
    "athlete_display_name",
    "first_name",
    "last_name",
    "school_program",
    "city_state",
    "primary_sport",
    "primary_position",
    "secondary_position",
    "graduation_class"
  ]);


  const STATUS = Object.freeze({
    READY:
      "READY",

    EMPTY_QUERY:
      "EMPTY_QUERY",

    ACCESS_AUTHORITY_UNAVAILABLE:
      "ACCESS_AUTHORITY_UNAVAILABLE",

    SEARCH_NOT_AUTHORIZED:
      "SEARCH_NOT_AUTHORIZED",

    ATHLETE_NOT_AUTHORIZED:
      "ATHLETE_NOT_AUTHORIZED",

    DATABASE_CLIENT_UNAVAILABLE:
      "DATABASE_CLIENT_UNAVAILABLE",

    DATABASE_SEARCH_FAILED:
      "DATABASE_SEARCH_FAILED",

    SEARCH_COMPLETE:
      "SEARCH_COMPLETE",

    NO_RESULTS:
      "NO_RESULTS",

    ROUTE_BLOCKED:
      "ROUTE_BLOCKED"
  });


  /* ==========================================================
     UTILITIES
  ========================================================== */

  function nowISO() {
    return new Date().toISOString();
  }


  function log(message, payload) {
    console.info(
      `[STATS-CORE Athlete Search] ${message}`,
      payload || ""
    );
  }


  function warn(message, payload) {
    console.warn(
      `[STATS-CORE Athlete Search] ${message}`,
      payload || ""
    );
  }


  function error(message, payload) {
    console.error(
      `[STATS-CORE Athlete Search] ${message}`,
      payload || ""
    );
  }


  function clean(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value).trim();
  }


  function lower(value) {
    return clean(value).toLowerCase();
  }


  function hasObject(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }


  function safeText(value) {
    return clean(value);
  }


  /* ==========================================================
     DATA CLIENT
  ========================================================== */

  function getSupabaseClient() {
    return (
      window.STATScoreData?.getClient?.() ||
      window.STATScoreCore?.getClient?.() ||
      window.STATScoreSupabase ||
      window.statscoreSupabase ||
      window.supabaseClient ||
      window.STATSCORE_SUPABASE_CLIENT ||
      null
    );
  }


  /* ==========================================================
     SESSION / WORKSPACE CONTEXT

     This engine consumes context.
     It does not manufacture identity or role authority.
  ========================================================== */

  function getSessionContext() {
    return (
      window.PHNXSessionEngine?.getCurrentSession?.() ||
      window.PHNXSessionEngine?.getSession?.() ||
      window.STATScoreAuthenticationContext?.getCurrent?.() ||
      window.STATScoreCurrentSession ||
      null
    );
  }


  function getWorkspaceContext() {
    return (
      window.PHNXWorkspaceRuntime?.getActiveWorkspace?.() ||
      window.STATScoreActiveWorkspaceEngine?.getActiveWorkspace?.() ||
      window.STATScoreCurrentWorkspace ||
      null
    );
  }


  function getProfessionalContext() {
    return (
      window.PHNXProfessionalIdentityEngine?.getCurrentIdentity?.() ||
      window.PHNXProfessionalIdentityEngine?.getIdentity?.() ||
      window.STATScoreCurrentProfessionalIdentity ||
      null
    );
  }


  function buildAccessContext() {
    const session =
      getSessionContext();

    const workspace =
      getWorkspaceContext();

    const professional =
      getProfessionalContext();


    return {
      user_id:
        session?.user_id ||
        session?.id ||
        null,

      role:
        workspace?.role ||
        professional?.role ||
        session?.role ||
        null,

      role_id:
        workspace?.role_id ||
        professional?.role_id ||
        null,

      role_context_id:
        workspace?.role_context_id ||
        professional?.role_context_id ||
        null,

      role_instance_id:
        workspace?.role_instance_id ||
        professional?.role_instance_id ||
        null,

      professional_id:
        professional?.professional_id ||
        professional?.id ||
        null,

      certification_id:
        professional?.certification_id ||
        professional?.psc_certification_id ||
        null,

      organization_id:
        workspace?.organization_id ||
        professional?.organization_id ||
        null,

      program_id:
        workspace?.program_id ||
        professional?.program_id ||
        null,

      workspace_id:
        workspace?.workspace_id ||
        workspace?.id ||
        null
    };
  }


  /* ==========================================================
     ACCESS AUTHORITY ADAPTER

     Search must fail closed unless a recognized authority
     explicitly allows athlete discovery.

     RLS remains defense-in-depth.
  ========================================================== */

  async function authorizeSearch(context) {
    const authority =
      window.STATScoreRolePermissionEngine ||
      window.STATScoreRoleAccess ||
      window.PHNXWorkspaceRuntime ||
      null;


    if (!authority) {
      return {
        ok: false,
        status:
          STATUS.ACCESS_AUTHORITY_UNAVAILABLE,

        reason:
          "No governed professional access authority is available."
      };
    }


    try {

      if (
        typeof authority.canSearchAthletes ===
        "function"
      ) {
        const result =
          await authority.canSearchAthletes(
            context
          );

        return normalizeDecision(
          result,
          "ATHLETE_SEARCH"
        );
      }


      if (
        typeof authority.authorize ===
        "function"
      ) {
        const result =
          await authority.authorize({
            action:
              "ATHLETE_SEARCH",

            ...context
          });

        return normalizeDecision(
          result,
          "ATHLETE_SEARCH"
        );
      }


      if (
        typeof authority.can ===
        "function"
      ) {
        const result =
          await authority.can(
            "ATHLETE_SEARCH",
            context
          );

        return normalizeDecision(
          result,
          "ATHLETE_SEARCH"
        );
      }


      return {
        ok: false,
        status:
          STATUS.ACCESS_AUTHORITY_UNAVAILABLE,

        reason:
          "Available access authority exposes no recognized athlete-search authorization method."
      };

    } catch (err) {
      return {
        ok: false,
        status:
          STATUS.SEARCH_NOT_AUTHORIZED,

        reason:
          err?.message ||
          "Athlete search authorization failed."
      };
    }
  }


  async function authorizeAthleteAccess(
    row,
    context
  ) {
    const authority =
      window.STATScoreRolePermissionEngine ||
      window.STATScoreRoleAccess ||
      window.PHNXWorkspaceRuntime ||
      null;


    if (!authority) {
      return {
        ok: false,
        status:
          STATUS.ACCESS_AUTHORITY_UNAVAILABLE,

        reason:
          "No governed athlete-access authority is available."
      };
    }


    const request = {
      action:
        "ATHLETE_VIEW",

      athlete_id:
        row.athlete_id ||
        null,

      snapshot_id:
        row.snapshot_id ||
        null,

      ...context
    };


    try {

      if (
        typeof authority.canAccessAthlete ===
        "function"
      ) {
        const result =
          await authority.canAccessAthlete(
            request
          );

        return normalizeDecision(
          result,
          "ATHLETE_VIEW"
        );
      }


      if (
        typeof authority.authorize ===
        "function"
      ) {
        const result =
          await authority.authorize(
            request
          );

        return normalizeDecision(
          result,
          "ATHLETE_VIEW"
        );
      }


      if (
        typeof authority.can ===
        "function"
      ) {
        const result =
          await authority.can(
            "ATHLETE_VIEW",
            request
          );

        return normalizeDecision(
          result,
          "ATHLETE_VIEW"
        );
      }


      return {
        ok: false,
        status:
          STATUS.ACCESS_AUTHORITY_UNAVAILABLE,

        reason:
          "Available access authority exposes no recognized athlete-view authorization method."
      };

    } catch (err) {
      return {
        ok: false,
        status:
          STATUS.ATHLETE_NOT_AUTHORIZED,

        reason:
          err?.message ||
          "Athlete access authorization failed."
      };
    }
  }


  function normalizeDecision(
    result,
    action
  ) {
    if (result === true) {
      return {
        ok: true,
        status:
          "AUTHORIZED",

        action
      };
    }


    if (result === false) {
      return {
        ok: false,
        status:
          "DENIED",

        action
      };
    }


    if (hasObject(result)) {
      const allowed =
        result.allowed === true ||
        result.authorized === true ||
        result.ok === true;


      return {
        ...result,

        ok:
          allowed,

        status:
          result.status ||
          (
            allowed
              ? "AUTHORIZED"
              : "DENIED"
          ),

        action
      };
    }


    return {
      ok: false,
      status:
        "DENIED",

      action
    };
  }


  /* ==========================================================
     QUERY
  ========================================================== */

  function buildOrFilter(query) {
    const q =
      clean(query)
        .replace(
          /,/g,
          "\\,"
        );


    return SEARCH_COLUMNS
      .map(
        column =>
          `${column}.ilike.%${q}%`
      )
      .join(",");
  }


  function displayName(row) {
    if (
      row?.athlete_display_name
    ) {
      return clean(
        row.athlete_display_name
      );
    }


    const joined =
      [
        row?.first_name,
        row?.last_name
      ]
        .filter(Boolean)
        .join(" ")
        .trim();


    return (
      joined ||
      "Unnamed Athlete"
    );
  }


  function normalizeRow(row = {}) {
    return {
      snapshot_id:
        clean(
          row.snapshot_id
        ),

      athlete_id:
        clean(
          row.athlete_id
        ),

      athlete_display_name:
        displayName(row),

      first_name:
        clean(
          row.first_name
        ),

      last_name:
        clean(
          row.last_name
        ),

      graduation_class:
        clean(
          row.graduation_class
        ),

      city_state:
        clean(
          row.city_state
        ),

      school_program:
        clean(
          row.school_program
        ),

      primary_sport:
        clean(
          row.primary_sport
        ),

      primary_position:
        clean(
          row.primary_position
        ),

      secondary_position:
        clean(
          row.secondary_position
        ),

      verification_status:
        clean(
          row.verification_status
        ),

      updated_at:
        clean(
          row.updated_at
        )
    };
  }


  /* ==========================================================
     ROUTING

     Destination remains Stream 3-owned shared athlete
     intelligence presentation.
  ========================================================== */

  function profileUrl(
    row,
    context = {}
  ) {
    const params =
      new URLSearchParams();


    if (row.snapshot_id) {
      params.set(
        "snapshot_id",
        row.snapshot_id
      );
    }


    if (row.athlete_id) {
      params.set(
        "athlete_id",
        row.athlete_id
      );
    }


    if (context.role) {
      params.set(
        "role",
        context.role
      );
    }


    if (context.role_context_id) {
      params.set(
        "role_context_id",
        context.role_context_id
      );
    }


    if (context.role_instance_id) {
      params.set(
        "role_instance_id",
        context.role_instance_id
      );
    }


    if (context.workspace_id) {
      params.set(
        "workspace_id",
        context.workspace_id
      );
    }


    if (context.program_id) {
      params.set(
        "program_id",
        context.program_id
      );
    }


    if (context.organization_id) {
      params.set(
        "organization_id",
        context.organization_id
      );
    }


    params.set(
      "source",
      "professional_workspace"
    );


    return (
      `player-profile.html?` +
      params.toString()
    );
  }


  async function routeToProfile(row) {
    if (
      !row ||
      (
        !row.snapshot_id &&
        !row.athlete_id
      )
    ) {
      error(
        "Cannot route. Athlete search result lacks governed identity.",
        row
      );

      return {
        ok: false,
        status:
          STATUS.ROUTE_BLOCKED
      };
    }


    const context =
      buildAccessContext();


    const decision =
      await authorizeAthleteAccess(
        row,
        context
      );


    if (!decision.ok) {
      warn(
        "Athlete route denied.",
        {
          row,
          context,
          decision
        }
      );


      return {
        ok: false,
        status:
          STATUS.ATHLETE_NOT_AUTHORIZED,

        decision
      };
    }


    const url =
      profileUrl(
        row,
        context
      );


    if (
      window.STATScoreEngineBus &&
      typeof window.STATScoreEngineBus.emit ===
        "function"
    ) {
      window.STATScoreEngineBus.emit(
        "athlete_profile_route_requested",
        {
          engine:
            ENGINE_ID,

          engine_version:
            VERSION,

          athlete_id:
            row.athlete_id,

          snapshot_id:
            row.snapshot_id,

          role:
            context.role,

          role_context_id:
            context.role_context_id,

          role_instance_id:
            context.role_instance_id,

          workspace_id:
            context.workspace_id,

          organization_id:
            context.organization_id,

          program_id:
            context.program_id,

          access_status:
            decision.status,

          url,

          requested_at:
            nowISO()
        }
      );
    }


    log(
      "Authorized route to shared athlete profile.",
      url
    );


    window.location.href =
      url;


    return {
      ok: true,
      status:
        "ROUTING",

      url
    };
  }


  /* ==========================================================
     LIVE DATABASE SEARCH

     IMPORTANT:
     This query still relies on database RLS for row-level
     enforcement after constitutional authorization.

     RLS is defense-in-depth, not the sole authority.
  ========================================================== */

  async function searchLiveDatabase(query) {
    const context =
      buildAccessContext();


    const authorization =
      await authorizeSearch(
        context
      );


    if (!authorization.ok) {
      return {
        ok: false,

        status:
          authorization.status ===
            STATUS.ACCESS_AUTHORITY_UNAVAILABLE
            ? STATUS.ACCESS_AUTHORITY_UNAVAILABLE
            : STATUS.SEARCH_NOT_AUTHORIZED,

        source:
          "ACCESS_AUTHORITY",

        authorization,

        count:
          0,

        results:
          []
      };
    }


    const client =
      getSupabaseClient();


    if (
      !client ||
      typeof client.from !==
        "function"
    ) {
      return {
        ok: false,

        status:
          STATUS.DATABASE_CLIENT_UNAVAILABLE,

        source:
          "CLIENT",

        count:
          0,

        results:
          []
      };
    }


    const {
      data,
      error: dbError
    } =
      await client
        .from(
          SOURCE_TABLE
        )
        .select(
          SELECT_COLUMNS
        )
        .or(
          buildOrFilter(
            query
          )
        )
        .order(
          "updated_at",
          {
            ascending:
              false
          }
        )
        .limit(20);


    if (dbError) {
      return {
        ok: false,

        status:
          STATUS.DATABASE_SEARCH_FAILED,

        source:
          "DATABASE",

        error:
          dbError,

        count:
          0,

        results:
          []
      };
    }


    const candidates =
      Array.isArray(data)
        ? data.map(
            normalizeRow
          )
        : [];


    /*
      Apply a second authorization pass before displaying
      any athlete search result.

      This preserves minimum necessary disclosure if RLS
      is broader than the active professional relationship.
    */

    const authorizedResults = [];


    for (const row of candidates) {
      const decision =
        await authorizeAthleteAccess(
          row,
          context
        );


      if (decision.ok) {
        authorizedResults.push(
          row
        );
      }
    }


    return {
      ok: true,

      status:
        STATUS.SEARCH_COMPLETE,

      source:
        "DATABASE",

      authorization,

      count:
        authorizedResults.length,

      results:
        authorizedResults,

      searched_at:
        nowISO()
    };
  }


  /* ==========================================================
     SORTING
  ========================================================== */

  function exactSort(
    query,
    results
  ) {
    const q =
      lower(query);


    return results
      .slice()
      .sort(
        (a, b) => {
          const aName =
            lower(
              a.athlete_display_name
            );

          const bName =
            lower(
              b.athlete_display_name
            );


          if (
            aName === q &&
            bName !== q
          ) {
            return -1;
          }


          if (
            bName === q &&
            aName !== q
          ) {
            return 1;
          }


          if (
            aName.startsWith(q) &&
            !bName.startsWith(q)
          ) {
            return -1;
          }


          if (
            bName.startsWith(q) &&
            !aName.startsWith(q)
          ) {
            return 1;
          }


          return aName.localeCompare(
            bName
          );
        }
      );
  }


  /* ==========================================================
     DOM DISCOVERY
  ========================================================== */

  function findSearchInput() {
    return (
      document.querySelector(
        "[data-statscore-athlete-search]"
      ) ||
      document.querySelector(
        "#statscore-athlete-search"
      ) ||
      document.querySelector(
        "#athlete-search"
      ) ||
      document.querySelector(
        'input[placeholder*="Search athlete"]'
      ) ||
      document.querySelector(
        'input[placeholder*="athlete"]'
      ) ||
      document.querySelector(
        'input[type="search"]'
      )
    );
  }


  function findSearchButton(input) {
    return (
      document.querySelector(
        "[data-statscore-athlete-search-button]"
      ) ||
      document.querySelector(
        "#statscore-athlete-search-button"
      ) ||
      document.querySelector(
        "#athlete-search-button"
      ) ||
      (
        input?.parentElement
          ? input.parentElement.querySelector(
              "button"
            )
          : null
      )
    );
  }


  function ensureResultsContainer(input) {
    let container =
      document.querySelector(
        "[data-statscore-athlete-search-results]"
      ) ||
      document.querySelector(
        "#statscore-athlete-search-results"
      );


    if (container) {
      return container;
    }


    container =
      document.createElement(
        "div"
      );


    container.id =
      "statscore-athlete-search-results";


    container.setAttribute(
      "data-statscore-athlete-search-results",
      "true"
    );


    Object.assign(
      container.style,
      {
        display:
          "none",

        position:
          "relative",

        zIndex:
          "9999",

        maxWidth:
          "760px",

        margin:
          "8px 0 18px 0",

        background:
          "rgba(5,8,14,.97)",

        border:
          "1px solid rgba(255,52,52,.65)",

        boxShadow:
          "0 12px 32px rgba(0,0,0,.5)",

        color:
          "#fff"
      }
    );


    if (
      input &&
      input.parentElement
    ) {
      input.parentElement
        .insertAdjacentElement(
          "afterend",
          container
        );

    } else {
      document.body.prepend(
        container
      );
    }


    return container;
  }


  function clearResults() {
    const container =
      document.querySelector(
        "[data-statscore-athlete-search-results]"
      ) ||
      document.querySelector(
        "#statscore-athlete-search-results"
      );


    if (!container) {
      return;
    }


    container.replaceChildren();

    container.style.display =
      "none";
  }


  /* ==========================================================
     SAFE DOM RENDERING

     No database content is written through innerHTML.
  ========================================================== */

  function makeHeader(
    text,
    danger = false
  ) {
    const header =
      document.createElement(
        "div"
      );


    header.style.padding =
      "14px 16px";

    header.style.borderBottom =
      "1px solid rgba(255,255,255,.14)";

    header.style.fontWeight =
      "900";

    header.style.letterSpacing =
      ".12em";

    header.style.textTransform =
      "uppercase";


    if (danger) {
      header.style.color =
        "#ff3434";
    }


    header.textContent =
      safeText(text);


    return header;
  }


  function makeMessage(text) {
    const body =
      document.createElement(
        "div"
      );


    body.style.padding =
      "16px";

    body.style.color =
      "#cfd8e3";

    body.textContent =
      safeText(text);


    return body;
  }


  function renderNoMatch(
    container,
    query
  ) {
    container.replaceChildren();

    container.style.display =
      "block";


    container.appendChild(
      makeHeader(
        "STATS-CORE Athlete Search"
      )
    );


    container.appendChild(
      makeMessage(
        `No authorized athlete matched: ${query}`
      )
    );
  }


  function renderError(
    container,
    message
  ) {
    container.replaceChildren();

    container.style.display =
      "block";


    container.appendChild(
      makeHeader(
        "STATS-CORE Search Blocked",
        true
      )
    );


    const body =
      makeMessage(
        message
      );


    body.style.color =
      "#ffb4b4";


    container.appendChild(
      body
    );
  }


  function addTextLine(
    parent,
    text,
    styles = {}
  ) {
    const div =
      document.createElement(
        "div"
      );


    Object.assign(
      div.style,
      styles
    );


    div.textContent =
      safeText(text);


    parent.appendChild(
      div
    );


    return div;
  }


  function renderMultiple(
    container,
    results
  ) {
    container.replaceChildren();

    container.style.display =
      "block";


    container.appendChild(
      makeHeader(
        `STATS-CORE Authorized Athlete Results (${results.length})`
      )
    );


    results.forEach(row => {
      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      Object.assign(
        button.style,
        {
          display:
            "block",

          width:
            "100%",

          textAlign:
            "left",

          padding:
            "14px 16px",

          background:
            "rgba(255,255,255,.035)",

          border:
            "0",

          borderBottom:
            "1px solid rgba(255,255,255,.1)",

          color:
            "#fff",

          cursor:
            "pointer"
        }
      );


      const line =
        [
          row.primary_sport,
          row.primary_position,
          row.secondary_position,
          row.graduation_class
        ]
          .filter(Boolean)
          .join(" · ");


      addTextLine(
        button,
        row.athlete_display_name,
        {
          fontWeight:
            "900",

          letterSpacing:
            ".08em",

          textTransform:
            "uppercase"
        }
      );


      addTextLine(
        button,
        line ||
        "Athlete Profile",
        {
          marginTop:
            "5px",

          color:
            "#ff3434",

          fontWeight:
            "800",

          letterSpacing:
            ".08em",

          textTransform:
            "uppercase"
        }
      );


      addTextLine(
        button,
        `${row.school_program || "Program Pending"} · ${row.city_state || "Location Pending"}`,
        {
          marginTop:
            "5px",

          color:
            "#b9c4d6"
        }
      );


      addTextLine(
        button,
        `Verification: ${row.verification_status || "Pending"}`,
        {
          marginTop:
            "6px",

          color:
            "#9fe7ff",

          fontSize:
            "12px",

          textTransform:
            "uppercase",

          letterSpacing:
            ".08em"
        }
      );


      button.addEventListener(
        "click",
        async function () {
          const routeResult =
            await routeToProfile(
              row
            );


          if (!routeResult.ok) {
            renderError(
              container,
              "Access to this athlete is not authorized in the current professional workspace."
            );
          }
        }
      );


      container.appendChild(
        button
      );
    });
  }


  /* ==========================================================
     SEARCH EXECUTION
  ========================================================== */

  async function runSearch(
    query,
    options = {}
  ) {
    const q =
      clean(query);


    const input =
      findSearchInput();


    const container =
      ensureResultsContainer(
        input
      );


    if (!q) {
      renderError(
        container,
        "Enter an athlete name, school, sport, class, or position."
      );


      return {
        ok: false,
        status:
          STATUS.EMPTY_QUERY,

        count:
          0,

        results:
          []
      };
    }


    const response =
      await searchLiveDatabase(
        q
      );


    log(
      "Governed search response.",
      response
    );


    if (!response.ok) {

      if (
        response.status ===
        STATUS.ACCESS_AUTHORITY_UNAVAILABLE
      ) {
        renderError(
          container,
          "Athlete search is unavailable because governed professional access authority is not active."
        );

      } else if (
        response.status ===
        STATUS.SEARCH_NOT_AUTHORIZED
      ) {
        renderError(
          container,
          "Your current professional workspace is not authorized to search athletes."
        );

      } else if (
        response.status ===
        STATUS.DATABASE_CLIENT_UNAVAILABLE
      ) {
        renderError(
          container,
          "Athlete search runtime is unavailable."
        );

      } else {
        renderError(
          container,
          "Athlete search failed."
        );

        error(
          "Database search failed.",
          response.error ||
          response
        );
      }


      return response;
    }


    const results =
      exactSort(
        q,
        response.results
      );


    if (!results.length) {
      renderNoMatch(
        container,
        q
      );


      return {
        ...response,
        status:
          STATUS.NO_RESULTS
      };
    }


    /*
      Do not auto-route merely because one exact result exists.

      Requiring explicit user selection avoids unintended
      navigation/disclosure and preserves visible choice.
    */

    renderMultiple(
      container,
      results
    );


    return {
      ...response,
      results
    };
  }


  /* ==========================================================
     UI BINDING
  ========================================================== */

  function bindSearchUI() {
    const input =
      findSearchInput();


    if (!input) {
      warn(
        "Athlete search input not found. Engine available API-only."
      );

      return;
    }


    const button =
      findSearchButton(
        input
      );


    const execute =
      function () {
        runSearch(
          input.value
        );
      };


    if (button) {
      button.addEventListener(
        "click",
        function (event) {
          event.preventDefault();
          execute();
        }
      );
    }


    input.addEventListener(
      "keydown",
      function (event) {
        if (
          event.key ===
          "Enter"
        ) {
          event.preventDefault();
          execute();
        }
      }
    );


    log(
      "Governed athlete search UI bound."
    );
  }


  /* ==========================================================
     PUBLIC AUTHORITY
  ========================================================== */

  function init() {
    if (
      window
        .__STATSCORE_ATHLETE_SEARCH_ENGINE_V3__
    ) {
      warn(
        "Duplicate initialization blocked."
      );

      return;
    }


    window
      .__STATSCORE_ATHLETE_SEARCH_ENGINE_V3__ =
      true;


    const authority = {
      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      owner_stream:
        OWNER_STREAM,

      classification:
        "PROFESSIONAL_WORKSPACE_DISCOVERY_ROUTER",

      status:
        "ACTIVE",

      source_table:
        SOURCE_TABLE,

      search_columns:
        [
          ...SEARCH_COLUMNS
        ],

      select_columns:
        SELECT_COLUMNS,

      search:
        runSearch,

      searchLiveDatabase,

      routeToProfile,

      profileUrl,

      normalizeRow,

      getAccessContext:
        buildAccessContext,

      doctrine:
        Object.freeze({
          calculates_intelligence:
            false,

          owns_athlete_source_truth:
            false,

          owns_athlete_presentation:
            false,

          owns_professional_workspace_discovery:
            true,

          requires_access_authority:
            true,

          fails_closed_without_authority:
            true,

          minimum_disclosure:
            true,

          direct_gpa_disclosure:
            false,

          direct_eligibility_disclosure:
            false,

          direct_media_url_disclosure:
            false,

          direct_recruiting_data_disclosure:
            false,

          database_rls_is_sole_authority:
            false
        })
    };


    window.STATScoreAthleteSearch =
      authority;


    window.STATScore =
      window.STATScore ||
      {};


    window.STATScore.AthleteSearch =
      authority;


    bindSearchUI();


    if (
      window.STATScoreEngineBus &&
      typeof window.STATScoreEngineBus.emit ===
        "function"
    ) {
      window.STATScoreEngineBus.emit(
        "engine_online",
        {
          engine:
            ENGINE_ID,

          version:
            VERSION,

          owner_stream:
            OWNER_STREAM,

          status:
            "ONLINE",

          mode:
            "GOVERNED_ATHLETE_DISCOVERY_ROUTER"
        }
      );
    }


    log(
      "Engine online.",
      {
        engine:
          ENGINE_ID,

        version:
          VERSION,

        owner_stream:
          OWNER_STREAM
      }
    );
  }


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {
    init();
  }

})(); 
