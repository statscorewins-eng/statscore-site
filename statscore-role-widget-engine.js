/*
==========================================================
STATS-CORE™
File: statscore-role-widget-engine.js
Stream: 5
Purpose:
Creates role dashboard widgets from context and permissions.
==========================================================
*/

(function(){
  "use strict";

  window.STATScore = window.STATScore || {};

  const WIDGETS = {
    assigned_athletes: {
      title: "Assigned Athletes",
      description: "Athletes connected to this active workspace.",
      route: "assigned_athletes"
    },
    roster: {
      title: "Roster",
      description: "View team, group, or assigned roster context.",
      route: "roster"
    },
    production: {
      title: "Production Review",
      description: "Review athlete production records when permissioned.",
      route: "production"
    },
    verification: {
      title: "Verification Queue",
      description: "Review evidence and verification support items.",
      route: "verification"
    },
    evaluation: {
      title: "Camp / Combine Evaluation",
      description: "Capture measurables and event-based evidence.",
      route: "evaluation"
    },
    development_tracker: {
      title: "Development Tracker",
      description: "Track sport and position development progression.",
      route: "development_tracker"
    },
    recruiting_board: {
      title: "Recruiting Board",
      description: "Review prospects, fit context, and access requests.",
      route: "recruiting_board"
    },
    academic_alerts: {
      title: "Academic Alerts",
      description: "Review academic readiness and eligibility support.",
      route: "academic_alerts"
    },
    parent_approval_status: {
      title: "Guardian Approval",
      description: "Review visibility, consent, and approval status.",
      route: "parent_approval_status"
    },
    reports: {
      title: "Crystal Reports",
      description: "Open permissioned Crystal intelligence outputs.",
      route: "reports"
    },
    messages: {
      title: "Messages",
      description: "Open governed Multi-Box communication.",
      route: "messages"
    },
    media_review: {
      title: "Media Review",
      description: "Review film, media evidence, and PHNX outputs.",
      route: "media_review"
    }
  };

  function getEnabledWidgets(){
    const permissions = window.STATScore.RolePermissionEngine?.get?.() || {};
    return Object.keys(WIDGETS)
      .filter(key => permissions[key])
      .map(key => ({ key, ...WIDGETS[key] }));
  }

  function renderWidget(widget){
    const href = window.STATScore.RoleNavigationEngine?.route?.(widget.route) || "#";
    return `
      <a class="workspace-tool-card panel" href="${href}" data-widget-key="${widget.key}">
        <div class="tool-icon">▣</div>
        <h3>${widget.title}</h3>
        <p>${widget.description}</p>
        <span class="tool-action">Open →</span>
      </a>
    `;
  }

  function render(containerSelector){
    const container = document.querySelector(containerSelector || "[data-role-widgets]");
    if(!container) return;

    const widgets = getEnabledWidgets();

    container.innerHTML = widgets.length
      ? widgets.map(renderWidget).join("")
      : `
        <div class="panel workspace-tool-card">
          <div class="tool-icon">!</div>
          <h3>Complete Setup</h3>
          <p>Finish role intake or credential review to activate workspace tools.</p>
          <span class="tool-action">Setup Required</span>
        </div>
      `;

    document.dispatchEvent(new CustomEvent("statscore:role-widgets-rendered", {
      detail: widgets
    }));
  }

  document.addEventListener("statscore:role-permissions-ready", () => render());

  window.STATScore.RoleWidgetEngine = {
    WIDGETS,
    getEnabledWidgets,
    render
  };

})(); 
