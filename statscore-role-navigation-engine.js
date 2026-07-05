/*
==========================================================
STATS-CORE™
File: statscore-role-navigation-engine.js
Stream: 5
Purpose:
Builds role-safe dashboard routes while preserving workspace_id.
==========================================================
*/

(function(){
  "use strict";

  window.STATScore = window.STATScore || {};

  const ROUTES = {
    dashboard: "role-dashboard.html",
    workspace_setup: "role-dashboard-intake.html",
    assigned_athletes: "role-dashboard.html#athletes",
    reports: "crystal-report.html",
    messages: "multi-box.html",
    roster: "coach.html",
    production: "athlete-production-record.html",
    verification: "verification-request.html",
    evaluation: "evaluator.html",
    trainer: "trainer.html",
    development_tracker: "trainer.html",
    recruiting_board: "recruiter-access.html",
    academic_alerts: "counselor.html",
    parent_approval_status: "parent.html",
    media_review: "phnx-sports-media.html",
    activity: "activity-feed.html"
  };

  function withWorkspace(url){
    const wsId = window.STATScore.ActiveWorkspace?.getId?.();
    if(!wsId) return url;

    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}workspace_id=${encodeURIComponent(wsId)}`;
  }

  function route(key){
    return withWorkspace(ROUTES[key] || "role-dashboard.html");
  }

  function applyLinks(){
    document.querySelectorAll("[data-role-route]").forEach(el => {
      const key = el.getAttribute("data-role-route");
      el.setAttribute("href", route(key));
    });
  }

  document.addEventListener("statscore:role-permissions-ready", applyLinks);
  document.addEventListener("DOMContentLoaded", applyLinks);

  window.STATScore.RoleNavigationEngine = {
    route,
    withWorkspace,
    applyLinks,
    routes: ROUTES
  };

})(); 
