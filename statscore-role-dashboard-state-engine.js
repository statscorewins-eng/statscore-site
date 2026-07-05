/*
==========================================================
STATS-CORE™
File: statscore-role-dashboard-state-engine.js
Stream: 5
Purpose:
Stores dashboard filters, active panel, selected athlete, and
runtime dashboard state.
==========================================================
*/

(function(){
  "use strict";

  window.STATScore = window.STATScore || {};

  const KEY = "statscore_role_dashboard_state";

  function read(){
    try{
      return JSON.parse(sessionStorage.getItem(KEY)) || {};
    }catch(err){
      return {};
    }
  }

  function write(state){
    sessionStorage.setItem(KEY, JSON.stringify(state || {}));
    window.STATScore.roleDashboardState = state || {};
    return state;
  }

  function patch(update){
    const next = { ...read(), ...(update || {}) };
    write(next);

    document.dispatchEvent(new CustomEvent("statscore:role-dashboard-state-updated", {
      detail: next
    }));

    return next;
  }

  function init(){
    const ws = window.STATScore.ActiveWorkspace?.get?.() || {};

    const state = patch({
      workspace_id: ws.active_workspace_id || ws.workspace_id || null,
      selected_athlete_id: null,
      active_panel: "dashboard",
      search_query: "",
      filters: {},
      last_loaded_at: new Date().toISOString()
    });

    return state;
  }

  document.addEventListener("statscore:active-workspace-ready", init);

  window.STATScore.RoleDashboardStateEngine = {
    init,
    get: read,
    set: write,
    patch
  };

})(); 
