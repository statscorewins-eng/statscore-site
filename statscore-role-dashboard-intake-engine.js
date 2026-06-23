/* =========================================================
   STATS-CORE™
   STREAM 4 — ROLE DASHBOARD INTAKE PAGE ENGINE
   File: statscore-role-dashboard-intake-engine.js
   Depends on:
   - statscore-data.js
   - statscore-role-intake-core.js
   ========================================================= */

(function(){
  "use strict";

  const PAGE = "role-dashboard-intake.html";
  const DASHBOARD = "role-dashboard.html";

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

  function buildDraftPayload(){
    return {
      role_name: getRole().role_name,
      specialization_key: val("specializationKey"),
      specialization_label: getSpecializationLabel(),

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
    const specializationKey = val("specializationKey");
    const specializationLabel = getSpecializationLabel();
    const name = fullName() || user.display_name || user.email || "STATS-CORE Role User";
    const primarySport = val("primarySport");
    const sportScope = selectedValues("sportScope").length
      ? selectedValues("sportScope")
      : primarySport ? [primarySport] : [];

    const nextPage =
      `${DASHBOARD}?role=${encodeURIComponent(role.role_name)}&from=role-dashboard-intake`;

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
        first_name: val("firstName"),
        last_name: val("lastName"),
        full_name: name,
        email: val("email") || user.email || "",
        phone: val("phone"),
        official_title: val("officialTitle"),
        organization_name: val("organizationName")
      },

      operating_context: {
        specialization_key: specializationKey,
        specialization_label: specializationLabel,
        team_level: val("teamLevel"),
        position_event_group: val("positionEventGroup"),
        authority_scope: val("authorityScope"),
        dashboard_need: val("dashboardNeed"),
        operating_notes: val("operatingNotes")
      },

      dashboard_context: {
        dashboard_role: role.role_name,
        source_page: PAGE,
        default_dashboard: DASHBOARD,
        primary_dashboard_need: val("dashboardNeed"),
        specialization_key: specializationKey,
        specialization_label: specializationLabel,
        primary_sport: primarySport,
        sport_scope: sportScope
      },

      multibox_context: {
        from_role: role.role_name,
        from_role_label: role.role_name,
        from_display_name: name,
        from_specialization: specializationLabel,
        source_page: PAGE
      },

      permissions_context: {
        authority_scope: val("authorityScope"),
        specialization_key: specializationKey,
        specialization_label: specializationLabel,
        sport_scope: sportScope,
        primary_sport: primarySport
      },

      action_type: "role_dashboard_intake_created"
    };
  }

  function syncStatus(){
    const role = getRole();
    const name = fullName();

    setText("statusRole", role.role_name || "Pending");
    setText("statusSpecialization", getSpecializationLabel() || "Pending");
    setText("statusIdentity", name || "Pending");
    setText("statusSport", val("primarySport") || "Pending");
    setText("statusContext", val("authorityScope") || "Pending");
    setText("statusMultibox", name || role.role_name || "Pending");

    setText("recordBadge", name && val("specializationKey") ? "Environment Ready" : "Environment Pending");

    const identity = $("multiboxIdentity");
    if(identity){
      identity.value = name || role.role_name || "";
    }

    const dashboard = $("viewDashboardBtn");
    if(dashboard && role.role_name){
      dashboard.href = `${DASHBOARD}?role=${encodeURIComponent(role.role_name)}&from=role-dashboard-intake`;
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
      option.textContent = "General Role User";
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

      showMessage("Draft saved to Supabase.");
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
        showMessage("Draft restored.");
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
    return "";
  }

  async function createContext(){
    try{
      const issue = validateRequired();
      if(issue){
        showMessage(issue, "error");
        return;
      }

      showMessage("Creating role context...");

      const result = await core().createRoleContext(buildContextPayload());

      showMessage("Role context created. Routing enabled.");

      const next =
        `${DASHBOARD}?role=${encodeURIComponent(result.context.role_name)}` +
        `&role_context_id=${encodeURIComponent(result.context.role_context_id)}` +
        `&role_instance_id=${encodeURIComponent(result.context.role_instance_id)}` +
        `&from=role-dashboard-intake`;

      const dashboard = $("viewDashboardBtn");
      if(dashboard) dashboard.href = next;

      setTimeout(() => {
        window.location.href = next;
      }, 700);

    }catch(err){
      console.error(err);
      showMessage(err.message || "Role context creation failed.", "error");
    }
  }

  function previewContext(){
    const payload = buildContextPayload();
    console.log("STATS-CORE Role Intake Preview:", payload);
    syncStatus();
    showMessage("Context preview generated in console.");
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

      setValue("detectedRole", role.role_name || "No role detected");
      setValue("email", user.email || "");
      setText("pageTitle", role.role_name ? `${role.role_name} Intake` : "Role Intake");

      await loadSpecializations();
      await restoreDraft();

      bind();
      syncStatus();

      if(!role.role_name){
        showMessage("No login role detected. Return to login.", "error");
      }else{
        showMessage("Role intake ready.");
      }

    }catch(err){
      console.error(err);
      showMessage(err.message || "Role intake failed to initialize.", "error");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})(); 
