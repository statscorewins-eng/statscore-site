/*
==========================================================
STATS-CORE™
File: statscore-role-dashboard-config.js
Stream: 5
Purpose:
Defines dashboard titles, role summaries, and widget priority.
==========================================================
*/

(function(){
  "use strict";

  window.STATScore = window.STATScore || {};

  const CONFIGS = {
    parent: {
      title: "Guardian Operations",
      subtitle: "Approvals, visibility, consent, notices, and athlete access protection.",
      primary_widgets: ["parent_approval_status", "assigned_athletes", "reports", "messages"]
    },
    coach: {
      title: "Coach Operations",
      subtitle: "Roster support, athlete development, production review, and communication.",
      primary_widgets: ["roster", "assigned_athletes", "production", "development_tracker", "verification", "messages"]
    },
    counselor: {
      title: "Counselor Operations",
      subtitle: "Academic readiness, eligibility support, transcript awareness, and athlete support.",
      primary_widgets: ["academic_alerts", "assigned_athletes", "reports", "messages"]
    },
    recruiter: {
      title: "Recruiter Access",
      subtitle: "Permissioned athlete search, watchlist context, fit review, and governed recruiting workflow.",
      primary_widgets: ["recruiting_board", "assigned_athletes", "reports", "messages"]
    },
    evaluator: {
      title: "Evaluator Operations",
      subtitle: "Camp/combine evidence capture, measurables, assessment support, and verification context.",
      primary_widgets: ["evaluation", "verification", "assigned_athletes", "media_review", "reports"]
    },
    trainer: {
      title: "Trainer Operations",
      subtitle: "Athlete performance development tracking by sport, position, drill, and progression.",
      primary_widgets: ["development_tracker", "assigned_athletes", "media_review", "reports", "messages"]
    },
    program: {
      title: "Program Operations",
      subtitle: "Program roster, organization context, athlete fit visibility, and managed access.",
      primary_widgets: ["roster", "assigned_athletes", "production", "recruiting_board", "reports"]
    },
    professional: {
      title: "Professional Workspace",
      subtitle: "Your active professional workspace, assigned athletes, actions, notices, and permitted tools.",
      primary_widgets: ["assigned_athletes", "reports", "messages"]
    }
  };

  function get(){
    const ctx = window.STATScore.RoleContextEngine?.get?.() || {};
    const role = String(ctx.role || "professional").toLowerCase();
    return CONFIGS[role] || CONFIGS.professional;
  }

  window.STATScore.RoleDashboardConfig = {
    CONFIGS,
    get
  };

})(); 
