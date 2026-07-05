/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-routing.js

Asset Type:
JavaScript Infrastructure / Routing Authority

Owner Stream:
Master Integration

Primary Operational Authority:
Master Integration

Layer:
Infrastructure / Routing

Runtime Owner:
Master Integration Runtime

Primary Consumers:
- index.html
- login.html
- snapshot-intake.html
- athlete-dashboard.html
- player-profile.html
- role-dashboard-intake.html
- role-dashboard.html
- system.html
- all route-aware pages

Purpose:
Provides governed routing support, route preservation,
snapshot_id preservation, role-based navigation,
and page-to-page flow integrity.

Consumes:
- runtime state
- snapshot_id
- role
- role_id
- page map
- system map

Provides:
- governed routes
- preserved query context
- route decisions
- navigation support

Primary IDs:
- snapshot_id
- athlete_id
- role
- role_id
- page_id

Cross-Stream Dependencies:
May route between all Streams.
May not implement another Stream's page logic.

Does NOT:
- Calculate intelligence
- Render dashboards
- Create source records
- Modify scores
- Generate Crystal Reports
- Execute communications

Status:
CANON LOCKED

Last Governance Review:
2026-07-05

==========================================================
*/

/*
============================================================
STATScore™ Routing Spine
File: statscore-routing.js
Version: STATSCORE-ROUTING-V2
Purpose:
Role-based login routing, protected room access,
snapshot-aware navigation, and controlled redirects.

Canonical Login Routes:
- Athlete → snapshot-intake.html
- Professional Roles → role-dashboard-intake.html
- Admin → system.html
============================================================
*/

