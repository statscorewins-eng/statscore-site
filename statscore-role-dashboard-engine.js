/*
==========================================================
STATS-CORE™
File: statscore-role-dashboard-engine.js
Stream: 5
Purpose:
Final dashboard renderer for Professional Workspace Dashboard.
==========================================================
*/

(function(){
  "use strict";

  window.STATScore = window.STATScore || {};

  function text(selector, value){
    document.querySelectorAll(selector).forEach(el => {
      el.textContent = value ?? "";
    });
  }

  function count(value){
    return Array.isArray(value) ? value.length : Number(value || 0);
  }

  function renderIdentity(){
    const ctx = window.STATScore.RoleContextEngine?.get?.() || {};
    const config = window.STATScore.RoleDashboardConfig?.get?.() || {};

    text("[data-professional-name]", ctx.display_name || "Professional");
    text("[data-role-title]", config.title || "Professional Workspace");
    text("[data-role-subtitle]", config.subtitle || "");
    text("[data-role-label]", ctx.role_label || "PROFESSIONAL");
    text("[data-organization]", ctx.organization || "Pending");
    text("[data-sport]", ctx.sport_label || "PENDING");
    text("[data-position-event]", ctx.position_event_scope || "Pending");
    text("[data-workspace-id]", ctx.workspace_id || "Pending");
    text("[data-phnx-id]", ctx.phnx_id || "Pending");
    text("[data-multibox-from]", ctx.multibox_from_identity || "Pending");
  }

  function renderCounters(){
    const ws = window.STATScore.ActiveWorkspace?.get?.() || {};

    text("[data-count-athletes]", count(ws.assigned_athletes) || "—");
    text("[data-count-actions]", count(ws.actions));
    text("[data-count-notices]", count(ws.notices));
    text("[data-count-messages]", count(ws.messages));
  }

  function renderAssignedAthletes(){
    const container = document.querySelector("[data-assigned-athletes]");
    if(!container) return;

    const athletes = window.STATScore.ActiveWorkspace?.getAssignedAthletes?.() || [];

    if(!athletes.length){
      container.innerHTML = `
        <div class="list-row">
          <div class="avatar-dot">—</div>
          <div>
            <b>No Athletes Loaded</b>
            <span>Assigned athletes appear after workspace access is loaded.</span>
          </div>
          <time>Pending</time>
        </div>
      `;
      return;
    }

    container.innerHTML = athletes.map(a => `
      <a class="list-row" href="athlete-dashboard.html?snapshot_id=${encodeURIComponent(a.snapshot_id || "")}">
        <div class="avatar-dot">${(a.first_name || a.name || "A").charAt(0)}</div>
        <div>
          <b>${a.name || `${a.first_name || ""} ${a.last_name || ""}`.trim() || "Athlete"}</b>
          <span>${a.sport || ""} ${a.position || ""}</span>
        </div>
        <time>${a.status || "Open"}</time>
      </a>
    `).join("");
  }

  function renderActions(){
    const container = document.querySelector("[data-actions-needed]");
    if(!container) return;

    const actions = window.STATScore.ActiveWorkspace?.getActions?.() || [];

    if(!actions.length){
      container.innerHTML = `
        <div class="list-row">
          <div class="avatar-dot">—</div>
          <div>
            <b>No Actions Loaded</b>
            <span>Role-specific tasks appear when available.</span>
          </div>
          <time>Pending</time>
        </div>
      `;
      return;
    }

    container.innerHTML = actions.map(a => `
      <div class="list-row">
        <div class="avatar-dot">!</div>
        <div>
          <b>${a.title || "Action Needed"}</b>
          <span>${a.description || ""}</span>
        </div>
        <time>${a.status || "Open"}</time>
      </div>
    `).join("");
  }

  function renderScope(){
    const ctx = window.STATScore.RoleContextEngine?.get?.() || {};

    text("[data-scope-sport]", ctx.sport_label || "PENDING");
    text("[data-scope-position]", ctx.position_event_scope || "Pending");
    text("[data-scope-access]", ctx.assigned_access_type || "Pending");
    text("[data-scope-workflow]", ctx.primary_workflow || "Pending");
  }

  async function init(){
    await window.STATScore.ActiveWorkspace?.restore?.();

    window.STATScore.RoleContextEngine?.build?.();
    window.STATScore.RolePermissionEngine?.build?.();
    window.STATScore.RoleDashboardStateEngine?.init?.();

    renderIdentity();
    renderCounters();
    renderAssignedAthletes();
    renderActions();
    renderScope();

    window.STATScore.RoleWidgetEngine?.render?.();

    document.body.classList.add("role-dashboard-ready");

    document.dispatchEvent(new CustomEvent("statscore:role-dashboard-ready", {
      detail: {
        workspace: window.STATScore.ActiveWorkspace?.get?.(),
        context: window.STATScore.RoleContextEngine?.get?.(),
        permissions: window.STATScore.RolePermissionEngine?.get?.()
      }
    }));
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }

  window.STATScore.RoleDashboardEngine = {
    init,
    renderIdentity,
    renderCounters,
    renderAssignedAthletes,
    renderActions,
    renderScope
  };

})(); 
