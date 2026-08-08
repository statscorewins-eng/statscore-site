/* =========================================================
   STATS-CORE™
   STREAM 4 — PROFESSIONAL ROLE DASHBOARD INTAKE ENGINE
   File: statscore-role-dashboard-intake-engine.js

   Version:
   STREAM_4_ROLE_DASHBOARD_INTAKE_V2.2_TRANSACTION_HARDENED

   Purpose:
   Governed runtime controller for role-dashboard-intake.html.

   Constitutional Admission Rule:
   Professional Role Intake SHALL NOT initialize until the
   approved Stream 1 Authentication Context Authority has
   been successfully established.

   Manufacturing Completion Rule:
   Dashboard traversal SHALL NOT be released until:

   1. authoritative Professional Role Context exists;
   2. authoritative Manufacturing Receipt exists;
   3. Stream 4 runtime handoff has been manufactured.

   Owns:
   - governed Professional Role Intake admission
   - professional operating profile assembly
   - authenticated login-role display / lock
   - role specialization loading
   - draft save / restore
   - full profile validation
   - atomic context/receipt manufacture through Stream 4 core
   - commit-indeterminate recovery handling
   - runtime handoff release
   - Dashboard release gate

   Depends on:
   - statscore-data.js
   - statscore-authentication-errors.js
   - statscore-authentication-context.js
   - statscore-role-intake-core.js

   Does NOT Own:
   - authentication
   - Stream 1 authentication persistence
   - professional certification
   - Professional Workspace runtime
   - athlete truth
   - athlete intelligence
   - communication execution
   - Crystal Reports
   ========================================================= */

