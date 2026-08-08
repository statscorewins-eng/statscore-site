/* =========================================================
   STATS-CORE™
   STREAM 4 — PROFESSIONAL ROLE DASHBOARD INTAKE ENGINE

   File:
   statscore-role-dashboard-intake-engine.js

   Version:
   STREAM_4_ROLE_DASHBOARD_INTAKE_V2.3_PHYS_READY

   Owner Stream:
   Stream 4 — Professional Role Intake Authority

   Purpose:
   Governed runtime controller for:
   role-dashboard-intake.html

   Constitutional Admission Rule:
   Professional Role Intake SHALL NOT initialize until the
   approved Stream 1 Initial Authentication Context Authority
   has been successfully restored and consumed.

   Manufacturing Completion Rule:
   Professional Workspace / Dashboard traversal SHALL NOT be
   released until all of the following exist:

   1. Authoritative Professional Role Context
   2. Authoritative Stream 4 Manufacturing Receipt
   3. Completed Stream 4 Runtime Handoff

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
   - Dashboard is released
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
   - Professional Workspace runtime
   - professional certification
   - communication execution
   - Crystal Reports
   - Stream 5 dashboard behavior

   Manufacturing Status:
   COMPLETE REPLACEMENT — PHYS READY

   ========================================================= */

(function(){
  "use strict";


  /* =========================================================
     ENGINE CONSTANTS
     ========================================================= */

  const ENGINE_VERSION =
    "STREAM_4_ROLE_DASHBOARD_INTAKE_V2.3_PHYS_READY";

  const PAGE =
    "role-dashboard-intake.html";

  const NEXT_PAGE =
    "role-dashboard.html";

  const PROFILE_VERSION =
    "STREAM_4_PROFESSIONAL_OPERATING_PROFILE_V2.3_PHYS_READY";

  const CREDENTIAL_STATUS =
    "pending_professional_credential_review";

  const WORKSPACE_STATUS =
    "pending_workspace_configuration";

  const TX_COMPLETE =
    "context_persisted_receipt_complete";

  const TX_INDETERMINATE =
    "commit_state_indeterminate";


  /* =========================================================
     GOVERNED CONTROLLER STATE
     ========================================================= */

  /*
   * Authentication admission into Stream 4.
   *
   * This does NOT mean manufacturing is complete.
   */
  let INTAKE_ADMITTED =
    false;


  /*
   * Downstream Dashboard release authority.
   */
  let DASHBOARD_RELEASED =
    false;


  /*
   * Protects against concurrent button clicks while an
   * asynchronous manufacturing request is executing.
   */
  let SUBMISSION_IN_PROGRESS =
    false;


  /*
   * Final manufacturing lifecycle state.
   *
   * Once TRUE, this intake instance may never manufacture a
   * second Professional Role Context transaction.
   */
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

    /*
     * Reconfirm approved Stream 1 authority remains available
     * through the Stream 4 Core consumer contract.
     */
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
     CONTROL GOVERNANCE
     ========================================================= */

  function setIntakeControlsEnabled(
    enabled
  ){
    /*
     * Explicit Stream 4 editable controls only.
     *
     * This replaces broad blanket unlocking of every
     * input/select/textarea/button on the page.
     *
     * Read-only and independently governed controls remain
     * outside this list.
     */
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
      .forEach(id => {

        const el =
          $(id);

        if(el){
          el.disabled =
            !enabled;
        }

      });
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


    /*
     * Completed manufacturing may NEVER be re-enabled.
     */
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


    /*
     * Remove actual navigation authority.
     */
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


    /*
     * Authentication admission is NOT manufacturing
     * completion.
     *
     * Dashboard remains locked.
     */
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


      /* -----------------------------------------------------
         AUTHENTICATED USER CORRELATION
         ----------------------------------------------------- */

      user_identity: {

        /*
         * user_id originates exclusively from the approved
         * Stream 1 Initial Authentication Context Authority.
         */
        user_id:
          user.user_id ||
          null,


        /*
         * Professional email is captured by Stream 4.
         *
         * It is NOT manufactured from Initial Authentication
         * Context because that contract does not publish email.
         */
        email:
          val(
            "email"
          ),


        display_name:
          name
      },


      /* -----------------------------------------------------
         PROFESSIONAL PROFILE
         ----------------------------------------------------- */

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


      /* -----------------------------------------------------
         AUTHENTICATED ROLE IDENTITY
         ----------------------------------------------------- */

      role_identity: {

        /*
         * Role originates exclusively from Stream 1.
         */
        role_name:
          role.role_name,


        /*
         * Stream 1 does not publish sc_role_id.
         *
         * Stream 4 Core resolves the enterprise role record
         * from sc_roles during governed manufacture.
         */
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


      /* -----------------------------------------------------
         ORGANIZATION CONTEXT
         ----------------------------------------------------- */

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


      /* -----------------------------------------------------
         SPORT / POSITION / EVENT CONTEXT
         ----------------------------------------------------- */

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


      /* -----------------------------------------------------
         REQUESTED ACCESS
         ----------------------------------------------------- */

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


      /* -----------------------------------------------------
         REQUESTED WORKSPACE CONFIGURATION
         ----------------------------------------------------- */

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


      /* -----------------------------------------------------
         COMMUNICATION IDENTITY CONTEXT
         ----------------------------------------------------- */

      communication_context: {

        communication_route_preference:
          val(
            "communicationRoutePreference"
          ),

        multibox_from_identity:
          name
      },


      /* -----------------------------------------------------
         STREAM 10 REVIEW REQUEST CONTEXT
         ----------------------------------------------------- */

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


      /* -----------------------------------------------------
         OPERATING NOTES
         ----------------------------------------------------- */

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
     * URL role remains navigation / presentation context.
     *
     * It is NOT authentication authority.
     */
    const nextPage =

      `${NEXT_PAGE}?role=${encodeURIComponent(
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
          NEXT_PAGE,

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


    select.innerHTML =
      `<option value="">Select specialization</option>`;


    /*
     * This should be unreachable after approved admission.
     */
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


    /*
     * CRITICAL GOVERNANCE RULE:
     *
     * NO Dashboard URL is published here.
     *
     * "Profile Ready" means form readiness only.
     *
     * It does NOT mean manufacturing completion.
     */
  }


  /* =========================================================
     PROFESSIONAL PROFILE COMPLETION
     ========================================================= */

  async function completeProfile(){

    /*
     * =======================================================
     * DUPLICATE / CONCURRENT MANUFACTURING GUARD
     * =======================================================
     *
     * Prevent:
     * - concurrent submissions;
     * - second manufacturing after authoritative completion.
     */

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


      /*
       * Manufacturing always begins with downstream release
       * closed.
       */
      lockDashboard();


      setSubmissionLocked(
        true
      );


      showMessage(
        "Completing professional profile..."
      );


      /*
       * Stream 4 Core:
       *
       * Authentication authority
       *       ↓
       * registered role resolution
       *       ↓
       * manufacturing transaction UUID
       *       ↓
       * atomic PostgreSQL RPC
       *       ↓
       * authoritative context + receipt
       */
      const result =
        await core()
          .createRoleContext(
            buildContextPayload()
          );


      /* =====================================================
         COMMIT STATE INDETERMINATE
         =====================================================

         Client cannot conclusively prove whether the database
         transaction committed.

         The Core retains the SAME transaction UUID.

         Therefore:

         - manufacturing remains incomplete locally;
         - Dashboard remains locked;
         - no runtime release occurs;
         - controlled retry is permitted;
         - retry resolves authoritative database truth.
         ===================================================== */

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


      /* =====================================================
         UNKNOWN / UNGOVERNED TRANSACTION STATE
         ===================================================== */

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


      /* =====================================================
         AUTHORITATIVE MANUFACTURING UNIT
         ===================================================== */

      const context =
        result.context;


      const receipt =
        result.receipt;


      const handoff =
        result.handoff;


      /*
       * A completed database response without all required
       * authoritative manufacturing outputs remains blocked.
       */
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


      /*
       * Additional physical contract checks.
       */
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


      /* =====================================================
         DOWNSTREAM STREAM 4 OPERATIONAL PUBLICATION
         =====================================================

         These are operational outputs.

         NONE constitute authentication authority.
         ===================================================== */

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


      localStorage.setItem(
        "STATSCORE_CREDENTIAL_STATUS",
        CREDENTIAL_STATUS
      );


      localStorage.setItem(
        "STATSCORE_WORKSPACE_STATUS",
        WORKSPACE_STATUS
      );


      /* =====================================================
         DOWNSTREAM ROUTE
         ===================================================== */

      const next =

        `${NEXT_PAGE}?role=${encodeURIComponent(
          context.role_name
        )}` +

        `&role_context_id=${encodeURIComponent(
          context.role_context_id
        )}` +

        `&role_instance_id=${encodeURIComponent(
          context.role_instance_id
        )}` +

        `&dashboard_config_key=${encodeURIComponent(
          profile.workspace_context.dashboard_config_key
        )}` +

        `&credential_status=${encodeURIComponent(
          CREDENTIAL_STATUS
        )}` +

        `&workspace_status=${encodeURIComponent(
          WORKSPACE_STATUS
        )}` +

        `&from=role-dashboard-intake`;


      /* =====================================================
         AUTHORITATIVE MANUFACTURING COMPLETION
         =====================================================

         At this exact boundary Stream 4 has proven:

         ✓ authoritative Professional Role Context
         ✓ authoritative Manufacturing Receipt
         ✓ completed Stream 4 runtime handoff

         This intake instance may NEVER manufacture a second
         transaction.
         ===================================================== */

      MANUFACTURING_COMPLETE =
        true;


      document
        .body
        .dataset
        .roleIntakeManufacturing =
          "complete";


      /*
       * Permanently close all Stream 4 manufacturing controls.
       */
      setIntakeControlsEnabled(
        false
      );


      setText(
        "recordBadge",
        "Profile Complete"
      );


      /*
       * Dashboard release occurs ONLY after manufacturing
       * becomes permanently complete.
       */
      releaseDashboard(
        next
      );


      showMessage(

        result.recovered

          ? "Professional profile transaction recovered and completed. Continuing..."

          : "Professional profile completed. Continuing..."

      );


      /*
       * Enterprise diagnostic / evidence event.
       */
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


      /*
       * Brief controlled transition interval.
       *
       * Manufacturing controls remain permanently locked
       * throughout this interval.
       */
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


      /*
       * Any non-complete manufacturing condition remains
       * downstream fail-closed.
       */
      lockDashboard();


      showMessage(
        err.message ||
        "Professional profile completion failed.",
        "error"
      );


    }finally{

      /* =====================================================
         POST-TRANSACTION CONTROL DISCIPLINE
         =====================================================

         FAILURE / INDETERMINATE:
         Manufacturing is not locally complete.
         Controlled retry is allowed.

         SUCCESS:
         MANUFACTURING_COMPLETE = true.
         Manufacturing controls remain permanently locked.
         ===================================================== */

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

    /*
     * =======================================================
     * PHYSICAL STARTUP STATE
     * =======================================================
     *
     * Professional Role Intake begins fail-closed.
     */

    failClosed(
      "Establishing authenticated professional authority..."
    );


    try{

      /* =====================================================
         FIRST AUTHORITY OPERATION
         =====================================================

         Stream 1 owns:

         - Initial Authentication Context validation
         - sessionStorage restoration
         - runtime / persisted authority precedence

         Stream 4 merely consumes the approved authority.
         ===================================================== */

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


      /* =====================================================
         STREAM 4 ADMISSION
         =====================================================

         Authentication authority is established.

         Professional Intake may now initialize.

         Dashboard remains locked.
         ===================================================== */

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


      /* =====================================================
         AUTHENTICATED ROLE PRESENTATION
         =====================================================

         "Login Verified" is now truthful because this display
         occurs only after approved Stream 1 authority has been
         established and consumed.
         ===================================================== */

      setValue(
        "detectedRole",
        `${role.role_name} — Login Verified`
      );


      /*
       * Stream 1 Initial Authentication Context intentionally
       * does not publish professional email.
       *
       * Email remains empty unless:
       * - restored from governed Stream 4 draft, or
       * - entered by professional.
       */
      setValue(
        "email",
        ""
      );


      /* =====================================================
         GOVERNED STREAM 4 INITIALIZATION
         ===================================================== */

      await loadSpecializations();


      try{

        await restoreDraft();

      }catch(err){

        /*
         * Draft restoration failure is recoverable.
         *
         * It does not invalidate successful authenticated
         * Stream 4 admission.
         */
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


      /* =====================================================
         PHYS / ENTERPRISE DIAGNOSTIC EVENT
         ===================================================== */

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
