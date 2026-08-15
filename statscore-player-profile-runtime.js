/* ============================================================
   STATS-CORE™ PLAYER PROFILE RUNTIME
   File: statscore-player-profile-runtime.js
   Version: STATSCORE-PLAYER-PROFILE-RUNTIME-V3-GOVERNED-PROJECTION

   Owner:
   Stream 3 — Athlete Intelligence Presentation Authority

   Classification:
   Governed Athlete Profile Projection Runtime

   Purpose:
   - Resolve requested athlete/snapshot context.
   - Require authenticated session context.
   - Require workspace / role permission context.
   - Require explicit athlete/snapshot scope authorization.
   - Load canonical snapshot data only after authorization.
   - Consume governed Stream 9 intelligence.
   - Apply role-safe disclosure projection.
   - Render authorized athlete profile presentation.
   - Preserve route context without converting identifiers into authority.

   Constitutional Boundaries:

   Stream 2
   → owns athlete source record / snapshot source preservation.

   Stream 3
   → owns athlete profile presentation.

   Stream 5
   → owns professional workspace / role operational permissions.

   Stream 6
   → owns communication governance.

   Stream 7
   → owns media publication / exposure publication.

   Stream 9
   → owns governed athlete intelligence and explainability.

   Stream 10
   → owns professional certification / credential trust.

   Core Doctrine:

   REQUESTED CONTEXT ≠ AUTHORIZATION

   SNAPSHOT ID ≠ PERMISSION

   WORKSPACE ROLE ≠ ATHLETE SCOPE

   SOURCE DATA ≠ GOVERNED INTELLIGENCE

   MISSING AUTHORITY ≠ PERMISSION TO RECONSTRUCT AUTHORITY

   NO AUTHORIZATION
   → DO NOT LOAD ATHLETE PROFILE

   NO CANONICAL SNAPSHOT
   → DO NOT FALL BACK TO INTAKE RECORD

   NO STREAM 9 INTELLIGENCE
   → DISPLAY PENDING / UNAVAILABLE

   NO DISCLOSURE AUTHORITY
   → DO NOT RENDER FIELD

============================================================ */

