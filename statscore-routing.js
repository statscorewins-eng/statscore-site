/* ============================================================
   STATScore™ Routing Spine
   File: statscore-routing.js
   Version: STATSCORE-ROUTING-V1
   Purpose:
   Role-based login routing, protected room access,
   snapshot-aware navigation, and controlled redirects.
============================================================ */

window.STATScoreRouting = (() => { 

  /* ============================================================
     ROLE ROUTE MAP
  ============================================================ */

  const ROLE_ROUTES = {

    athlete: "player-profile.html",
    parent: "parent.html",
    coach: "coach.html",
    counselor: "counselor.html",
    recruiter: "recruiter-access.html",
    evaluator: "evaluator.html",
    program: "program.html",
    admin: "system.html"

  };

  const PUBLIC_ROUTES = [
    "index.html",
    "login.html",
    "privacy.html",
    "terms.html"
  ];

  const PROTECTED_ROUTES = {

    "player-profile.html": ["athlete", "parent", "coach", "counselor", "recruiter", "evaluator", "program", "admin"],
    "parent.html": ["parent", "admin"],
    "coach.html": ["coach", "admin"],
    "counselor.html": ["counselor", "admin"],
    "recruiter-access.html": ["recruiter", "admin"],
    "evaluator.html": ["evaluator", "admin"],
    "program.html": ["program", "admin"],
    "system.html": ["admin"],
    "snapshot-intake.html": ["athlete", "parent", "coach", "program", "admin"],
    "verification.html": ["athlete", "parent", "coach", "counselor", "evaluator", "program", "admin"],
    "eligibility.html": ["athlete", "parent", "counselor", "coach", "admin"],
    "readiness.html": ["athlete", "parent", "coach", "evaluator", "program", "admin"],
    "college-pathway.html": ["athlete", "parent", "counselor", "coach", "recruiter", "admin"],
    "multi-box.html": ["athlete", "parent", "coach", "counselor", "recruiter", "evaluator", "program", "admin"],
    "crystal-registry.html": ["athlete", "parent", "coach", "counselor", "recruiter", "evaluator", "program", "admin"]

  };

  /* ============================================================
     UTILITIES
  ============================================================ */

  function core(){
    return window.STATScoreCore || null;
  }

  function getCurrentPage(){

    const path = window.location.pathname || "";

    return (
      path.split("/").pop() ||
      "index.html"
    );

  }

  function normalizeRole(role){

    return String(role || "")
      .trim()
      .toLowerCase();

  }

  function getRole(){

    const c = core();

    return normalizeRole(
      c?.getRole?.() ||
      new URLSearchParams(window.location.search).get("role") ||
      localStorage.getItem("statscore_active_role_v1") ||
      ""
    );

  }

  function setRole(role){

    const c = core();

    const normalized = normalizeRole(role);

    if (!normalized) return "";

    c?.setRole?.(normalized);

    localStorage.setItem(
      "statscore_active_role_v1",
      normalized
    );

    return normalized;

  }

  function getSnapshotId(){

    const c = core();

    return (
      c?.getSnapshotId?.() ||
      new URLSearchParams(window.location.search).get("snapshot_id") ||
      ""
    );

  }

  function withSnapshot(url, snapshotId = getSnapshotId()){

    if (!snapshotId) return url;

    const separator =
      url.includes("?") ? "&" : "?";

    return `${url}${separator}snapshot_id=${encodeURIComponent(snapshotId)}`;

  }

  function routeForRole(role){

    const normalized = normalizeRole(role);

    return ROLE_ROUTES[normalized] || "login.html";

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

  /* ============================================================
     LOGIN ROUTING
  ============================================================ */

  function routeLogin(role, options = {}){

    const normalized = setRole(role);

    if (!normalized) {

      window.location.href = "login.html";
      return;

    }

    const destination = routeForRole(normalized);

    const includeSnapshot =
      options.includeSnapshot !== false;

    const finalUrl =
      includeSnapshot
        ? withSnapshot(destination, options.snapshot_id || getSnapshotId())
        : destination;

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

  /* ============================================================
     PROTECTED ROOM ENFORCEMENT
  ============================================================ */

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

        const safeRoute =
          routeForRole(role);

        window.location.href =
          withSnapshot(safeRoute);

      }

      return false;

    }

    return true;

  }

  function requireAdmin(){

    const role = getRole();

    if (role !== "admin") {

      window.location.href =
        withSnapshot(routeForRole(role || "athlete"));

      return false;

    }

    return true;

  }

  /* ============================================================
     ROOM NAVIGATION
  ============================================================ */

  function goToRoleRoom(role){

    const destination =
      routeForRole(role);

    window.location.href =
      withSnapshot(destination);

  }

  function goToProfile(snapshotId = getSnapshotId()){

    window.location.href =
      withSnapshot("player-profile.html", snapshotId);

  }

  function goToSnapshotIntake(){

    window.location.href =
      "snapshot-intake.html";

  }

  function goToVerification(snapshotId = getSnapshotId()){

    window.location.href =
      withSnapshot("verification.html", snapshotId);

  }

  function goToEligibility(snapshotId = getSnapshotId()){

    window.location.href =
      withSnapshot("eligibility.html", snapshotId);

  }

  function goToReadiness(snapshotId = getSnapshotId()){

    window.location.href =
      withSnapshot("readiness.html", snapshotId);

  }

  function goToMultiBox(snapshotId = getSnapshotId()){

    window.location.href =
      withSnapshot("multi-box.html", snapshotId);

  }

  function goToCrystal(snapshotId = getSnapshotId()){

    window.location.href =
      withSnapshot("crystal-registry.html", snapshotId);

  }

  /* ============================================================
     NAV LINK HYDRATION
  ============================================================ */

  function hydrateSnapshotLinks(){

    const snapshotId = getSnapshotId();

    if (!snapshotId) return;

    document.querySelectorAll("[data-snapshot-link]").forEach((el) => {

      const href =
        el.getAttribute("href") ||
        el.dataset.snapshotLink ||
        "";

      if (!href || href.includes("snapshot_id=")) return;

      el.setAttribute(
        "href",
        withSnapshot(href, snapshotId)
      );

    });

  }

  function markActiveNav(){

    const page = getCurrentPage();

    document.querySelectorAll("a").forEach((link) => {

      const href =
        link.getAttribute("href") || "";

      if (!href) return;

      const hrefPage =
        href.split("?")[0].split("/").pop();

      if (hrefPage === page) {
        link.classList.add("active");
      }

    });

  }

  /* ============================================================
     ROOM CONTEXT
  ============================================================ */

  function getRoomContext(){

    const role = getRole();
    const page = getCurrentPage();
    const snapshotId = getSnapshotId();

    return {

      role,
      page,
      snapshot_id:snapshotId,
      route:routeForRole(role),
      allowed_roles:allowedRolesForPage(page),
      can_access:canAccessPage(role, page)

    };

  }

  function exposeRoomContext(){

    window.STATScoreRoomContext =
      getRoomContext();

    return window.STATScoreRoomContext;

  }

  /* ============================================================
     INIT
  ============================================================ */

  function init(options = {}){

    if (options.enforce !== false) {
      enforceAccess(options);
    }

    hydrateSnapshotLinks();

    markActiveNav();

    exposeRoomContext();

    if (options.bindRoleButtons !== false) {
      bindRoleButtons();
    }

  }

  /* ============================================================
     PUBLIC EXPORTS
  ============================================================ */

  return {

    ROLE_ROUTES,
    PUBLIC_ROUTES,
    PROTECTED_ROUTES,

    getCurrentPage,
    normalizeRole,
    getRole,
    setRole,
    getSnapshotId,
    withSnapshot,

    routeForRole,
    isPublicRoute,
    allowedRolesForPage,
    canAccessPage,

    routeLogin,
    bindRoleButtons,

    enforceAccess,
    requireAdmin,

    goToRoleRoom,
    goToProfile,
    goToSnapshotIntake,
    goToVerification,
    goToEligibility,
    goToReadiness,
    goToMultiBox,
    goToCrystal,

    hydrateSnapshotLinks,
    markActiveNav,

    getRoomContext,
    exposeRoomContext,

    init

  };

})(); 
