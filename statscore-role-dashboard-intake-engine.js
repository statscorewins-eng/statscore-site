/* =========================================================
   STATS-CORE™
   STREAM 4 — PROFESSIONAL ROLE DASHBOARD INTAKE ENGINE

   File:
   statscore-role-dashboard-intake-engine.js

   Version:
   STREAM_4_ROLE_DASHBOARD_INTAKE_V2.4_ROLE_ROUTING_LOCKED

   Owner Stream:
   Stream 4 — Professional Role Intake Authority

   Purpose:
   Governed runtime controller for:
   role-dashboard-intake.html

   Constitutional Admission Rule:
   Professional Role Intake SHALL NOT initialize until the
   approved Stream 1 Initial Authentication Context Authority
   has been successfully restored and consumed.

   Dashboard Routing Rule:
   Stream 4 SHALL route a completed Professional Role Intake
   only to the CSE-locked physical dashboard assigned to the
   authoritative authenticated role.

   Role selection, query-string values, specialization, workflow,
   requested tools, credential intent, localStorage, or user-entered
   titles SHALL NOT determine dashboard authority.

   Administrator Boundary:
   Administrator access is NOT part of the shared Professional
   Role Intake path and is intentionally excluded from this router.

   Locked V1 Role Dashboard Routes:
   parent     -> parent-dashboard.html
   coach      -> coach-dashboard.html
   counselor  -> counselor-dashboard.html
   recruiter  -> recruiter-dashboard.html
   evaluator  -> evaluator-dashboard.html
   program    -> program-dashboard.html
   trainer    -> trainer-dashboard.html

   Manufacturing Completion Rule:
   Professional Workspace / Dashboard traversal SHALL NOT be
   released until all of the following exist:

   1. Authoritative Professional Role Context
   2. Authoritative Stream 4 Manufacturing Receipt
   3. Completed Stream 4 Runtime Handoff
   4. CSE-locked role dashboard route resolution

   Transaction Rule:
   A client-visible transport/RPC failure SHALL NOT be treated
   as proof that database persistence did not occur.

   When commit state is indeterminate:
   - Dashboard remains locked
   - Runtime handoff remains blocked
   - Manufacturing remains incomplete
   - Same transaction UUID is retained
   - Controlled retry is permitted

   Successful Completion Rule:
   Once authoritative manufacturing completes:
   - Manufacturing is permanently marked complete
   - Stream 4 editable controls are locked
   - A second manufacturing submission is prohibited
   - Correct role dashboard is released
   - Automatic downstream navigation may occur

   Owns:
   - governed Professional Role Intake admission
   - professional operating profile assembly
   - authenticated login-role display / lock
   - role specialization loading
   - draft save / restore
   - full profile validation
   - atomic context/receipt manufacture through Stream 4 core
   - commit-indeterminate recovery handling
   - submission concurrency protection
   - successful-completion duplicate-submission protection
   - runtime handoff release
   - role-to-dashboard route resolution
   - Dashboard release gate

   Depends On:
   - statscore-data.js
   - statscore-authentication-errors.js
   - statscore-authentication-context.js
   - statscore-role-intake-core.js

   Database Dependency:
   - public.sc_stream4_complete_role_intake(...)
     consumed through statscore-role-intake-core.js

   Does NOT Own:
   - authentication
   - Stream 1 authentication persistence
   - Stream 1 authority precedence
   - account creation
   - athlete source truth
   - athlete intelligence
   - Professional Workspace runtime behavior
   - professional certification
   - communication execution
   - Crystal Reports
   - Stream 5 dashboard behavior
   - Administrator access routing

   Manufacturing Status:
   CONTROLLED REVISION — V1 ROLE ROUTING LOCKED

   ========================================================= */

