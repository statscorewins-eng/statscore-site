/*
==========================================================
STATS-CORE™
File: statscore-professional-workspace-runtime.js
Stream: 5 — Professional Operations Dashboard / CRM
Purpose:
Consumes active_workspace_id and exposes resolved workspace
context to Stream 5 dashboard engines.

Does NOT:
- create professional identity
- issue credentials
- calculate intelligence
- create athlete snapshots
==========================================================
*/

(function(){
  "use strict";

  window.STATScore = window.STATScore || {};

  const STORAGE_KEYS = {
    ACTIVE_WORKSPACE_ID: "active_workspace_id",
    WORKSPACE_CONTEXT: "statscore_active_workspace_context"
  };

  function getUrlParam(name){
    return new URLSearchParams(window.location.search).get(name);
  }

  function safeJsonParse(value){
    try{
      return value ? JSON.parse(value) : null;
    }catch(err){
      console.warn("Workspace context parse failed:", err);
      return null;
    }
  }

  function readStoredContext(){
    return safeJsonParse(localStorage.getItem(STORAGE_KEYS.WORKSPACE_CONTEXT));
  }

  function writeStoredContext(context){
    if(!context) return;
    localStorage.setItem(STORAGE_KEYS.WORKSPACE_CONTEXT, JSON.stringify(context));
  }

  function resolveActiveWorkspaceId(){
    return (
      getUrlParam("workspace_id") ||
      getUrlParam("active_workspace_id") ||
      localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID) ||
      sessionStorage.getItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID) ||
      null
    );
  }

  function normalizeWorkspace(raw){
    raw = raw || {};

    const workspaceId =
      raw.active_workspace_id ||
      raw.workspace_id ||
      raw.id ||
      resolveActiveWorkspaceId();

    return {
      active_workspace_id: workspaceId,
      workspace_id: workspaceId,

      professional_id: raw.professional_id || raw.phnx_professional_id || null,
      phnx_id: raw.phnx_id || raw.phnx_professional_id || null,

      role: raw.role || raw.role_key || "professional",
      role_id: raw.role_id || null,
      role_context_id: raw.role_context_id || null,
      role_instance_id: raw.role_instance_id || null,

      first_name: raw.first_name || raw.firstName || "",
      last_name: raw.last_name || raw.lastName || "",
      display_name:
        raw.display_name ||
        raw.professional_name ||
        [raw.first_name || raw.firstName, raw.last_name || raw.lastName].filter(Boolean).join(" ") ||
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
        raw.sport_scope ||
        raw.sportScope ||
        [],

      position_event_scope:
        raw.position_event_scope ||
        raw.positionEventGroup ||
        raw.position_scope ||
        null,

      authority_scope:
        raw.authority_scope ||
        raw.authorityScope ||
        raw.assigned_access_type ||
        null,

      assigned_access_type:
        raw.assigned_access_type ||
        raw.assignedAccessType ||
        null,

      primary_workflow:
        raw.primary_workflow ||
        raw.dashboardNeed ||
        raw.workflow ||
        "role_overview",

      dashboard_config_key:
        raw.dashboard_config_key ||
        raw.dashboardConfigKey ||
        null,

      permissions: raw.permissions || {},
      credentials: raw.credentials || {},
      assigned_athletes: raw.assigned_athletes || raw.assignedAthletes || [],
      notices: raw.notices || [],
      actions: raw.actions || [],

      communication_context: raw.communication_context || {},
      multibox_from_identity:
        raw.multibox_from_identity ||
        raw.multiboxIdentity ||
        null,

      raw
    };
  }

  async function loadFromPHNXRuntime(activeWorkspaceId){
    const phnxRuntime =
      window.PHNXWorkspaceRuntime ||
      window.PHNX?.WorkspaceRuntime ||
      window.phnxWorkspaceRuntime ||
      null;

    if(!phnxRuntime) return null;

    if(typeof phnxRuntime.getActiveWorkspace === "function"){
      return await phnxRuntime.getActiveWorkspace(activeWorkspaceId);
    }

    if(typeof phnxRuntime.restoreActiveWorkspace === "function"){
      return await phnxRuntime.restoreActiveWorkspace(activeWorkspaceId);
    }

    if(typeof phnxRuntime.getWorkspaceContext === "function"){
      return await phnxRuntime.getWorkspaceContext(activeWorkspaceId);
    }

    return null;
  }

  async function loadWorkspace(){
    const activeWorkspaceId = resolveActiveWorkspaceId();

    if(activeWorkspaceId){
      localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID, activeWorkspaceId);
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID, activeWorkspaceId);
    }

    let workspace = null;

    try{
      workspace = await loadFromPHNXRuntime(activeWorkspaceId);
    }catch(err){
      console.warn("PHNX workspace runtime unavailable:", err);
    }

    if(!workspace){
      workspace = readStoredContext();
    }

    if(!workspace){
      workspace = {
        active_workspace_id: activeWorkspaceId,
        workspace_id: activeWorkspaceId,
        role: getUrlParam("role") || "professional",
        sport: getUrlParam("sport") || null,
        dashboard_config_key: null,
        permissions: {},
        credentials: {},
        assigned_athletes: [],
        actions: [],
        notices: []
      };
    }

    const normalized = normalizeWorkspace(workspace);
    writeStoredContext(normalized);

    window.STATScore.currentWorkspace = normalized;

    document.dispatchEvent(new CustomEvent("statscore:workspace-ready", {
      detail: normalized
    }));

    return normalized;
  }

  window.STATScore.ProfessionalWorkspaceRuntime = {
    load: loadWorkspace,
    get: function(){
      return window.STATScore.currentWorkspace || readStoredContext();
    },
    getActiveWorkspaceId: resolveActiveWorkspaceId,
    normalize: normalizeWorkspace
  };

})(); 
