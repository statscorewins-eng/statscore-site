/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-page-map.js

Asset Type:
JavaScript Infrastructure / Governed Page Registry Authority

Owner Authority:
STATS-CORE Enterprise Page Registry Authority

Primary Operational Authority:
STATS-CORE Enterprise Page Registry Authority

Layer:
Enterprise Infrastructure / Page Registration Governance

Runtime Consumer Boundary:
Consumed by the Routing Authority, Access Authority,
System Map, runtime loaders, health diagnostics, and
governed page consumers.

Primary Consumers:
- statscore-routing.js
- statscore-role-access.js
- statscore-system-map.js
- statscore-engine-registry.js
- statscore-engine-execution.js
- governed page runtime engines
- system.html
- runtime diagnostics

Purpose:
Defines the canonical registration, identity, ownership,
classification, and declared navigation metadata of verified
STATS-CORE HTML pages.

Provides:
- canonical page registration
- canonical page identity
- page ownership metadata
- access classification metadata
- runtime classification metadata
- declared navigation-target metadata
- verified dependency references
- registry validation
- registry health diagnostics
- immutable registry query services

Consumes:
- approved repository inventory
- approved Stream Registry
- approved authentication lifecycle doctrine
- approved runtime doctrine
- approved routing doctrine
- approved access-governance doctrine
- approved page ownership assignments

Primary IDs:
- page_id
- canonical_filename

Cross-Stream Dependencies:
May reference page ownership across all approved Streams.
May reference only repository-verified page and dependency assets.
May not implement another Stream's business logic.

Does NOT:
- authenticate users
- create Authentication Context
- create Runtime Context
- execute routing
- authorize navigation
- grant page access
- create role context
- manufacture page destinations
- infer repository files
- load scripts
- render HTML
- execute page runtime behavior
- calculate athlete intelligence
- create athlete source records
- send communications
- modify Supabase records
- create enterprise receipts
- register missing pages as active destinations

Status:
CONTROLLED V2 PAGE-AUTHORITY RECONSTRUCTION

==========================================================
*/

/*
============================================================
STATS-CORE™ Governed Page Registry Authority
File: statscore-page-map.js
Version: STATSCORE-PAGE-MAP-V2

Constitutional Sequence:

Repository-Verified HTML Asset
        ↓
Page Registry Authority
        ↓
Canonical Page Identity
        ↓
Ownership and Classification Metadata
        ↓
Access Authority Evaluation
        ↓
Routing Authority Execution
        ↓
Runtime/Page Consumer

Important:

This registry publishes destination metadata only.

declared_navigation_targets:
- describe known navigation relationships;
- do not authorize navigation;
- do not execute navigation;
- do not override Authentication Context;
- do not override Access Authority decisions;
- do not override Routing Authority.

A destination is active only when it is registered inside the
private VERIFIED_PAGE_REGISTRY.

Planned, missing, unverified, legacy, or deprecated pages must
not be returned by isRegisteredDestination().
============================================================
*/