window.STATScoreRouting = (() => {

  const ROLE_ROUTES = {
    athlete: "snapshot-intake.html",
    parent: "role-dashboard-intake.html",
    coach: "role-dashboard-intake.html",
    counselor: "role-dashboard-intake.html",
    recruiter: "role-dashboard-intake.html",
    evaluator: "role-dashboard-intake.html",
    program: "role-dashboard-intake.html",
    admin: "system.html"
  };

  const ROLE_DASHBOARDS = {
    athlete: "athlete-dashboard.html",
    parent: "role-dashboard.html",
    coach: "role-dashboard.html",
    counselor: "role-dashboard.html",
    recruiter: "role-dashboard.html",
    evaluator: "role-dashboard.html",
    program: "role-dashboard.html",
    admin: "system.html"
  };

  const PUBLIC_ROUTES = [
    "index.html",
    "login.html",
    "privacy.html",
    "terms.html"
  ];

  const PROFESSIONAL_ROLES = [
    "parent",
    "coach",
    "counselor",
    "recruiter",
    "evaluator",
    "program"
  ];

  const ALL_ROLES = [
    "athlete",
    ...PROFESSIONAL_ROLES,
    "admin"
  ];

  const PROTECTED_ROUTES = {
    "snapshot-intake.html": ["athlete", "admin"],
    "athlete-dashboard.html": ["athlete", "parent", "coach", "counselor", "recruiter", "evaluator", "program", "admin"],
    "player-profile.html": ["athlete", "parent", "coach", "counselor", "recruiter", "evaluator", "program", "admin"],

    "role-dashboard-intake.html": ["parent", "coach", "counselor", "recruiter", "evaluator", "program", "admin"],
    "role-dashboard.html": ["parent", "coach", "counselor", "recruiter", "evaluator", "program", "admin"],

    "parent.html": ["parent", "admin"],
    "coach.html": ["coach", "admin"],
    "counselor.html": ["counselor", "admin"],
    "recruiter-access.html": ["recruiter", "admin"],
    "evaluator.html": ["evaluator", "admin"],
    "program.html": ["program", "admin"],

    "system.html": ["admin"],

    "verification.html": ["athlete", "parent", "coach", "counselor", "evaluator", "program", "admin"],
    "eligibility.html": ["athlete", "parent", "counselor", "coach", "admin"],
    "readiness.html": ["athlete", "parent", "coach", "evaluator", "program", "admin"],
    "college-pathway.html": ["athlete", "parent", "counselor", "coach", "recruiter", "admin"],
    "multi-box.html": ["athlete", "parent", "coach", "counselor", "recruiter", "evaluator", "program", "admin"],
    "crystal-registry.html": ["athlete", "parent", "coach", "counselor", "recruiter", "evaluator", "program", "admin"],
    "crystal-report.html": ["athlete", "parent", "coach", "counselor", "recruiter", "evaluator", "program", "admin"]
  };

  function core(){
    return window.STATScoreCore || null;
  }

  function getCurrentPage(){
    const path = window.location.pathname || "";
    return path.split("/").pop() || "index.html";
  }

  function normalizeRole(role){
    return String(role || "").trim().toLowerCase();
  }

  function getQueryParam(key){
    return new URLSearchParams(window.location.search).get(key) || "";
  }

  function getRole(){
    const c = core();

    return normalizeRole(
      c?.getRole?.() ||
      getQueryParam("role") ||
      sessionStorage.getItem("statscore_role") ||
      sessionStorage.getItem("statscore_active_role_v1") ||
      localStorage.getItem("statscore_active_role_v1") ||
      ""
    );
  }

  function setRole(role){
    const c = core();
    const normalized = normalizeRole(role);

    if (!normalized) return "";

    c?.setRole?.(normalized);

    sessionStorage.setItem("statscore_role", normalized);
    sessionStorage.setItem("statscore_active_role_v1", normalized);
    localStorage.setItem("statscore_active_role_v1", normalized);

    return normalized;
  }

  function getSnapshotId(){
    const c = core();

    return (
      c?.getSnapshotId?.() ||
      getQueryParam("snapshot_id") ||
      sessionStorage.getItem("statscore_snapshot_id") ||
      localStorage.getItem("statscore_snapshot_id") ||
      ""
    );
  }

  function getRoleId(){
    return (
      getQueryParam("role_id") ||
      sessionStorage.getItem("statscore_role_id") ||
      localStorage.getItem("statscore_role_id") ||
      ""
    );
  }

  function isValidRole(role){
    return ALL_ROLES.includes(normalizeRole(role));
  }

  function isProfessionalRole(role){
    return PROFESSIONAL_ROLES.includes(normalizeRole(role));
  }

  function appendParams(url, params = {}){
    const cleanParams = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && String(value) !== "");

    if (!cleanParams.length) return url;

    const separator = url.includes("?") ? "&" : "?";
    const query = new URLSearchParams();

    cleanParams.forEach(([key, value]) => {
      query.set(key, String(value));
    });

    return `${url}${separator}${query.toString()}`;
  }

  function withSnapshot(url, snapshotId = getSnapshotId()){
    if (!snapshotId) return url;
    return appendParams(url, { snapshot_id: snapshotId });
  }

  function withRoleContext(url, role = getRole(), options = {}){
    const normalized = normalizeRole(role);

    return appendParams(url, {
      role: normalized,
      role_id: options.role_id || getRoleId(),
      from: options.from || "",
      next: options.next || "",
      snapshot_id: options.snapshot_id || ""
    });
  }

  function routeForRole(role){
    const normalized = normalizeRole(role);
    return ROLE_ROUTES[normalized] || "login.html";
  }

  function dashboardForRole(role){
    const normalized = normalizeRole(role);
    return ROLE_DASHBOARDS[normalized] || "";
  }

  function isPublicRoute(page = getCurrentPage()){
    return PUBLIC_ROUTES.includes(page);
  }

  function allowedRolesForPage(page = getCurrentPage()){
    return PROTECTED_ROUTES[page] || [];
  }

  function canAccessPage(role = getRole(), page = getCurrentPage()){
    const normalized = normalizeRole(role);

    if (isPublicRoute(page)) return true;

    const allowed = allowedRolesForPage(page);

    if (!allowed.length) return true;

    return allowed.includes(normalized);
  }

  function routeLogin(role, options = {}){
    const normalized = setRole(role);

    if (!normalized || !isValidRole(normalized)) {
      window.location.href = "login.html";
      return;
    }

    const destination = routeForRole(normalized);
    const nextDashboard = options.next || dashboardForRole(normalized);

    let finalUrl = appendParams(destination, {
      role: normalized,
      role_id: options.role_id || getRoleId(),
      from: options.from || "login",
      next: nextDashboard
    });

    if (options.includeSnapshot === true || (normalized === "athlete" && options.snapshot_id)) {
      finalUrl = withSnapshot(finalUrl, options.snapshot_id || getSnapshotId());
    }

    window.location.href = finalUrl;
  }

  function bindRoleButtons(selector = "[data-role-route]"){
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener("click", (event) => {
        event.preventDefault();

        const role =
          el.getAttribute("data-role-route") ||
          el.dataset.roleRoute ||
          "";

        routeLogin(role);
      });
    });
  }

  function enforceAccess(options = {}){
    const page = getCurrentPage();
    const role = getRole();

    if (isPublicRoute(page)) return true;

    if (!role) {
      if (options.redirect !== false) {
        window.location.href = "login.html";
      }
      return false;
    }

    if (!canAccessPage(role, page)) {
      if (options.redirect !== false) {
        const safeRoute = routeForRole(role);

        window.location.href = appendParams(safeRoute, {
          role,
          from: "access-denied",
          next: dashboardForRole(role)
        });
      }

      return false;
    }

    return true;
  }

  function requireAdmin(){
    const role = getRole();

    if (role !== "admin") {
      window.location.href = appendParams(routeForRole(role || "athlete"), {
        role: role || "athlete",
        from: "admin-denied",
        next: dashboardForRole(role || "athlete")
      });

      return false;
    }

    return true;
  }

  function goToRoleRoom(role){
    routeLogin(role, { from: getCurrentPage() });
  }

  function goToDashboard(role = getRole()){
    const destination = dashboardForRole(role) || routeForRole(role);
    window.location.href = appendParams(destination, { role });
  }

  function goToProfile(snapshotId = getSnapshotId()){
    window.location.href = withSnapshot("player-profile.html", snapshotId);
  }

  function goToSnapshotIntake(){
    window.location.href = appendParams("snapshot-intake.html", {
      role: "athlete",
      from: getCurrentPage(),
      next: "athlete-dashboard.html"
    });
  }

  function goToRoleDashboardIntake(role = getRole()){
    const normalized = normalizeRole(role);

    window.location.href = appendParams("role-dashboard-intake.html", {
      role: normalized,
      from: getCurrentPage(),
      next: "role-dashboard.html"
    });
  }

  function goToVerification(snapshotId = getSnapshotId()){
    window.location.href = withSnapshot("verification.html", snapshotId);
  }

  function goToEligibility(snapshotId = getSnapshotId()){
    window.location.href = withSnapshot("eligibility.html", snapshotId);
  }

  function goToReadiness(snapshotId = getSnapshotId()){
    window.location.href = withSnapshot("readiness.html", snapshotId);
  }

  function goToMultiBox(snapshotId = getSnapshotId()){
    window.location.href = withSnapshot("multi-box.html", snapshotId);
  }

  function goToCrystal(snapshotId = getSnapshotId()){
    window.location.href = withSnapshot("crystal-registry.html", snapshotId);
  }

  function hydrateSnapshotLinks(){
    const snapshotId = getSnapshotId();

    if (!snapshotId) return;

    document.querySelectorAll("[data-snapshot-link]").forEach((el) => {
      const href =
        el.getAttribute("href") ||
        el.dataset.snapshotLink ||
        "";

      if (!href || href.includes("snapshot_id=")) return;

      el.setAttribute("href", withSnapshot(href, snapshotId));
    });
  }

  function hydrateRoleLinks(){
    const role = getRole();
    const roleId = getRoleId();

    if (!role) return;

    document.querySelectorAll("[data-role-link]").forEach((el) => {
      const href =
        el.getAttribute("href") ||
        el.dataset.roleLink ||
        "";

      if (!href || href.includes("role=")) return;

      el.setAttribute("href", appendParams(href, {
        role,
        role_id: roleId
      }));
    });
  }

  function markActiveNav(){
    const page = getCurrentPage();

    document.querySelectorAll("a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!href) return;

      const hrefPage = href.split("?")[0].split("/").pop();

      if (hrefPage === page) {
        link.classList.add("active");
      }
    });
  }

  function getRoomContext(){
    const role = getRole();
    const page = getCurrentPage();
    const snapshotId = getSnapshotId();
    const roleId = getRoleId();

    return {
      role,
      role_id: roleId,
      page,
      snapshot_id: snapshotId,
      route: routeForRole(role),
      dashboard: dashboardForRole(role),
      is_professional: isProfessionalRole(role),
      allowed_roles: allowedRolesForPage(page),
      can_access: canAccessPage(role, page)
    };
  }

  function exposeRoomContext(){
    window.STATScoreRoomContext = getRoomContext();
    return window.STATScoreRoomContext;
  }

  function init(options = {}){
    if (options.enforce !== false) {
      enforceAccess(options);
    }

    hydrateSnapshotLinks();
    hydrateRoleLinks();
    markActiveNav();
    exposeRoomContext();

    if (options.bindRoleButtons !== false) {
      bindRoleButtons();
    }
  }

  return {
    ROLE_ROUTES,
    ROLE_DASHBOARDS,
    PUBLIC_ROUTES,
    PROFESSIONAL_ROLES,
    ALL_ROLES,
    PROTECTED_ROUTES,

    getCurrentPage,
    normalizeRole,
    getQueryParam,
    getRole,
    setRole,
    getSnapshotId,
    getRoleId,

    isValidRole,
    isProfessionalRole,
    appendParams,
    withSnapshot,
    withRoleContext,

    routeForRole,
    dashboardForRole,
    isPublicRoute,
    allowedRolesForPage,
    canAccessPage,

    routeLogin,
    bindRoleButtons,

    enforceAccess,
    requireAdmin,

    goToRoleRoom,
    goToDashboard,
    goToProfile,
    goToSnapshotIntake,
    goToRoleDashboardIntake,
    goToVerification,
    goToEligibility,
    goToReadiness,
    goToMultiBox,
    goToCrystal,

    hydrateSnapshotLinks,
    hydrateRoleLinks,
    markActiveNav,

    getRoomContext,
    exposeRoomContext,

    init
  };

})(); 
