/* =========================================================
   STATS-CORE™
   STREAM 4 — PROFESSIONAL ROLE DASHBOARD INTAKE ENGINE
   File: statscore-role-dashboard-intake-engine.js

   Purpose:
   Runtime controller for role-dashboard-intake.html.

   Owns:
   - professional operating profile assembly
   - login role display / lock
   - role specialization loading
   - draft save / restore
   - full profile validation
   - Supabase context creation through statscore-role-intake-core.js
   - runtime handoff for credential review + workspace configuration

   Depends on:
   - statscore-data.js
   - statscore-role-intake-core.js
   ========================================================= */

(function(){
  "use strict";

  const PAGE = "role-dashboard-intake.html";
  const NEXT_PAGE = "role-dashboard.html";

  const PROFILE_VERSION = "STREAM_4_PROFESSIONAL_OPERATING_PROFILE_V1";
  const CREDENTIAL_STATUS = "pending_professional_credential_review";
  const WORKSPACE_STATUS = "pending_workspace_configuration";

  const $ = id => document.getElementById(id);

  function val(id){
    const el = $(id);
    return (el?.value || "").trim();
  }

  function selectedValues(id){
    const el = $(id);
    if(!el) return [];
    return Array.from(el.selectedOptions || [])
      .map(option => option.value)
      .filter(Boolean);
  }

  function setValue(id, value){
    const el = $(id);
    if(el) el.value = value || "";
  }

  function setText(id, value){
    const el = $(id);
    if(el) el.textContent = value || "Pending";
  }

  function showMessage(message, kind){
    const el = $("systemMessage");
    if(!el) return;

    el.textContent = message || "";
    el.style.color = kind === "error" ? "#ff2b1f" : "#25d366";
  }

  function core(){
    if(!window.STATSCORE_ROLE_INTAKE_CORE){
      throw new Error("STATSCORE_ROLE_INTAKE_CORE is not loaded.");
    }
    return window.STATSCORE_ROLE_INTAKE_CORE;
  }

  function getUser(){
    return core().getCurrentUser();
  }

  function getRole(){
    return core().getCurrentRole();
  }

  function normalizeKey(value, fallback){
    const cleaned = String(value || fallback || "")
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    return cleaned || String(fallback || "general");
  }

  function fullName(){
    return `${val("firstName")} ${val("lastName")}`.trim();
  }

  function getSpecializationLabel(){
    const select = $("specializationKey");
    if(!select) return "";
    return select.options[select.selectedIndex]?.text || "";
  }

  function getSpecializationGroup(){
    const select = $("specializationKey");
    if(!select) return "";
    const option = select.options[select.selectedIndex];
    return option?.dataset?.group || "";
  }

  function getSpecializationPermissions(){
    const select = $("specializationKey");
    if(!select) return {};
    const option = select.options[select.selectedIndex];

    try{
      return JSON.parse(option?.dataset?.permissions || "{}");
    }catch(err){
      return {};
    }
  }

  function getPrimarySport(){
    return val("primarySport");
  }

  function getSportScope(){
    const primary = getPrimarySport();
    const selected = selectedValues("sportScope");
    const merged = primary ? [primary, ...selected] : selected;
    return Array.from(new Set(merged.filter(Boolean)));
  }

  function getRequestedModules(){
    return selectedValues("requestedDashboardModules");
  }

  function generateDashboardConfigKey(profile){
    return [
      normalizeKey(profile.role_identity.role_name, "role"),
      normalizeKey(profile.role_identity.specialization_key, "general"),
      normalizeKey(profile.scope_context.primary_sport, "multi_sport"),
      normalizeKey(profile.workspace_context.primary_workflow, "role_overview"),
      normalizeKey(profile.access_context.assigned_access_type, "assigned")
    ].join("_");
  }

  function buildProfessionalProfile(){
    const user = getUser();
    const role = getRole();

    const name = fullName() || user.display_name || user.email || "STATS-CORE Professional";
    const primarySport = getPrimarySport();
    const sportScope = getSportScope();
    const specializationKey = val("specializationKey");
    const specializationLabel = getSpecializationLabel();

    const profile = {
      profile_type: "professional_operating_profile",
      profile_version: PROFILE_VERSION,
      source_page: PAGE,

      user_identity: {
        user_id: user.user_id || null,
        email: val("email") || user.email || "",
        display_name: name
      },

      professional_identity: {
        first_name: val("firstName"),
        last_name: val("lastName"),
        full_name: name,
        email: val("email") || user.email || "",
        phone: val("phone"),
        official_title: val("officialTitle")
      },

      role_identity: {
        role_name: role.role_name || "",
        sc_role_id: role.sc_role_id || null,
        login_role_locked: true,
        specialization_key: specializationKey,
        specialization_label: specializationLabel,
        specialization_group: getSpecializationGroup()
      },

      organization_context: {
        organization_name: val("organizationName"),
        organization_level: val("teamLevel"),
        organization_location: val("organizationLocation"),
        organization_url: val("organizationUrl")
      },

      scope_context: {
        primary_sport: primarySport,
        sport_scope: sportScope,
        position_event_group: val("positionEventGroup"),
        competition_context: val("competitionContext")
      },

      access_context: {
        authority_scope_requested: val("authorityScope"),
        assigned_access_type: val("assignedAccessType")
      },

      workspace_context: {
        primary_workflow: val("dashboardNeed"),
        requested_dashboard_modules: getRequestedModules(),
        workspace_status: WORKSPACE_STATUS
      },

      communication_context: {
        communication_route_preference: val("communicationRoutePreference"),
        multibox_from_identity: name
      },

      credential_review_context: {
        credential_status: CREDENTIAL_STATUS,
        credential_review_path: val("credentialReviewPath"),
        credential_intent: val("credentialIntent"),
        credential_notes: val("credentialNotes")
      },

      operating_context: {
        operating_notes: val("operatingNotes")
      }
    };

    profile.workspace_context.dashboard_config_key = generateDashboardConfigKey(profile);

    return profile;
  }

  function buildDraftPayload(){
    return {
      professional_profile: buildProfessionalProfile(),
      form_snapshot: {
        firstName: val("firstName"),
        lastName: val("lastName"),
        email: val("email"),
        phone: val("phone"),
        specializationKey: val("specializationKey"),
        officialTitle: val("officialTitle"),
        authorityScope: val("authorityScope"),
        organizationName: val("organizationName"),
        teamLevel: val("teamLevel"),
        organizationLocation: val("organizationLocation"),
        organizationUrl: val("organizationUrl"),
        primarySport: val("primarySport"),
        sportScope: selectedValues("sportScope"),
        positionEventGroup: val("positionEventGroup"),
        competitionContext: val("competitionContext"),
        assignedAccessType: val("assignedAccessType"),
        dashboardNeed: val("dashboardNeed"),
        requestedDashboardModules: selectedValues("requestedDashboardModules"),
        communicationRoutePreference: val("communicationRoutePreference"),
        credentialReviewPath: val("credentialReviewPath"),
        credentialIntent: val("credentialIntent"),
        credentialNotes: val("credentialNotes"),
        operatingNotes: val("operatingNotes")
      }
    };
  }

  function buildContextPayload(){
    const user = getUser();
    const role = getRole();
    const profile = buildProfessionalProfile();

    const dashboardConfigKey = profile.workspace_context.dashboard_config_key;

    const nextPage =
      `${NEXT_PAGE}?role=${encodeURIComponent(profile.role_identity.role_name)}` +
      `&dashboard_config_key=${encodeURIComponent(dashboardConfigKey)}` +
      `&credential_status=${encodeURIComponent(CREDENTIAL_STATUS)}` +
      `&workspace_status=${encodeURIComponent(WORKSPACE_STATUS)}` +
      `&from=role-dashboard-intake`;

    return {
      role_name: profile.role_identity.role_name,
      display_name: profile.professional_identity.full_name,
      email: profile.professional_identity.email || user.email || null,
      phone: profile.professional_identity.phone || null,

      primary_sport: profile.scope_context.primary_sport || null,
      sport_scope: profile.scope_context.sport_scope,

      source_page: PAGE,
      next_page: nextPage,

      identity_context: {
        user_id: user.user_id || null,
        professional_identity: profile.professional_identity,
        role_identity: profile.role_identity
      },

      operating_context: {
        professional_profile: profile,
        organization_context: profile.organization_context,
        scope_context: profile.scope_context,
        access_context: profile.access_context,
        workspace_context: profile.workspace_context,
        credential_review_context: profile.credential_review_context,
        operating_notes: profile.operating_context.operating_notes
      },

      dashboard_context: {
        dashboard_config_key: dashboardConfigKey,
        dashboard_role: profile.role_identity.role_name,
        default_dashboard: NEXT_PAGE,
        primary_workflow: profile.workspace_context.primary_workflow,
        requested_dashboard_modules: profile.workspace_context.requested_dashboard_modules,
        assigned_access_type: profile.access_context.assigned_access_type,
        authority_scope_requested: profile.access_context.authority_scope_requested,
        specialization_key: profile.role_identity.specialization_key,
        specialization_label: profile.role_identity.specialization_label,
        primary_sport: profile.scope_context.primary_sport,
        sport_scope: profile.scope_context.sport_scope,
        position_event_group: profile.scope_context.position_event_group,
        competition_context: profile.scope_context.competition_context,
        workspace_status: WORKSPACE_STATUS,
        credential_status: CREDENTIAL_STATUS
      },

      multibox_context: {
        from_role: profile.role_identity.role_name,
        from_role_label: profile.role_identity.role_name,
        from_display_name: profile.professional_identity.full_name,
        from_specialization: profile.role_identity.specialization_label,
        communication_route_preference: profile.communication_context.communication_route_preference,
        source_page: PAGE
      },

      permissions_context: {
        permission_status: CREDENTIAL_STATUS,
        credential_required: profile.credential_review_context.credential_review_path !== "identity_only",
        authority_scope_requested: profile.access_context.authority_scope_requested,
        assigned_access_type: profile.access_context.assigned_access_type,
        specialization_key: profile.role_identity.specialization_key,
        specialization_label: profile.role_identity.specialization_label,
        specialization_default_permissions: getSpecializationPermissions(),
        primary_sport: profile.scope_context.primary_sport,
        sport_scope: profile.scope_context.sport_scope,
        position_event_group: profile.scope_context.position_event_group,
        requested_dashboard_modules: profile.workspace_context.requested_dashboard_modules
      },

      action_type: "professional_operating_profile_completed"
    };
  }

  async function loadSpecializations(){
    const role = getRole();
    const select = $("specializationKey");

    if(!select) return;

    select.innerHTML = `<option value="">Select specialization</option>`;

    if(!role.role_name){
      select.innerHTML = `<option value="">No login role detected</option>`;
      return;
    }

    const specs = await core().fetchSpecializations(role.role_name);

    if(!specs.length){
      const option = document.createElement("option");
      option.value = "general";
      option.textContent = "General Professional";
      option.dataset.group = "general";
      option.dataset.permissions = "{}";
      select.appendChild(option);
      return;
    }

    specs.forEach(spec => {
      const option = document.createElement("option");
      option.value = spec.specialization_key;
      option.textContent = spec.specialization_label;
      option.dataset.group = spec.specialization_group || "";
      option.dataset.permissions = JSON.stringify(spec.default_permissions || {});
      select.appendChild(option);
    });
  }

  function applyDraftPayload(payload){
    const snapshot = payload?.form_snapshot || {};
    if(!snapshot) return;

    setValue("firstName", snapshot.firstName);
    setValue("lastName", snapshot.lastName);
    setValue("email", snapshot.email);
    setValue("phone", snapshot.phone);
    setValue("specializationKey", snapshot.specializationKey);
    setValue("officialTitle", snapshot.officialTitle);
    setValue("authorityScope", snapshot.authorityScope);
    setValue("organizationName", snapshot.organizationName);
    setValue("teamLevel", snapshot.teamLevel);
    setValue("organizationLocation", snapshot.organizationLocation);
    setValue("organizationUrl", snapshot.organizationUrl);
    setValue("primarySport", snapshot.primarySport);
    setValue("positionEventGroup", snapshot.positionEventGroup);
    setValue("competitionContext", snapshot.competitionContext);
    setValue("assignedAccessType", snapshot.assignedAccessType);
    setValue("dashboardNeed", snapshot.dashboardNeed);
    setValue("communicationRoutePreference", snapshot.communicationRoutePreference);
    setValue("credentialReviewPath", snapshot.credentialReviewPath);
    setValue("credentialIntent", snapshot.credentialIntent);
    setValue("credentialNotes", snapshot.credentialNotes);
    setValue("operatingNotes", snapshot.operatingNotes);

    setMultiSelect("sportScope", snapshot.sportScope || []);
    setMultiSelect("requestedDashboardModules", snapshot.requestedDashboardModules || []);
  }

  function setMultiSelect(id, values){
    const el = $(id);
    if(!el) return;

    Array.from(el.options).forEach(option => {
      option.selected = values.includes(option.value);
    });
  }

  async function saveDraft(){
    try{
      const role = getRole();

      if(!role.role_name){
        showMessage("No login role detected. Draft not saved.", "error");
        return;
      }

      await core().saveDraft({
        role_name: role.role_name,
        source_page: PAGE,
        draft_payload: buildDraftPayload()
      });

      showMessage("Professional profile draft saved.");
    }catch(err){
      console.error(err);
      showMessage(err.message || "Draft save failed.", "error");
    }
  }

  async function restoreDraft(){
    try{
      const role = getRole();
      if(!role.role_name) return;

      const draft = await core().restoreDraft(role.role_name, PAGE);

      if(draft?.draft_payload){
        applyDraftPayload(draft.draft_payload);
        showMessage("Professional profile draft restored.");
      }
    }catch(err){
      console.warn("Draft restore skipped:", err);
    }
  }

  function validateRequired(){
    const checks = [
      ["firstName", "First name is required."],
      ["lastName", "Last name is required."],
      ["specializationKey", "Role specialization is required."],
      ["authorityScope", "Requested authority scope is required."],
      ["primarySport", "Primary sport is required."],
      ["assignedAccessType", "Assigned athlete access type is required."],
      ["dashboardNeed", "Primary workflow is required."]
    ];

    if(!getRole().role_name) return "No login role detected. Return to login.";

    for(const [id, message] of checks){
      if(!val(id)) return message;
    }

    return "";
  }

  function syncStatus(){
    const role = getRole();
    const name = fullName();
    const specialization = getSpecializationLabel();
    const sport = val("primarySport");
    const scope = val("authorityScope");

    setText("statusIdentity", name || "Pending");
    setText("statusRole", role.role_name || "Pending");
    setText("statusSpecialization", specialization || "Pending");
    setText("statusSport", sport || "Pending");
    setText("statusContext", scope || "Pending");
    setText("statusMultibox", name || role.role_name || "Pending");

    setText("recordBadge", name && specialization && sport && scope ? "Profile Ready" : "Profile Pending");

    setValue("multiboxIdentity", name || role.role_name || "");
    setValue("workspaceStatus", "Pending Profile Review");
    setValue("credentialStatus", "Pending Credential Review");

    const dashboard = $("viewDashboardBtn");
    if(dashboard && role.role_name){
      const profile = buildProfessionalProfile();
      dashboard.href =
        `${NEXT_PAGE}?role=${encodeURIComponent(role.role_name)}` +
        `&dashboard_config_key=${encodeURIComponent(profile.workspace_context.dashboard_config_key)}` +
        `&from=role-dashboard-intake`;
    }
  }

  async function completeProfile(){
    try{
      const issue = validateRequired();
      if(issue){
        showMessage(issue, "error");
        return;
      }

      showMessage("Completing professional profile...");

      const result = await core().createRoleContext(buildContextPayload());
      const context = result.context;
      const profile = context.operating_context?.professional_profile || buildProfessionalProfile();

      localStorage.setItem("STATSCORE_PROFESSIONAL_OPERATING_PROFILE", JSON.stringify(profile));
      localStorage.setItem("STATSCORE_DASHBOARD_CONFIG_KEY", profile.workspace_context.dashboard_config_key);
      localStorage.setItem("STATSCORE_CREDENTIAL_STATUS", CREDENTIAL_STATUS);
      localStorage.setItem("STATSCORE_WORKSPACE_STATUS", WORKSPACE_STATUS);

      const next =
        `${NEXT_PAGE}?role=${encodeURIComponent(context.role_name)}` +
        `&role_context_id=${encodeURIComponent(context.role_context_id)}` +
        `&role_instance_id=${encodeURIComponent(context.role_instance_id)}` +
        `&dashboard_config_key=${encodeURIComponent(profile.workspace_context.dashboard_config_key)}` +
        `&credential_status=${encodeURIComponent(CREDENTIAL_STATUS)}` +
        `&workspace_status=${encodeURIComponent(WORKSPACE_STATUS)}` +
        `&from=role-dashboard-intake`;

      const dashboard = $("viewDashboardBtn");
      if(dashboard) dashboard.href = next;

      showMessage("Professional profile completed. Continuing...");

      setTimeout(() => {
        window.location.href = next;
      }, 700);

    }catch(err){
      console.error(err);
      showMessage(err.message || "Professional profile completion failed.", "error");
    }
  }

  function previewProfile(){
    console.log("STATS-CORE Professional Operating Profile Preview:", buildContextPayload());
    syncStatus();
    showMessage("Professional profile preview generated in console.");
  }

  function bind(){
    $("submitRoleBtn")?.addEventListener("click", completeProfile);
    $("saveDraftBtn")?.addEventListener("click", saveDraft);
    $("previewBtn")?.addEventListener("click", previewProfile);

    document.querySelectorAll("input, select, textarea").forEach(el => {
      el.addEventListener("input", syncStatus);
      el.addEventListener("change", syncStatus);
    });
  }

  async function init(){
    try{
      const role = getRole();
      const user = getUser();

      setValue("detectedRole", role.role_name ? `${role.role_name} — Login Verified` : "No role detected");
      setValue("email", user.email || "");

      await loadSpecializations();
      await restoreDraft();

      bind();
      syncStatus();

      showMessage(role.role_name ? "Professional intake ready." : "No login role detected. Return to login.", role.role_name ? "ok" : "error");

    }catch(err){
      console.error(err);
      showMessage(err.message || "Professional intake failed to initialize.", "error");
    }
  }

  window.STATSCORE_ROLE_DASHBOARD_INTAKE_ENGINE = {
    buildProfessionalProfile,
    buildDraftPayload,
    buildContextPayload,
    saveDraft,
    restoreDraft,
    completeProfile,
    previewProfile,
    syncStatus
  };

  document.addEventListener("DOMContentLoaded", init);
})(); 