(function () {
  "use strict";

  const ENGINE_ID = "statscore-page-map";
  const VERSION = "STATSCORE-PAGE-MAP-V2";
  const AUTHORITY_ID = "statscore-enterprise-page-registry";
  const AUTHORITY_TYPE = "GOVERNED_PAGE_REGISTRY_AUTHORITY";
  const REGISTRY_STATUS = "ACTIVE";
  const REGISTRY_SCOPE = "VERIFIED_REPOSITORY_PAGES_ONLY";

  /*
  ========================================================
  ENUMERATIONS
  ========================================================
  */

  const REGISTRATION_STATUS = deepFreeze({
    REGISTERED_EXISTING: "REGISTERED_EXISTING",
    REGISTERED_PLANNED: "REGISTERED_PLANNED",
    LEGACY_UNVERIFIED: "LEGACY_UNVERIFIED",
    DEPRECATED: "DEPRECATED",
    NOT_REGISTERED: "NOT_REGISTERED"
  });

  const REPOSITORY_STATUS = deepFreeze({
    VERIFIED_EXISTING: "VERIFIED_EXISTING",
    VERIFIED_ABSENT: "VERIFIED_ABSENT",
    UNVERIFIED: "UNVERIFIED"
  });

  const CONSTRUCTION_STATUS = deepFreeze({
    BUILT_SHELL: "BUILT_SHELL",
    PARTIAL: "PARTIAL",
    FUNCTIONAL_ACTIVATION_REQUIRED:
      "FUNCTIONAL_ACTIVATION_REQUIRED",
    FUNCTIONAL: "FUNCTIONAL",
    UNKNOWN: "UNKNOWN"
  });

  const AUDIT_STATUS = deepFreeze({
    PASS: "PASS",
    PASS_WITH_NON_BLOCKING_REFINEMENTS:
      "PASS_WITH_NON_BLOCKING_REFINEMENTS",
    PENDING: "PENDING",
    NOT_AUDITED: "NOT_AUDITED",
    FAILED: "FAILED"
  });

  const OPERATIONAL_STATUS = deepFreeze({
    ACTIVE: "ACTIVE",
    CONTROLLED_INSTALLATION: "CONTROLLED_INSTALLATION",
    FUNCTIONAL_ACTIVATION_PENDING:
      "FUNCTIONAL_ACTIVATION_PENDING",
    INACTIVE: "INACTIVE",
    UNKNOWN: "UNKNOWN"
  });

  const ACCESS_CLASS = deepFreeze({
    PUBLIC: "PUBLIC",
    AUTHENTICATED_INTAKE: "AUTHENTICATED_INTAKE",
    AUTHENTICATED_DASHBOARD: "AUTHENTICATED_DASHBOARD",
    GOVERNED_RESOURCE: "GOVERNED_RESOURCE",
    GOVERNED_COMMUNICATION: "GOVERNED_COMMUNICATION",
    GOVERNED_ADMINISTRATION: "GOVERNED_ADMINISTRATION"
  });

  const PAGE_TYPE = deepFreeze({
    PUBLIC_ENTRY_SURFACE: "PUBLIC_ENTRY_SURFACE",
    PUBLIC_AUTHENTICATION_SURFACE:
      "PUBLIC_AUTHENTICATION_SURFACE",
    PUBLIC_LEGAL_SURFACE: "PUBLIC_LEGAL_SURFACE",

    ATHLETE_SOURCE_RECORD_INTAKE:
      "ATHLETE_SOURCE_RECORD_INTAKE",
    ATHLETE_DASHBOARD: "ATHLETE_DASHBOARD",
    ATHLETE_INTELLIGENCE_PROFILE:
      "ATHLETE_INTELLIGENCE_PROFILE",

    PROFESSIONAL_ROLE_INTAKE:
      "PROFESSIONAL_ROLE_INTAKE",
    PROFESSIONAL_OPERATIONS_DASHBOARD:
      "PROFESSIONAL_OPERATIONS_DASHBOARD",
    PROFESSIONAL_ROLE_WORKSPACE:
      "PROFESSIONAL_ROLE_WORKSPACE",

    GOVERNED_COMMUNICATION_SURFACE:
      "GOVERNED_COMMUNICATION_SURFACE",

    VERIFICATION_REQUEST_SURFACE:
      "VERIFICATION_REQUEST_SURFACE",
    VERIFICATION_REVIEW_SURFACE:
      "VERIFICATION_REVIEW_SURFACE",

    ADMINISTRATION_SURFACE:
      "ADMINISTRATION_SURFACE"
  });

  const RUNTIME_CLASS = deepFreeze({
    PUBLIC_ENTRY_CONSUMER: "PUBLIC_ENTRY_CONSUMER",
    AUTHENTICATION_CONSUMER: "AUTHENTICATION_CONSUMER",
    PUBLIC_SUPPORT_CONSUMER: "PUBLIC_SUPPORT_CONSUMER",

    SOURCE_RECORD_RUNTIME_CONSUMER:
      "SOURCE_RECORD_RUNTIME_CONSUMER",
    ATHLETE_RUNTIME_CONSUMER:
      "ATHLETE_RUNTIME_CONSUMER",
    ATHLETE_INTELLIGENCE_CONSUMER:
      "ATHLETE_INTELLIGENCE_CONSUMER",

    PROFESSIONAL_INTAKE_RUNTIME_CONSUMER:
      "PROFESSIONAL_INTAKE_RUNTIME_CONSUMER",
    PROFESSIONAL_WORKSPACE_RUNTIME_CONSUMER:
      "PROFESSIONAL_WORKSPACE_RUNTIME_CONSUMER",

    COMMUNICATION_RUNTIME_CONSUMER:
      "COMMUNICATION_RUNTIME_CONSUMER",

    VERIFICATION_RUNTIME_CONSUMER:
      "VERIFICATION_RUNTIME_CONSUMER",

    SYSTEM_OPERATIONS_RUNTIME_CONSUMER:
      "SYSTEM_OPERATIONS_RUNTIME_CONSUMER"
  });

  const OWNER_STREAM = deepFreeze({
    STREAM_1: "STREAM_1_PUBLIC_ACCESS_LOGIN",
    STREAM_2: "STREAM_2_ATHLETE_SOURCE_RECORD",
    STREAM_3: "STREAM_3_ATHLETE_INTELLIGENCE",
    STREAM_4: "STREAM_4_PROFESSIONAL_ROLE_INTAKE",
    STREAM_5: "STREAM_5_PROFESSIONAL_OPERATIONS_DASHBOARD_CRM",
    STREAM_6: "STREAM_6_COMMUNICATION_GOVERNANCE",
    STREAM_8: "STREAM_8_SYSTEM_OPERATIONS_SELF_HEALING",
    STREAM_10: "STREAM_10_PROFESSIONAL_CERTIFICATION"
  });

  const OPERATIONAL_AUTHORITY = deepFreeze({
    PUBLIC_ACCESS_AUTHENTICATION:
      "STATS_CORE_PUBLIC_ACCESS_AUTHENTICATION_AUTHORITY",

    ATHLETE_SOURCE_RECORD:
      "STATS_CORE_ATHLETE_SOURCE_RECORD_AUTHORITY",

    ATHLETE_INTELLIGENCE:
      "STATS_CORE_ATHLETE_INTELLIGENCE_AUTHORITY",

    PROFESSIONAL_ROLE_INTAKE:
      "STATS_CORE_PROFESSIONAL_ROLE_INTAKE_AUTHORITY",

    PROFESSIONAL_OPERATIONS:
      "STATS_CORE_PROFESSIONAL_OPERATIONS_AUTHORITY",

    COMMUNICATION_GOVERNANCE:
      "STATS_CORE_COMMUNICATION_GOVERNANCE_AUTHORITY",

    VERIFICATION_GOVERNANCE:
      "STATS_CORE_VERIFICATION_GOVERNANCE_AUTHORITY",

    SYSTEM_OPERATIONS:
      "STATS_CORE_SYSTEM_OPERATIONS_AUTHORITY"
  });

  const SUPPORTED_ROLES = deepFreeze([
    "athlete",
    "parent",
    "coach",
    "counselor",
    "recruiter",
    "evaluator",
    "program",
    "trainer",
    "admin"
  ]);

  /*
  ========================================================
  REPOSITORY-VERIFIED DEPENDENCY CATALOG
  ========================================================

  Only dependencies established by the approved engineering
  record are registered as verified dependencies.

  Registry presence does not mean every dependency is active on
  every page. It establishes that the filename is recognized by
  this Page Registry Authority.
  ========================================================
  */

  const VERIFIED_DEPENDENCY_CATALOG = deepFreeze({
    "statscore-authentication-service.js": {
      dependency_id: "SC_DEP_AUTHENTICATION_SERVICE",
      authority_class: "AUTHENTICATION_AUTHORITY",
      owner_stream: OWNER_STREAM.STREAM_1
    },

    "statscore-authentication-context.js": {
      dependency_id: "SC_DEP_AUTHENTICATION_CONTEXT",
      authority_class: "AUTHENTICATION_CONTEXT_AUTHORITY",
      owner_stream: OWNER_STREAM.STREAM_1
    },

    "statscore-authentication-receipts.js": {
      dependency_id: "SC_DEP_AUTHENTICATION_RECEIPTS",
      authority_class: "AUTHENTICATION_RECEIPT_AUTHORITY",
      owner_stream: OWNER_STREAM.STREAM_1
    },

    "statscore-authentication-errors.js": {
      dependency_id: "SC_DEP_AUTHENTICATION_ERRORS",
      authority_class: "AUTHENTICATION_ERROR_AUTHORITY",
      owner_stream: OWNER_STREAM.STREAM_1
    },

    "statscore-demo-authentication-provider.js": {
      dependency_id: "SC_DEP_DEMO_AUTH_PROVIDER",
      authority_class: "DEMO_AUTHENTICATION_PROVIDER",
      owner_stream: OWNER_STREAM.STREAM_1
    },

    "statscore-routing.js": {
      dependency_id: "SC_DEP_ROUTING_AUTHORITY",
      authority_class: "ROUTING_AUTHORITY",
      owner_stream: OWNER_STREAM.STREAM_1
    },

    "statscore-role-access.js": {
      dependency_id: "SC_DEP_ROLE_ACCESS_AUTHORITY",
      authority_class: "ACCESS_AUTHORITY",
      owner_stream: OWNER_STREAM.STREAM_1
    },

    "statscore-runtime-state-engine.js": {
      dependency_id: "SC_DEP_RUNTIME_STATE_ENGINE",
      authority_class: "RUNTIME_AUTHORITY_CONSUMER",
      owner_stream: OWNER_STREAM.STREAM_8
    },

    "statscore-snapshot-intake-engine.js": {
      dependency_id: "SC_DEP_SNAPSHOT_INTAKE_ENGINE",
      authority_class: "ATHLETE_SOURCE_RECORD_INTAKE_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_2
    },

    "statscore-athlete-dashboard-engine.js": {
      dependency_id: "SC_DEP_ATHLETE_DASHBOARD_ENGINE",
      authority_class: "ATHLETE_DASHBOARD_RUNTIME_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_3
    },

    "statscore-role-dashboard-intake-engine.js": {
      dependency_id: "SC_DEP_ROLE_DASHBOARD_INTAKE_ENGINE",
      authority_class: "PROFESSIONAL_ROLE_INTAKE_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_4
    },

    "statscore-doctrine.js": {
      dependency_id: "SC_DEP_INTELLIGENCE_DOCTRINE",
      authority_class: "ATHLETE_INTELLIGENCE_DOCTRINE",
      owner_stream: OWNER_STREAM.STREAM_3
    },

    "statscore-engine-registry.js": {
      dependency_id: "SC_DEP_ENGINE_REGISTRY",
      authority_class: "ENGINE_REGISTRY",
      owner_stream: OWNER_STREAM.STREAM_3
    },

    "statscore-engine-execution.js": {
      dependency_id: "SC_DEP_ENGINE_EXECUTION",
      authority_class: "ENGINE_EXECUTION_COORDINATOR",
      owner_stream: OWNER_STREAM.STREAM_3
    },

    "statscore-production-matrix.js": {
      dependency_id: "SC_DEP_PRODUCTION_MATRIX",
      authority_class: "ATHLETE_PRODUCTION_INTELLIGENCE",
      owner_stream: OWNER_STREAM.STREAM_3
    },

    "statscore-intelligence-doctrine.js": {
      dependency_id: "SC_DEP_INTELLIGENCE_AUTHORITY_DOCTRINE",
      authority_class: "INTELLIGENCE_AUTHORITY_DOCTRINE",
      owner_stream: OWNER_STREAM.STREAM_3
    },

    "statscore-score-doctrine.js": {
      dependency_id: "SC_DEP_SCORE_DOCTRINE",
      authority_class: "SCORE_DOCTRINE",
      owner_stream: "STREAM_9_SCORE_AUTHORITY"
    },

    "statscore-matrix-doctrine.js": {
      dependency_id: "SC_DEP_MATRIX_DOCTRINE",
      authority_class: "MATRIX_DOCTRINE",
      owner_stream: "STREAM_9_SCORE_AUTHORITY"
    },

    "statscore-matrix-registry.js": {
      dependency_id: "SC_DEP_MATRIX_REGISTRY",
      authority_class: "MATRIX_REGISTRY",
      owner_stream: "STREAM_9_SCORE_AUTHORITY"
    },

    "statscore-verification-engine.js": {
      dependency_id: "SC_DEP_VERIFICATION_ENGINE",
      authority_class: "VERIFICATION_AUTHORITY_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_10
    },

    "statscore-communication-engine.js": {
      dependency_id: "SC_DEP_COMMUNICATION_ENGINE",
      authority_class: "COMMUNICATION_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_6
    },

    "statscore-multibox-governance-engine.js": {
      dependency_id: "SC_DEP_MULTIBOX_GOVERNANCE_ENGINE",
      authority_class: "MULTIBOX_GOVERNANCE_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_6
    },

    "sc-receipt-ledger-engine.js": {
      dependency_id: "SC_DEP_RECEIPT_LEDGER_ENGINE",
      authority_class: "COMMUNICATION_RECEIPT_LEDGER",
      owner_stream: OWNER_STREAM.STREAM_6
    },

    "statscore-phnx-media-engine.js": {
      dependency_id: "SC_DEP_PHNX_MEDIA_ENGINE",
      authority_class: "PHNX_MEDIA_ENGINE",
      owner_stream: "STREAM_7_CRYSTAL_EXPOSURE_MEDIA"
    },

    "statscore-system-map.js": {
      dependency_id: "SC_DEP_SYSTEM_MAP",
      authority_class: "SYSTEM_REGISTRY_AUTHORITY",
      owner_stream: OWNER_STREAM.STREAM_8
    },

    "statscore-page-map.js": {
      dependency_id: "SC_DEP_PAGE_MAP",
      authority_class: "PAGE_REGISTRY_AUTHORITY",
      owner_stream: "ENTERPRISE_PAGE_REGISTRY_AUTHORITY"
    }
  });

  /*
  ========================================================
  REQUIRED VERIFIED PAGE SET
  ========================================================

  This is the approved existing repository page inventory
  available to this reconstruction.

  A missing entry causes registry validation failure.
  ========================================================
  */

  const REQUIRED_REGISTERED_FILENAMES = deepFreeze([
    "index.html",
    "login.html",
    "snapshot-intake.html",
    "athlete-dashboard.html",
    "player-profile.html",
    "role-dashboard-intake.html",
    "role-dashboard.html",
    "parent.html",
    "coach.html",
    "counselor.html",
    "evaluator.html",
    "trainer.html",
    "recruiter-access.html",
    "program.html",
    "multi-box.html",
    "system.html",
    "terms.html",
    "verification-request.html",
    "verification-review.html"
  ]);

  /*
  ========================================================
  PRIVATE VERIFIED PAGE REGISTRY
  ========================================================

  declared_navigation_targets:
  Metadata only. These targets do not authorize navigation.

  verified_dependencies:
  Repository-confirmed dependency filenames only.

  resource_context:
  Describes the governed identifiers commonly consumed by the
  page. It does not establish authority over those identifiers.
  ========================================================
  */

  const VERIFIED_PAGE_REGISTRY = deepFreeze({
    "index.html": {
      page_id: "SC_PAGE_PUBLIC_INDEX",
      canonical_filename: "index.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.BUILT_SHELL,
      audit_status: AUDIT_STATUS.PASS,
      operational_status: OPERATIONAL_STATUS.ACTIVE,

      page_type: PAGE_TYPE.PUBLIC_ENTRY_SURFACE,
      access_class: ACCESS_CLASS.PUBLIC,
      runtime_class: RUNTIME_CLASS.PUBLIC_ENTRY_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_1,
      operational_authority:
        OPERATIONAL_AUTHORITY.PUBLIC_ACCESS_AUTHENTICATION,

      purpose:
        "Public STATS-CORE entry surface that introduces the system and exposes the governed login destination.",

      declared_navigation_targets: [
        "login.html",
        "terms.html"
      ],

      verified_dependencies: [
        "statscore-page-map.js"
      ],

      supported_roles: [],
      resource_context: [],

      lifecycle_notes:
        "Public entry only. Authentication begins through login.html."
    },

    "login.html": {
      page_id: "SC_PAGE_LOGIN",
      canonical_filename: "login.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.BUILT_SHELL,
      audit_status: AUDIT_STATUS.PASS,
      operational_status:
        OPERATIONAL_STATUS.CONTROLLED_INSTALLATION,

      page_type:
        PAGE_TYPE.PUBLIC_AUTHENTICATION_SURFACE,
      access_class: ACCESS_CLASS.PUBLIC,
      runtime_class: RUNTIME_CLASS.AUTHENTICATION_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_1,
      operational_authority:
        OPERATIONAL_AUTHORITY.PUBLIC_ACCESS_AUTHENTICATION,

      purpose:
        "Public authentication surface that submits credentials to the Authentication Authority and consumes the resulting authorized destination.",

      declared_navigation_targets: [
        "snapshot-intake.html",
        "athlete-dashboard.html",
        "role-dashboard-intake.html",
        "role-dashboard.html",
        "system.html"
      ],

      verified_dependencies: [
        "statscore-authentication-service.js",
        "statscore-authentication-context.js",
        "statscore-authentication-receipts.js",
        "statscore-authentication-errors.js",
        "statscore-demo-authentication-provider.js",
        "statscore-routing.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "athlete",
        "parent",
        "coach",
        "counselor",
        "recruiter",
        "evaluator",
        "program",
        "trainer",
        "admin"
      ],

      resource_context: [],

      lifecycle_notes:
        "First-time athlete routes to Snapshot Intake. Returning athlete routes to Athlete Dashboard. First-time professional routes to Role Dashboard Intake. Returning professional routes to Role Dashboard. Administrator routes to system.html."
    },

    "terms.html": {
      page_id: "SC_PAGE_TERMS",
      canonical_filename: "terms.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.BUILT_SHELL,
      audit_status: AUDIT_STATUS.PASS,
      operational_status: OPERATIONAL_STATUS.ACTIVE,

      page_type: PAGE_TYPE.PUBLIC_LEGAL_SURFACE,
      access_class: ACCESS_CLASS.PUBLIC,
      runtime_class: RUNTIME_CLASS.PUBLIC_SUPPORT_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_1,
      operational_authority:
        OPERATIONAL_AUTHORITY.PUBLIC_ACCESS_AUTHENTICATION,

      purpose:
        "Public terms and conditions surface for STATS-CORE use.",

      declared_navigation_targets: [
        "index.html",
        "login.html"
      ],

      verified_dependencies: [
        "statscore-page-map.js"
      ],

      supported_roles: [],
      resource_context: [],

      lifecycle_notes:
        "Public support page. It does not participate in authentication or runtime creation."
    },

    "snapshot-intake.html": {
      page_id: "SC_PAGE_SNAPSHOT_INTAKE",
      canonical_filename: "snapshot-intake.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type:
        PAGE_TYPE.ATHLETE_SOURCE_RECORD_INTAKE,
      access_class: ACCESS_CLASS.AUTHENTICATED_INTAKE,
      runtime_class:
        RUNTIME_CLASS.SOURCE_RECORD_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_2,
      operational_authority:
        OPERATIONAL_AUTHORITY.ATHLETE_SOURCE_RECORD,

      purpose:
        "Governed athlete source-record intake and maintenance surface through which Stream 2 services establish or maintain athlete and snapshot records.",

      declared_navigation_targets: [
        "athlete-dashboard.html"
      ],

      verified_dependencies: [
        "statscore-snapshot-intake-engine.js",
        "statscore-routing.js",
        "statscore-role-access.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "athlete"
      ],

      resource_context: [
        "runtime_id",
        "athlete_id",
        "snapshot_id"
      ],

      lifecycle_notes:
        "First-time athlete intake may begin before athlete_id and snapshot_id exist. Stream 2 establishes governed source-record identifiers. Completion routes to athlete-dashboard.html."
    },

    "athlete-dashboard.html": {
      page_id: "SC_PAGE_ATHLETE_DASHBOARD",
      canonical_filename: "athlete-dashboard.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type: PAGE_TYPE.ATHLETE_DASHBOARD,
      access_class: ACCESS_CLASS.AUTHENTICATED_DASHBOARD,
      runtime_class: RUNTIME_CLASS.ATHLETE_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_3,
      operational_authority:
        OPERATIONAL_AUTHORITY.ATHLETE_INTELLIGENCE,

      purpose:
        "Athlete navigation and awareness dashboard that consumes governed intelligence and routes users to deeper resource surfaces.",

      declared_navigation_targets: [
        "snapshot-intake.html",
        "player-profile.html",
        "verification-request.html",
        "multi-box.html"
      ],

      verified_dependencies: [
        "statscore-athlete-dashboard-engine.js",
        "statscore-doctrine.js",
        "statscore-engine-registry.js",
        "statscore-engine-execution.js",
        "statscore-production-matrix.js",
        "statscore-routing.js",
        "statscore-role-access.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "athlete",
        "parent",
        "coach",
        "counselor",
        "recruiter",
        "evaluator",
        "program",
        "trainer",
        "admin"
      ],

      resource_context: [
        "runtime_id",
        "athlete_id",
        "snapshot_id"
      ],

      lifecycle_notes:
        "Returning athletes enter here. Snapshot Intake is a governed maintenance destination entered from this dashboard. The dashboard consumes intelligence; it does not own or calculate intelligence."
    },

    "player-profile.html": {
      page_id: "SC_PAGE_PLAYER_PROFILE",
      canonical_filename: "player-profile.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type:
        PAGE_TYPE.ATHLETE_INTELLIGENCE_PROFILE,
      access_class: ACCESS_CLASS.GOVERNED_RESOURCE,
      runtime_class:
        RUNTIME_CLASS.ATHLETE_INTELLIGENCE_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_3,
      operational_authority:
        OPERATIONAL_AUTHORITY.ATHLETE_INTELLIGENCE,

      purpose:
        "Explainable athlete intelligence surface that consumes governed source records, matrices, engine outputs, and resource access determinations.",

      declared_navigation_targets: [
        "athlete-dashboard.html",
        "verification-request.html",
        "multi-box.html"
      ],

      verified_dependencies: [
        "statscore-doctrine.js",
        "statscore-engine-registry.js",
        "statscore-engine-execution.js",
        "statscore-production-matrix.js",
        "statscore-intelligence-doctrine.js",
        "statscore-score-doctrine.js",
        "statscore-matrix-doctrine.js",
        "statscore-matrix-registry.js",
        "statscore-routing.js",
        "statscore-role-access.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "athlete",
        "parent",
        "coach",
        "counselor",
        "recruiter",
        "evaluator",
        "program",
        "trainer",
        "admin"
      ],

      resource_context: [
        "runtime_id",
        "athlete_id",
        "snapshot_id"
      ],

      lifecycle_notes:
        "Deep intelligence surface. Access depends on governed athlete-resource authority and applicable role/workspace constraints."
    },

    "role-dashboard-intake.html": {
      page_id: "SC_PAGE_ROLE_DASHBOARD_INTAKE",
      canonical_filename: "role-dashboard-intake.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type: PAGE_TYPE.PROFESSIONAL_ROLE_INTAKE,
      access_class: ACCESS_CLASS.AUTHENTICATED_INTAKE,
      runtime_class:
        RUNTIME_CLASS.PROFESSIONAL_INTAKE_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_4,
      operational_authority:
        OPERATIONAL_AUTHORITY.PROFESSIONAL_ROLE_INTAKE,

      purpose:
        "First-time professional intake surface that establishes or completes governed professional identity, role context, specialization, and workspace preparation.",

      declared_navigation_targets: [
        "role-dashboard.html"
      ],

      verified_dependencies: [
        "statscore-role-dashboard-intake-engine.js",
        "statscore-routing.js",
        "statscore-role-access.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "parent",
        "coach",
        "counselor",
        "recruiter",
        "evaluator",
        "program",
        "trainer"
      ],

      resource_context: [
        "runtime_id",
        "role_id",
        "workspace_id"
      ],

      lifecycle_notes:
        "Only first-time professionals enter this intake. Returning professionals route directly to role-dashboard.html. Intake may begin before role_id and active_workspace_id exist."
    },

    "role-dashboard.html": {
      page_id: "SC_PAGE_ROLE_DASHBOARD",
      canonical_filename: "role-dashboard.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type:
        PAGE_TYPE.PROFESSIONAL_OPERATIONS_DASHBOARD,
      access_class: ACCESS_CLASS.AUTHENTICATED_DASHBOARD,
      runtime_class:
        RUNTIME_CLASS.PROFESSIONAL_WORKSPACE_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_5,
      operational_authority:
        OPERATIONAL_AUTHORITY.PROFESSIONAL_OPERATIONS,

      purpose:
        "Shared governed professional operations dashboard that consumes active professional workspace context and exposes authorized role-specific modules.",

      declared_navigation_targets: [
        "parent.html",
        "coach.html",
        "counselor.html",
        "recruiter-access.html",
        "evaluator.html",
        "program.html",
        "trainer.html",
        "multi-box.html"
      ],

      verified_dependencies: [
        "statscore-routing.js",
        "statscore-role-access.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "parent",
        "coach",
        "counselor",
        "recruiter",
        "evaluator",
        "program",
        "trainer"
      ],

      resource_context: [
        "runtime_id",
        "role_id",
        "workspace_id"
      ],

      lifecycle_notes:
        "Returning professionals enter this dashboard directly. Runtime restores the active workspace. Stream 1 does not restore professional workspaces."
    },

    "parent.html": {
      page_id: "SC_PAGE_PARENT_WORKSPACE",
      canonical_filename: "parent.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type: PAGE_TYPE.PROFESSIONAL_ROLE_WORKSPACE,
      access_class: ACCESS_CLASS.GOVERNED_RESOURCE,
      runtime_class:
        RUNTIME_CLASS.PROFESSIONAL_WORKSPACE_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_5,
      operational_authority:
        OPERATIONAL_AUTHORITY.PROFESSIONAL_OPERATIONS,

      purpose:
        "Parent or guardian professional workspace surface for governed athlete oversight and permitted lifecycle actions.",

      declared_navigation_targets: [
        "role-dashboard.html",
        "player-profile.html",
        "verification-request.html",
        "multi-box.html"
      ],

      verified_dependencies: [
        "statscore-role-access.js",
        "statscore-routing.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "parent"
      ],

      resource_context: [
        "runtime_id",
        "role_id",
        "workspace_id",
        "athlete_id",
        "snapshot_id"
      ],

      lifecycle_notes:
        "Consumes governed parent workspace and assigned-athlete context. Parent authority is not inferred from role alone."
    },

    "coach.html": {
      page_id: "SC_PAGE_COACH_WORKSPACE",
      canonical_filename: "coach.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type: PAGE_TYPE.PROFESSIONAL_ROLE_WORKSPACE,
      access_class: ACCESS_CLASS.GOVERNED_RESOURCE,
      runtime_class:
        RUNTIME_CLASS.PROFESSIONAL_WORKSPACE_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_5,
      operational_authority:
        OPERATIONAL_AUTHORITY.PROFESSIONAL_OPERATIONS,

      purpose:
        "Coach professional workspace surface for governed athlete contribution, development evidence, and permitted verification support.",

      declared_navigation_targets: [
        "role-dashboard.html",
        "player-profile.html",
        "verification-request.html",
        "multi-box.html"
      ],

      verified_dependencies: [
        "statscore-verification-engine.js",
        "statscore-role-access.js",
        "statscore-routing.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "coach"
      ],

      resource_context: [
        "runtime_id",
        "role_id",
        "workspace_id",
        "athlete_id",
        "snapshot_id"
      ],

      lifecycle_notes:
        "Coach is a governed contributor and consumer, not the athlete source-record or intelligence authority."
    },

    "counselor.html": {
      page_id: "SC_PAGE_COUNSELOR_WORKSPACE",
      canonical_filename: "counselor.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type: PAGE_TYPE.PROFESSIONAL_ROLE_WORKSPACE,
      access_class: ACCESS_CLASS.GOVERNED_RESOURCE,
      runtime_class:
        RUNTIME_CLASS.PROFESSIONAL_WORKSPACE_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_5,
      operational_authority:
        OPERATIONAL_AUTHORITY.PROFESSIONAL_OPERATIONS,

      purpose:
        "Counselor professional workspace surface for governed academic support, eligibility evidence, and assigned-athlete operations.",

      declared_navigation_targets: [
        "role-dashboard.html",
        "player-profile.html",
        "verification-request.html",
        "multi-box.html"
      ],

      verified_dependencies: [
        "statscore-role-access.js",
        "statscore-verification-engine.js",
        "statscore-routing.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "counselor"
      ],

      resource_context: [
        "runtime_id",
        "role_id",
        "workspace_id",
        "athlete_id",
        "snapshot_id"
      ],

      lifecycle_notes:
        "Consumes governed counselor workspace and assigned-athlete context."
    },

    "recruiter-access.html": {
      page_id: "SC_PAGE_RECRUITER_ACCESS",
      canonical_filename: "recruiter-access.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type: PAGE_TYPE.PROFESSIONAL_ROLE_WORKSPACE,
      access_class: ACCESS_CLASS.GOVERNED_RESOURCE,
      runtime_class:
        RUNTIME_CLASS.PROFESSIONAL_WORKSPACE_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_5,
      operational_authority:
        OPERATIONAL_AUTHORITY.PROFESSIONAL_OPERATIONS,

      purpose:
        "Recruiter workspace and athlete-profile access surface governed by workspace, release, visibility, credential, and athlete-resource authority.",

      declared_navigation_targets: [
        "role-dashboard.html",
        "player-profile.html",
        "multi-box.html"
      ],

      verified_dependencies: [
        "statscore-role-access.js",
        "statscore-routing.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "recruiter"
      ],

      resource_context: [
        "runtime_id",
        "role_id",
        "workspace_id",
        "athlete_id",
        "snapshot_id"
      ],

      lifecycle_notes:
        "Recruiter role alone does not grant athlete access. An affirmative governed resource decision is required."
    },

    "evaluator.html": {
      page_id: "SC_PAGE_EVALUATOR_WORKSPACE",
      canonical_filename: "evaluator.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type: PAGE_TYPE.PROFESSIONAL_ROLE_WORKSPACE,
      access_class: ACCESS_CLASS.GOVERNED_RESOURCE,
      runtime_class:
        RUNTIME_CLASS.PROFESSIONAL_WORKSPACE_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_5,
      operational_authority:
        OPERATIONAL_AUTHORITY.PROFESSIONAL_OPERATIONS,

      purpose:
        "Evaluator professional workspace surface for governed evidence review, independent evaluation, and verification operations.",

      declared_navigation_targets: [
        "role-dashboard.html",
        "player-profile.html",
        "verification-review.html",
        "multi-box.html"
      ],

      verified_dependencies: [
        "statscore-verification-engine.js",
        "statscore-role-access.js",
        "statscore-routing.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "evaluator"
      ],

      resource_context: [
        "runtime_id",
        "role_id",
        "workspace_id",
        "athlete_id",
        "snapshot_id"
      ],

      lifecycle_notes:
        "Evaluator access remains resource-bound and does not create unrestricted athlete or verification authority."
    },

    "program.html": {
      page_id: "SC_PAGE_PROGRAM_WORKSPACE",
      canonical_filename: "program.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type: PAGE_TYPE.PROFESSIONAL_ROLE_WORKSPACE,
      access_class: ACCESS_CLASS.GOVERNED_RESOURCE,
      runtime_class:
        RUNTIME_CLASS.PROFESSIONAL_WORKSPACE_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_5,
      operational_authority:
        OPERATIONAL_AUTHORITY.PROFESSIONAL_OPERATIONS,

      purpose:
        "Program professional workspace surface for governed program operations, assigned athlete context, and authorized intelligence consumption.",

      declared_navigation_targets: [
        "role-dashboard.html",
        "player-profile.html",
        "verification-request.html",
        "multi-box.html"
      ],

      verified_dependencies: [
        "statscore-role-access.js",
        "statscore-routing.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "program"
      ],

      resource_context: [
        "runtime_id",
        "role_id",
        "workspace_id",
        "athlete_id",
        "snapshot_id",
        "organization_id"
      ],

      lifecycle_notes:
        "Program access is governed by active workspace, organization, population assignment, and resource authority."
    },

    "trainer.html": {
      page_id: "SC_PAGE_TRAINER_WORKSPACE",
      canonical_filename: "trainer.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type: PAGE_TYPE.PROFESSIONAL_ROLE_WORKSPACE,
      access_class: ACCESS_CLASS.GOVERNED_RESOURCE,
      runtime_class:
        RUNTIME_CLASS.PROFESSIONAL_WORKSPACE_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_5,
      operational_authority:
        OPERATIONAL_AUTHORITY.PROFESSIONAL_OPERATIONS,

      purpose:
        "Trainer professional workspace surface for governed development planning, evidence contribution, and assigned-athlete operations.",

      declared_navigation_targets: [
        "role-dashboard.html",
        "player-profile.html",
        "verification-request.html",
        "multi-box.html"
      ],

      verified_dependencies: [
        "statscore-role-access.js",
        "statscore-routing.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "trainer"
      ],

      resource_context: [
        "runtime_id",
        "role_id",
        "workspace_id",
        "athlete_id",
        "snapshot_id"
      ],

      lifecycle_notes:
        "Trainer is a canonical professional role and must remain registered in professional workspace navigation metadata."
    },

    "multi-box.html": {
      page_id: "SC_PAGE_MULTI_BOX",
      canonical_filename: "multi-box.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type:
        PAGE_TYPE.GOVERNED_COMMUNICATION_SURFACE,
      access_class: ACCESS_CLASS.GOVERNED_COMMUNICATION,
      runtime_class:
        RUNTIME_CLASS.COMMUNICATION_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_6,
      operational_authority:
        OPERATIONAL_AUTHORITY.COMMUNICATION_GOVERNANCE,

      purpose:
        "Governed role-to-role communication surface that consumes authenticated sender identity and Stream 6 communication-policy decisions.",

      declared_navigation_targets: [
        "athlete-dashboard.html",
        "role-dashboard.html",
        "player-profile.html"
      ],

      verified_dependencies: [
        "statscore-communication-engine.js",
        "statscore-multibox-governance-engine.js",
        "sc-receipt-ledger-engine.js",
        "statscore-role-access.js",
        "statscore-routing.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "athlete",
        "parent",
        "coach",
        "counselor",
        "recruiter",
        "evaluator",
        "program",
        "trainer",
        "admin"
      ],

      resource_context: [
        "runtime_id",
        "role_id",
        "workspace_id",
        "athlete_id",
        "snapshot_id"
      ],

      lifecycle_notes:
        "Multi-Box is a communication surface, not a dashboard. Sender identity is locked to governed runtime context. Stream 6 determines target eligibility, communication windows, guardian gating, and receipts."
    },

    "verification-request.html": {
      page_id: "SC_PAGE_VERIFICATION_REQUEST",
      canonical_filename: "verification-request.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type:
        PAGE_TYPE.VERIFICATION_REQUEST_SURFACE,
      access_class: ACCESS_CLASS.GOVERNED_RESOURCE,
      runtime_class:
        RUNTIME_CLASS.VERIFICATION_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_10,
      operational_authority:
        OPERATIONAL_AUTHORITY.VERIFICATION_GOVERNANCE,

      purpose:
        "Governed verification-request surface for submitting eligible athlete evidence or claims into the verification lifecycle.",

      declared_navigation_targets: [
        "athlete-dashboard.html",
        "player-profile.html",
        "role-dashboard.html"
      ],

      verified_dependencies: [
        "statscore-verification-engine.js",
        "statscore-role-access.js",
        "statscore-routing.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "athlete",
        "parent",
        "coach",
        "counselor",
        "evaluator",
        "program",
        "trainer",
        "admin"
      ],

      resource_context: [
        "runtime_id",
        "athlete_id",
        "snapshot_id"
      ],

      lifecycle_notes:
        "Requesting verification is distinct from reviewing or approving verification."
    },

    "verification-review.html": {
      page_id: "SC_PAGE_VERIFICATION_REVIEW",
      canonical_filename: "verification-review.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type:
        PAGE_TYPE.VERIFICATION_REVIEW_SURFACE,
      access_class: ACCESS_CLASS.GOVERNED_RESOURCE,
      runtime_class:
        RUNTIME_CLASS.VERIFICATION_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_10,
      operational_authority:
        OPERATIONAL_AUTHORITY.VERIFICATION_GOVERNANCE,

      purpose:
        "Governed verification-review surface for constitutionally authorized evaluators and administrators.",

      declared_navigation_targets: [
        "evaluator.html",
        "system.html",
        "player-profile.html"
      ],

      verified_dependencies: [
        "statscore-verification-engine.js",
        "statscore-role-access.js",
        "statscore-routing.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "evaluator",
        "admin"
      ],

      resource_context: [
        "runtime_id",
        "athlete_id",
        "snapshot_id"
      ],

      lifecycle_notes:
        "Verification review authority is distinct from verification-request authority and requires a governed review decision."
    },

    "system.html": {
      page_id: "SC_PAGE_SYSTEM_ADMINISTRATION",
      canonical_filename: "system.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_EXISTING,
      repository_status:
        REPOSITORY_STATUS.VERIFIED_EXISTING,
      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,
      audit_status: AUDIT_STATUS.PENDING,
      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      page_type: PAGE_TYPE.ADMINISTRATION_SURFACE,
      access_class: ACCESS_CLASS.GOVERNED_ADMINISTRATION,
      runtime_class:
        RUNTIME_CLASS.SYSTEM_OPERATIONS_RUNTIME_CONSUMER,

      owner_stream: OWNER_STREAM.STREAM_8,
      operational_authority:
        OPERATIONAL_AUTHORITY.SYSTEM_OPERATIONS,

      purpose:
        "Governed administrative and system-operations surface for authorized STATS-CORE back-office functions.",

      declared_navigation_targets: [
        "login.html",
        "verification-review.html",
        "multi-box.html"
      ],

      verified_dependencies: [
        "statscore-system-map.js",
        "statscore-engine-registry.js",
        "statscore-role-access.js",
        "statscore-routing.js",
        "statscore-runtime-state-engine.js",
        "statscore-page-map.js"
      ],

      supported_roles: [
        "admin"
      ],

      resource_context: [
        "runtime_id"
      ],

      lifecycle_notes:
        "Administrator access is governed and is not a universal override. system.html is not the Athlete Dashboard."
    }
  });

  /*
  ========================================================
  NON-ACTIVE REGISTRIES
  ========================================================

  These structures remain empty until repository evidence and
  formal governance approval establish additional pages.

  Entries in these registries are never active destinations.
  ========================================================
  */

  const PLANNED_PAGE_REGISTRY = deepFreeze({});
  const LEGACY_UNVERIFIED_PAGE_REGISTRY = deepFreeze({});
  const DEPRECATED_PAGE_REGISTRY = deepFreeze({});

  /*
  ========================================================
  VALIDATION RULES
  ========================================================
  */

  const REQUIRED_PAGE_FIELDS = deepFreeze([
    "page_id",
    "canonical_filename",
    "registration_status",
    "repository_status",
    "construction_status",
    "audit_status",
    "operational_status",
    "page_type",
    "access_class",
    "runtime_class",
    "owner_stream",
    "operational_authority",
    "purpose",
    "declared_navigation_targets",
    "verified_dependencies",
    "supported_roles",
    "resource_context",
    "lifecycle_notes"
  ]);

  const VALID_HTML_FILENAME_PATTERN =
    /^[a-z0-9][a-z0-9-]*\.html$/;

  const VALID_DEPENDENCY_FILENAME_PATTERN =
    /^[a-z0-9][a-z0-9-]*\.js$/;

  const STATE = {
    loaded_at: null,
    validation: null,
    health: null
  };

  /*
  ========================================================
  UTILITIES
  ========================================================
  */

  function deepFreeze(value) {
    if (
      value === null ||
      typeof value !== "object" ||
      Object.isFrozen(value)
    ) {
      return value;
    }

    Object.getOwnPropertyNames(value).forEach(key => {
      deepFreeze(value[key]);
    });

    return Object.freeze(value);
  }

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(JSON.stringify(value));
    }
  }

  function clean(value) {
    return String(value ?? "").trim();
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function normalizeFilename(value) {
    const raw = clean(value);

    if (!raw) {
      return "";
    }

    let url;

    try {
      url = new URL(raw, window.location.href);
    } catch (_) {
      return raw.toLowerCase();
    }

    if (url.origin !== window.location.origin) {
      return "";
    }

    return (
      url.pathname
        .split("/")
        .filter(Boolean)
        .pop() || "index.html"
    ).toLowerCase();
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function getCurrentFilename() {
    return normalizeFilename(window.location.href);
  }

  function isKnownRole(role) {
    return SUPPORTED_ROLES.includes(
      clean(role).toLowerCase()
    );
  }

  function isVerifiedDependency(filename) {
    return Object.prototype.hasOwnProperty.call(
      VERIFIED_DEPENDENCY_CATALOG,
      clean(filename)
    );
  }

  /*
  ========================================================
  REGISTRY QUERY AUTHORITY
  ========================================================
  */

  function isRegisteredDestination(destination) {
    const filename = normalizeFilename(destination);

    if (!filename) {
      return false;
    }

    return Object.prototype.hasOwnProperty.call(
      VERIFIED_PAGE_REGISTRY,
      filename
    );
  }

  function isPlannedDestination(destination) {
    const filename = normalizeFilename(destination);

    if (!filename) {
      return false;
    }

    return Object.prototype.hasOwnProperty.call(
      PLANNED_PAGE_REGISTRY,
      filename
    );
  }

  function isLegacyUnverifiedDestination(destination) {
    const filename = normalizeFilename(destination);

    if (!filename) {
      return false;
    }

    return Object.prototype.hasOwnProperty.call(
      LEGACY_UNVERIFIED_PAGE_REGISTRY,
      filename
    );
  }

  function isDeprecatedDestination(destination) {
    const filename = normalizeFilename(destination);

    if (!filename) {
      return false;
    }

    return Object.prototype.hasOwnProperty.call(
      DEPRECATED_PAGE_REGISTRY,
      filename
    );
  }

  function getPage(destination) {
    const filename = normalizeFilename(destination);

    if (!filename) {
      return null;
    }

    return clone(
      VERIFIED_PAGE_REGISTRY[filename] || null
    );
  }

  function getPageById(pageId) {
    const targetId = clean(pageId);

    if (!targetId) {
      return null;
    }

    const page = Object.values(
      VERIFIED_PAGE_REGISTRY
    ).find(entry => entry.page_id === targetId);

    return clone(page || null);
  }

  function getRegisteredPages() {
    return clone(
      Object.values(VERIFIED_PAGE_REGISTRY)
    );
  }

  function getRegisteredFilenames() {
    return Object.keys(VERIFIED_PAGE_REGISTRY);
  }

  function getRegisteredPageCount() {
    return Object.keys(VERIFIED_PAGE_REGISTRY).length;
  }

  function getPagesByOwner(ownerStream) {
    const owner = clean(ownerStream);

    return clone(
      Object.values(VERIFIED_PAGE_REGISTRY)
        .filter(page => page.owner_stream === owner)
    );
  }

  function getPagesByOperationalAuthority(authority) {
    const target = clean(authority);

    return clone(
      Object.values(VERIFIED_PAGE_REGISTRY)
        .filter(
          page =>
            page.operational_authority === target
        )
    );
  }

  function getPagesByType(pageType) {
    const target = clean(pageType);

    return clone(
      Object.values(VERIFIED_PAGE_REGISTRY)
        .filter(page => page.page_type === target)
    );
  }

  function getPagesByAccessClass(accessClass) {
    const target = clean(accessClass);

    return clone(
      Object.values(VERIFIED_PAGE_REGISTRY)
        .filter(page => page.access_class === target)
    );
  }

  function getPagesByRuntimeClass(runtimeClass) {
    const target = clean(runtimeClass);

    return clone(
      Object.values(VERIFIED_PAGE_REGISTRY)
        .filter(page => page.runtime_class === target)
    );
  }

  function getPagesForRole(role) {
    const normalizedRole = clean(role).toLowerCase();

    if (!isKnownRole(normalizedRole)) {
      return [];
    }

    return clone(
      Object.values(VERIFIED_PAGE_REGISTRY)
        .filter(
          page =>
            page.supported_roles.length === 0 ||
            page.supported_roles.includes(
              normalizedRole
            )
        )
    );
  }

  function getDeclaredTargets(destination) {
    const page = getPage(destination);

    return page
      ? clone(page.declared_navigation_targets)
      : [];
  }

  function isDeclaredTarget(source, target) {
    const sourcePage = getPage(source);
    const targetFilename = normalizeFilename(target);

    if (!sourcePage || !targetFilename) {
      return false;
    }

    return sourcePage.declared_navigation_targets.includes(
      targetFilename
    );
  }

  function getVerifiedDependencies(destination) {
    const page = getPage(destination);

    return page
      ? clone(page.verified_dependencies)
      : [];
  }

  function getDependency(filename) {
    const normalized = clean(filename);

    return clone(
      VERIFIED_DEPENDENCY_CATALOG[normalized] || null
    );
  }

  function getDependencyCatalog() {
    return clone(VERIFIED_DEPENDENCY_CATALOG);
  }

  function getPlannedPages() {
    return clone(
      Object.values(PLANNED_PAGE_REGISTRY)
    );
  }

  function getLegacyUnverifiedPages() {
    return clone(
      Object.values(
        LEGACY_UNVERIFIED_PAGE_REGISTRY
      )
    );
  }

  function getDeprecatedPages() {
    return clone(
      Object.values(DEPRECATED_PAGE_REGISTRY)
    );
  }

  function classifyDestination(destination) {
    const filename = normalizeFilename(destination);

    if (!filename) {
      return {
        filename: null,
        classification:
          REGISTRATION_STATUS.NOT_REGISTERED,
        active: false
      };
    }

    if (isRegisteredDestination(filename)) {
      return {
        filename,
        classification:
          REGISTRATION_STATUS.REGISTERED_EXISTING,
        active: true
      };
    }

    if (isPlannedDestination(filename)) {
      return {
        filename,
        classification:
          REGISTRATION_STATUS.REGISTERED_PLANNED,
        active: false
      };
    }

    if (isLegacyUnverifiedDestination(filename)) {
      return {
        filename,
        classification:
          REGISTRATION_STATUS.LEGACY_UNVERIFIED,
        active: false
      };
    }

    if (isDeprecatedDestination(filename)) {
      return {
        filename,
        classification:
          REGISTRATION_STATUS.DEPRECATED,
        active: false
      };
    }

    return {
      filename,
      classification:
        REGISTRATION_STATUS.NOT_REGISTERED,
      active: false
    };
  }

  /*
  ========================================================
  REGISTRY VALIDATION
  ========================================================
  */

  function validateRegistry() {
    const errors = [];
    const warnings = [];

    const filenames = Object.keys(
      VERIFIED_PAGE_REGISTRY
    );

    const pageIds = new Set();

    if (filenames.length === 0) {
      errors.push({
        code: "PAGE_REGISTRY_EMPTY",
        message:
          "Verified Page Registry contains no active pages."
      });
    }

    REQUIRED_REGISTERED_FILENAMES.forEach(filename => {
      if (
        !Object.prototype.hasOwnProperty.call(
          VERIFIED_PAGE_REGISTRY,
          filename
        )
      ) {
        errors.push({
          code: "REQUIRED_PAGE_MISSING",
          page: filename,
          message:
            `Required repository-verified page is missing from the registry: ${filename}`
        });
      }
    });

    filenames.forEach(registryKey => {
      const page = VERIFIED_PAGE_REGISTRY[registryKey];

      if (
        !VALID_HTML_FILENAME_PATTERN.test(registryKey)
      ) {
        errors.push({
          code: "INVALID_REGISTRY_KEY",
          page: registryKey,
          message:
            `Registry key is not a valid canonical HTML filename: ${registryKey}`
        });
      }

      REQUIRED_PAGE_FIELDS.forEach(field => {
        if (
          !Object.prototype.hasOwnProperty.call(
            page,
            field
          )
        ) {
          errors.push({
            code: "REQUIRED_PAGE_FIELD_MISSING",
            page: registryKey,
            field,
            message:
              `Page entry is missing required field ${field}: ${registryKey}`
          });
        }
      });

      if (page.canonical_filename !== registryKey) {
        errors.push({
          code: "CANONICAL_FILENAME_MISMATCH",
          page: registryKey,
          message:
            `canonical_filename does not match registry key: ${registryKey}`
        });
      }

      if (
        !VALID_HTML_FILENAME_PATTERN.test(
          page.canonical_filename
        )
      ) {
        errors.push({
          code: "INVALID_CANONICAL_FILENAME",
          page: registryKey,
          message:
            `Invalid canonical page filename: ${page.canonical_filename}`
        });
      }

      if (!clean(page.page_id)) {
        errors.push({
          code: "PAGE_ID_MISSING",
          page: registryKey,
          message:
            `Page ID is missing: ${registryKey}`
        });
      } else if (pageIds.has(page.page_id)) {
        errors.push({
          code: "DUPLICATE_PAGE_ID",
          page: registryKey,
          page_id: page.page_id,
          message:
            `Duplicate page_id detected: ${page.page_id}`
        });
      } else {
        pageIds.add(page.page_id);
      }

      if (
        page.registration_status !==
        REGISTRATION_STATUS.REGISTERED_EXISTING
      ) {
        errors.push({
          code: "ACTIVE_PAGE_REGISTRATION_INVALID",
          page: registryKey,
          message:
            `Active registry page must use REGISTERED_EXISTING: ${registryKey}`
        });
      }

      if (
        page.repository_status !==
        REPOSITORY_STATUS.VERIFIED_EXISTING
      ) {
        errors.push({
          code: "ACTIVE_PAGE_REPOSITORY_STATUS_INVALID",
          page: registryKey,
          message:
            `Active registry page must be repository verified: ${registryKey}`
        });
      }

      if (
        !Object.values(PAGE_TYPE).includes(
          page.page_type
        )
      ) {
        errors.push({
          code: "INVALID_PAGE_TYPE",
          page: registryKey,
          message:
            `Unsupported page_type: ${page.page_type}`
        });
      }

      if (
        !Object.values(ACCESS_CLASS).includes(
          page.access_class
        )
      ) {
        errors.push({
          code: "INVALID_ACCESS_CLASS",
          page: registryKey,
          message:
            `Unsupported access_class: ${page.access_class}`
        });
      }

      if (
        !Object.values(RUNTIME_CLASS).includes(
          page.runtime_class
        )
      ) {
        errors.push({
          code: "INVALID_RUNTIME_CLASS",
          page: registryKey,
          message:
            `Unsupported runtime_class: ${page.runtime_class}`
        });
      }

      if (!clean(page.owner_stream)) {
        errors.push({
          code: "OWNER_STREAM_MISSING",
          page: registryKey,
          message:
            `owner_stream is missing: ${registryKey}`
        });
      }

      if (!clean(page.operational_authority)) {
        errors.push({
          code: "OPERATIONAL_AUTHORITY_MISSING",
          page: registryKey,
          message:
            `operational_authority is missing: ${registryKey}`
        });
      }

      if (!clean(page.purpose)) {
        errors.push({
          code: "PAGE_PURPOSE_MISSING",
          page: registryKey,
          message:
            `Page purpose is missing: ${registryKey}`
        });
      }

      if (
        !Array.isArray(
          page.declared_navigation_targets
        )
      ) {
        errors.push({
          code: "NAVIGATION_TARGETS_INVALID",
          page: registryKey,
          message:
            `declared_navigation_targets must be an array: ${registryKey}`
        });
      } else {
        const duplicateTargets =
          page.declared_navigation_targets.filter(
            (target, index, values) =>
              values.indexOf(target) !== index
          );

        if (duplicateTargets.length > 0) {
          errors.push({
            code: "DUPLICATE_NAVIGATION_TARGET",
            page: registryKey,
            targets: unique(duplicateTargets),
            message:
              `Duplicate declared navigation targets exist: ${registryKey}`
          });
        }

        page.declared_navigation_targets.forEach(
          target => {
            if (
              !VALID_HTML_FILENAME_PATTERN.test(
                target
              )
            ) {
              errors.push({
                code: "INVALID_NAVIGATION_TARGET",
                page: registryKey,
                target,
                message:
                  `Declared navigation target is not a valid canonical HTML filename: ${target}`
              });

              return;
            }

            if (
              !Object.prototype.hasOwnProperty.call(
                VERIFIED_PAGE_REGISTRY,
                target
              )
            ) {
              errors.push({
                code:
                  "UNREGISTERED_NAVIGATION_TARGET",
                page: registryKey,
                target,
                message:
                  `Declared navigation target is not an active registered page: ${registryKey} → ${target}`
              });
            }
          }
        );
      }

      if (!Array.isArray(page.verified_dependencies)) {
        errors.push({
          code: "VERIFIED_DEPENDENCIES_INVALID",
          page: registryKey,
          message:
            `verified_dependencies must be an array: ${registryKey}`
        });
      } else {
        const duplicateDependencies =
          page.verified_dependencies.filter(
            (dependency, index, values) =>
              values.indexOf(dependency) !== index
          );

        if (duplicateDependencies.length > 0) {
          errors.push({
            code: "DUPLICATE_DEPENDENCY_REFERENCE",
            page: registryKey,
            dependencies: unique(
              duplicateDependencies
            ),
            message:
              `Duplicate dependency references exist: ${registryKey}`
          });
        }

        page.verified_dependencies.forEach(
          dependency => {
            if (
              !VALID_DEPENDENCY_FILENAME_PATTERN.test(
                dependency
              )
            ) {
              errors.push({
                code: "INVALID_DEPENDENCY_FILENAME",
                page: registryKey,
                dependency,
                message:
                  `Dependency filename is invalid: ${dependency}`
              });

              return;
            }

            if (!isVerifiedDependency(dependency)) {
              errors.push({
                code:
                  "UNVERIFIED_DEPENDENCY_REFERENCE",
                page: registryKey,
                dependency,
                message:
                  `Page references a dependency not present in the verified dependency catalog: ${dependency}`
              });
            }
          }
        );
      }

      if (!Array.isArray(page.supported_roles)) {
        errors.push({
          code: "SUPPORTED_ROLES_INVALID",
          page: registryKey,
          message:
            `supported_roles must be an array: ${registryKey}`
        });
      } else {
        const duplicateRoles =
          page.supported_roles.filter(
            (role, index, values) =>
              values.indexOf(role) !== index
          );

        if (duplicateRoles.length > 0) {
          errors.push({
            code: "DUPLICATE_SUPPORTED_ROLE",
            page: registryKey,
            roles: unique(duplicateRoles),
            message:
              `Duplicate supported roles exist: ${registryKey}`
          });
        }

        page.supported_roles.forEach(role => {
          if (!isKnownRole(role)) {
            errors.push({
              code: "UNKNOWN_SUPPORTED_ROLE",
              page: registryKey,
              role,
              message:
                `Page contains unsupported role: ${role}`
            });
          }
        });
      }

      if (!Array.isArray(page.resource_context)) {
        errors.push({
          code: "RESOURCE_CONTEXT_INVALID",
          page: registryKey,
          message:
            `resource_context must be an array: ${registryKey}`
        });
      }

      if (
        page.access_class === ACCESS_CLASS.PUBLIC &&
        page.supported_roles.length > 0
      ) {
        warnings.push({
          code: "PUBLIC_PAGE_ROLE_METADATA_PRESENT",
          page: registryKey,
          message:
            `Public page contains supported_roles metadata: ${registryKey}`
        });
      }

      if (
        page.access_class !== ACCESS_CLASS.PUBLIC &&
        page.supported_roles.length === 0
      ) {
        errors.push({
          code: "PROTECTED_PAGE_ROLE_METADATA_MISSING",
          page: registryKey,
          message:
            `Protected page must declare supported roles: ${registryKey}`
        });
      }
    });

    const activeAndPlannedOverlap = Object.keys(
      PLANNED_PAGE_REGISTRY
    ).filter(filename =>
      Object.prototype.hasOwnProperty.call(
        VERIFIED_PAGE_REGISTRY,
        filename
      )
    );

    if (activeAndPlannedOverlap.length > 0) {
      errors.push({
        code: "ACTIVE_PLANNED_REGISTRY_OVERLAP",
        pages: activeAndPlannedOverlap,
        message:
          "Pages may not exist in both active and planned registries."
      });
    }

    const activeAndLegacyOverlap = Object.keys(
      LEGACY_UNVERIFIED_PAGE_REGISTRY
    ).filter(filename =>
      Object.prototype.hasOwnProperty.call(
        VERIFIED_PAGE_REGISTRY,
        filename
      )
    );

    if (activeAndLegacyOverlap.length > 0) {
      errors.push({
        code: "ACTIVE_LEGACY_REGISTRY_OVERLAP",
        pages: activeAndLegacyOverlap,
        message:
          "Pages may not exist in both active and legacy-unverified registries."
      });
    }

    const activeAndDeprecatedOverlap = Object.keys(
      DEPRECATED_PAGE_REGISTRY
    ).filter(filename =>
      Object.prototype.hasOwnProperty.call(
        VERIFIED_PAGE_REGISTRY,
        filename
      )
    );

    if (activeAndDeprecatedOverlap.length > 0) {
      errors.push({
        code: "ACTIVE_DEPRECATED_REGISTRY_OVERLAP",
        pages: activeAndDeprecatedOverlap,
        message:
          "Pages may not exist in both active and deprecated registries."
      });
    }

    const result = {
      valid: errors.length === 0,
      registry_version: VERSION,
      authority_id: AUTHORITY_ID,
      authority_type: AUTHORITY_TYPE,
      registry_status: REGISTRY_STATUS,
      registered_page_count: filenames.length,
      required_page_count:
        REQUIRED_REGISTERED_FILENAMES.length,
      planned_page_count: Object.keys(
        PLANNED_PAGE_REGISTRY
      ).length,
      legacy_unverified_page_count: Object.keys(
        LEGACY_UNVERIFIED_PAGE_REGISTRY
      ).length,
      deprecated_page_count: Object.keys(
        DEPRECATED_PAGE_REGISTRY
      ).length,
      dependency_count: Object.keys(
        VERIFIED_DEPENDENCY_CATALOG
      ).length,
      error_count: errors.length,
      warning_count: warnings.length,
      errors,
      warnings,
      validated_at: nowISO()
    };

    STATE.validation = clone(result);

    return clone(result);
  }

  /*
  ========================================================
  HEALTH DIAGNOSTICS
  ========================================================
  */

  function runHealthCheck() {
    const validation = validateRegistry();
    const currentFilename = getCurrentFilename();

    const accessAuthority =
      window.STATScoreRoleAccess ||
      window.STATScore?.RoleAccess ||
      null;

    const routingAuthority =
      window.STATScoreRouting ||
      window.STATScore?.Routing ||
      null;

    const runtimeAuthority =
      window.STATScoreRuntimeStateEngine ||
      window.STATScore?.RuntimeStateEngine ||
      null;

    const systemMap =
      window.STATScoreSystemMap ||
      window.STATSCORE_SYSTEM_MAP ||
      window.STATScore?.SystemMap ||
      null;

    const currentPageClassification =
      classifyDestination(currentFilename);

    const health = {
      ok: validation.valid,

      engine_id: ENGINE_ID,
      version: VERSION,
      authority_id: AUTHORITY_ID,
      authority_type: AUTHORITY_TYPE,

      registry_status: REGISTRY_STATUS,
      registry_scope: REGISTRY_SCOPE,

      immutable_registry:
        Object.isFrozen(VERIFIED_PAGE_REGISTRY),

      immutable_dependency_catalog:
        Object.isFrozen(
          VERIFIED_DEPENDENCY_CATALOG
        ),

      registry_valid: validation.valid,
      registry_error_count:
        validation.error_count,
      registry_warning_count:
        validation.warning_count,

      registered_page_count:
        getRegisteredPageCount(),

      required_page_count:
        REQUIRED_REGISTERED_FILENAMES.length,

      required_pages_complete:
        REQUIRED_REGISTERED_FILENAMES.every(
          isRegisteredDestination
        ),

      planned_pages_are_non_active:
        Object.keys(
          PLANNED_PAGE_REGISTRY
        ).every(
          filename =>
            !isRegisteredDestination(filename)
        ),

      legacy_pages_are_non_active:
        Object.keys(
          LEGACY_UNVERIFIED_PAGE_REGISTRY
        ).every(
          filename =>
            !isRegisteredDestination(filename)
        ),

      deprecated_pages_are_non_active:
        Object.keys(
          DEPRECATED_PAGE_REGISTRY
        ).every(
          filename =>
            !isRegisteredDestination(filename)
        ),

      access_authority_available:
        !!accessAuthority,

      routing_authority_available:
        !!routingAuthority,

      runtime_authority_available:
        !!runtimeAuthority,

      system_map_available:
        !!systemMap,

      current_filename: currentFilename,
      current_page_registered:
        currentPageClassification.active,
      current_page_classification:
        currentPageClassification.classification,

      loaded_at: STATE.loaded_at,
      checked_at: nowISO()
    };

    STATE.health = clone(health);

    return clone(health);
  }

  function getRegistrySummary() {
    return {
      engine_id: ENGINE_ID,
      version: VERSION,
      authority_id: AUTHORITY_ID,
      authority_type: AUTHORITY_TYPE,
      registry_status: REGISTRY_STATUS,
      registry_scope: REGISTRY_SCOPE,

      registered_page_count:
        getRegisteredPageCount(),

      registered_filenames:
        getRegisteredFilenames(),

      planned_page_count:
        Object.keys(PLANNED_PAGE_REGISTRY).length,

      legacy_unverified_page_count:
        Object.keys(
          LEGACY_UNVERIFIED_PAGE_REGISTRY
        ).length,

      deprecated_page_count:
        Object.keys(
          DEPRECATED_PAGE_REGISTRY
        ).length,

      verified_dependency_count:
        Object.keys(
          VERIFIED_DEPENDENCY_CATALOG
        ).length,

      validation:
        clone(STATE.validation),

      health:
        clone(STATE.health),

      generated_at: nowISO()
    };
  }

  /*
  ========================================================
  EVENT PUBLICATION
  ========================================================
  */

  function emit(eventName, payload = {}) {
    const detail = {
      engine_id: ENGINE_ID,
      version: VERSION,
      authority_id: AUTHORITY_ID,
      authority_type: AUTHORITY_TYPE,
      emitted_at: nowISO(),
      ...clone(payload)
    };

    window.dispatchEvent(
      new CustomEvent(
        `statscore:page-map:${eventName}`,
        { detail }
      )
    );

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit(
        `page_map_${eventName}`,
        detail
      );
    }
  }

  /*
  ========================================================
  PUBLIC API
  ========================================================
  */

  function expose() {
    const validation = validateRegistry();

    if (!validation.valid) {
      console.error(
        "[STATS-CORE Page Map] Registry validation failed.",
        clone(validation)
      );
    }

    STATE.loaded_at = nowISO();

    const api = Object.freeze({
      engine_id: ENGINE_ID,
      version: VERSION,
      authority_id: AUTHORITY_ID,
      authority_type: AUTHORITY_TYPE,
      registry_status: REGISTRY_STATUS,
      registry_scope: REGISTRY_SCOPE,

      normalizeFilename,
      getCurrentFilename,

      isRegisteredDestination,
      isPlannedDestination,
      isLegacyUnverifiedDestination,
      isDeprecatedDestination,
      classifyDestination,

      getPage,
      getPageById,
      getRegisteredPages,
      getRegisteredFilenames,
      getRegisteredPageCount,

      getPagesByOwner,
      getPagesByOperationalAuthority,
      getPagesByType,
      getPagesByAccessClass,
      getPagesByRuntimeClass,
      getPagesForRole,

      getDeclaredTargets,
      isDeclaredTarget,

      getVerifiedDependencies,
      getDependency,
      getDependencyCatalog,

      getPlannedPages,
      getLegacyUnverifiedPages,
      getDeprecatedPages,

      validateRegistry,
      runHealthCheck,
      getRegistrySummary,

      getEnumerations() {
        return {
          registration_status:
            clone(REGISTRATION_STATUS),

          repository_status:
            clone(REPOSITORY_STATUS),

          construction_status:
            clone(CONSTRUCTION_STATUS),

          audit_status:
            clone(AUDIT_STATUS),

          operational_status:
            clone(OPERATIONAL_STATUS),

          access_class:
            clone(ACCESS_CLASS),

          page_type:
            clone(PAGE_TYPE),

          runtime_class:
            clone(RUNTIME_CLASS),

          owner_stream:
            clone(OWNER_STREAM),

          operational_authority:
            clone(OPERATIONAL_AUTHORITY),

          supported_roles:
            clone(SUPPORTED_ROLES)
        };
      }
    });

    window.STATScorePageMap = api;

    window.STATScore =
      window.STATScore || {};

    window.STATScore.PageMap = api;

    /*
    Compatibility publication:

    A cloned read-only snapshot is published for consumers that
    previously referenced STATSCORE_PAGE_MAP directly.

    Consumers should migrate to window.STATScorePageMap methods.
    Mutating this snapshot does not mutate the private registry.
    */

    window.STATSCORE_PAGE_MAP = deepFreeze({
      map_version: VERSION,
      map_status: REGISTRY_STATUS,
      map_name:
        "STATS-CORE Governed Page Registry",
      authority_id: AUTHORITY_ID,
      authority_type: AUTHORITY_TYPE,
      registry_scope: REGISTRY_SCOPE,

      pages: clone(
        VERIFIED_PAGE_REGISTRY
      ),

      planned_pages: clone(
        PLANNED_PAGE_REGISTRY
      ),

      legacy_unverified_pages: clone(
        LEGACY_UNVERIFIED_PAGE_REGISTRY
      ),

      deprecated_pages: clone(
        DEPRECATED_PAGE_REGISTRY
      )
    });

    const health = runHealthCheck();

    emit("loaded", {
      registry_valid:
        validation.valid,

      registered_page_count:
        getRegisteredPageCount(),

      health:
        clone(health)
    });

    console.info(
      "[STATS-CORE Page Map] Governed registry loaded.",
      {
        version: VERSION,
        authority_id: AUTHORITY_ID,
        registry_valid:
          validation.valid,
        registered_page_count:
          getRegisteredPageCount()
      }
    );

    return api;
  }

  expose();

  /*
  ========================================================
  CONSUMER DOCTRINE
  ========================================================

  Destination registration:

  const registered =
    window.STATScorePageMap
      .isRegisteredDestination(
        "athlete-dashboard.html"
      );

  Page metadata:

  const page =
    window.STATScorePageMap
      .getPage(
        "athlete-dashboard.html"
      );

  Declared navigation metadata:

  const targets =
    window.STATScorePageMap
      .getDeclaredTargets(
        "login.html"
      );

  IMPORTANT:

  declared_navigation_targets do not authorize navigation.

  Correct navigation sequence:

  Authentication Context
          ↓
  Registered Destination Validation
          ↓
  Access Authority Decision
          ↓
  Routing Authority Execution

  Example Routing Authority registration check:

  const pageMap =
    window.STATScorePageMap;

  if (
    !pageMap.isRegisteredDestination(
      requestedDestination
    )
  ) {
    // Fail closed.
  }

  The Routing Authority must not treat a declared target as an
  access grant.

  The Access Authority must not treat registration as access
  permission.

  Runtime loaders must use verified_dependencies only as registry
  metadata and must independently verify that the dependency
  exists before loading it.

  Missing, planned, legacy-unverified, and deprecated pages are
  not active destinations.

  Registry modification requires:
  - repository evidence;
  - ownership evidence;
  - authority assignment;
  - lifecycle review;
  - Access Authority alignment;
  - Routing Authority alignment;
  - System Map alignment;
  - registry validation;
  - Chief Systems Engineering disposition.

  No page is added to the active registry by runtime code.
  ========================================================
  */
})(); 
