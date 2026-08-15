/*
==========================================================
STATS-CORE™
File:
statscore-role-permission-engine.js

Version:
STATSCORE-ROLE-PERMISSION-ENGINE-V2-GOVERNED-SCOPE

Owner:
Stream 5 — Professional Operations / Professional Workspace Authority

Purpose:
1. Determine role-safe workspace UI capabilities.
2. Perform governed contextual authorization for professional
   actions that depend on active relationship/scope.

Constitutional Doctrine:

CERTIFICATION ≠ ORGANIZATIONAL AFFILIATION
AFFILIATION ≠ AUTHORITY
AUTHORITY ≠ PERMANENT ACCESS
ROLE ≠ ATHLETE ACCESS
UI VISIBILITY ≠ ACTION AUTHORIZATION

Credentials may influence trust/capability classification.
Credentials SHALL NOT independently grant athlete access.

Athlete-specific access requires an active governed relationship,
assignment, organizational scope, or other explicit authority.

Missing Authority ≠ Permission.

==========================================================
*/

(function(){
  "use strict";


  /* ==========================================================
     NAMESPACE / ENGINE IDENTITY
  ========================================================== */

  window.STATScore =
    window.STATScore ||
    {};


  const ENGINE_ID =
    "statscore-role-permission-engine";


  const VERSION =
    "STATSCORE-ROLE-PERMISSION-ENGINE-V2-GOVERNED-SCOPE";


  const OWNER_STREAM =
    "STREAM_5_PROFESSIONAL_OPERATIONS";


  /* ==========================================================
     UI CAPABILITY PERMISSIONS

     These control workspace presentation.

     They DO NOT independently establish athlete-specific access.
  ========================================================== */

  const DEFAULT_PERMISSIONS = Object.freeze({
    assigned_athletes:
      false,

    reports:
      false,

    messages:
      false,

    roster:
      false,

    production:
      false,

    verification:
      false,

    evaluation:
      false,

    development_tracker:
      false,

    recruiting_board:
      false,

    academic_alerts:
      false,

    parent_approval_status:
      false,

    media_review:
      false,

    athlete_search:
      false
  });


  const ROLE_DEFAULTS = Object.freeze({

    parent: Object.freeze({
      assigned_athletes:
        true,

      reports:
        true,

      messages:
        true,

      parent_approval_status:
        true,

      athlete_search:
        false
    }),


    coach: Object.freeze({
      assigned_athletes:
        true,

      reports:
        true,

      messages:
        true,

      roster:
        true,

      production:
        true,

      verification:
        true,

      development_tracker:
        true,

      media_review:
        true,

      athlete_search:
        true
    }),


    counselor: Object.freeze({
      assigned_athletes:
        true,

      reports:
        true,

      messages:
        true,

      academic_alerts:
        true,

      verification:
        true,

      athlete_search:
        true
    }),


    recruiter: Object.freeze({
      assigned_athletes:
        true,

      reports:
        true,

      messages:
        true,

      recruiting_board:
        true,

      athlete_search:
        true
    }),


    evaluator: Object.freeze({
      assigned_athletes:
        true,

      reports:
        true,

      messages:
        true,

      verification:
        true,

      evaluation:
        true,

      media_review:
        true,

      athlete_search:
        true
    }),


    trainer: Object.freeze({
      assigned_athletes:
        true,

      reports:
        true,

      messages:
        true,

      development_tracker:
        true,

      evaluation:
        false,

      athlete_search:
        true
    }),


    program: Object.freeze({
      assigned_athletes:
        true,

      reports:
        true,

      messages:
        true,

      roster:
        true,

      production:
        true,

      recruiting_board:
        true,

      athlete_search:
        true
    }),


    professional: Object.freeze({
      assigned_athletes:
        false,

      messages:
        true,

      athlete_search:
        false
    })

  });


  /* ==========================================================
     AUTHORIZATION ACTIONS
  ========================================================== */

  const ACTIONS = Object.freeze({
    ATHLETE_SEARCH:
      "ATHLETE_SEARCH",

    ATHLETE_VIEW:
      "ATHLETE_VIEW",

    ATHLETE_REPORT_VIEW:
      "ATHLETE_REPORT_VIEW",

    ATHLETE_MESSAGE:
      "ATHLETE_MESSAGE",

    ATHLETE_EVALUATE:
      "ATHLETE_EVALUATE",

    ATHLETE_TRAIN:
      "ATHLETE_TRAIN",

    ATHLETE_VERIFY:
      "ATHLETE_VERIFY",

    ATHLETE_MEDIA_REVIEW:
      "ATHLETE_MEDIA_REVIEW"
  });


  const DECISION = Object.freeze({
    AUTHORIZED:
      "AUTHORIZED",

    DENIED:
      "DENIED",

    CONTEXT_REQUIRED:
      "CONTEXT_REQUIRED",

    RELATIONSHIP_REQUIRED:
      "RELATIONSHIP_REQUIRED",

    WORKSPACE_REQUIRED:
      "WORKSPACE_REQUIRED",

    CAPABILITY_DENIED:
      "CAPABILITY_DENIED",

    ACCESS_AUTHORITY_UNAVAILABLE:
      "ACCESS_AUTHORITY_UNAVAILABLE"
  });


  /* ==========================================================
     BASIC UTILITIES
  ========================================================== */

  function nowISO(){
    return new Date().toISOString();
  }


  function clean(value){
    if(
      value === null ||
      value === undefined
    ){
      return "";
    }

    return String(value).trim();
  }


  function lower(value){
    return clean(value).toLowerCase();
  }


  function upper(value){
    return clean(value).toUpperCase();
  }


  function hasObject(value){
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }


  function safeArray(value){
    return Array.isArray(value)
      ? value
      : [];
  }


  /* ==========================================================
     WORKSPACE / IDENTITY CONTEXT

     Stream 5 consumes identity/context.
     It does not manufacture it.
  ========================================================== */

  function getActiveWorkspace(){
    return (
      window.STATScore.ActiveWorkspace?.get?.() ||
      window.STATScoreActiveWorkspaceEngine?.getActiveWorkspace?.() ||
      window.PHNXWorkspaceRuntime?.getActiveWorkspace?.() ||
      window.STATScoreCurrentWorkspace ||
      {}
    );
  }


  function getProfessionalIdentity(){
    return (
      window.PHNXProfessionalIdentityEngine?.getCurrentIdentity?.() ||
      window.PHNXProfessionalIdentityEngine?.getIdentity?.() ||
      window.STATScoreCurrentProfessionalIdentity ||
      {}
    );
  }


  function getSession(){
    return (
      window.PHNXSessionEngine?.getCurrentSession?.() ||
      window.PHNXSessionEngine?.getSession?.() ||
      window.STATScoreAuthenticationContext?.getCurrent?.() ||
      window.STATScoreCurrentSession ||
      {}
    );
  }


  function buildContext(extra = {}){
    const ws =
      getActiveWorkspace();

    const identity =
      getProfessionalIdentity();

    const session =
      getSession();


    return {
      user_id:
        extra.user_id ||
        session.user_id ||
        session.id ||
        null,

      professional_id:
        extra.professional_id ||
        identity.professional_id ||
        identity.id ||
        ws.professional_id ||
        null,

      role:
        lower(
          extra.role ||
          ws.role ||
          identity.role ||
          session.role ||
          "professional"
        ),

      role_id:
        extra.role_id ||
        ws.role_id ||
        identity.role_id ||
        null,

      role_context_id:
        extra.role_context_id ||
        ws.role_context_id ||
        identity.role_context_id ||
        null,

      role_instance_id:
        extra.role_instance_id ||
        ws.role_instance_id ||
        identity.role_instance_id ||
        null,

      workspace_id:
        extra.workspace_id ||
        ws.workspace_id ||
        ws.id ||
        null,

      organization_id:
        extra.organization_id ||
        ws.organization_id ||
        identity.organization_id ||
        null,

      program_id:
        extra.program_id ||
        ws.program_id ||
        identity.program_id ||
        null,

      athlete_id:
        extra.athlete_id ||
        null,

      snapshot_id:
        extra.snapshot_id ||
        null,

      credentials:
        extra.credentials ||
        ws.credentials ||
        identity.credentials ||
        {},

      explicit_permissions:
        extra.permissions ||
        ws.permissions ||
        {},

      raw_workspace:
        ws
    };
  }


  /* ==========================================================
     CREDENTIAL INSPECTION

     Credential presence may expose a UI capability.

     It NEVER grants athlete-specific authority.
  ========================================================== */

  function hasCredential(
    credentials,
    key
  ){
    if(!credentials){
      return false;
    }


    if(
      Array.isArray(credentials)
    ){
      return credentials.some(
        credential =>
          lower(
            credential?.role ||
            credential?.type ||
            credential?.name ||
            credential
          ) === lower(key)
      );
    }


    if(
      hasObject(credentials)
    ){
      return Boolean(
        credentials[key] === true ||
        credentials[lower(key)] === true
      );
    }


    return false;
  }


  /* ==========================================================
     UI PERMISSION BUILD

     This determines what tools may be surfaced.

     It does NOT authorize a specific athlete.
  ========================================================== */

  function build(extraContext = {}){
    const context =
      buildContext(
        extraContext
      );


    const role =
      context.role ||
      "professional";


    const roleDefaults =
      ROLE_DEFAULTS[role] ||
      ROLE_DEFAULTS.professional;


    const permissions = {
      ...DEFAULT_PERMISSIONS,
      ...roleDefaults,
      ...(context.explicit_permissions || {})
    };


    /*
      Credentials may enable professional capability display,
      but athlete access still requires relationship/scope.
    */

    if(
      hasCredential(
        context.credentials,
        "evaluator"
      )
    ){
      permissions.evaluation =
        true;

      permissions.verification =
        true;

      permissions.media_review =
        true;
    }


    if(
      hasCredential(
        context.credentials,
        "trainer"
      )
    ){
      permissions.development_tracker =
        true;
    }


    if(
      hasCredential(
        context.credentials,
        "coach"
      )
    ){
      permissions.roster =
        true;

      permissions.production =
        true;
    }


    window.STATScore.rolePermissions =
      Object.freeze({
        ...permissions
      });


    document.dispatchEvent(
      new CustomEvent(
        "statscore:role-permissions-ready",
        {
          detail:{
            permissions:
              window.STATScore.rolePermissions,

            role:
              context.role,

            workspace_id:
              context.workspace_id,

            generated_at:
              nowISO()
          }
        }
      )
    );


    return window.STATScore.rolePermissions;
  }


  /* ==========================================================
     UI CAPABILITY CHECK
  ========================================================== */

  function canUI(key){
    const permissions =
      window.STATScore.rolePermissions ||
      build();


    return Boolean(
      permissions[
        lower(key)
      ]
    );
  }


  /* ==========================================================
     RELATIONSHIP / SCOPE RESOLUTION

     Preferred:
     Consume a governing relationship/scope authority if present.

     Compatibility:
     Consume explicit active-workspace assignments when already
     established by an upstream authority.

     Missing relationship authority fails closed.
  ========================================================== */

  async function resolveRelationshipScope(
    context
  ){
    const relationshipAuthority =
      window.STATScoreRelationshipAuthority ||
      window.STATScoreAthleteAccessAuthority ||
      window.PHNXRelationshipAuthority ||
      null;


    /* ----------------------------------------------------------
       Preferred external authority
    ---------------------------------------------------------- */

    if(
      relationshipAuthority
    ){
      try{

        if(
          typeof relationshipAuthority.authorizeAthleteAccess ===
          "function"
        ){
          const result =
            await relationshipAuthority.authorizeAthleteAccess(
              context
            );

          return normalizeRelationshipDecision(
            result
          );
        }


        if(
          typeof relationshipAuthority.authorize ===
          "function"
        ){
          const result =
            await relationshipAuthority.authorize({
              action:
                ACTIONS.ATHLETE_VIEW,

              ...context
            });

          return normalizeRelationshipDecision(
            result
          );
        }

      }catch(err){
        return {
          ok:false,

          status:
            DECISION.DENIED,

          reason:
            err?.message ||
            "Relationship authorization failed."
        };
      }
    }


    /* ----------------------------------------------------------
       Explicit active-workspace assignment compatibility

       These values must already have been manufactured upstream.

       This engine does NOT create them.
    ---------------------------------------------------------- */

    const ws =
      context.raw_workspace ||
      {};


    const assignedIds =
      [
        ...safeArray(
          ws.assigned_athlete_ids
        ),

        ...safeArray(
          ws.authorized_athlete_ids
        ),

        ...safeArray(
          ws.athlete_scope_ids
        )
      ]
        .map(clean)
        .filter(Boolean);


    const assignedSnapshots =
      [
        ...safeArray(
          ws.assigned_snapshot_ids
        ),

        ...safeArray(
          ws.authorized_snapshot_ids
        )
      ]
        .map(clean)
        .filter(Boolean);


    const athleteMatch =
      Boolean(
        context.athlete_id &&
        assignedIds.includes(
          clean(
            context.athlete_id
          )
        )
      );


    const snapshotMatch =
      Boolean(
        context.snapshot_id &&
        assignedSnapshots.includes(
          clean(
            context.snapshot_id
          )
        )
      );


    if(
      athleteMatch ||
      snapshotMatch
    ){
      return {
        ok:true,

        status:
          DECISION.AUTHORIZED,

        source:
          "ACTIVE_WORKSPACE_ASSIGNMENT",

        relationship_verified:
          true
      };
    }


    return {
      ok:false,

      status:
        DECISION.RELATIONSHIP_REQUIRED,

      source:
        "NO_GOVERNED_RELATIONSHIP_FOUND",

      relationship_verified:
        false,

      reason:
        "No active governed relationship or assignment authorizes this athlete."
    };
  }


  function normalizeRelationshipDecision(
    result
  ){
    if(
      result === true
    ){
      return {
        ok:true,
        status:
          DECISION.AUTHORIZED
      };
    }


    if(
      result === false
    ){
      return {
        ok:false,
        status:
          DECISION.DENIED
      };
    }


    if(
      hasObject(result)
    ){
      const authorized =
        result.ok === true ||
        result.allowed === true ||
        result.authorized === true;


      return {
        ...result,

        ok:
          authorized,

        status:
          result.status ||
          (
            authorized
              ? DECISION.AUTHORIZED
              : DECISION.DENIED
          )
      };
    }


    return {
      ok:false,
      status:
        DECISION.DENIED
    };
  }


  /* ==========================================================
     SEARCH AUTHORIZATION

     Search capability means a professional can search within
     lawful scope.

     It does NOT mean global athlete directory access.
  ========================================================== */

  async function canSearchAthletes(
    extraContext = {}
  ){
    const context =
      buildContext(
        extraContext
      );


    const permissions =
      window.STATScore.rolePermissions ||
      build(
        context
      );


    if(
      !context.workspace_id &&
      !context.role_context_id &&
      !context.role_instance_id
    ){
      return {
        ok:false,

        authorized:false,

        status:
          DECISION.WORKSPACE_REQUIRED,

        action:
          ACTIONS.ATHLETE_SEARCH,

        reason:
          "Active professional workspace context is required."
      };
    }


    if(
      permissions.athlete_search !==
      true
    ){
      return {
        ok:false,

        authorized:false,

        status:
          DECISION.CAPABILITY_DENIED,

        action:
          ACTIONS.ATHLETE_SEARCH,

        reason:
          "Current role/workspace does not expose athlete search capability."
      };
    }


    /*
      Important:
      Search authorization only enables scoped discovery.

      Individual results must still pass athlete-specific
      authorization before disclosure.
    */

    return {
      ok:true,

      authorized:true,

      status:
        DECISION.AUTHORIZED,

      action:
        ACTIONS.ATHLETE_SEARCH,

      scoped_search:
        true,

      global_directory_access:
        false,

      professional_id:
        context.professional_id,

      role:
        context.role,

      workspace_id:
        context.workspace_id,

      organization_id:
        context.organization_id,

      program_id:
        context.program_id,

      granted_at:
        nowISO()
    };
  }


  /* ==========================================================
     ATHLETE-SPECIFIC ACCESS
  ========================================================== */

  async function canAccessAthlete(
    extraContext = {}
  ){
    const context =
      buildContext(
        extraContext
      );


    if(
      !context.athlete_id &&
      !context.snapshot_id
    ){
      return {
        ok:false,

        authorized:false,

        status:
          DECISION.CONTEXT_REQUIRED,

        action:
          ACTIONS.ATHLETE_VIEW,

        reason:
          "athlete_id or snapshot_id is required."
      };
    }


    const permissions =
      window.STATScore.rolePermissions ||
      build(
        context
      );


    if(
      permissions.assigned_athletes !==
      true
    ){
      return {
        ok:false,

        authorized:false,

        status:
          DECISION.CAPABILITY_DENIED,

        action:
          ACTIONS.ATHLETE_VIEW,

        reason:
          "Current role does not expose assigned-athlete access capability."
      };
    }


    const relationship =
      await resolveRelationshipScope(
        context
      );


    if(
      !relationship.ok
    ){
      return {
        ok:false,

        authorized:false,

        status:
          relationship.status ||
          DECISION.RELATIONSHIP_REQUIRED,

        action:
          ACTIONS.ATHLETE_VIEW,

        relationship,

        reason:
          relationship.reason ||
          "No active governed athlete relationship exists."
      };
    }


    return {
      ok:true,

      authorized:true,

      status:
        DECISION.AUTHORIZED,

      action:
        ACTIONS.ATHLETE_VIEW,

      athlete_id:
        context.athlete_id,

      snapshot_id:
        context.snapshot_id,

      professional_id:
        context.professional_id,

      role:
        context.role,

      workspace_id:
        context.workspace_id,

      organization_id:
        context.organization_id,

      program_id:
        context.program_id,

      relationship,

      granted_at:
        nowISO()
    };
  }


  /* ==========================================================
     ACTION → UI CAPABILITY MAP
  ========================================================== */

  function capabilityForAction(
    action
  ){
    switch(
      upper(action)
    ){

      case ACTIONS.ATHLETE_SEARCH:
        return "athlete_search";

      case ACTIONS.ATHLETE_VIEW:
        return "assigned_athletes";

      case ACTIONS.ATHLETE_REPORT_VIEW:
        return "reports";

      case ACTIONS.ATHLETE_MESSAGE:
        return "messages";

      case ACTIONS.ATHLETE_EVALUATE:
        return "evaluation";

      case ACTIONS.ATHLETE_TRAIN:
        return "development_tracker";

      case ACTIONS.ATHLETE_VERIFY:
        return "verification";

      case ACTIONS.ATHLETE_MEDIA_REVIEW:
        return "media_review";

      default:
        return null;
    }
  }


  /* ==========================================================
     GENERAL AUTHORIZATION
  ========================================================== */

  async function authorize(
    request = {}
  ){
    const action =
      upper(
        request.action
      );


    if(
      !action
    ){
      return {
        ok:false,

        authorized:false,

        status:
          DECISION.CONTEXT_REQUIRED,

        reason:
          "Authorization action is required."
      };
    }


    if(
      action ===
      ACTIONS.ATHLETE_SEARCH
    ){
      return canSearchAthletes(
        request
      );
    }


    if(
      action ===
      ACTIONS.ATHLETE_VIEW
    ){
      return canAccessAthlete(
        request
      );
    }


    const capability =
      capabilityForAction(
        action
      );


    if(
      !capability
    ){
      return {
        ok:false,

        authorized:false,

        status:
          DECISION.CAPABILITY_DENIED,

        action,

        reason:
          "Requested action is not registered with Role Permission Authority."
      };
    }


    const context =
      buildContext(
        request
      );


    const permissions =
      window.STATScore.rolePermissions ||
      build(
        context
      );


    if(
      permissions[capability] !==
      true
    ){
      return {
        ok:false,

        authorized:false,

        status:
          DECISION.CAPABILITY_DENIED,

        action,

        capability
      };
    }


    /*
      Athlete-targeted professional actions require athlete scope.
    */

    const athleteDecision =
      await canAccessAthlete(
        context
      );


    if(
      !athleteDecision.ok
    ){
      return {
        ...athleteDecision,

        action
      };
    }


    return {
      ...athleteDecision,

      action,

      capability
    };
  }


  /* ==========================================================
     COMPATIBILITY `can`

     Supports both:

       can("reports")

     and:

       can("ATHLETE_VIEW", context)
  ========================================================== */

  function can(
    keyOrAction,
    context
  ){
    const normalized =
      upper(
        keyOrAction
      );


    if(
      Object.values(
        ACTIONS
      ).includes(
        normalized
      )
    ){
      return authorize({
        ...(context || {}),
        action:
          normalized
      });
    }


    return canUI(
      keyOrAction
    );
  }


  /* ==========================================================
     EVENTS
  ========================================================== */

  document.addEventListener(
    "statscore:role-context-ready",
    function(event){
      build(
        event?.detail ||
        {}
      );
    }
  );


  document.addEventListener(
    "statscore:active-workspace-ready",
    function(event){
      build(
        event?.detail ||
        {}
      );
    }
  );


  /* ==========================================================
     PUBLIC AUTHORITY
  ========================================================== */

  const RolePermissionEngine = {

    engine_id:
      ENGINE_ID,

    version:
      VERSION,

    owner_stream:
      OWNER_STREAM,

    status:
      "ACTIVE",

    ACTIONS,

    DECISION,

    build,

    get:
      () =>
        window.STATScore.rolePermissions ||
        build(),

    can,

    canUI,

    authorize,

    canSearchAthletes,

    canAccessAthlete,

    getContext:
      buildContext,

    doctrine:
      Object.freeze({

        ui_permission_equals_access_authority:
          false,

        certification_equals_authority:
          false,

        role_equals_athlete_access:
          false,

        affiliation_equals_authority:
          false,

        authority_equals_permanent_access:
          false,

        athlete_access_requires_relationship_scope:
          true,

        missing_authority_fails_closed:
          true,

        supports_contextual_authorization:
          true,

        global_athlete_directory_by_default:
          false
      })
  };


  window.STATScore.RolePermissionEngine =
    RolePermissionEngine;


  /*
    Compatibility namespace expected by newer governed routers.
  */

  window.STATScoreRolePermissionEngine =
    RolePermissionEngine;


  console.info(
    "[STATS-CORE] Role Permission Engine loaded:",
    VERSION
  );

})(); 
