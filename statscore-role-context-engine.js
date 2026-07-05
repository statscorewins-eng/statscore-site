/*
==========================================================
STATS-CORE™
File: statscore-role-context-engine.js
Stream: 5
Purpose:
Builds role, sport, organization, workflow, and scope context
from the active workspace.
==========================================================
*/

(function(){
  "use strict";

  window.STATScore = window.STATScore || {};

  function normalizeText(value, fallback){
    return value ? String(value).replace(/_/g," ").toUpperCase() : fallback;
  }

  function build(){
    const ws = window.STATScore.ActiveWorkspace?.get?.() || {};

    const context = {
      workspace_id: ws.active_workspace_id || ws.workspace_id || null,
      professional_id: ws.professional_id || null,
      phnx_id: ws.phnx_id || null,

      display_name: ws.display_name || "Professional",
      role: ws.role || "professional",
      role_label: normalizeText(ws.role, "PROFESSIONAL"),

      organization: ws.organization || "Pending",
      sport: ws.sport || "Pending",
      sport_label: normalizeText(ws.sport, "PENDING"),

      sport_scope: ws.sport_scope || [],
      position_event_scope: ws.position_event_scope || "Pending",
      authority_scope: ws.authority_scope || "Pending",
      assigned_access_type: ws.assigned_access_type || "Pending",
      primary_workflow: ws.primary_workflow || "role_overview",

      dashboard_config_key:
        ws.dashboard_config_key ||
        [ws.role, ws.sport, ws.primary_workflow].filter(Boolean).join("_") ||
        "professional_default",

      multibox_from_identity:
        ws.multibox_from_identity ||
        `${ws.display_name || "Professional"} • ${normalizeText(ws.role, "ROLE")}`,

      raw: ws
    };

    window.STATScore.roleContext = context;

    document.dispatchEvent(new CustomEvent("statscore:role-context-ready", {
      detail: context
    }));

    return context;
  }

  function get(){
    return window.STATScore.roleContext || build();
  }

  document.addEventListener("statscore:active-workspace-ready", build);

  window.STATScore.RoleContextEngine = {
    build,
    get
  };

})(); 