(function(){
  "use strict";


  /* =========================================================
     ENGINE CONSTANTS
     ========================================================= */

  const ENGINE_VERSION =
    "STREAM_4_ROLE_DASHBOARD_INTAKE_V2.4_ROLE_ROUTING_LOCKED";

  const PAGE =
    "role-dashboard-intake.html";

  const PROFILE_VERSION =
    "STREAM_4_PROFESSIONAL_OPERATING_PROFILE_V2.4_ROLE_ROUTING_LOCKED";

  const CREDENTIAL_STATUS =
    "pending_professional_credential_review";

  const WORKSPACE_STATUS =
    "pending_workspace_configuration";

  const TX_COMPLETE =
    "context_persisted_receipt_complete";

  const TX_INDETERMINATE =
    "commit_state_indeterminate";


  /*
   * CSE-LOCKED V1 PHYSICAL DASHBOARD ROUTES.
   *
   * These filenames are the canonical destinations for the
   * shared non-athlete Professional Role Intake path.
   *
   * Administrator is intentionally excluded.
   */
  const ROLE_DASHBOARD_ROUTES =
    Object.freeze({

      parent:
        "parent-dashboard.html",

      coach:
        "coach-dashboard.html",

      counselor:
        "counselor-dashboard.html",

      recruiter:
        "recruiter-dashboard.html",

      evaluator:
        "evaluator-dashboard.html",

      program:
        "program-dashboard.html",

      trainer:
        "trainer-dashboard.html"

    });


  /* =========================================================
     GOVERNED CONTROLLER STATE
     ========================================================= */

  let INTAKE_ADMITTED =
    false;

  let DASHBOARD_RELEASED =
    false;

  let SUBMISSION_IN_PROGRESS =
    false;

  let MANUFACTURING_COMPLETE =
    false;


  const $ = id =>
    document.getElementById(id);


  /* =========================================================
     BASIC UI UTILITIES
     ========================================================= */

  function val(id){

    const el =
      $(id);

    return String(
      el?.value ||
      ""
    ).trim();

  }


  function selectedValues(id){

    const el =
      $(id);

    if(!el){
      return [];
    }

    return Array
      .from(
        el.selectedOptions ||
        []
      )
      .map(
        option =>
          option.value
      )
      .filter(Boolean);

  }


  function setValue(
    id,
    value
  ){

    const el =
      $(id);

    if(!el){
      return;
    }

    el.value =
      value === undefined ||
      value === null
        ? ""
        : value;

  }


  function setText(
    id,
    value
  ){

    const el =
      $(id);

    if(!el){
      return;
    }

    el.textContent =
      value ||
      "Pending";

  }


  function showMessage(
    message,
    kind
  ){

    const el =
      $("systemMessage");

    if(!el){
      return;
    }

    el.textContent =
      message ||
      "";

    el.style.color =
      kind === "error"
        ? "#ff2b1f"
        : "#25d366";

  }


  /* =========================================================
     STREAM 4 CORE ACCESS
     ========================================================= */

  function core(){

    if(
      !window
        .STATSCORE_ROLE_INTAKE_CORE
    ){

      throw new Error(
        "STATSCORE_ROLE_INTAKE_CORE is not loaded."
      );

    }

    return window
      .STATSCORE_ROLE_INTAKE_CORE;

  }


  function requireAdmission(){

    if(
      !INTAKE_ADMITTED
    ){

      throw new Error(
        "Professional Role Intake admission has not been established."
      );

    }

    core()
      .requireAuthenticationAuthority();

  }


  function getUser(){

    requireAdmission();

    return core()
      .getCurrentUser();

  }


  function getRole(){

    requireAdmission();

    return core()
      .getCurrentRole();

  }


  /* =========================================================
     LOCKED ROLE DASHBOARD ROUTING
     ========================================================= */

  function normalizeRoleName(
    value
  ){

    return String(
      value ||
      ""
    )
      .trim()
      .toLowerCase()
      .replace(
        /\s+/g,
        "_"
      )
      .replace(
        /-/g,
        "_"
      );

  }


  function resolveDashboardRoute(
    roleName
  ){

    const role =
      normalizeRoleName(
        roleName
      );


    /*
     * Administrator has its own independent access path.
     *
     * Administrator SHALL NOT be routed through shared
     * Professional Role Intake.
     */
    if(
      role === "administrator" ||
      role === "admin"
    ){

      return {

        ok:
          false,

        status:
          "ADMINISTRATOR_ROUTE_EXCLUDED",

        role,

        destination:
          null,

        message:
          "Administrator access is not routed through Professional Role Intake."

      };

    }


    if(
      !Object.prototype
        .hasOwnProperty
        .call(
          ROLE_DASHBOARD_ROUTES,
          role
        )
    ){

      return {

        ok:
          false,

        status:
          "ROLE_DASHBOARD_ROUTE_NOT_REGISTERED",

        role,

        destination:
          null,

        message:
          `No CSE-locked Professional Dashboard route is registered for role: ${role || "unknown"}.`

      };

    }


    return {

      ok:
        true,

      status:
        "ROLE_DASHBOARD_ROUTE_RESOLVED",

      role,

      destination:
        ROLE_DASHBOARD_ROUTES[
          role
        ]

    };

  }


  function requireDashboardRoute(
    roleName
  ){

    const resolution =
      resolveDashboardRoute(
        roleName
      );


    if(
      !resolution.ok
    ){

      throw new Error(
        resolution.message ||
        "Professional Dashboard route could not be resolved."
      );

    }


    return resolution;

  }


  function buildDashboardUrl(
    destination,
    context,
    profile
  ){

    if(
      !destination
    ){

      throw new Error(
        "Dashboard destination is required."
      );

    }


    if(
      !context?.role_context_id ||
      !context?.role_instance_id
    ){

      throw new Error(
        "Dashboard route requires authoritative Stream 4 role context identifiers."
      );

    }


    const dashboardConfigKey =
      profile
        ?.workspace_context
        ?.dashboard_config_key;


    if(
      !dashboardConfigKey
    ){

      throw new Error(
        "Dashboard route requires dashboard_config_key."
      );

    }


    /*
     * role is included only as presentation / navigation context.
     *
     * It is NOT role authority.
     */
    return (

      `${destination}` +

      `?role=${encodeURIComponent(
        context.role_name
      )}` +

      `&role_context_id=${encodeURIComponent(
        context.role_context_id
      )}` +

      `&role_instance_id=${encodeURIComponent(
        context.role_instance_id
      )}` +

      `&dashboard_config_key=${encodeURIComponent(
        dashboardConfigKey
      )}` +

      `&credential_status=${encodeURIComponent(
        CREDENTIAL_STATUS
      )}` +

      `&workspace_status=${encodeURIComponent(
        WORKSPACE_STATUS
      )}` +

      `&from=role-dashboard-intake`

    );

  }


  /* =========================================================
     CONTROL GOVERNANCE
     ========================================================= */

  function setIntakeControlsEnabled(
    enabled
  ){

    const editableIds = [

      "firstName",
      "lastName",
      "email",
      "phone",

      "specializationKey",
      "officialTitle",
      "authorityScope",

      "organizationName",
      "teamLevel",
      "organizationLocation",
      "organizationUrl",

      "primarySport",
      "sportScope",
      "positionEventGroup",
      "competitionContext",

      "assignedAccessType",
      "dashboardNeed",

      "requestedDashboardModules",

      "communicationRoutePreference",

      "credentialReviewPath",
      "credentialIntent",
      "credentialNotes",

      "operatingNotes",

      "submitRoleBtn",
      "saveDraftBtn",
      "previewBtn"

    ];


    editableIds
      .forEach(
        id => {

          const el =
            $(id);

          if(el){

            el.disabled =
              !enabled;

          }

        }
      );

  }


  function setSubmissionLocked(
    locked
  ){

    SUBMISSION_IN_PROGRESS =
      Boolean(
        locked
      );


    const submit =
      $("submitRoleBtn");

    const save =
      $("saveDraftBtn");

    const preview =
      $("previewBtn");


    const disabled =
      locked ||
      !INTAKE_ADMITTED ||
      MANUFACTURING_COMPLETE;


    if(submit){

      submit.disabled =
        disabled;

    }


    if(save){

      save.disabled =
        disabled;

    }


    if(preview){

      preview.disabled =
        disabled;

    }

  }


  /* =========================================================
     DASHBOARD RELEASE GOVERNANCE
     ========================================================= */

  function lockDashboard(){

    DASHBOARD_RELEASED =
      false;


    const dashboard =
      $("viewDashboardBtn");


    if(!dashboard){
      return;
    }


    dashboard
      .removeAttribute(
        "href"
      );


    dashboard
      .style
      .pointerEvents =
        "none";


    dashboard
      .setAttribute(
        "aria-disabled",
        "true"
      );


    dashboard
      .setAttribute(
        "data-stream4-release-state",
        "locked"
      );

  }


  function releaseDashboard(
    next
  ){

    if(
      !MANUFACTURING_COMPLETE
    ){

      throw new Error(
        "Dashboard release attempted before Stream 4 manufacturing completion."
      );

    }


    const dashboard =
      $("viewDashboardBtn");


    if(!dashboard){

      throw new Error(
        "Dashboard release control is unavailable."
      );

    }


    if(!next){

      throw new Error(
        "Dashboard release requires a completed Stream 4 handoff destination."
      );

    }


    DASHBOARD_RELEASED =
      true;


    dashboard.href =
      next;


    dashboard
      .style
      .pointerEvents =
        "";


    dashboard
      .setAttribute(
        "aria-disabled",
        "false"
      );


    dashboard
      .setAttribute(
        "data-stream4-release-state",
        "released"
      );

  }


  /* =========================================================
     FAIL-CLOSED ADMISSION
     ========================================================= */

  function failClosed(
    message
  ){

    INTAKE_ADMITTED =
      false;


    SUBMISSION_IN_PROGRESS =
      false;


    document
      .body
      .dataset
      .roleIntakeAdmission =
        "denied";


    setIntakeControlsEnabled(
      false
    );


    lockDashboard();


    const roleField =
      $("detectedRole");


    if(roleField){

      roleField.value =
        "Authentication authority unavailable";

    }


    setText(
      "statusRole",
      "Admission Denied"
    );


    setText(
      "recordBadge",
      "Authentication Required"
    );


    showMessage(
      message ||
      "Authenticated professional authority could not be established. Return to login.",
      "error"
    );

  }


  function admitIntake(){

    if(
      MANUFACTURING_COMPLETE
    ){

      throw new Error(
        "Completed Professional Role Intake cannot be reopened."
      );

    }


    INTAKE_ADMITTED =
      true;


    document
      .body
      .dataset
      .roleIntakeAdmission =
        "admitted";


    setIntakeControlsEnabled(
      true
    );


    lockDashboard();

  }


  /* =========================================================
     PROFILE UTILITIES
     ========================================================= */

  function normalizeKey(
    value,
    fallback
  ){

    const cleaned =
      String(
        value ||
        fallback ||
        ""
      )
        .toLowerCase()
        .trim()
        .replace(
          /&/g,
          "and"
        )
        .replace(
          /[^a-z0-9]+/g,
          "_"
        )
        .replace(
          /^_+|_+$/g,
          ""
        );


    return cleaned ||
      String(
        fallback ||
        "general"
      );

  }


  function fullName(){

    return (
      `${val("firstName")} ${val("lastName")}`
    ).trim();

  }


  function getSpecializationLabel(){

    const select =
      $("specializationKey");


    if(!select){
      return "";
    }


    return select
      .options[
        select.selectedIndex
      ]
      ?.text ||
      "";

  }


  function getSpecializationGroup(){

    const select =
      $("specializationKey");


    if(!select){
      return "";
    }


    const option =
      select
        .options[
          select.selectedIndex
        ];


    return option
      ?.dataset
      ?.group ||
      "";

  }


  function getSpecializationPermissions(){

    const select =
      $("specializationKey");


    if(!select){
      return {};
    }


    const option =
      select
        .options[
          select.selectedIndex
        ];


    try{

      return JSON.parse(
        option
          ?.dataset
          ?.permissions ||
        "{}"
      );

    }catch(err){

      return {};

    }

  }


  function getPrimarySport(){

    return val(
      "primarySport"
    );

  }


  function getSportScope(){

    const primary =
      getPrimarySport();


    const selected =
      selectedValues(
        "sportScope"
      );


    const merged =
      primary
        ? [
            primary,
            ...selected
          ]
        : selected;


    return Array.from(
      new Set(
        merged.filter(
          Boolean
        )
      )
    );

  }


  function getRequestedModules(){

    return selectedValues(
      "requestedDashboardModules"
    );

  }


  function generateDashboardConfigKey(
    profile
  ){

    return [

      normalizeKey(
        profile
          .role_identity
          .role_name,
        "role"
      ),

      normalizeKey(
        profile
          .role_identity
          .specialization_key,
        "general"
      ),

      normalizeKey(
        profile
          .scope_context
          .primary_sport,
        "multi_sport"
      ),

      normalizeKey(
        profile
          .workspace_context
          .primary_workflow,
        "role_overview"
      ),

      normalizeKey(
        profile
          .access_context
          .assigned_access_type,
        "assigned"
      )

    ].join("_");

  }


  /* =========================================================
     PROFESSIONAL OPERATING PROFILE ASSEMBLY
     ========================================================= */

  function buildProfessionalProfile(){

    requireAdmission();


    const user =
      getUser();


    const role =
      getRole();


    const name =
      fullName() ||
      "STATS-CORE Professional";


    const primarySport =
      getPrimarySport();


    const sportScope =
      getSportScope();


    const specializationKey =
      val(
        "specializationKey"
      );


    const specializationLabel =
      getSpecializationLabel();


    const profile = {

      profile_type:
        "professional_operating_profile",

      profile_version:
        PROFILE_VERSION,

      source_page:
        PAGE,


      user_identity: {

        user_id:
          user.user_id ||
          null,

        email:
          val(
            "email"
          ),

        display_name:
          name

      },


      professional_identity: {

        first_name:
          val(
            "firstName"
          ),

        last_name:
          val(
            "lastName"
          ),

        full_name:
          name,

        email:
          val(
            "email"
          ),

        phone:
          val(
            "phone"
          ),

        official_title:
          val(
            "officialTitle"
          )

      },


      role_identity: {

        role_name:
          role.role_name,

        sc_role_id:
          null,

        login_role_locked:
          true,

        authentication_authority_validated:
          true,

        specialization_key:
          specializationKey,

        specialization_label:
          specializationLabel,

        specialization_group:
          getSpecializationGroup()

      },


      organization_context: {

        organization_name:
          val(
            "organizationName"
          ),

        organization_level:
          val(
            "teamLevel"
          ),

        organization_location:
          val(
            "organizationLocation"
          ),

        organization_url:
          val(
            "organizationUrl"
          )

      },


      scope_context: {

        primary_sport:
          primarySport,

        sport_scope:
          sportScope,

        position_event_group:
          val(
            "positionEventGroup"
          ),

        competition_context:
          val(
            "competitionContext"
          )

      },


      access_context: {

        authority_scope_requested:
          val(
            "authorityScope"
          ),

        assigned_access_type:
          val(
            "assignedAccessType"
          )

      },


      workspace_context: {

        primary_workflow:
          val(
            "dashboardNeed"
          ),

        requested_dashboard_modules:
          getRequestedModules(),

        workspace_status:
          WORKSPACE_STATUS

      },


      communication_context: {

        communication_route_preference:
          val(
            "communicationRoutePreference"
          ),

        multibox_from_identity:
          name

      },


      credential_review_context: {

        credential_status:
          CREDENTIAL_STATUS,

        credential_review_path:
          val(
            "credentialReviewPath"
          ),

        credential_intent:
          val(
            "credentialIntent"
          ),

        credential_notes:
          val(
            "credentialNotes"
          )

      },


      operating_context: {

        operating_notes:
          val(
            "operatingNotes"
          )

      }

    };


    profile
      .workspace_context
      .dashboard_config_key =
        generateDashboardConfigKey(
          profile
        );


    return profile;

  }


  /* =========================================================
     DRAFT PAYLOAD
     ========================================================= */

  function buildDraftPayload(){

    requireAdmission();


    return {

      professional_profile:
        buildProfessionalProfile(),


      form_snapshot: {

        firstName:
          val(
            "firstName"
          ),

        lastName:
          val(
            "lastName"
          ),

        email:
          val(
            "email"
          ),

        phone:
          val(
            "phone"
          ),

        specializationKey:
          val(
            "specializationKey"
          ),

        officialTitle:
          val(
            "officialTitle"
          ),

        authorityScope:
          val(
            "authorityScope"
          ),

        organizationName:
          val(
            "organizationName"
          ),

        teamLevel:
          val(
            "teamLevel"
          ),

        organizationLocation:
          val(
            "organizationLocation"
          ),

        organizationUrl:
          val(
            "organizationUrl"
          ),

        primarySport:
          val(
            "primarySport"
          ),

        sportScope:
          selectedValues(
            "sportScope"
          ),

        positionEventGroup:
          val(
            "positionEventGroup"
          ),

        competitionContext:
          val(
            "competitionContext"
          ),

        assignedAccessType:
          val(
            "assignedAccessType"
          ),

        dashboardNeed:
          val(
            "dashboardNeed"
          ),

        requestedDashboardModules:
          selectedValues(
            "requestedDashboardModules"
          ),

        communicationRoutePreference:
          val(
            "communicationRoutePreference"
          ),

        credentialReviewPath:
          val(
            "credentialReviewPath"
          ),

        credentialIntent:
          val(
            "credentialIntent"
          ),

        credentialNotes:
          val(
            "credentialNotes"
          ),

        operatingNotes:
          val(
            "operatingNotes"
          )

      }

    };

  }


  /* =========================================================
     GOVERNED CONTEXT PAYLOAD
     ========================================================= */

  function buildContextPayload(){

    requireAdmission();


    const user =
      getUser();


    const profile =
      buildProfessionalProfile();


    const dashboardConfigKey =
      profile
        .workspace_context
        .dashboard_config_key;


    /*
     * Route authority comes from the authenticated Stream 1
     * role carried into the Stream 4 governed profile.
     */
    const routeResolution =
      requireDashboardRoute(
        profile
          .role_identity
          .role_name
      );


    /*
     * Before persistence, context IDs do not yet exist, so this
     * preliminary handoff destination intentionally carries only
     * the dashboard_config_key and pending review state.
     */
    const nextPage =

      `${routeResolution.destination}` +

      `?role=${encodeURIComponent(
        profile.role_identity.role_name
      )}` +

      `&dashboard_config_key=${encodeURIComponent(
        dashboardConfigKey
      )}` +

      `&credential_status=${encodeURIComponent(
        CREDENTIAL_STATUS
      )}` +

      `&workspace_status=${encodeURIComponent(
        WORKSPACE_STATUS
      )}` +

      `&from=role-dashboard-intake`;


    return {

      role_name:
        profile
          .role_identity
          .role_name,


      display_name:
        profile
          .professional_identity
          .full_name,


      email:
        profile
          .professional_identity
          .email ||
        null,


      phone:
        profile
          .professional_identity
          .phone ||
        null,


      primary_sport:
        profile
          .scope_context
          .primary_sport ||
        null,


      sport_scope:
        profile
          .scope_context
          .sport_scope,


      source_page:
        PAGE,


      next_page:
        nextPage,


      identity_context: {

        user_id:
          user.user_id ||
          null,

        professional_identity:
          profile
            .professional_identity,

        role_identity:
          profile
            .role_identity

      },


      operating_context: {

        professional_profile:
          profile,

        organization_context:
          profile
            .organization_context,

        scope_context:
          profile
            .scope_context,

        access_context:
          profile
            .access_context,

        workspace_context:
          profile
            .workspace_context,

        credential_review_context:
          profile
            .credential_review_context,

        operating_notes:
          profile
            .operating_context
            .operating_notes

      },


      dashboard_context: {

        dashboard_config_key:
          dashboardConfigKey,

        dashboard_role:
          profile
            .role_identity
            .role_name,

        default_dashboard:
          routeResolution.destination,

        dashboard_route_status:
          routeResolution.status,

        primary_workflow:
          profile
            .workspace_context
            .primary_workflow,

        requested_dashboard_modules:
          profile
            .workspace_context
            .requested_dashboard_modules,

        assigned_access_type:
          profile
            .access_context
            .assigned_access_type,

        authority_scope_requested:
          profile
            .access_context
            .authority_scope_requested,

        specialization_key:
          profile
            .role_identity
            .specialization_key,

        specialization_label:
          profile
            .role_identity
            .specialization_label,

        primary_sport:
          profile
            .scope_context
            .primary_sport,

        sport_scope:
          profile
            .scope_context
            .sport_scope,

        position_event_group:
          profile
            .scope_context
            .position_event_group,

        competition_context:
          profile
            .scope_context
            .competition_context,

        workspace_status:
          WORKSPACE_STATUS,

        credential_status:
          CREDENTIAL_STATUS

      },


      multibox_context: {

        from_role:
          profile
            .role_identity
            .role_name,

        from_role_label:
          profile
            .role_identity
            .role_name,

        from_display_name:
          profile
            .professional_identity
            .full_name,

        from_specialization:
          profile
            .role_identity
            .specialization_label,

        communication_route_preference:
          profile
            .communication_context
            .communication_route_preference,

        source_page:
          PAGE

      },


      permissions_context: {

        permission_status:
          CREDENTIAL_STATUS,

        credential_required:
          profile
            .credential_review_context
            .credential_review_path !==
          "identity_only",

        authority_scope_requested:
          profile
            .access_context
            .authority_scope_requested,

        assigned_access_type:
          profile
            .access_context
            .assigned_access_type,

        specialization_key:
          profile
            .role_identity
            .specialization_key,

        specialization_label:
          profile
            .role_identity
            .specialization_label,

        /*
         * Stream 4 publishes specialization defaults as request /
         * configuration context only. These values are NOT
         * operational permission authority.
         */
        specialization_default_permissions:
          getSpecializationPermissions(),

        primary_sport:
          profile
            .scope_context
            .primary_sport,

        sport_scope:
          profile
            .scope_context
            .sport_scope,

        position_event_group:
          profile
            .scope_context
            .position_event_group,

        requested_dashboard_modules:
          profile
            .workspace_context
            .requested_dashboard_modules

      },


      action_type:
        "professional_operating_profile_completed"

    };

  }


  /* =========================================================
     SPECIALIZATION LOADING
     ========================================================= */

  async function loadSpecializations(){

    requireAdmission();


    const role =
      getRole();


    const select =
      $("specializationKey");


    if(!select){
      return;
    }


    /*
     * Administrator does not traverse shared Professional Intake.
     */
    requireDashboardRoute(
      role.role_name
    );


    select.innerHTML =
      `<option value="">Select specialization</option>`;


    if(
      !role.role_name
    ){

      throw new Error(
        "Authenticated professional role unavailable after intake admission."
      );

    }


    const specs =
      await core()
        .fetchSpecializations(
          role.role_name
        );


    if(
      !specs.length
    ){

      const option =
        document
          .createElement(
            "option"
          );


      option.value =
        "general";


      option.textContent =
        "General Professional";


      option.dataset.group =
        "general";


      option.dataset.permissions =
        "{}";


      select
        .appendChild(
          option
        );


      return;

    }


    specs.forEach(
      spec => {

        const option =
          document
            .createElement(
              "option"
            );


        option.value =
          spec
            .specialization_key;


        option.textContent =
          spec
            .specialization_label;


        option.dataset.group =
          spec
            .specialization_group ||
          "";


        option.dataset.permissions =
          JSON.stringify(
            spec
              .default_permissions ||
            {}
          );


        select
          .appendChild(
            option
          );

      }
    );

  }


  /* =========================================================
     DRAFT RESTORE UTILITIES
     ========================================================= */

  function setMultiSelect(
    id,
    values
  ){

    const el =
      $(id);


    if(!el){
      return;
    }


    const governedValues =
      Array.isArray(
        values
      )
        ? values
        : [];


    Array
      .from(
        el.options
      )
      .forEach(
        option => {

          option.selected =
            governedValues
              .includes(
                option.value
              );

        }
      );

  }


  function applyDraftPayload(
    payload
  ){

    const snapshot =
      payload
        ?.form_snapshot ||
      {};


    setValue(
      "firstName",
      snapshot.firstName
    );


    setValue(
      "lastName",
      snapshot.lastName
    );


    setValue(
      "email",
      snapshot.email
    );


    setValue(
      "phone",
      snapshot.phone
    );


    setValue(
      "specializationKey",
      snapshot.specializationKey
    );


    setValue(
      "officialTitle",
      snapshot.officialTitle
    );


    setValue(
      "authorityScope",
      snapshot.authorityScope
    );


    setValue(
      "organizationName",
      snapshot.organizationName
    );


    setValue(
      "teamLevel",
      snapshot.teamLevel
    );


    setValue(
      "organizationLocation",
      snapshot.organizationLocation
    );


    setValue(
      "organizationUrl",
      snapshot.organizationUrl
    );


    setValue(
      "primarySport",
      snapshot.primarySport
    );


    setValue(
      "positionEventGroup",
      snapshot.positionEventGroup
    );


    setValue(
      "competitionContext",
      snapshot.competitionContext
    );


    setValue(
      "assignedAccessType",
      snapshot.assignedAccessType
    );


    setValue(
      "dashboardNeed",
      snapshot.dashboardNeed
    );


    setValue(
      "communicationRoutePreference",
      snapshot.communicationRoutePreference
    );


    setValue(
      "credentialReviewPath",
      snapshot.credentialReviewPath
    );


    setValue(
      "credentialIntent",
      snapshot.credentialIntent
    );


    setValue(
      "credentialNotes",
      snapshot.credentialNotes
    );


    setValue(
      "operatingNotes",
      snapshot.operatingNotes
    );


    setMultiSelect(
      "sportScope",
      snapshot.sportScope ||
      []
    );


    setMultiSelect(
      "requestedDashboardModules",
      snapshot.requestedDashboardModules ||
      []
    );

  }


  /* =========================================================
     DRAFT SAVE
     ========================================================= */

  async function saveDraft(){

    try{

      requireAdmission();


      if(
        MANUFACTURING_COMPLETE
      ){
        return;
      }


      const role =
        getRole();


      await core()
        .saveDraft({

          role_name:
            role.role_name,

          source_page:
            PAGE,

          draft_payload:
            buildDraftPayload()

        });


      showMessage(
        "Professional profile draft saved."
      );


    }catch(err){

      console.error(
        err
      );


      showMessage(
        err.message ||
        "Draft save failed.",
        "error"
      );

    }

  }


  /* =========================================================
     DRAFT RESTORE
     ========================================================= */

  async function restoreDraft(){

    requireAdmission();


    const role =
      getRole();


    const draft =
      await core()
        .restoreDraft(
          role.role_name,
          PAGE
        );


    if(
      draft
        ?.draft_payload
    ){

      applyDraftPayload(
        draft.draft_payload
      );


      showMessage(
        "Professional profile draft restored."
      );

    }

  }


  /* =========================================================
     REQUIRED FIELD VALIDATION
     ========================================================= */

  function validateRequired(){

    try{

      requireAdmission();

    }catch(err){

      return err.message;

    }


    if(
      MANUFACTURING_COMPLETE
    ){

      return (
        "Professional Role Intake manufacturing is already complete."
      );

    }


    const role =
      getRole();


    const authorityValidation =
      core()
        .validateLoginRole(
          role.role_name
        );


    if(
      !authorityValidation.ok
    ){

      return authorityValidation
        .message;

    }


    const routeResolution =
      resolveDashboardRoute(
        role.role_name
      );


    if(
      !routeResolution.ok
    ){

      return routeResolution
        .message;

    }


    const checks = [

      [
        "firstName",
        "First name is required."
      ],

      [
        "lastName",
        "Last name is required."
      ],

      [
        "specializationKey",
        "Role specialization is required."
      ],

      [
        "authorityScope",
        "Requested authority scope is required."
      ],

      [
        "primarySport",
        "Primary sport is required."
      ],

      [
        "assignedAccessType",
        "Assigned athlete access type is required."
      ],

      [
        "dashboardNeed",
        "Primary workflow is required."
      ]

    ];


    for(
      const [
        id,
        message
      ] of checks
    ){

      if(
        !val(
          id
        )
      ){

        return message;

      }

    }


    return "";

  }


  /* =========================================================
     STATUS PRESENTATION
     ========================================================= */

  function syncStatus(){

    if(
      !INTAKE_ADMITTED ||
      MANUFACTURING_COMPLETE
    ){
      return;
    }


    const role =
      getRole();


    const name =
      fullName();


    const specialization =
      getSpecializationLabel();


    const sport =
      val(
        "primarySport"
      );


    const scope =
      val(
        "authorityScope"
      );


    setText(
      "statusIdentity",
      name ||
      "Pending"
    );


    setText(
      "statusRole",
      role.role_name ||
      "Pending"
    );


    setText(
      "statusSpecialization",
      specialization ||
      "Pending"
    );


    setText(
      "statusSport",
      sport ||
      "Pending"
    );


    setText(
      "statusContext",
      scope ||
      "Pending"
    );


    setText(
      "statusMultibox",
      name ||
      role.role_name ||
      "Pending"
    );


    setText(
      "recordBadge",

      name &&
      specialization &&
      sport &&
      scope

        ? "Profile Ready"

        : "Profile Pending"
    );


    setValue(
      "multiboxIdentity",
      name ||
      role.role_name ||
      ""
    );


    setValue(
      "workspaceStatus",
      "Pending Profile Review"
    );


    setValue(
      "credentialStatus",
      "Pending Credential Review"
    );

  }


  /* =========================================================
     PROFESSIONAL PROFILE COMPLETION
     ========================================================= */

  async function completeProfile(){

    if(
      SUBMISSION_IN_PROGRESS ||
      MANUFACTURING_COMPLETE
    ){
      return;
    }


    try{

      requireAdmission();


      const issue =
        validateRequired();


      if(
        issue
      ){

        showMessage(
          issue,
          "error"
        );


        return;

      }


      lockDashboard();


      setSubmissionLocked(
        true
      );


      showMessage(
        "Completing professional profile..."
      );


      const result =
        await core()
          .createRoleContext(
            buildContextPayload()
          );


      if(
        result
          ?.transaction_status ===
        TX_INDETERMINATE
      ){

        lockDashboard();


        showMessage(
          "Professional profile completion could not be conclusively confirmed. No duplicate profile will be created. Select Complete Professional Profile again to resolve the existing transaction.",
          "error"
        );


        return;

      }


      if(
        result
          ?.transaction_status !==
        TX_COMPLETE
      ){

        lockDashboard();


        throw new Error(
          "Professional Role Intake returned an unknown transaction state."
        );

      }


      const context =
        result.context;


      const receipt =
        result.receipt;


      const handoff =
        result.handoff;


      if(
        !context ||
        !receipt ||
        !handoff
      ){

        lockDashboard();


        throw new Error(
          "Professional Role Intake completed without authoritative context, receipt, and runtime handoff evidence."
        );

      }


      if(
        !context.role_context_id
      ){

        throw new Error(
          "Authoritative Professional Role Context is missing role_context_id."
        );

      }


      if(
        !context.role_instance_id
      ){

        throw new Error(
          "Authoritative Professional Role Context is missing role_instance_id."
        );

      }


      if(
        !receipt.receipt_id
      ){

        throw new Error(
          "Authoritative Stream 4 Manufacturing Receipt is missing receipt_id."
        );

      }


      const profile =
        context
          .operating_context
          ?.professional_profile ||
        buildProfessionalProfile();


      if(
        !profile
          ?.workspace_context
          ?.dashboard_config_key
      ){

        throw new Error(
          "Completed Professional Operating Profile is missing dashboard configuration authority."
        );

      }


      /*
       * Resolve the final physical Dashboard strictly from the
       * authoritative role carried by the completed Stream 4
       * context.
       */
      const routeResolution =
        requireDashboardRoute(
          context.role_name
        );


      localStorage.setItem(
        "STATSCORE_PROFESSIONAL_OPERATING_PROFILE",
        JSON.stringify(
          profile
        )
      );


      localStorage.setItem(
        "STATSCORE_DASHBOARD_CONFIG_KEY",
        profile
          .workspace_context
          .dashboard_config_key
      );


      /*
       * These are downstream operational presentation values.
       * They are NOT credential / access authority.
       */
      localStorage.setItem(
        "STATSCORE_CREDENTIAL_STATUS",
        CREDENTIAL_STATUS
      );


      localStorage.setItem(
        "STATSCORE_WORKSPACE_STATUS",
        WORKSPACE_STATUS
      );


      const next =
        buildDashboardUrl(
          routeResolution.destination,
          context,
          profile
        );


      MANUFACTURING_COMPLETE =
        true;


      document
        .body
        .dataset
        .roleIntakeManufacturing =
          "complete";


      setIntakeControlsEnabled(
        false
      );


      setText(
        "recordBadge",
        "Profile Complete"
      );


      releaseDashboard(
        next
      );


      showMessage(

        result.recovered

          ? "Professional profile transaction recovered and completed. Continuing..."

          : "Professional profile completed. Continuing..."

      );


      document.dispatchEvent(

        new CustomEvent(
          "statscore:professional-role-intake-complete",
          {

            detail: {

              engine_version:
                ENGINE_VERSION,

              manufacturing_transaction_id:
                result
                  .manufacturing_transaction_id ||
                null,

              recovered:
                Boolean(
                  result.recovered
                ),

              role_context_id:
                context
                  .role_context_id,

              role_instance_id:
                context
                  .role_instance_id,

              receipt_id:
                receipt
                  .receipt_id,

              role_name:
                context
                  .role_name,

              dashboard_destination:
                routeResolution
                  .destination,

              dashboard_route_status:
                routeResolution
                  .status,

              user_id:
                context
                  .user_id,

              dashboard_released:
                true,

              completed_at:
                new Date()
                  .toISOString()

            }

          }
        )

      );


      setTimeout(
        () => {

          if(
            MANUFACTURING_COMPLETE &&
            DASHBOARD_RELEASED
          ){

            window.location.href =
              next;

          }

        },
        700
      );


    }catch(err){

      console.error(
        err
      );


      lockDashboard();


      showMessage(
        err.message ||
        "Professional profile completion failed.",
        "error"
      );


    }finally{


      if(
        !MANUFACTURING_COMPLETE
      ){

        setSubmissionLocked(
          false
        );

      }

    }

  }


  /* =========================================================
     PROFILE PREVIEW
     ========================================================= */

  function previewProfile(){

    try{

      requireAdmission();


      if(
        MANUFACTURING_COMPLETE
      ){
        return;
      }


      console.log(
        "STATS-CORE Professional Operating Profile Preview:",
        buildContextPayload()
      );


      syncStatus();


      showMessage(
        "Professional profile preview generated in console."
      );


    }catch(err){

      console.error(
        err
      );


      showMessage(
        err.message ||
        "Profile preview unavailable.",
        "error"
      );

    }

  }


  /* =========================================================
     EVENT BINDING
     ========================================================= */

  function bind(){

    $("submitRoleBtn")
      ?.addEventListener(
        "click",
        completeProfile
      );


    $("saveDraftBtn")
      ?.addEventListener(
        "click",
        saveDraft
      );


    $("previewBtn")
      ?.addEventListener(
        "click",
        previewProfile
      );


    document
      .querySelectorAll(
        "input, select, textarea"
      )
      .forEach(
        el => {

          el.addEventListener(
            "input",
            syncStatus
          );


          el.addEventListener(
            "change",
            syncStatus
          );

        }
      );

  }


  /* =========================================================
     GOVERNED INITIALIZATION
     ========================================================= */

  async function init(){

    failClosed(
      "Establishing authenticated professional authority..."
    );


    try{

      const authority =
        await Promise.resolve(

          core()
            .restoreAuthenticationAuthority()

        );


      if(
        !authority.ok
      ){

        failClosed(

          authority.message ||
          "Authenticated professional authority could not be restored. Return to login."

        );


        return;

      }


      admitIntake();


      const role =
        getRole();


      const user =
        getUser();


      const validation =
        core()
          .validateLoginRole(
            role.role_name
          );


      if(
        !validation.ok
      ){

        failClosed(
          validation.message
        );


        return;

      }


      /*
       * Enforce the CSE-locked shared-role dashboard population
       * before Stream 4 intake is allowed to proceed.
       */
      const routeResolution =
        resolveDashboardRoute(
          role.role_name
        );


      if(
        !routeResolution.ok
      ){

        failClosed(
          routeResolution.message
        );


        return;

      }


      setValue(
        "detectedRole",
        `${role.role_name} — Login Verified`
      );


      setValue(
        "email",
        ""
      );


      await loadSpecializations();


      try{

        await restoreDraft();

      }catch(err){

        console.warn(
          "Professional draft restore skipped:",
          err
        );

      }


      bind();


      syncStatus();


      showMessage(
        "Professional intake ready."
      );


      document.dispatchEvent(

        new CustomEvent(
          "statscore:professional-role-intake-ready",
          {

            detail: {

              engine_version:
                ENGINE_VERSION,

              role:
                role.role_name,

              user_id:
                user.user_id,

              authenticated_session_id:
                authority.session_id,

              authentication_source:
                authority.authentication_source,

              dashboard_destination:
                routeResolution
                  .destination,

              dashboard_route_status:
                routeResolution
                  .status,

              intake_admitted:
                true,

              dashboard_released:
                false,

              manufacturing_complete:
                false,

              ready_at:
                new Date()
                  .toISOString()

            }

          }
        )

      );


    }catch(err){

      console.error(
        err
      );


      failClosed(
        err.message ||
        "Professional intake failed to initialize."
      );

    }

  }


  /* =========================================================
     PUBLIC STREAM 4 CONTROLLER
     ========================================================= */

  window.STATSCORE_ROLE_DASHBOARD_INTAKE_ENGINE = {

    version:
      ENGINE_VERSION,


    buildProfessionalProfile,

    buildDraftPayload,

    buildContextPayload,


    resolveDashboardRoute,


    getDashboardRoutes(){

      return {
        ...ROLE_DASHBOARD_ROUTES
      };

    },


    saveDraft,

    restoreDraft,


    completeProfile,

    previewProfile,

    syncStatus,


    isAdmitted(){

      return INTAKE_ADMITTED;

    },


    isDashboardReleased(){

      return DASHBOARD_RELEASED;

    },


    isSubmissionInProgress(){

      return SUBMISSION_IN_PROGRESS;

    },


    isManufacturingComplete(){

      return MANUFACTURING_COMPLETE;

    },


    getManufacturingTransactionId(){

      return core()
        .getActiveManufacturingTransactionId();

    },


    getRuntimeState(){

      const role =
        INTAKE_ADMITTED
          ? getRole()
          : null;


      const route =
        role
          ? resolveDashboardRoute(
              role.role_name
            )
          : null;


      return {

        engine_version:
          ENGINE_VERSION,

        intake_admitted:
          INTAKE_ADMITTED,

        submission_in_progress:
          SUBMISSION_IN_PROGRESS,

        manufacturing_complete:
          MANUFACTURING_COMPLETE,

        dashboard_released:
          DASHBOARD_RELEASED,

        dashboard_route:
          route,

        manufacturing_transaction_id:
          core()
            .getActiveManufacturingTransactionId() ||
          null

      };

    }

  };


  /* =========================================================
     STARTUP
     ========================================================= */

  if(
    document.readyState ===
    "loading"
  ){

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  }else{

    init();

  }


})(); 
