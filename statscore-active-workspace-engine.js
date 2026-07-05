/*
==========================================================
STATS-CORE™
File: statscore-active-workspace-engine.js
Stream: 5 — Professional Operations Dashboard / CRM
Purpose:
Maintains the active workspace context for Stream 5.
==========================================================
*/

(function(){
  "use strict";

  window.STATScore = window.STATScore || {};

  let activeWorkspace = null;

  function set(workspace){
    activeWorkspace = workspace || null;
    window.STATScore.activeWorkspace = activeWorkspace;

    if(activeWorkspace?.active_workspace_id){
      localStorage.setItem("active_workspace_id", activeWorkspace.active_workspace_id);
      sessionStorage.setItem("active_workspace_id", activeWorkspace.active_workspace_id);
    }

    document.dispatchEvent(new CustomEvent("statscore:active-workspace-ready", {
      detail: activeWorkspace
    }));

    return activeWorkspace;
  }

  async function restore(){
    if(window.STATScore?.ProfessionalWorkspaceRuntime?.load){
      const workspace = await window.STATScore.ProfessionalWorkspaceRuntime.load();
      return set(workspace);
    }

    console.warn("ProfessionalWorkspaceRuntime not available.");
    return set(null);
  }

  function get(){
    return activeWorkspace || window.STATScore.currentWorkspace || null;
  }

  function getField(key, fallback){
    const workspace = get();
    return workspace && workspace[key] !== undefined ? workspace[key] : fallback;
  }

  window.STATScore.ActiveWorkspace = {
    restore,
    set,
    get,
    getId: () => getField("active_workspace_id", null),
    getRole: () => getField("role", "professional"),
    getSport: () => getField("sport", null),
    getOrganization: () => getField("organization", null),
    getPermissions: () => getField("permissions", {}),
    getCredentials: () => getField("credentials", {}),
    getDashboardConfigKey: () => getField("dashboard_config_key", null),
    getAssignedAthletes: () => getField("assigned_athletes", []),
    getActions: () => getField("actions", []),
    getNotices: () => getField("notices", [])
  };

})(); 