(function () {
  "use strict";

  const ENGINE =
    "statscore-player-profile-runtime.js";

  const VERSION =
    "STATSCORE-PLAYER-PROFILE-RUNTIME-V3-GOVERNED-PROJECTION";

  const OWNER_STREAM =
    "STREAM_3_ATHLETE_INTELLIGENCE_PRESENTATION";

  const CANONICAL_SNAPSHOT_TABLE =
    "statscore_snapshots";

  const PARENT_APPROVAL_TABLE =
    "sc_parent_approval_requests";

  const STATUS = Object.freeze({
    READY:
      "READY",

    REQUEST_CONTEXT_MISSING:
      "REQUEST_CONTEXT_MISSING",

    DATA_CLIENT_UNAVAILABLE:
      "DATA_CLIENT_UNAVAILABLE",

    SESSION_REQUIRED:
      "SESSION_REQUIRED",

    WORKSPACE_REQUIRED:
      "WORKSPACE_REQUIRED",

    PERMISSION_CONTEXT_REQUIRED:
      "PERMISSION_CONTEXT_REQUIRED",

    SNAPSHOT_NOT_FOUND:
      "SNAPSHOT_NOT_FOUND",

    ATHLETE_CONTEXT_MISMATCH:
      "ATHLETE_CONTEXT_MISMATCH",

    ATHLETE_SCOPE_DENIED:
      "ATHLETE_SCOPE_DENIED",

    SNAPSHOT_SCOPE_DENIED:
      "SNAPSHOT_SCOPE_DENIED",

    INTELLIGENCE_AUTHORITY_UNAVAILABLE:
      "INTELLIGENCE_AUTHORITY_UNAVAILABLE",

    INTELLIGENCE_PENDING:
      "INTELLIGENCE_PENDING",

    AUTHORIZED:
      "AUTHORIZED",

    BLOCKED:
      "BLOCKED"
  });

  const ROLE_KEYS = Object.freeze({
    ATHLETE: "athlete",
    PARENT: "parent",
    COACH: "coach",
    COUNSELOR: "counselor",
    RECRUITER: "recruiter",
    EVALUATOR: "evaluator",
    TRAINER: "trainer",
    PROGRAM: "program",
    ADMIN: "admin",
    PROFESSIONAL: "professional"
  });

  const CANONICAL_SELECT = [
    "snapshot_id",
    "athlete_id",
    "snapshot_status",
    "verification_status",
    "verification_authority",

    "first_name",
    "last_name",
    "athlete_display_name",

    "primary_sport",
    "primary_position",
    "secondary_position",

    "height",
    "weight",
    "graduation_class",
    "city_state",
    "school_program",

    "current_gpa",
    "ncaa_eligibility_status",

    "dash40",
    "vertical_jump",
    "shuttle",
    "broad_jump",
    "strength_marker",

    "highlight_url",
    "game_film_url",
    "recruiting_profile_url",
    "social_profile_url",
    "headshot_public_url",

    "created_at",
    "updated_at"
  ].join(",");

  /* ============================================================
     UTILITIES
  ============================================================ */

  function nowISO() {
    return new Date().toISOString();
  }

  function normalize(value) {
    return String(value ?? "").trim();
  }

  function lower(value) {
    return normalize(value).toLowerCase();
  }

  function upper(value) {
    return normalize(value).toUpperCase();
  }

  function asArray(value) {
    return Array.isArray(value)
      ? value
      : [];
  }

  function unique(values) {
    return Array.from(
      new Set(
        asArray(values)
          .map(normalize)
          .filter(Boolean)
      )
    );
  }

  function safe(value, fallback = "—") {
    return (
      value === undefined ||
      value === null ||
      value === ""
    )
      ? fallback
      : value;
  }

  function qs(selector) {
    return document.querySelector(selector);
  }

  function qsa(selector) {
    return Array.from(
      document.querySelectorAll(selector)
    );
  }

  function setText(selectors, value, fallback = "—") {
    const list =
      Array.isArray(selectors)
        ? selectors
        : [selectors];

    list.forEach(selector => {
      const el =
        typeof selector === "string"
          ? qs(selector)
          : selector;

      if (!el) {
        return;
      }

      el.textContent =
        safe(value, fallback);
    });
  }

  function setHidden(selectors, hidden) {
    const list =
      Array.isArray(selectors)
        ? selectors
        : [selectors];

    list.forEach(selector => {
      const el =
        typeof selector === "string"
          ? qs(selector)
          : selector;

      if (!el) {
        return;
      }

      el.hidden =
        Boolean(hidden);
    });
  }

  function maskValue(label = "Restricted") {
    return label;
  }

  function emit(eventName, payload = {}) {
    try {
      if (
        window.STATScoreEngineBus &&
        typeof window.STATScoreEngineBus.emit === "function"
      ) {
        window.STATScoreEngineBus.emit(
          eventName,
          {
            engine: ENGINE,
            version: VERSION,
            ...payload
          }
        );
      }
    } catch (_) {
      /* non-blocking */
    }
  }

  /* ============================================================
     REQUESTED CONTEXT
     Identifiers are requests only.
     They are never treated as authorization.
  ============================================================ */

  function getRequestedContext() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    return {
      snapshot_id:
        normalize(
          params.get("snapshot_id")
        ),

      athlete_id:
        normalize(
          params.get("athlete_id")
        ),

      workspace_id:
        normalize(
          params.get("workspace_id")
        ),

      role_context_id:
        normalize(
          params.get("role_context_id")
        ),

      requested_at:
        nowISO()
    };
  }

  /* ============================================================
     SHARED DATA AUTHORITY
     This runtime never creates a new Supabase client.
  ============================================================ */

  function getDb() {
    const candidates = [
      window.STATScoreData?.getClient?.(),
      window.STATScoreCore?.getClient?.(),
      window.STATScoreSupabase,
      window.statscoreSupabase,
      window.STATSCORE_SUPABASE_CLIENT
    ];

    return (
      candidates.find(client =>
        client &&
        typeof client.from === "function"
      ) ||
      null
    );
  }

  /* ============================================================
     SESSION RESOLUTION
  ============================================================ */

  function resolveSessionContext() {
    const candidates = [
      window.PHNXSessionEngine?.getSession?.(),
      window.PHNXSessionEngine?.current?.(),
      window.STATScore?.SessionEngine?.get?.(),
      window.STATScore?.Session?.get?.(),
      window.STATScoreAuthContext?.get?.(),
      window.STATScore?.AuthContext?.get?.(),
      window.STATScoreCurrentSession,
      window.__STATSCORE_SESSION__
    ];

    const session =
      candidates.find(value =>
        value &&
        typeof value === "object"
      ) ||
      null;

    if (!session) {
      return null;
    }

    const userId =
      session.user_id ||
      session.userId ||
      session.auth_user_id ||
      session.authUserId ||
      session.user?.id ||
      session.id ||
      null;

    const authenticated =
      session.authenticated === true ||
      session.is_authenticated === true ||
      session.status === "AUTHENTICATED" ||
      Boolean(userId);

    if (!authenticated || !userId) {
      return null;
    }

    return {
      user_id:
        userId,

      email:
        session.email ||
        session.user?.email ||
        null,

      role:
        lower(
          session.role ||
          session.active_role ||
          session.role_key ||
          ""
        ),

      raw:
        session
    };
  }

  /* ============================================================
     WORKSPACE RESOLUTION
  ============================================================ */

  function resolveWorkspaceContext() {
    const candidates = [
      window.STATScore?.ActiveWorkspace?.get?.(),
      window.STATScoreActiveWorkspace?.get?.(),
      window.PHNXWorkspaceRuntime?.getActiveWorkspace?.(),
      window.PHNXWorkspaceRuntime?.getCurrentWorkspace?.(),
      window.STATScoreCurrentWorkspace,
      window.__STATSCORE_ACTIVE_WORKSPACE__
    ];

    const workspace =
      candidates.find(value =>
        value &&
        typeof value === "object"
      ) ||
      null;

    if (!workspace) {
      return null;
    }

    return {
      workspace_id:
        workspace.workspace_id ||
        workspace.workspaceId ||
        workspace.id ||
        null,

      role_context_id:
        workspace.role_context_id ||
        workspace.roleContextId ||
        null,

      role_instance_id:
        workspace.role_instance_id ||
        workspace.roleInstanceId ||
        null,

      role:
        lower(
          workspace.role ||
          workspace.role_key ||
          workspace.active_role ||
          "professional"
        ),

      athlete_id:
        workspace.athlete_id ||
        workspace.current_athlete_id ||
        null,

      snapshot_id:
        workspace.snapshot_id ||
        workspace.current_snapshot_id ||
        null,

      permissions:
        workspace.permissions ||
        {},

      credentials:
        workspace.credentials ||
        {},

      raw:
        workspace
    };
  }

  /* ============================================================
     ROLE PERMISSION AUTHORITY
  ============================================================ */

  function getPermissionEngine() {
    return (
      window.STATScore?.RolePermissionEngine ||
      window.STATScoreRolePermissionEngine ||
      null
    );
  }

  function resolvePermissions() {
    const engine =
      getPermissionEngine();

    if (!engine) {
      return null;
    }

    try {
      const permissions =
        typeof engine.get === "function"
          ? engine.get()
          : null;

      if (
        !permissions ||
        typeof permissions !== "object"
      ) {
        return null;
      }

      return permissions;
    } catch (_) {
      return null;
    }
  }

  function canPermission(permissions, key) {
    return Boolean(
      permissions &&
      permissions[key] === true
    );
  }

  /* ============================================================
     SCOPE RESOLUTION
     Explicit relationship/scope is required.
  ============================================================ */

  function collectScopeValues(workspace) {
    const raw =
      workspace?.raw ||
      {};

    const athleteIds = unique([
      workspace?.athlete_id,

      ...(raw.assigned_athlete_ids || []),
      ...(raw.athlete_ids || []),
      ...(raw.authorized_athlete_ids || []),

      ...asArray(
        raw.assigned_athletes
      )
        .map(item =>
          typeof item === "object"
            ? (
              item.athlete_id ||
              item.id
            )
            : item
        ),

      ...asArray(
        raw.athlete_scope
      )
        .map(item =>
          typeof item === "object"
            ? (
              item.athlete_id ||
              item.id
            )
            : item
        )
    ]);

    const snapshotIds = unique([
      workspace?.snapshot_id,

      ...(raw.assigned_snapshot_ids || []),
      ...(raw.snapshot_ids || []),
      ...(raw.authorized_snapshot_ids || []),

      ...asArray(
        raw.snapshot_scope
      )
        .map(item =>
          typeof item === "object"
            ? (
              item.snapshot_id ||
              item.id
            )
            : item
        )
    ]);

    const allowAllAthletes =
      raw.allow_all_athletes === true ||
      raw.all_athletes === true ||
      raw.scope_all_athletes === true ||
      raw.athlete_scope === "*" ||
      raw.scope === "ALL_ATHLETES";

    const allowAllSnapshots =
      raw.allow_all_snapshots === true ||
      raw.all_snapshots === true ||
      raw.scope_all_snapshots === true ||
      raw.snapshot_scope === "*" ||
      raw.scope === "ALL_SNAPSHOTS";

    return {
      athlete_ids:
        athleteIds,

      snapshot_ids:
        snapshotIds,

      allow_all_athletes:
        allowAllAthletes,

      allow_all_snapshots:
        allowAllSnapshots
    };
  }

  function isAthleteSelf(
    session,
    workspace,
    athleteId
  ) {
    const role =
      workspace?.role ||
      session?.role ||
      "";

    if (role !== ROLE_KEYS.ATHLETE) {
      return false;
    }

    const raw =
      workspace?.raw ||
      {};

    const selfAthleteId =
      workspace?.athlete_id ||
      raw.self_athlete_id ||
      raw.profile_athlete_id ||
      session?.raw?.athlete_id ||
      session?.raw?.profile_athlete_id ||
      null;

    return Boolean(
      selfAthleteId &&
      athleteId &&
      normalize(selfAthleteId) ===
        normalize(athleteId)
    );
  }

  function authorizeEntityScope({
    session,
    workspace,
    permissions,
    snapshotIdentity
  }) {
    if (
      !session ||
      !workspace ||
      !permissions ||
      !snapshotIdentity
    ) {
      return {
        ok: false,
        status:
          STATUS.ATHLETE_SCOPE_DENIED,
        reason:
          "Authorization context incomplete."
      };
    }

    if (
      !canPermission(
        permissions,
        "assigned_athletes"
      )
    ) {
      return {
        ok: false,
        status:
          STATUS.ATHLETE_SCOPE_DENIED,
        reason:
          "Current role does not have athlete-profile access."
      };
    }

    const scope =
      collectScopeValues(
        workspace
      );

    const athleteId =
      normalize(
        snapshotIdentity.athlete_id
      );

    const snapshotId =
      normalize(
        snapshotIdentity.snapshot_id
      );

    if (
      isAthleteSelf(
        session,
        workspace,
        athleteId
      )
    ) {
      return {
        ok: true,
        status:
          STATUS.AUTHORIZED,
        mode:
          "ATHLETE_SELF",
        scope
      };
    }

    const athleteAllowed =
      scope.allow_all_athletes ||
      scope.athlete_ids.includes(
        athleteId
      );

    if (!athleteAllowed) {
      return {
        ok: false,
        status:
          STATUS.ATHLETE_SCOPE_DENIED,
        reason:
          "Requested athlete is outside the active workspace scope.",
        scope
      };
    }

    if (
      scope.snapshot_ids.length &&
      !scope.allow_all_snapshots &&
      !scope.snapshot_ids.includes(
        snapshotId
      )
    ) {
      return {
        ok: false,
        status:
          STATUS.SNAPSHOT_SCOPE_DENIED,
        reason:
          "Requested snapshot is outside the active workspace scope.",
        scope
      };
    }

    return {
      ok: true,
      status:
        STATUS.AUTHORIZED,
      mode:
        "WORKSPACE_SCOPE",
      scope
    };
  }

  /* ============================================================
     CANONICAL SNAPSHOT RESOLUTION
  ============================================================ */

  async function resolveSnapshotIdentity(
    db,
    requested
  ) {
    if (
      !db ||
      !requested?.snapshot_id
    ) {
      return null;
    }

    const { data, error } =
      await db
        .from(
          CANONICAL_SNAPSHOT_TABLE
        )
        .select(
          "snapshot_id,athlete_id"
        )
        .eq(
          "snapshot_id",
          requested.snapshot_id
        )
        .maybeSingle();

    if (error) {
      console.error(
        "[Player Profile] Snapshot identity lookup failed:",
        error
      );

      return null;
    }

    if (!data) {
      return null;
    }

    if (
      requested.athlete_id &&
      normalize(
        requested.athlete_id
      ) !==
        normalize(
          data.athlete_id
        )
    ) {
      return {
        mismatch: true,
        snapshot_id:
          data.snapshot_id,
        athlete_id:
          data.athlete_id
      };
    }

    return {
      mismatch: false,
      snapshot_id:
        data.snapshot_id,
      athlete_id:
        data.athlete_id
    };
  }

  async function loadCanonicalSnapshot(
    db,
    snapshotIdentity
  ) {
    const { data, error } =
      await db
        .from(
          CANONICAL_SNAPSHOT_TABLE
        )
        .select(
          CANONICAL_SELECT
        )
        .eq(
          "snapshot_id",
          snapshotIdentity.snapshot_id
        )
        .eq(
          "athlete_id",
          snapshotIdentity.athlete_id
        )
        .maybeSingle();

    if (error) {
      console.error(
        "[Player Profile] Canonical snapshot load failed:",
        error
      );

      return null;
    }

    return data || null;
  }

  /* ============================================================
     CANONICAL NORMALIZATION
     No raw_payload / intake_payload fallback is permitted.
  ============================================================ */

  function normalizeCanonicalSnapshot(row) {
    if (!row) {
      return null;
    }

    const first =
      normalize(
        row.first_name
      );

    const last =
      normalize(
        row.last_name
      );

    const displayName =
      normalize(
        row.athlete_display_name
      ) ||
      [first, last]
        .filter(Boolean)
        .join(" ");

    return {
      snapshot_id:
        normalize(
          row.snapshot_id
        ),

      athlete_id:
        normalize(
          row.athlete_id
        ),

      snapshot_status:
        normalize(
          row.snapshot_status
        ),

      athlete_name:
        displayName ||
        "Athlete",

      first_name:
        first,

      last_name:
        last,

      sport:
        normalize(
          row.primary_sport
        ),

      position:
        normalize(
          row.primary_position
        ),

      secondary_position:
        normalize(
          row.secondary_position
        ),

      height:
        normalize(
          row.height
        ),

      weight:
        normalize(
          row.weight
        ),

      graduation_class:
        normalize(
          row.graduation_class
        ),

      city_state:
        normalize(
          row.city_state
        ),

      school:
        normalize(
          row.school_program
        ),

      gpa:
        row.current_gpa ??
        null,

      ncaa_status:
        normalize(
          row.ncaa_eligibility_status
        ),

      forty:
        row.dash40 ??
        null,

      vertical:
        row.vertical_jump ??
        null,

      shuttle:
        row.shuttle ??
        null,

      broad_jump:
        row.broad_jump ??
        null,

      strength_marker:
        row.strength_marker ??
        null,

      highlight_url:
        normalize(
          row.highlight_url
        ),

      game_film_url:
        normalize(
          row.game_film_url
        ),

      recruiting_profile_url:
        normalize(
          row.recruiting_profile_url
        ),

      social_url:
        normalize(
          row.social_profile_url
        ),

      headshot_url:
        normalize(
          row.headshot_public_url
        ),

      verification_status:
        normalize(
          row.verification_status
        ) ||
        "UNVERIFIED",

      verification_authority:
        normalize(
          row.verification_authority
        ) ||
        "UNAVAILABLE",

      created_at:
        row.created_at ||
        null,

      updated_at:
        row.updated_at ||
        null
    };
  }

  /* ============================================================
     ROLE-SAFE DISCLOSURE PROJECTION
  ============================================================ */

  function buildDisclosurePolicy({
    session,
    workspace,
    permissions
  }) {
    const role =
      lower(
        workspace?.role ||
        session?.role ||
        ROLE_KEYS.PROFESSIONAL
      );

    const athleteSelf =
      role === ROLE_KEYS.ATHLETE;

    const parent =
      role === ROLE_KEYS.PARENT;

    return {
      role,

      identity:
        true,

      basic_profile:
        true,

      performance:
        athleteSelf ||
        parent ||
        canPermission(
          permissions,
          "reports"
        ) ||
        canPermission(
          permissions,
          "production"
        ) ||
        canPermission(
          permissions,
          "evaluation"
        ) ||
        canPermission(
          permissions,
          "development_tracker"
        ),

      academics:
        athleteSelf ||
        parent ||
        role === ROLE_KEYS.COUNSELOR ||
        canPermission(
          permissions,
          "academic_alerts"
        ),

      verification:
        athleteSelf ||
        parent ||
        canPermission(
          permissions,
          "verification"
        ) ||
        canPermission(
          permissions,
          "evaluation"
        ),

      media:
        athleteSelf ||
        parent ||
        canPermission(
          permissions,
          "media_review"
        ) ||
        canPermission(
          permissions,
          "reports"
        ),

      recruiting:
        athleteSelf ||
        parent ||
        canPermission(
          permissions,
          "recruiting_board"
        ),

      parent_approval:
        athleteSelf ||
        parent ||
        canPermission(
          permissions,
          "parent_approval_status"
        ),

      messages:
        canPermission(
          permissions,
          "messages"
        )
    };
  }

  function projectSnapshot(
    snapshot,
    policy
  ) {
    return {
      snapshot_id:
        snapshot.snapshot_id,

      athlete_id:
        snapshot.athlete_id,

      snapshot_status:
        snapshot.snapshot_status,

      athlete_name:
        snapshot.athlete_name,

      sport:
        snapshot.sport,

      position:
        snapshot.position,

      secondary_position:
        snapshot.secondary_position,

      height:
        snapshot.height,

      weight:
        snapshot.weight,

      graduation_class:
        snapshot.graduation_class,

      city_state:
        snapshot.city_state,

      school:
        snapshot.school,

      headshot_url:
        policy.media
          ? snapshot.headshot_url
          : "",

      gpa:
        policy.academics
          ? snapshot.gpa
          : null,

      ncaa_status:
        policy.academics
          ? snapshot.ncaa_status
          : maskValue(),

      forty:
        policy.performance
          ? snapshot.forty
          : null,

      vertical:
        policy.performance
          ? snapshot.vertical
          : null,

      shuttle:
        policy.performance
          ? snapshot.shuttle
          : null,

      broad_jump:
        policy.performance
          ? snapshot.broad_jump
          : null,

      strength_marker:
        policy.performance
          ? snapshot.strength_marker
          : null,

      highlight_url:
        policy.media
          ? snapshot.highlight_url
          : "",

      game_film_url:
        policy.media
          ? snapshot.game_film_url
          : "",

      recruiting_profile_url:
        policy.recruiting
          ? snapshot.recruiting_profile_url
          : "",

      social_url:
        policy.media
          ? snapshot.social_url
          : "",

      verification_status:
        policy.verification
          ? snapshot.verification_status
          : maskValue(),

      verification_authority:
        policy.verification
          ? snapshot.verification_authority
          : maskValue()
    };
  }

  /* ============================================================
     PARENT GOVERNANCE
  ============================================================ */

  async function loadParentGovernance(
    db,
    snapshot,
    policy
  ) {
    if (
      !policy.parent_approval ||
      !snapshot?.snapshot_id
    ) {
      return {
        available: false,
        status:
          "RESTRICTED"
      };
    }

    const { data, error } =
      await db
        .from(
          PARENT_APPROVAL_TABLE
        )
        .select(
          "status,approval_status,request_type,created_at,updated_at"
        )
        .eq(
          "snapshot_id",
          snapshot.snapshot_id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(1)
        .maybeSingle();

    if (error) {
      console.warn(
        "[Player Profile] Parent governance unavailable:",
        error
      );

      return {
        available: false,
        status:
          "UNAVAILABLE"
      };
    }

    if (!data) {
      return {
        available: true,
        status:
          "NOT_REQUESTED"
      };
    }

    return {
      available: true,

      status:
        upper(
          data.approval_status ||
          data.status ||
          "PENDING"
        ),

      request_type:
        data.request_type ||
        null,

      created_at:
        data.created_at ||
        null,

      updated_at:
        data.updated_at ||
        null
    };
  }

  /* ============================================================
     STREAM 9 INTELLIGENCE
  ============================================================ */

  function getScoreAuthority() {
    return (
      window.STATSCORE_SCORE_AUTHORITY_ENGINE ||
      window.STATScore?.ScoreAuthorityEngine ||
      null
    );
  }

  function unavailableIntelligence(
    reason =
      "Governed Stream 9 intelligence is unavailable."
  ) {
    return {
      ok:
        false,

      authority_available:
        false,

      status:
        STATUS.INTELLIGENCE_AUTHORITY_UNAVAILABLE,

      final_score:
        null,

      score_status:
        "UNAVAILABLE",

      matrix_id:
        null,

      matrix_code:
        null,

      star_signal:
        null,

      projection_lane:
        null,

      confidence_score:
        null,

      composite_value:
        null,

      composite_state:
        "COMPOSITE INTELLIGENCE UNAVAILABLE",

      athletic_score:
        null,

      production_score:
        null,

      academic_score:
        null,

      character_score:
        null,

      traits:
        [],

      risk_flags:
        [],

      why_this_signal:
        [reason],

      display_rule:
        "No local score reconstruction is permitted.",

      source_authority:
        "STREAM_9",

      generated_at:
        nowISO()
    };
  }

  function getGovernedScoreModel(
    snapshot
  ) {
    const authority =
      getScoreAuthority();

    if (!authority) {
      return unavailableIntelligence();
    }

    try {
      let result =
        null;

      if (
        typeof authority.getProfileScoreModel ===
        "function"
      ) {
        result =
          authority.getProfileScoreModel(
            snapshot
          );
      } else if (
        typeof authority.getDashboardScoreModel ===
        "function"
      ) {
        result =
          authority.getDashboardScoreModel(
            snapshot
          );
      }

      if (
        !result ||
        typeof result !== "object"
      ) {
        return unavailableIntelligence(
          "Stream 9 Score Authority did not return governed profile intelligence."
        );
      }

      return {
        ...result,

        ok:
          result.ok !== false,

        authority_available:
          true,

        source_authority:
          "STREAM_9",

        reconstructed_locally:
          false
      };

    } catch (error) {
      console.error(
        "[Player Profile] Stream 9 intelligence read failed:",
        error
      );

      return unavailableIntelligence(
        "Stream 9 Score Authority failed to return governed profile intelligence."
      );
    }
  }

  function getExplainabilityAuthority() {
    return (
      window.STATSCORE_EXPLAINABILITY_ENGINE ||
      window.STATScore?.ExplainabilityEngine ||
      window.STATScore?.Explainability ||
      null
    );
  }

  function getGovernedExplanation(
    scoreModel,
    audience
  ) {
    const authority =
      getExplainabilityAuthority();

    if (
      !authority ||
      typeof authority.explain !== "function"
    ) {
      return null;
    }

    const packageInput =
      scoreModel.intelligence_package ||
      scoreModel.governed_intelligence_package ||
      scoreModel.report_package ||
      null;

    if (!packageInput) {
      return null;
    }

    try {
      const explained =
        authority.explain({
          audience:
            upper(audience),
          intelligence_package:
            packageInput
        });

      return (
        explained &&
        typeof explained === "object"
      )
        ? explained
        : null;

    } catch (error) {
      console.warn(
        "[Player Profile] Explainability authority unavailable:",
        error
      );

      return null;
    }
  }

  /* ============================================================
     SAFE LIST RENDERING
  ============================================================ */

  function renderList(
    container,
    items,
    emptyMessage
  ) {
    if (!container) {
      return;
    }

    while (
      container.firstChild
    ) {
      container.removeChild(
        container.firstChild
      );
    }

    const values =
      asArray(items)
        .filter(
          value =>
            value !== null &&
            value !== undefined &&
            value !== ""
        );

    if (!values.length) {
      const li =
        document.createElement("li");

      li.textContent =
        emptyMessage;

      container.appendChild(
        li
      );

      return;
    }

    values.forEach(item => {
      const li =
        document.createElement("li");

      if (
        typeof item === "string"
      ) {
        li.textContent =
          item;
      } else {
        li.textContent =
          item.reason ||
          item.action ||
          item.label ||
          item.flag ||
          JSON.stringify(item);
      }

      container.appendChild(
        li
      );
    });
  }

  /* ============================================================
     PRESENTATION
  ============================================================ */

  function renderIdentity(
    snapshot
  ) {
    setText(
      [
        "[data-sc='athlete-name']",
        ".athlete-name",
        "#athleteName",
        "#captionName"
      ],
      snapshot.athlete_name
    );

    setText(
      [
        "[data-sc='position']",
        "#primaryPosition",
        "#tagPosition"
      ],
      snapshot.position
    );

    setText(
      [
        "[data-sc='school']",
        "#schoolName",
        "#tagSchool"
      ],
      snapshot.school
    );

    setText(
      [
        "[data-sc='class']",
        "#gradClass",
        "#tagClass"
      ],
      snapshot.graduation_class
    );

    setText(
      [
        "[data-sc='height']",
        "#tagHeight"
      ],
      snapshot.height
    );

    setText(
      [
        "[data-sc='weight']",
        "#tagWeight"
      ],
      snapshot.weight
    );

    setText(
      [
        "[data-sc='snapshot-id']",
        "#snapshotId"
      ],
      snapshot.snapshot_id
    );

    setText(
      [
        "[data-sc='location']",
        "#tagCity"
      ],
      snapshot.city_state
    );

    setText(
      "#captionMeta",
      [
        snapshot.position,
        snapshot.graduation_class
      ]
        .filter(Boolean)
        .join(" · ")
    );

    const imageFrame =
      qs("#athleteImageFrame");

    if (imageFrame) {
      while (
        imageFrame.firstChild
      ) {
        imageFrame.removeChild(
          imageFrame.firstChild
        );
      }

      if (
        snapshot.headshot_url
      ) {
        const img =
          document.createElement("img");

        img.src =
          snapshot.headshot_url;

        img.alt =
          `${snapshot.athlete_name} athlete image`;

        img.loading =
          "lazy";

        imageFrame.appendChild(
          img
        );
      } else {
        imageFrame.textContent =
          "Athlete Image Unavailable";
      }
    }
  }

  function renderMetrics(
    snapshot,
    policy
  ) {
    const performance = {
      "forty":
        snapshot.forty,

      "vertical":
        snapshot.vertical,

      "shuttle":
        snapshot.shuttle,

      "broad-jump":
        snapshot.broad_jump,

      "strength-marker":
        snapshot.strength_marker
    };

    Object.entries(
      performance
    ).forEach(
      ([key, value]) => {
        setText(
          `[data-sc='${key}']`,
          policy.performance
            ? value
            : maskValue()
        );
      }
    );

    setText(
      [
        "[data-sc='gpa']"
      ],
      policy.academics
        ? snapshot.gpa
        : maskValue()
    );

    setText(
      [
        "[data-sc='ncaa-status']"
      ],
      policy.academics
        ? snapshot.ncaa_status
        : maskValue()
    );

    setText(
      "#metricSpeed",
      policy.performance
        ? snapshot.forty
        : maskValue()
    );

    setText(
      "#metricExplosive",
      policy.performance
        ? snapshot.vertical
        : maskValue()
    );
  }

  function renderGovernedIntelligence(
    scoreModel,
    policy
  ) {
    const available =
      scoreModel &&
      scoreModel.authority_available !== false;

    const score =
      available
        ? (
          scoreModel.final_score ??
          null
        )
        : null;

    setText(
      [
        "[data-sc='score']",
        "[data-sc='final-score']",
        "#scoreValue",
        "#scFinalScore"
      ],
      score ??
      "—"
    );

    setText(
      [
        "[data-sc='score-status']",
        "#scoreStatus",
        "#signalText"
      ],
      available
        ? (
          scoreModel.score_status ||
          "PENDING"
        )
        : "UNAVAILABLE"
    );

    setText(
      [
        "[data-sc='matrix-version']",
        "#scMatrixVersion",
        "#dossierArchetype"
      ],
      available
        ? (
          scoreModel.matrix_id ||
          scoreModel.matrix_code ||
          "PENDING"
        )
        : "UNAVAILABLE"
    );

    const star =
      scoreModel?.star_signal;

    setText(
      [
        "[data-sc='star-signal']",
        "#scStarSignal"
      ],
      available
        ? (
          typeof star === "object"
            ? (
              star.label ||
              star.display ||
              "PENDING"
            )
            : (
              star ||
              "PENDING"
            )
        )
        : "UNAVAILABLE"
    );

    setText(
      "#starDisplay",
      available
        ? (
          typeof star === "object"
            ? (
              star.display ||
              star.label ||
              "☆☆☆☆☆"
            )
            : (
              star ||
              "☆☆☆☆☆"
            )
        )
        : "☆☆☆☆☆"
    );

    const projection =
      scoreModel?.projection_lane;

    setText(
      [
        "[data-sc='projection-lane']",
        "#scProjectionLane",
        "#evaluationStatus",
        "#dossierTranslation"
      ],
      available
        ? (
          typeof projection === "object"
            ? (
              projection.label ||
              "PENDING"
            )
            : (
              projection ||
              "PENDING"
            )
        )
        : "UNAVAILABLE"
    );

    setText(
      [
        "[data-sc='confidence']",
        "#scConfidence"
      ],
      available
        ? (
          scoreModel.confidence_score ??
          "—"
        )
        : "—"
    );

    setText(
      [
        "[data-sc='composite']",
        "[data-sc='composite-score']"
      ],
      available
        ? (
          scoreModel.composite_value ??
          "—"
        )
        : "—"
    );

    setText(
      "[data-sc='composite-state']",
      available
        ? (
          scoreModel.composite_state ||
          "COMPOSITE INTELLIGENCE PENDING"
        )
        : "COMPOSITE INTELLIGENCE UNAVAILABLE"
    );

    setText(
      [
        "[data-sc='athletic-score']",
        "#dossierAthleticSignal"
      ],
      (
        available &&
        policy.performance
      )
        ? (
          scoreModel.athletic_score ??
          "—"
        )
        : "—"
    );

    setText(
      [
        "[data-sc='production-score']",
        "#dossierProductionSignal"
      ],
      (
        available &&
        policy.performance
      )
        ? (
          scoreModel.production_score ??
          "—"
        )
        : "—"
    );

    setText(
      "[data-sc='academic-score']",
      (
        available &&
        policy.academics
      )
        ? (
          scoreModel.academic_score ??
          "—"
        )
        : "Restricted"
    );

    setText(
      "#metricReadiness",
      available
        ? (
          scoreModel.score_band ||
          scoreModel.readiness_label ||
          "PENDING"
        )
        : "UNAVAILABLE"
    );

    setText(
      "#scoreNote",
      available
        ? (
          scoreModel.display_rule ||
          "Governed intelligence supplied by Stream 9."
        )
        : "Governed Stream 9 intelligence is unavailable. No local score reconstruction has been performed."
    );

    renderList(
      qs("#scWhyList") ||
        qs("[data-sc='why-list']"),

      scoreModel?.why_this_signal,

      available
        ? "Governed explainability is pending."
        : "Stream 9 intelligence authority unavailable."
    );

    renderList(
      qs("#scRiskFlags") ||
        qs("[data-sc='risk-flags']"),

      scoreModel?.risk_flags,

      "No governed risk flags supplied."
    );
  }

  function renderGovernance(
    snapshot,
    parentGovernance,
    policy
  ) {
    const parentStatus =
      policy.parent_approval
        ? (
          parentGovernance.status ||
          "PENDING"
        )
        : "RESTRICTED";

    setText(
      "#guardianStatus",
      parentStatus
    );

    setText(
      "#verificationBadge",
      snapshot.verification_status
    );

    setText(
      "#dossierVerification",
      snapshot.verification_status
    );

    const guardianApproved =
      parentStatus === "APPROVED";

    setText(
      "#visibilityStatus",
      guardianApproved
        ? "CONTROLLED RELEASE"
        : "LIMITED"
    );

    setText(
      "#metricVisibility",
      guardianApproved
        ? "CONTROLLED"
        : "LIMITED"
    );

    setText(
      "#dossierVisibility",
      guardianApproved
        ? "CONTROLLED"
        : "LIMITED"
    );

    setText(
      "#recruitingStatus",
      (
        policy.recruiting &&
        guardianApproved
      )
        ? "GOVERNED"
        : "LOCKED"
    );

    setText(
      "#recruiterViewStatus",
      policy.recruiting
        ? "Recruiting visibility remains governed by active relationship scope, disclosure authority, and applicable consent."
        : "Recruiting visibility is not available to the current role."
    );

    setText(
      "#contactStatusText",
      policy.messages
        ? "Communication is available only through governed Multi-Box™ permissions."
        : "Communication access is restricted."
    );

    setText(
      "#exposureLaneText",
      policy.media
        ? "Media visibility is controlled by governed rights, consent, and publication authority."
        : "Media visibility is restricted for the current role."
    );
  }

  function renderEvidence(
    snapshot,
    policy
  ) {
    setText(
      "#gameFilmStatus",
      policy.media
        ? (
          snapshot.game_film_url ||
          snapshot.highlight_url ||
          "Film evidence unavailable."
        )
        : "Restricted"
    );

    setText(
      "#mediaStatus",
      policy.media
        ? (
          snapshot.recruiting_profile_url ||
          snapshot.social_url ||
          "No authorized media reference available."
        )
        : "Restricted"
    );

    setText(
      "#campStatus",
      "Event evidence is rendered only through governed event/evidence authorities."
    );
  }

  function renderProfileNarrative(
    snapshot,
    scoreModel,
    policy
  ) {
    const narrative = [
      snapshot.athlete_name,
      snapshot.graduation_class
        ? `Class of ${snapshot.graduation_class}`
        : "",
      snapshot.sport,
      snapshot.position
    ]
      .filter(Boolean)
      .join(" · ");

    setText(
      "#identitySub",
      narrative ||
      "Governed Athlete Profile"
    );

    setText(
      "#profileBio",
      `${snapshot.athlete_name} is presented through the STATS-CORE governed athlete profile. Stream 3 renders authorized profile information; governed intelligence is consumed from Stream 9 and source evidence remains controlled by its lawful authority.`
    );

    setText(
      "#recordStatus",
      "AUTHORIZED SNAPSHOT"
    );

    setText(
      "#footerSnapshotState",
      `Snapshot ID: ${snapshot.snapshot_id}`
    );

    setText(
      "#primaryFocus",
      scoreModel?.projection_lane?.label ||
      "Development intelligence pending governed authority."
    );

    setText(
      "#verificationNeed",
      policy.verification
        ? "Verification requirements are controlled by governed verification authority."
        : "Verification details restricted."
    );

    setText(
      "#nextSnapshotText",
      "Historical snapshots remain immutable. New verified evidence produces a new lifecycle state."
    );
  }

  /* ============================================================
     GOVERNED LINK CONTEXT
     Context travels forward.
     Authority does not.
  ============================================================ */

  function wireGovernedLinks(
    snapshot,
    workspace
  ) {
    if (
      !snapshot?.snapshot_id ||
      !snapshot?.athlete_id
    ) {
      return;
    }

    const permittedTargets = [
      "athlete-dashboard.html",
      "player-profile.html",
      "athlete-production-record.html",
      "eligibility.html",
      "readiness.html",
      "college-pathway.html",
      "crystal-report.html",
      "crystal-registry.html",
      "media.html",
      "recruiter-access.html",
      "multi-box.html",
      "profile-access.html",
      "verification-request.html",
      "parent-approval.html"
    ];

    qsa("a[href]")
      .forEach(anchor => {
        const href =
          anchor.getAttribute(
            "href"
          );

        if (
          !href ||
          href.startsWith("#") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          href.startsWith("http://") ||
          href.startsWith("https://")
        ) {
          return;
        }

        if (
          !permittedTargets.some(
            target =>
              href.includes(target)
          )
        ) {
          return;
        }

        const url =
          new URL(
            href,
            window.location.href
          );

        url.searchParams.set(
          "snapshot_id",
          snapshot.snapshot_id
        );

        url.searchParams.set(
          "athlete_id",
          snapshot.athlete_id
        );

        if (
          workspace?.workspace_id
        ) {
          url.searchParams.set(
            "workspace_id",
            workspace.workspace_id
          );
        }

        if (
          workspace?.role_context_id
        ) {
          url.searchParams.set(
            "role_context_id",
            workspace.role_context_id
          );
        }

        anchor.setAttribute(
          "href",
          (
            url.pathname
              .replace(/^\//, "") +
            url.search +
            url.hash
          )
        );

        /*
         * IMPORTANT:
         * Do not remove disabled states.
         * Destination pages must independently reauthorize.
         */
      });
  }

  /* ============================================================
     BLOCKED / FAILURE PRESENTATION
  ============================================================ */

  function renderBlocked(
    status,
    message
  ) {
    setText(
      "#recordStatus",
      status
    );

    setText(
      "#identitySub",
      "Profile Access Unavailable"
    );

    setText(
      "#scoreStatus",
      "UNAVAILABLE"
    );

    setText(
      "#scoreValue",
      "—"
    );

    setText(
      "#profileBio",
      message
    );

    setText(
      "#guardianStatus",
      "UNAVAILABLE"
    );

    setText(
      "#visibilityStatus",
      "BLOCKED"
    );

    setText(
      "#recruitingStatus",
      "BLOCKED"
    );

    setText(
      "#footerSnapshotState",
      status
    );

    emit(
      "player_profile_access_blocked",
      {
        status,
        message
      }
    );
  }

  /* ============================================================
     INIT
  ============================================================ */

  async function init() {
    console.info(
      "[STATS-CORE] Player Profile Runtime:",
      VERSION
    );

    const requested =
      getRequestedContext();

    if (!requested.snapshot_id) {
      renderBlocked(
        STATUS.REQUEST_CONTEXT_MISSING,
        "A governed snapshot_id is required to request an athlete profile. No fallback athlete has been selected."
      );

      return;
    }

    const db =
      getDb();

    if (!db) {
      renderBlocked(
        STATUS.DATA_CLIENT_UNAVAILABLE,
        "The shared STATS-CORE data authority is unavailable."
      );

      return;
    }

    const session =
      resolveSessionContext();

    if (!session) {
      renderBlocked(
        STATUS.SESSION_REQUIRED,
        "An authenticated STATS-CORE session is required before athlete profile data may be loaded."
      );

      return;
    }

    const workspace =
      resolveWorkspaceContext();

    if (!workspace) {
      renderBlocked(
        STATUS.WORKSPACE_REQUIRED,
        "An active governed workspace is required before athlete profile data may be loaded."
      );

      return;
    }

    const permissions =
      resolvePermissions();

    if (!permissions) {
      renderBlocked(
        STATUS.PERMISSION_CONTEXT_REQUIRED,
        "Role permission authority is unavailable. Athlete profile access is denied by default."
      );

      return;
    }

    /*
     * Phase 1:
     * Resolve only minimal identity.
     * Do not load the complete athlete record yet.
     */

    const snapshotIdentity =
      await resolveSnapshotIdentity(
        db,
        requested
      );

    if (!snapshotIdentity) {
      renderBlocked(
        STATUS.SNAPSHOT_NOT_FOUND,
        "The requested canonical snapshot does not exist or is not visible to the current authenticated session."
      );

      return;
    }

    if (
      snapshotIdentity.mismatch
    ) {
      renderBlocked(
        STATUS.ATHLETE_CONTEXT_MISMATCH,
        "The requested athlete_id does not match the canonical snapshot owner."
      );

      return;
    }

    /*
     * Phase 2:
     * Explicit scope authorization.
     */

    const authorization =
      authorizeEntityScope({
        session,
        workspace,
        permissions,
        snapshotIdentity
      });

    if (!authorization.ok) {
      renderBlocked(
        authorization.status ||
        STATUS.ATHLETE_SCOPE_DENIED,
        authorization.reason ||
        "The requested athlete is outside the authorized workspace scope."
      );

      return;
    }

    /*
     * Phase 3:
     * Load canonical snapshot only after authorization.
     */

    const canonical =
      await loadCanonicalSnapshot(
        db,
        snapshotIdentity
      );

    if (!canonical) {
      renderBlocked(
        STATUS.SNAPSHOT_NOT_FOUND,
        "The canonical athlete snapshot could not be loaded."
      );

      return;
    }

    const snapshot =
      normalizeCanonicalSnapshot(
        canonical
      );

    if (!snapshot) {
      renderBlocked(
        STATUS.SNAPSHOT_NOT_FOUND,
        "The canonical athlete snapshot is invalid."
      );

      return;
    }

    /*
     * Phase 4:
     * Role-safe disclosure projection.
     */

    const policy =
      buildDisclosurePolicy({
        session,
        workspace,
        permissions
      });

    const projected =
      projectSnapshot(
        snapshot,
        policy
      );

    /*
     * Phase 5:
     * Governed intelligence.
     */

    const scoreModel =
      getGovernedScoreModel(
        snapshot
      );

    const explanation =
      getGovernedExplanation(
        scoreModel,
        policy.role
      );

    /*
     * Phase 6:
     * Parent governance if permitted.
     */

    const parentGovernance =
      await loadParentGovernance(
        db,
        snapshot,
        policy
      );

    /*
     * Phase 7:
     * Presentation only.
     */

    renderIdentity(
      projected
    );

    renderMetrics(
      projected,
      policy
    );

    renderGovernedIntelligence(
      scoreModel,
      policy
    );

    renderGovernance(
      projected,
      parentGovernance,
      policy
    );

    renderEvidence(
      projected,
      policy
    );

    renderProfileNarrative(
      projected,
      scoreModel,
      policy
    );

    /*
     * If a governed explainability package exists,
     * prefer it for WHY presentation.
     */

    if (
      explanation?.recommended_actions
    ) {
      renderList(
        qs("#scWhyList"),
        explanation.recommended_actions,
        "No governed recommendation explanation supplied."
      );
    }

    wireGovernedLinks(
      snapshot,
      workspace
    );

    emit(
      "player_profile_projection_ready",
      {
        status:
          STATUS.READY,

        snapshot_id:
          snapshot.snapshot_id,

        athlete_id:
          snapshot.athlete_id,

        workspace_id:
          workspace.workspace_id,

        role_context_id:
          workspace.role_context_id,

        role:
          policy.role,

        authorization_mode:
          authorization.mode,

        stream_9_authority_available:
          scoreModel.authority_available !== false
      }
    );

    console.info(
      "[STATS-CORE] Player Profile projection ready:",
      {
        snapshot_id:
          snapshot.snapshot_id,

        athlete_id:
          snapshot.athlete_id,

        role:
          policy.role,

        authorization_mode:
          authorization.mode,

        stream_9_authority_available:
          scoreModel.authority_available !== false
      }
    );
  }

  /* ============================================================
     PUBLIC RUNTIME STATUS
  ============================================================ */

  window.STATScore =
    window.STATScore ||
    {};

  window.STATScore.PlayerProfileRuntime =
    Object.freeze({
      engine:
        ENGINE,

      version:
        VERSION,

      owner_stream:
        OWNER_STREAM,

      status:
        "ACTIVE",

      doctrine: Object.freeze({
        route_identifier_is_authority:
          false,

        storage_identifier_is_authority:
          false,

        latest_record_fallback:
          false,

        source_intake_fallback:
          false,

        raw_payload_fallback:
          false,

        creates_database_client:
          false,

        reconstructs_scores:
          false,

        requires_session:
          true,

        requires_workspace:
          true,

        requires_permission_context:
          true,

        requires_explicit_scope:
          true,

        canonical_snapshot_only:
          true,

        role_safe_projection:
          true,

        destination_reauthorization_required:
          true
      }),

      getRequestedContext,

      resolveSessionContext,

      resolveWorkspaceContext,

      resolvePermissions,

      buildDisclosurePolicy,

      authorizeEntityScope,

      getStatus() {
        return {
          engine:
            ENGINE,

          version:
            VERSION,

          owner_stream:
            OWNER_STREAM,

          canonical_snapshot_table:
            CANONICAL_SNAPSHOT_TABLE,

          creates_database_client:
            false,

          uses_local_storage_authority:
            false,

          uses_session_storage_authority:
            false,

          uses_latest_record_fallback:
            false,

          uses_intake_fallback:
            false,

          reconstructs_scores:
            false,

          generated_at:
            nowISO()
        };
      }
    });

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
