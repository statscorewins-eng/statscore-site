/*
==========================================================
STATS-CORE™
File:
statscore-professional-workspace-runtime.js

Version:
STATSCORE-PROFESSIONAL-WORKSPACE-RUNTIME-V2

Owner Stream:
Stream 5 — Professional Operations Dashboard / CRM

Primary Authority Dependency:
PHNX Workspace Runtime / governed professional workspace context

Purpose:
Consumes active_workspace_id and exposes resolved professional
workspace context to Stream 5 dashboard engines.

Constitutional Doctrine:

IDENTITY ≠ CERTIFICATION
CERTIFICATION ≠ ORGANIZATIONAL AFFILIATION
AFFILIATION ≠ AUTHORITY
AUTHORITY ≠ PERMANENT ACCESS
ROLE DECLARATION ≠ VERIFIED ROLE

Browser storage may preserve navigation continuity.
Browser storage does NOT establish professional authority.

URL parameters may identify a requested workspace.
URL parameters do NOT establish role, permissions,
credentials, assignments, or authority.

Missing Authority ≠ Permission to Reconstruct Authority.

Does NOT:
- create professional identity
- issue certification or credentials
- establish organization affiliation
- grant professional authority
- manufacture role permissions
- manufacture athlete assignments
- calculate athlete intelligence
- create athlete snapshots
==========================================================
*/

