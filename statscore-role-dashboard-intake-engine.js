/* =========================================================
   STATS-CORE™
   STREAM 4 — ROLE DASHBOARD INTAKE PAGE ENGINE
   File: statscore-role-dashboard-intake-engine.js

   Owner Stream:
   Stream 4 — Professional Role Intake

   Purpose:
   Creates the Professional Operating Profile required by
   Stream 10 credential verification and Stream 5 dashboard
   configuration.

   Depends on:
   - statscore-data.js
   - statscore-role-intake-core.js

   Provides:
   - professional identity
   - role
   - role_id / role_context_id
   - role specialization
   - organization context
   - sport scope
   - position/event scope
   - requested authority scope
   - primary workflow
   - dashboard_config_key
   - Multi-Box FROM identity
   - Stream 10 credential pending status
   ========================================================= */

(function(){
  "use strict";

  const PAGE = "role-dashboard-intake.html";
  const DASHBOARD = "role-dashboard.html";
  const STREAM_10_STATUS = "pending_stream_10_verification";
  const DASHBOARD_PENDING_STATUS = "pending_credential_validation";

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

  function setText(id, text){
    const el = $(id);
    if(el) el.textContent = text || "Pending";
  }

  function setValue(id, value){
    const el = $(id);
    if(el) el.value = value || "";
  }

  function safeKey(value, fallback){
    const raw = String(value || fallback || "")
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    return raw || String(fallback || "general");
  }

  function core(){
    if(!window.STATSCORE_ROLE_INTAKE_CORE){
      throw new Error("STATSCORE_ROLE_INTAKE_CORE is not loaded.");
    }
    return window.STATSCORE_ROLE_INTAKE_CORE;
  }

  function getRole(){
    return core().getCurrentRole();
  }

  function getUser(){
    return core().getCurrentUser();
  }

  function fullName(){
    return `${val("firstName")} ${val("lastName")}`.trim();
  }

  function getSpecializationLabel(){
    const select = $("specializationKey");
    if(!select) return "";
    return select.options[select.selectedIndex]?.text || "";
  }

  function getSpecializationPermissions(){
    const select = $("specializationKey");
    if(!select) return {};

    const option = select.options[select.selectedIndex];
    if(!option?.dataset?.permissions) return {};

    try{
      return JSON.parse(option.dataset.permissions);
    }catch(err){
      return {};
    }
  }

  function getSpecializationGroup(){
    const select = $("specializationKey");
    if(!select) return "";

    const option = select.options[select.selectedIndex];
    return option?.dataset?.group || "";
  }

  function normalizeSportScope(primarySport, explicitScope){
    const scope = Array.isArray(explicitScope) ? explicitScope.filter(Boolean) : [];
    if(primarySport && !scope.includes(primarySport)) scope.unshift(primarySport);
    return Array.from(new Set(scope));
  }

  function generateDashboardConfigKey(input){
    const role = safeKey(input.role, "role");
    const specialization = safeKey(input.specialization, "general");
    const sport = safeKey(input.sport, "multi_sport");
    const workflow = safeKey(input.workflow, "role_overview");

    return `${role}_${specialization}_${sport}_${workflow}`;
  }

  function buildProfessionalProfile(){
    const role = getRole();
    const user = getUser();
    const specializationKey = val("specializationKey");
    const specializationLabel = getSpecializationLabel();
    const specializationGroup = getSpecializationGroup();
    const primarySport = val("primarySport");
    const sportScope = normalizeSportScope(primarySport, selectedValues("sportScope"));
    const name = fullName() || user.display_name || user.email || "STATS-CORE Professional";
    const dashboardConfigKey = generateDashboardConfigKey({
      role: role.role_name,
      specialization: specializationKey,
      sport: primarySport,
      workflow: val("dashboardNeed")
    });

    return {
      profile_type: "stream_4_professional_operating_profile",
      profile_version: "v1.0",
      created_by_stream: "STREAM_4_PROFESSIONAL_ROLE_INTAKE",

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
        role_name: role.role_name,
        sc_role_id: role.sc_role_id || null,
        specialization_key: specializationKey,
        specialization_label: specializationLabel,
        specialization_group: specializationGroup
      },

      organization_context: {
        organization_name: val("organizationName"),
        team_level: val("teamLevel")
      },

      scope_context: {
        primary_sport: primarySport,
        sport_scope: sportScope,
        position_event_scope: val("positionEventGroup"),
        authority_scope_requested: val("authorityScope"),
        primary_workflow: val("dashboardNeed")
      },

      credential_context: {
        credential_status: STREAM_10_STATUS,
        dashboard_activation_status: DASHBOARD_PENDING_STATUS,
        credential_authority_stream: "STREAM_10_PHNX_PROFESSIONAL_CERTIFICATION",
        credential_required: true
      },

      dashboard_context: {
        dashboard_config_key: dashboardConfigKey,
        dashboard_role: role.role_name,
        default_dashboard: DASHBOARD,
        primary_workflow: val("dashboardNeed"),
        dashboard_activation_status: DASHBOARD_PENDING_STATUS
      },

      multibox_context: {
        from_role: role.role_name,
        from_role_label: role.role_name,
        from_display_name: name,
        from_specialization: specializationLabel,
        source_page: PAGE
      }
    };
  }

  function buildDraftPayload(){
    const profile = buildProfessionalProfile();

    return {
      role_name: profile.role_identity.role_name,
      specialization_key: profile.role_identity.specialization_key,
      specialization_label: profile.role_identity.specialization_label,
      professional_profile: profile,

      identity: {
        first_name: val("firstName"),
        last_name: val("lastName"),
        full_name: fullName(),
        email: val("email"),
        phone: val("phone"),
        official_title: val("officialTitle"),
        organization_name: val("organizationName")
      },

      sport: {
        primary_sport: val("primarySport"),
        sport_scope: selectedValues("sportScope"),
        team_level: val("teamLevel"),
        position_event_group: val("positionEventGroup")
      },

      operating: {
        authority_scope: val("authorityScope"),
        dashboard_need: val("dashboardNeed"),
        operating_notes: val("operatingNotes")
      }
    };
  }

  function buildContextPayload(){
    const role = getRole();
    const user = getUser();
    const profile = buildProfessionalProfile();

    const specializationKey = profile.role_identity.specialization_key;
    const specializationLabel = profile.role_identity.specialization_label;
    const name = profile.professional_identity.full_name;
    const primarySport = profile.scope_context.primary_sport;
    const sportScope = profile.scope_context.sport_scope;
    const dashboardConfigKey = profile.dashboard_context.dashboard_config_key;

    const nextPage =
      `${DASHBOARD}?role=${encodeURIComponent(role.role_name)}` +
      `&dashboard_config_key=${encodeURIComponent(dashboardConfigKey)}` +
      `&from=role-dashboard-intake`;

    return {
      role_name: role.role_name,
      display_name: name,
      email: val("email") || user.email || null,
      phone: val("phone") || null,

      primary_sport: primarySport || null,
      sport_scope: sportScope,

      source_page: PAGE,
      next_page: nextPage,

      identity_context: {
        professional_profile_type: "stream_4_professional_operating_profile",
        first_name: val("firstName"),
        last_name: val("lastName"),
        full_name: name,
        email: val("email") || user.email || "",
        phone: val("phone"),
        official_title: val("officialTitle"),
        organization_name: val("organizationName"),
        user_id: user.user_id || null
      },

      operating_context: {
        professional_profile: profile,
        specialization_key: specializationKey,
        specialization_label: specializationLabel,
        specialization_group: profile.role_identity.specialization_group,
        official_title: val("officialTitle"),
        organization_name: val("organizationName"),
        team_level: val("teamLevel"),
        position_event_scope: val("positionEventGroup"),
        authority_scope_requested: val("authorityScope"),
        primary_workflow: val("dashboardNeed"),
        operating_notes: val("operatingNotes"),
        credential_status: STREAM_10_STATUS,
        dashboard_activation_status: DASHBOARD_PENDING_STATUS
      },

      dashboard_context: {
        dashboard_role: role.role_name,
        dashboard_config_key: dashboardConfigKey,
        source_page: PAGE,
        default_dashboard: DASHBOARD,
        primary_workflow: val("dashboardNeed"),
        primary_dashboard_need: val("dashboardNeed"),
        specialization_key: specializationKey,
        specialization_label: specializationLabel,
        primary_sport: primarySport,
        sport_scope: sportScope,
        position_event_scope: val("positionEventGroup"),
        authority_scope_requested: val("authorityScope"),
        credential_status: STREAM_10_STATUS,
        dashboard_activation_status: DASHBOARD_PENDING_STATUS,
        credential_authority_source: "STREAM_10_PHNX_PROFESSIONAL_CERTIFICATION"
      },

      multibox_context: {
        from_role: role.role_name,
        from_role_label: role.role_name,
        from_display_name: name,
        from_specialization: specializationLabel,
        source_page: PAGE,
        credential_status: STREAM_10_STATUS
      },

      permissions_context: {
        permission_status: STREAM_10_STATUS,
        authority_scope_requested: val("authorityScope"),
        specialization_key: specializationKey,
        specialization_label: specializationLabel,
        specialization_group: profile.role_identity.specialization_group,
        specialization_default_permissions: getSpecializationPermissions(),
        sport_scope: sportScope,
        primary_sport: primarySport,
        position_event_scope: val("positionEventGroup"),
        credential_required: true,
        credential_authority_stream: "STREAM_10"
      },

      action_type: "professional_operating_profile_created"
    };
  }

  function syncStatus(){
    const role = getRole();
    const name = fullName();
    const primarySport = val("primarySport");
    const specialization = getSpecializationLabel();
    const authorityScope = val("authorityScope");

    setText("statusRole", role.role_name || "Pending");
    setText("statusSpecialization", specialization || "Pending");
    setText("statusIdentity", name || "Pending");
    setText("statusSport", primarySport || "Pending");
    setText("statusContext", authorityScope || "Pending");
    setText("statusMultibox", name || role.role_name || "Pending");

    setText("recordBadge", name && val("specializationKey") && primarySport ? "Profile Ready" : "Profile Pending");

    const identity = $("multiboxIdentity");
    if(identity){
      identity.value = name || role.role_name || "";
    }

    const dashboard = $("viewDashboardBtn");
    if(dashboard && role.role_name){
      const profile = buildProfessionalProfile();
      dashboard.href =
        `${DASHBOARD}?role=${encodeURIComponent(role.role_name)}` +
        `&dashboard_config_key=${encodeURIComponent(profile.dashboard_context.dashboard_config_key)}` +
        `&from=role-dashboard-intake`;
    }
  }

  function showMessage(text, kind){
    const el = $("systemMessage");
    if(!el) return;
    el.textContent = text || "";
    el.style.color = kind === "error" ? "#ff2b1f" : "#25d366";
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

    specs.forEach(spec => {
      const option = document.createElement("option");
      option.value = spec.specialization_key;
      option.textContent = spec.specialization_label;
      option.dataset.group = spec.specialization_group || "";
      option.dataset.permissions = JSON.stringify(spec.default_permissions || {});
      select.appendChild(option);
    });

    if(!specs.length){
      const option = document.createElement("option");
      option.value = "general";
      option.textContent = "General Professional";
      option.dataset.group = "general";
      option.dataset.permissions = "{}";
      select.appendChild(option);
    }
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

  function applyDraftPayload(payload){
    if(!payload) return;

    setValue("specializationKey", payload.specialization_key);
    setValue("firstName", payload.identity?.first_name);
    setValue("lastName", payload.identity?.last_name);
    setValue("email", payload.identity?.email);
    setValue("phone", payload.identity?.phone);
    setValue("officialTitle", payload.identity?.official_title);
    setValue("organizationName", payload.identity?.organization_name);

    setValue("primarySport", payload.sport?.primary_sport);
    setValue("teamLevel", payload.sport?.team_level);
    setValue("positionEventGroup", payload.sport?.position_event_group);

    const scope = payload.sport?.sport_scope || [];
    const scopeEl = $("sportScope");
    if(scopeEl){
      Array.from(scopeEl.options).forEach(option => {
        option.selected = scope.includes(option.value);
      });
    }

    setValue("authorityScope", payload.operating?.authority_scope);
    setValue("dashboardNeed", payload.operating?.dashboard_need);
    setValue("operatingNotes", payload.operating?.operating_notes);
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
    if(!getRole().role_name) return "No login role detected.";
    if(!val("specializationKey")) return "Select a role specialization.";
    if(!val("firstName")) return "First name is required.";
    if(!val("lastName")) return "Last name is required.";
    if(!val("primarySport")) return "Primary sport is required.";
    if(!val("authorityScope")) return "Authority scope is required.";
    if(!val("dashboardNeed")) return "Primary dashboard need is required.";
    return "";
  }

  async function createContext(){
    try{
      const issue = validateRequired();
      if(issue){
        showMessage(issue, "error");
        return;
      }

      showMessage("Creating professional operating profile...");

      const result = await core().createRoleContext(buildContextPayload());

      const context = result.context;
      const profile = context.operating_context?.professional_profile || buildProfessionalProfile();
      const dashboardConfigKey = profile.dashboard_context?.dashboard_config_key || "";

      localStorage.setItem("STATSCORE_PROFESSIONAL_OPERATING_PROFILE", JSON.stringify(profile));
      localStorage.setItem("STATSCORE_DASHBOARD_CONFIG_KEY", dashboardConfigKey);
      localStorage.setItem("STATSCORE_CREDENTIAL_STATUS", STREAM_10_STATUS);
      localStorage.setItem("STATSCORE_DASHBOARD_ACTIVATION_STATUS", DASHBOARD_PENDING_STATUS);

      showMessage("Professional profile created. Credential validation pending.");

      const next =
        `${DASHBOARD}?role=${encodeURIComponent(context.role_name)}` +
        `&role_context_id=${encodeURIComponent(context.role_context_id)}` +
        `&role_instance_id=${encodeURIComponent(context.role_instance_id)}` +
        `&dashboard_config_key=${encodeURIComponent(dashboardConfigKey)}` +
        `&credential_status=${encodeURIComponent(STREAM_10_STATUS)}` +
        `&from=role-dashboard-intake`;

      const dashboard = $("viewDashboardBtn");
      if(dashboard) dashboard.href = next;

      setTimeout(() => {
        window.location.href = next;
      }, 700);

    }catch(err){
      console.error(err);
      showMessage(err.message || "Professional profile creation failed.", "error");
    }
  }

  function previewContext(){
    const payload = buildContextPayload();
    console.log("STATS-CORE Professional Operating Profile Preview:", payload);
    syncStatus();
    showMessage("Professional operating profile preview generated.");
  }

  function bind(){
    $("submitRoleBtn")?.addEventListener("click", createContext);
    $("saveDraftBtn")?.addEventListener("click", saveDraft);
    $("previewBtn")?.addEventListener("click", previewContext);

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
      setText("pageTitle", role.role_name ? `${role.role_name} Intake` : "Role Dashboard Intake");

      await loadSpecializations();
      await restoreDraft();

      bind();
      syncStatus();

      if(!role.role_name){
        showMessage("No login role detected. Return to login.", "error");
      }else{
        showMessage("Professional role intake ready.");
      }

    }catch(err){
      console.error(err);
      showMessage(err.message || "Role intake failed to initialize.", "error");
    }
  }

  window.STATSCORE_ROLE_DASHBOARD_INTAKE_ENGINE = {
    buildProfessionalProfile,
    buildDraftPayload,
    buildContextPayload,
    generateDashboardConfigKey,
    syncStatus,
    saveDraft,
    restoreDraft,
    createContext,
    previewContext
  };

  document.addEventListener("DOMContentLoaded", init);
})(); 