(function(){
  "use strict";

  const ENGINE_VERSION =
    "STREAM_4_ROLE_DASHBOARD_INTAKE_V2.2_TRANSACTION_HARDENED";

  const PAGE =
    "role-dashboard-intake.html";

  const NEXT_PAGE =
    "role-dashboard.html";

  const PROFILE_VERSION =
    "STREAM_4_PROFESSIONAL_OPERATING_PROFILE_V2.2_TRANSACTION_HARDENED";

  const CREDENTIAL_STATUS =
    "pending_professional_credential_review";

  const WORKSPACE_STATUS =
    "pending_workspace_configuration";

  const TX_COMPLETE =
    "context_persisted_receipt_complete";

  const TX_INDETERMINATE =
    "commit_state_indeterminate";

  let INTAKE_ADMITTED =
    false;

  let DASHBOARD_RELEASED =
    false;

  let SUBMISSION_IN_PROGRESS =
    false;

  const $ = id =>
    document.getElementById(id);


  /* =========================================================
     BASIC UI UTILITIES
     ========================================================= */

  function val(id){
    const el = $(id);

    return String(
      el?.value || ""
    ).trim();
  }

  function selectedValues(id){
    const el = $(id);

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

  function setValue(id, value){
    const el = $(id);

    if(el){
      el.value =
        value === undefined ||
        value === null
          ? ""
          : value;
    }
  }

  function setText(id, value){
    const el = $(id);

    if(el){
      el.textContent =
        value ||
        "Pending";
    }
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
      message || "";

    el.style.color =
      kind === "error"
        ? "#ff2b1f"
        : "#25d366";
  }


  /* =========================================================
     STREAM 4 CORE
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
    if(!INTAKE_ADMITTED){
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
     CONTROL GOVERNANCE
     ========================================================= */

  function setIntakeControlsEnabled(
    enabled
  ){
    /*
     * Only Stream 4 user-editable intake controls are
     * manipulated here.
     *
     * Read-only / independently governed controls are not
     * indiscriminately unlocked.
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
        const el = $(id);

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
      Boolean(locked);

    const submit =
      $("submitRoleBtn");

    const save =
      $("saveDraftBtn");

    const preview =
      $("previewBtn");

    if(submit){
      submit.disabled =
        locked ||
        !INTAKE_ADMITTED;
    }

    if(save){
      save.disabled =
        locked ||
        !INTAKE_ADMITTED;
    }

    if(preview){
      preview.disabled =
        locked ||
        !INTAKE_ADMITTED;
    }
  }

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
  }

  function releaseDashboard(next){
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
  }

  function failClosed(message){
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
     * Authentication permits Role Intake.
     *
     * Authentication DOES NOT establish manufacturing
     * completion and therefore cannot release Dashboard.
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
     PROFESSIONAL PROFILE ASSEMBLY
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
        /*
         * user_id comes exclusively from Stream 1
         * Initial Authentication Context.
         */
        user_id:
          user.user_id ||
          null,

        /*
         * Email does NOT originate from Initial
         * Authentication Context.
         */
        email:
          val("email"),

        display_name:
          name
      },

      professional_identity: {
        first_name:
          val("firstName"),

        last_name:
          val("lastName"),

        full_name:
          name,

        email:
          val("email"),

        phone:
          val("phone"),

        official_title:
          val(
            "officialTitle"
          )
      },

      role_identity: {
        /*
         * Authenticated role comes exclusively from Stream 1.
         */
        role_name:
          role.role_name,

        /*
         * Stream 1 does not publish sc_role_id.
         * The Stream 4 core resolves the registered record
         * during authoritative manufacture.
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
          val("firstName"),

        lastName:
          val("lastName"),

        email:
          val("email"),

        phone:
          val("phone"),

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
     MANUFACTURING CONTEXT PAYLOAD
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

    const nextPage =
      `${NEXT_PAGE}?role=${encodeURIComponent(profile.role_identity.role_name)}` +
      `&dashboard_config_key=${encodeURIComponent(dashboardConfigKey)}` +
      `&credential_status=${encodeURIComponent(CREDENTIAL_STATUS)}` +
      `&workspace_status=${encodeURIComponent(WORKSPACE_STATUS)}` +
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
     * This should be unreachable after governed admission.
     */
    if(!role.role_name){
      throw new Error(
        "Authenticated professional role unavailable after intake admission."
      );
    }

    const specs =
      await core()
        .fetchSpecializations(
          role.role_name
        );

    if(!specs.length){
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

    specs.forEach(spec => {
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
    });
  }


  /* =========================================================
     DRAFT RESTORE
     ========================================================= */

  function setMultiSelect(
    id,
    values
  ){
    const el = $(id);

    if(!el){
      return;
    }

    const governedValues =
      Array.isArray(values)
        ? values
        : [];

    Array
      .from(
        el.options
      )
      .forEach(option => {
        option.selected =
          governedValues
            .includes(
              option.value
            );
      });
  }

  function applyDraftPayload(payload){
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
     DRAFT SAVE / RESTORE
     ========================================================= */

  async function saveDraft(){
    try{
      requireAdmission();

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
      console.error(err);

      showMessage(
        err.message ||
        "Draft save failed.",
        "error"
      );
    }
  }

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
      if(!val(id)){
        return message;
      }
    }

    return "";
  }


  /* =========================================================
     STATUS PRESENTATION
     ========================================================= */

  function syncStatus(){
    if(!INTAKE_ADMITTED){
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
     * NO DASHBOARD RELEASE HERE.
     *
     * "Profile Ready" is presentation state only.
     */
  }


  /* =========================================================
     PROFESSIONAL PROFILE COMPLETION
     ========================================================= */

  async function completeProfile(){
    /*
     * Prevent concurrent double-click submissions.
     */
    if(SUBMISSION_IN_PROGRESS){
      return;
    }

    try{
      requireAdmission();

      const issue =
        validateRequired();

      if(issue){
        showMessage(
          issue,
          "error"
        );

        return;
      }

      /*
       * Manufacturing begins with Dashboard physically locked.
       */
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

      /*
       * -----------------------------------------------------
       * COMMIT STATE INDETERMINATE
       * -----------------------------------------------------
       *
       * Browser cannot prove whether the server transaction
       * committed.
       *
       * The transaction UUID is retained by the core.
       * Retry reuses that same UUID and resolves database truth.
       */
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

      /*
       * Any response other than governed COMPLETE is blocked.
       */
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

      /*
       * Dashboard release requires the complete authoritative
       * manufacturing unit.
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

      const profile =
        context
          .operating_context
          ?.professional_profile ||
        buildProfessionalProfile();

      /*
       * Stream 4 downstream operational state only.
       *
       * These values are NOT authentication authority.
       */
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

      const next =
        `${NEXT_PAGE}?role=${encodeURIComponent(context.role_name)}` +
        `&role_context_id=${encodeURIComponent(context.role_context_id)}` +
        `&role_instance_id=${encodeURIComponent(context.role_instance_id)}` +
        `&dashboard_config_key=${encodeURIComponent(profile.workspace_context.dashboard_config_key)}` +
        `&credential_status=${encodeURIComponent(CREDENTIAL_STATUS)}` +
        `&workspace_status=${encodeURIComponent(WORKSPACE_STATUS)}` +
        `&from=role-dashboard-intake`;

      /*
       * Dashboard becomes traversable ONLY after:
       *
       * authoritative context
       * +
       * authoritative receipt
       * +
       * runtime handoff
       */
      releaseDashboard(
        next
      );

      showMessage(
        result.recovered
          ? "Professional profile transaction recovered and completed. Continuing..."
          : "Professional profile completed. Continuing..."
      );

      setTimeout(() => {
        if(
          DASHBOARD_RELEASED
        ){
          window.location.href =
            next;
        }
      }, 700);

    }catch(err){
      console.error(err);

      lockDashboard();

      showMessage(
        err.message ||
        "Professional profile completion failed.",
        "error"
      );

    }finally{
      /*
       * Re-enable completion controls after current operation.
       *
       * In the indeterminate case, this intentionally permits
       * the user to retry the SAME manufacturing transaction.
       */
      setSubmissionLocked(
        false
      );
    }
  }


  /* =========================================================
     PROFILE PREVIEW
     ========================================================= */

  function previewProfile(){
    try{
      requireAdmission();

      console.log(
        "STATS-CORE Professional Operating Profile Preview:",
        buildContextPayload()
      );

      syncStatus();

      showMessage(
        "Professional profile preview generated in console."
      );

    }catch(err){
      console.error(err);

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
      .forEach(el => {
        el.addEventListener(
          "input",
          syncStatus
        );

        el.addEventListener(
          "change",
          syncStatus
        );
      });
  }


  /* =========================================================
     GOVERNED INITIALIZATION
     ========================================================= */

  async function init(){
    /*
     * Role Intake begins physically closed.
     *
     * No professional intake operation may occur before
     * Stream 1 authentication authority is established.
     */
    failClosed(
      "Establishing authenticated professional authority..."
    );

    try{
      /*
       * FIRST Stream 4 authority operation.
       *
       * Stream 1 owns:
       * - context validation
       * - sessionStorage restoration
       * - runtime/persisted authority precedence
       */
      const authority =
        await Promise.resolve(
          core()
            .restoreAuthenticationAuthority()
        );

      if(!authority.ok){
        failClosed(
          authority.message ||
          "Authenticated professional authority could not be restored. Return to login."
        );

        return;
      }

      /*
       * Authentication authority established.
       *
       * Professional Role Intake may now be admitted.
       *
       * Dashboard remains locked.
       */
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

      if(!validation.ok){
        failClosed(
          validation.message
        );

        return;
      }

      /*
       * "Login Verified" is now truthful because it is
       * displayed only after successful Stream 1 authority
       * establishment and validation.
       */
      setValue(
        "detectedRole",
        `${role.role_name} — Login Verified`
      );

      /*
       * Initial Authentication Context intentionally does
       * not publish professional email.
       *
       * Email remains blank unless restored from a Stream 4
       * draft or entered by the professional.
       */
      setValue(
        "email",
        ""
      );

      await loadSpecializations();

      try{
        await restoreDraft();
      }catch(err){
        /*
         * Draft restoration is recoverable.
         * It does not invalidate authenticated admission.
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
                authority.authentication_source
            }
          }
        )
      );

    }catch(err){
      console.error(err);

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

    getManufacturingTransactionId(){
      return core()
        .getActiveManufacturingTransactionId();
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