(function(){
  "use strict";

  window.STATScore = window.STATScore || {};

  const ENGINE =
    "statscore-professional-workspace-runtime.js";

  const VERSION =
    "STATSCORE-PROFESSIONAL-WORKSPACE-RUNTIME-V2";

  const STORAGE_KEYS = Object.freeze({
    ACTIVE_WORKSPACE_ID:
      "active_workspace_id",

    WORKSPACE_CONTEXT:
      "statscore_active_workspace_context"
  });

  const RESOLUTION_STATUS = Object.freeze({
    RESOLVED:
      "RESOLVED",

    AUTHORITY_UNAVAILABLE:
      "AUTHORITY_UNAVAILABLE",

    WORKSPACE_ID_REQUIRED:
      "WORKSPACE_ID_REQUIRED",

    INVALID_WORKSPACE:
      "INVALID_WORKSPACE"
  });

  /* ==========================================================
     UTILITIES
  ========================================================== */

  function nowISO(){
    return new Date().toISOString();
  }

  function getUrlParam(name){
    return new URLSearchParams(
      window.location.search
    ).get(name);
  }

  function normalizeString(value){
    return String(value ?? "").trim();
  }

  function safeArray(value){
    return Array.isArray(value)
      ? value
      : [];
  }

  function safeObject(value){
    return (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    )
      ? value
      : {};
  }

  function safeJsonParse(value){
    try{
      return value
        ? JSON.parse(value)
        : null;
    }catch(err){
      console.warn(
        "[STATS-CORE] Workspace cache parse failed:",
        err
      );

      return null;
    }
  }

  function clone(value){
    if(value === undefined){
      return undefined;
    }

    try{
      return JSON.parse(
        JSON.stringify(value)
      );
    }catch(_){
      return value;
    }
  }

  /* ==========================================================
     WORKSPACE IDENTIFIER
  ========================================================== */

  function resolveActiveWorkspaceId(){
    return (
      normalizeString(
        getUrlParam("workspace_id")
      ) ||
      normalizeString(
        getUrlParam("active_workspace_id")
      ) ||
      normalizeString(
        localStorage.getItem(
          STORAGE_KEYS.ACTIVE_WORKSPACE_ID
        )
      ) ||
      normalizeString(
        sessionStorage.getItem(
          STORAGE_KEYS.ACTIVE_WORKSPACE_ID
        )
      ) ||
      null
    );
  }

  function persistWorkspaceId(workspaceId){
    const id =
      normalizeString(workspaceId);

    if(!id){
      return;
    }

    localStorage.setItem(
      STORAGE_KEYS.ACTIVE_WORKSPACE_ID,
      id
    );

    sessionStorage.setItem(
      STORAGE_KEYS.ACTIVE_WORKSPACE_ID,
      id
    );
  }

  /* ==========================================================
     CACHE
     Cache is informational only.
     It is never current authorization authority.
  ========================================================== */

  function readStoredContext(){
    const cached =
      safeJsonParse(
        localStorage.getItem(
          STORAGE_KEYS.WORKSPACE_CONTEXT
        )
      );

    if(!cached){
      return null;
    }

    return {
      ...cached,

      authority_verified:
        false,

      authoritative:
        false,

      cache_only:
        true,

      resolution_status:
        RESOLUTION_STATUS.AUTHORITY_UNAVAILABLE
    };
  }

  function writeStoredContext(context){
    if(!context){
      return;
    }

    const cached = {
      active_workspace_id:
        context.active_workspace_id ||
        null,

      workspace_id:
        context.workspace_id ||
        null,

      professional_id:
        context.professional_id ||
        null,

      phnx_id:
        context.phnx_id ||
        null,

      role:
        context.role ||
        null,

      role_id:
        context.role_id ||
        null,

      role_context_id:
        context.role_context_id ||
        null,

      role_instance_id:
        context.role_instance_id ||
        null,

      display_name:
        context.display_name ||
        "Professional",

      organization:
        context.organization ||
        null,

      sport:
        context.sport ||
        null,

      sport_scope:
        clone(
          context.sport_scope || []
        ),

      position_event_scope:
        clone(
          context.position_event_scope
        ),

      dashboard_config_key:
        context.dashboard_config_key ||
        null,

      multibox_from_identity:
        clone(
          context.multibox_from_identity
        ),

      cached_at:
        nowISO(),

      /*
       * Security-sensitive properties are intentionally
       * excluded from authoritative cache restoration:
       *
       * permissions
       * credentials
       * assigned_athletes
       * authority_scope
       * assigned_access_type
       * actions
       *
       * Those must be resolved from governed authority.
       */

      authoritative:
        false,

      cache_only:
        true
    };

    localStorage.setItem(
      STORAGE_KEYS.WORKSPACE_CONTEXT,
      JSON.stringify(cached)
    );
  }

  /* ==========================================================
     PHNX RUNTIME RESOLUTION
  ========================================================== */

  function getPHNXRuntime(){
    return (
      window.PHNXWorkspaceRuntime ||
      window.PHNX?.WorkspaceRuntime ||
      window.phnxWorkspaceRuntime ||
      null
    );
  }

  async function loadFromPHNXRuntime(
    activeWorkspaceId
  ){
    const phnxRuntime =
      getPHNXRuntime();

    if(!phnxRuntime){
      return null;
    }

    /*
     * Preserve only callable contracts already supported
     * by the physical predecessor file.
     */

    if(
      typeof phnxRuntime.getActiveWorkspace ===
      "function"
    ){
      return await phnxRuntime.getActiveWorkspace(
        activeWorkspaceId
      );
    }

    if(
      typeof phnxRuntime.restoreActiveWorkspace ===
      "function"
    ){
      return await phnxRuntime.restoreActiveWorkspace(
        activeWorkspaceId
      );
    }

    if(
      typeof phnxRuntime.getWorkspaceContext ===
      "function"
    ){
      return await phnxRuntime.getWorkspaceContext(
        activeWorkspaceId
      );
    }

    return null;
  }

  /* ==========================================================
     NORMALIZATION
  ========================================================== */

  function normalizeWorkspace(
    raw,
    options = {}
  ){
    raw =
      safeObject(raw);

    const authoritative =
      options.authoritative === true;

    const workspaceId =
      normalizeString(
        raw.active_workspace_id ||
        raw.workspace_id ||
        raw.id ||
        options.workspace_id
      ) ||
      null;

    const role =
      normalizeString(
        raw.role ||
        raw.role_key
      ) ||
      null;

    /*
     * Authority-bearing properties only survive
     * normalization when the source was resolved
     * through governed PHNX Workspace Runtime.
     */

    const permissions =
      authoritative
        ? clone(
            safeObject(
              raw.permissions
            )
          )
        : {};

    const credentials =
      authoritative
        ? clone(
            raw.credentials || {}
          )
        : {};

    const assignedAthletes =
      authoritative
        ? clone(
            safeArray(
              raw.assigned_athletes ||
              raw.assignedAthletes
            )
          )
        : [];

    const authorityScope =
      authoritative
        ? (
            raw.authority_scope ||
            raw.authorityScope ||
            raw.assigned_access_type ||
            null
          )
        : null;

    const assignedAccessType =
      authoritative
        ? (
            raw.assigned_access_type ||
            raw.assignedAccessType ||
            null
          )
        : null;

    const actions =
      authoritative
        ? clone(
            safeArray(
              raw.actions
            )
          )
        : [];

    return {
      engine:
        ENGINE,

      runtime_version:
        VERSION,

      active_workspace_id:
        workspaceId,

      workspace_id:
        workspaceId,

      professional_id:
        raw.professional_id ||
        raw.phnx_professional_id ||
        null,

      phnx_id:
        raw.phnx_id ||
        raw.phnx_professional_id ||
        null,

      role,

      role_id:
        raw.role_id ||
        null,

      role_context_id:
        raw.role_context_id ||
        null,

      role_instance_id:
        raw.role_instance_id ||
        null,

      first_name:
        raw.first_name ||
        raw.firstName ||
        "",

      last_name:
        raw.last_name ||
        raw.lastName ||
        "",

      display_name:
        raw.display_name ||
        raw.professional_name ||
        [
          raw.first_name ||
          raw.firstName,

          raw.last_name ||
          raw.lastName
        ]
          .filter(Boolean)
          .join(" ") ||
        "Professional",

      organization:
        raw.organization ||
        raw.organization_context ||
        raw.organizationName ||
        null,

      sport:
        raw.sport ||
        raw.primary_sport ||
        raw.primarySport ||
        null,

      sport_scope:
        clone(
          raw.sport_scope ||
          raw.sportScope ||
          []
        ),

      position_event_scope:
        raw.position_event_scope ||
        raw.positionEventGroup ||
        raw.position_scope ||
        null,

      /*
       * Governed authority-bearing fields.
       */

      authority_scope:
        authorityScope,

      assigned_access_type:
        assignedAccessType,

      permissions,

      credentials,

      assigned_athletes:
        assignedAthletes,

      primary_workflow:
        raw.primary_workflow ||
        raw.dashboardNeed ||
        raw.workflow ||
        "role_overview",

      dashboard_config_key:
        raw.dashboard_config_key ||
        raw.dashboardConfigKey ||
        null,

      notices:
        clone(
          safeArray(
            raw.notices
          )
        ),

      actions,

      communication_context:
        clone(
          safeObject(
            raw.communication_context
          )
        ),

      multibox_from_identity:
        raw.multibox_from_identity ||
        raw.multiboxIdentity ||
        null,

      authority_verified:
        authoritative,

      authoritative,

      cache_only:
        !authoritative,

      resolution_status:
        authoritative
          ? RESOLUTION_STATUS.RESOLVED
          : RESOLUTION_STATUS.AUTHORITY_UNAVAILABLE,

      resolved_at:
        authoritative
          ? nowISO()
          : null,

      raw:
        authoritative
          ? raw
          : null
    };
  }

  /* ==========================================================
     UNRESOLVED CONTEXT
  ========================================================== */

  function buildUnresolvedContext(
    activeWorkspaceId,
    cachedContext = null
  ){
    const cached =
      safeObject(cachedContext);

    return normalizeWorkspace(
      {
        active_workspace_id:
          activeWorkspaceId ||
          cached.active_workspace_id ||
          null,

        workspace_id:
          activeWorkspaceId ||
          cached.workspace_id ||
          null,

        professional_id:
          cached.professional_id ||
          null,

        phnx_id:
          cached.phnx_id ||
          null,

        role:
          cached.role ||
          null,

        role_id:
          cached.role_id ||
          null,

        role_context_id:
          cached.role_context_id ||
          null,

        role_instance_id:
          cached.role_instance_id ||
          null,

        display_name:
          cached.display_name ||
          "Professional",

        organization:
          cached.organization ||
          null,

        sport:
          cached.sport ||
          null,

        sport_scope:
          cached.sport_scope ||
          [],

        position_event_scope:
          cached.position_event_scope ||
          null,

        dashboard_config_key:
          cached.dashboard_config_key ||
          null,

        multibox_from_identity:
          cached.multibox_from_identity ||
          null
      },
      {
        authoritative:
          false,

        workspace_id:
          activeWorkspaceId ||
          null
      }
    );
  }

  /* ==========================================================
     EVENT PUBLICATION
  ========================================================== */

  function publishReady(context){
    document.dispatchEvent(
      new CustomEvent(
        "statscore:workspace-ready",
        {
          detail:
            context
        }
      )
    );
  }

  function publishUnavailable(context){
    document.dispatchEvent(
      new CustomEvent(
        "statscore:workspace-authority-unavailable",
        {
          detail:
            context
        }
      )
    );
  }

  /* ==========================================================
     LOAD
  ========================================================== */

  async function loadWorkspace(){
    const activeWorkspaceId =
      resolveActiveWorkspaceId();

    if(activeWorkspaceId){
      persistWorkspaceId(
        activeWorkspaceId
      );
    }

    let governedWorkspace =
      null;

    try{
      governedWorkspace =
        await loadFromPHNXRuntime(
          activeWorkspaceId
        );
    }catch(err){
      console.warn(
        "[STATS-CORE] PHNX workspace resolution failed:",
        err
      );
    }

    if(governedWorkspace){
      const normalized =
        normalizeWorkspace(
          governedWorkspace,
          {
            authoritative:
              true,

            workspace_id:
              activeWorkspaceId
          }
        );

      if(
        normalized.active_workspace_id
      ){
        persistWorkspaceId(
          normalized.active_workspace_id
        );
      }

      writeStoredContext(
        normalized
      );

      window.STATScore.currentWorkspace =
        normalized;

      publishReady(
        normalized
      );

      console.info(
        "[STATS-CORE] Professional workspace resolved:",
        {
          workspace_id:
            normalized.workspace_id,

          role:
            normalized.role,

          authoritative:
            true
        }
      );

      return normalized;
    }

    /*
     * No governed workspace was returned.
     *
     * Cache may assist presentation/navigation,
     * but no permissions, credentials, assigned
     * athletes, authority scope, or actions are
     * reconstructed from browser state.
     */

    const cached =
      readStoredContext();

    const unresolved =
      buildUnresolvedContext(
        activeWorkspaceId,
        cached
      );

    window.STATScore.currentWorkspace =
      unresolved;

    publishUnavailable(
      unresolved
    );

    console.warn(
      "[STATS-CORE] Professional workspace authority unavailable.",
      {
        workspace_id:
          unresolved.workspace_id,

        authoritative:
          false
      }
    );

    return unresolved;
  }

  /* ==========================================================
     ACCESSORS
  ========================================================== */

  function getWorkspace(){
    return (
      window.STATScore.currentWorkspace ||
      buildUnresolvedContext(
        resolveActiveWorkspaceId(),
        readStoredContext()
      )
    );
  }

  function hasAuthority(){
    const workspace =
      getWorkspace();

    return Boolean(
      workspace &&
      workspace.authoritative === true &&
      workspace.authority_verified === true
    );
  }

  function getAuthorityStatus(){
    const workspace =
      getWorkspace();

    return {
      engine:
        ENGINE,

      version:
        VERSION,

      workspace_id:
        workspace?.workspace_id ||
        null,

      role:
        workspace?.role ||
        null,

      authoritative:
        Boolean(
          workspace?.authoritative
        ),

      authority_verified:
        Boolean(
          workspace?.authority_verified
        ),

      resolution_status:
        workspace?.resolution_status ||
        RESOLUTION_STATUS.AUTHORITY_UNAVAILABLE
    };
  }

  /* ==========================================================
     PUBLIC RUNTIME
  ========================================================== */

  window.STATScore.ProfessionalWorkspaceRuntime = {
    engine:
      ENGINE,

    version:
      VERSION,

    load:
      loadWorkspace,

    get:
      getWorkspace,

    getActiveWorkspaceId:
      resolveActiveWorkspaceId,

    normalize:
      normalizeWorkspace,

    hasAuthority,

    getAuthorityStatus,

    RESOLUTION_STATUS
  };

  console.info(
    "[STATS-CORE] Professional Workspace Runtime loaded:",
    VERSION
  );

})(); 
