/*
==========================================================
STATS-CORE™
File: statscore-role-permission-engine.js
Stream: 5
Purpose:
Determines visible tools, widgets, and actions from workspace
permissions and credentials.
==========================================================
*/

(function(){
  "use strict";

  window.STATScore = window.STATScore || {};

  const DEFAULT_PERMISSIONS = {
    assigned_athletes: true,
    reports: false,
    messages: true,
    roster: false,
    production: false,
    verification: false,
    evaluation: false,
    development_tracker: false,
    recruiting_board: false,
    academic_alerts: false,
    parent_approval_status: false,
    media_review: false
  };

  const ROLE_DEFAULTS = {
    parent: {
      assigned_athletes: true,
      reports: true,
      messages: true,
      parent_approval_status: true
    },
    coach: {
      assigned_athletes: true,
      reports: true,
      messages: true,
      roster: true,
      production: true,
      verification: true,
      development_tracker: true,
      media_review: true
    },
    counselor: {
      assigned_athletes: true,
      reports: true,
      messages: true,
      academic_alerts: true,
      verification: true
    },
    recruiter: {
      assigned_athletes: true,
      reports: true,
      messages: true,
      recruiting_board: true
    },
    evaluator: {
      assigned_athletes: true,
      reports: true,
      messages: true,
      verification: true,
      evaluation: true,
      media_review: true
    },
    trainer: {
      assigned_athletes: true,
      reports: true,
      messages: true,
      development_tracker: true,
      evaluation: false
    },
    program: {
      assigned_athletes: true,
      reports: true,
      messages: true,
      roster: true,
      production: true,
      recruiting_board: true
    },
    professional: {
      assigned_athletes: true,
      messages: true
    }
  };

  function hasCredential(credentials, key){
    if(!credentials) return false;
    if(Array.isArray(credentials)){
      return credentials.some(c => String(c).toLowerCase().includes(key));
    }
    return Boolean(credentials[key]);
  }

  function build(){
    const ws = window.STATScore.ActiveWorkspace?.get?.() || {};
    const role = String(ws.role || "professional").toLowerCase();
    const explicit = ws.permissions || {};
    const credentials = ws.credentials || {};

    const permissions = {
      ...DEFAULT_PERMISSIONS,
      ...(ROLE_DEFAULTS[role] || ROLE_DEFAULTS.professional),
      ...explicit
    };

    if(hasCredential(credentials, "evaluator")){
      permissions.evaluation = true;
      permissions.verification = true;
      permissions.media_review = true;
    }

    if(hasCredential(credentials, "trainer")){
      permissions.development_tracker = true;
    }

    if(hasCredential(credentials, "coach")){
      permissions.roster = true;
      permissions.production = true;
    }

    window.STATScore.rolePermissions = permissions;

    document.dispatchEvent(new CustomEvent("statscore:role-permissions-ready", {
      detail: permissions
    }));

    return permissions;
  }

  function can(key){
    const permissions = window.STATScore.rolePermissions || build();
    return Boolean(permissions[key]);
  }

  document.addEventListener("statscore:role-context-ready", build);

  window.STATScore.RolePermissionEngine = {
    build,
    can,
    get: () => window.STATScore.rolePermissions || build()
  };

})(); 
