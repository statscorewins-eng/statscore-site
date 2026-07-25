/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-dashboard-map.js

Asset Type:
JavaScript Infrastructure / Governed Dashboard Registry

Owner Authority:
STATS-CORE Enterprise Dashboard Registry Authority

Primary Operational Authority:
STATS-CORE Enterprise Dashboard Registry Authority

Layer:
Enterprise Infrastructure / Dashboard Metadata Governance

Runtime Consumer Boundary:
Consumed by governed dashboard runtimes, the Page Registry,
Routing Authority, Access Authority, engine loaders,
System Map, and system diagnostics.

Primary Consumers:
- athlete-dashboard.html
- role-dashboard.html
- statscore-page-map.js
- statscore-system-map.js
- statscore-engine-loader.js
- statscore-engine-registry.js
- system.html
- governed dashboard runtime engines

Purpose:
Defines the canonical registration, identity, ownership,
component metadata, source-authority relationships, destination
metadata, and runtime-context requirements of approved
STATS-CORE dashboard surfaces.

Provides:
- dashboard registration
- dashboard identity
- dashboard ownership metadata
- dashboard component registration
- component classification
- component source-authority metadata
- registered destination metadata
- verified dependency references
- registry validation
- health diagnostics
- immutable dashboard query services

Consumes:
- approved repository inventory
- approved Page Registry Authority
- approved Stream Registry
- approved Runtime Context doctrine
- approved Access Authority doctrine
- approved Routing Authority doctrine
- approved Athlete Dashboard doctrine
- approved Professional Workspace doctrine
- approved Score Authority doctrine

Primary IDs:
- registry_id
- dashboard_id
- component_id
- canonical_page

Cross-Stream Dependencies:
May reference dashboard presentation and source authorities
across approved Streams.
May not implement another Stream's business logic.

Does NOT:
- render dashboard UI
- manufacture dashboard runtime
- manufacture Authentication Context
- manufacture Runtime Context
- calculate intelligence
- calculate scores
- create composite scores
- establish athlete identity
- establish professional identity
- execute routing
- authorize navigation
- grant resource access
- execute communication policy
- create athlete source records
- modify Supabase records
- create immutable enterprise receipts
- register missing pages as active destinations
- treat component existence as action authorization

Status:
CONTROLLED V2 DASHBOARD-REGISTRY RECONSTRUCTION

==========================================================
*/

/*
============================================================
STATS-CORE™ Governed Dashboard Registry
File: statscore-dashboard-map.js
Version: STATSCORE-DASHBOARD-MAP-V2

Constitutional Sequence:

Governed Source Authority
        ↓
Governed Intelligence / Status Output
        ↓
Dashboard Runtime Consumer
        ↓
Dashboard Registry Component Metadata
        ↓
Registered Destination Validation
        ↓
Access Authority Decision
        ↓
Routing Authority Execution

Doctrine:

- Dashboards are navigation, awareness, and operations surfaces.
- Dashboards consume governed outputs.
- Dashboards do not create source truth.
- Dashboards do not calculate intelligence.
- Dashboards do not manufacture access.
- Dashboard destinations are metadata only.
- A destination must be active in the Page Registry before this
  registry may classify it as navigable.
- A component may be intentionally non-navigable.
- Missing or future pages are never active destinations.
- Exposure is not recruiting interest.
- Recruiting interest is not communication.
- Communication is not an offer.
- An offer is not a commitment.
- Composite score remains COMPOSITE_PENDING until the Score
  Authority formally publishes an approved composite contract.
============================================================
*/

(function () {
  "use strict";

  const REGISTRY_ID = "SC_DASHBOARD_REGISTRY";
  const ENGINE_ID = "statscore-dashboard-map";
  const VERSION = "STATSCORE-DASHBOARD-MAP-V2";
  const AUTHORITY_ID =
    "statscore-enterprise-dashboard-registry";
  const AUTHORITY_TYPE =
    "GOVERNED_DASHBOARD_REGISTRY_AUTHORITY";
  const REGISTRY_STATUS = "ACTIVE";
  const REGISTRY_SCOPE =
    "APPROVED_DASHBOARDS_AND_REGISTERED_DESTINATIONS_ONLY";

  /*
  ========================================================
  ENUMERATIONS
  ========================================================
  */

  const REGISTRATION_STATUS = deepFreeze({
    REGISTERED_ACTIVE: "REGISTERED_ACTIVE",
    REGISTERED_INACTIVE: "REGISTERED_INACTIVE",
    REGISTERED_PLANNED: "REGISTERED_PLANNED",
    DEPRECATED: "DEPRECATED"
  });

  const DASHBOARD_TYPE = deepFreeze({
    NAVIGATION_AWARENESS_DASHBOARD:
      "NAVIGATION_AWARENESS_DASHBOARD",

    WORKSPACE_OPERATIONS_DASHBOARD:
      "WORKSPACE_OPERATIONS_DASHBOARD"
  });

  const COMPONENT_TYPE = deepFreeze({
    IDENTITY_HEADER: "IDENTITY_HEADER",
    STATUS_CARD: "STATUS_CARD",
    SUMMARY_CARD: "SUMMARY_CARD",
    NAVIGATION_CARD: "NAVIGATION_CARD",
    ACTION_CARD: "ACTION_CARD",
    GOVERNANCE_ALERT: "GOVERNANCE_ALERT",
    ACTIVITY_FEED: "ACTIVITY_FEED",
    WORKSPACE_MODULE: "WORKSPACE_MODULE"
  });

  const DESTINATION_STATUS = deepFreeze({
    ACTIVE_REGISTERED_DESTINATION:
      "ACTIVE_REGISTERED_DESTINATION",

    NON_NAVIGABLE_COMPONENT:
      "NON_NAVIGABLE_COMPONENT",

    PLANNED_DESTINATION:
      "PLANNED_DESTINATION",

    UNVERIFIED_DESTINATION:
      "UNVERIFIED_DESTINATION",

    DEPRECATED_DESTINATION:
      "DEPRECATED_DESTINATION"
  });

  const ACCESS_CLASS = deepFreeze({
    AUTHENTICATED_DASHBOARD:
      "AUTHENTICATED_DASHBOARD",

    GOVERNED_RESOURCE:
      "GOVERNED_RESOURCE",

    GOVERNED_COMMUNICATION:
      "GOVERNED_COMMUNICATION",

    GOVERNED_ACTION:
      "GOVERNED_ACTION"
  });

  const CONSTRUCTION_STATUS = deepFreeze({
    BUILT_SHELL: "BUILT_SHELL",
    PARTIAL: "PARTIAL",
    FUNCTIONAL_ACTIVATION_REQUIRED:
      "FUNCTIONAL_ACTIVATION_REQUIRED",
    FUNCTIONAL: "FUNCTIONAL",
    UNKNOWN: "UNKNOWN"
  });

  const OPERATIONAL_STATUS = deepFreeze({
    ACTIVE: "ACTIVE",
    CONTROLLED_INSTALLATION:
      "CONTROLLED_INSTALLATION",

    FUNCTIONAL_ACTIVATION_PENDING:
      "FUNCTIONAL_ACTIVATION_PENDING",

    INACTIVE: "INACTIVE"
  });

  const AUDIT_STATUS = deepFreeze({
    PASS: "PASS",
    PENDING: "PENDING",
    NOT_AUDITED: "NOT_AUDITED",
    FAILED: "FAILED"
  });

  const VALUE_VISIBILITY = deepFreeze({
    USER_VISIBLE: "USER_VISIBLE",
    GOVERNED_VISIBLE: "GOVERNED_VISIBLE",
    ADMINISTRATIVE_VISIBLE:
      "ADMINISTRATIVE_VISIBLE",
    DIAGNOSTIC_ONLY: "DIAGNOSTIC_ONLY",
    RUNTIME_ONLY: "RUNTIME_ONLY"
  });

  const COMPOSITE_STATUS = deepFreeze({
    COMPOSITE_PENDING: "COMPOSITE_PENDING",
    COMPOSITE_APPROVED: "COMPOSITE_APPROVED",
    NOT_APPLICABLE: "NOT_APPLICABLE"
  });

  const OWNER_STREAM = deepFreeze({
    STREAM_1:
      "STREAM_1_PUBLIC_ACCESS_LOGIN",

    STREAM_2:
      "STREAM_2_ATHLETE_SOURCE_RECORD",

    STREAM_3:
      "STREAM_3_ATHLETE_INTELLIGENCE",

    STREAM_4:
      "STREAM_4_PROFESSIONAL_ROLE_INTAKE",

    STREAM_5:
      "STREAM_5_PROFESSIONAL_OPERATIONS_DASHBOARD_CRM",

    STREAM_6:
      "STREAM_6_COMMUNICATION_GOVERNANCE",

    STREAM_7:
      "STREAM_7_CRYSTAL_EXPOSURE_MEDIA",

    STREAM_8:
      "STREAM_8_SYSTEM_OPERATIONS_SELF_HEALING",

    STREAM_9:
      "STREAM_9_SCORE_AUTHORITY_INTELLIGENCE_MATRIX",

    STREAM_10:
      "STREAM_10_PROFESSIONAL_CERTIFICATION_AUTHORITY"
  });

  const SOURCE_AUTHORITY = deepFreeze({
    ATHLETE_SOURCE_RECORD:
      "ATHLETE_SOURCE_RECORD_AUTHORITY",

    ATHLETE_INTELLIGENCE:
      "ATHLETE_INTELLIGENCE_AUTHORITY",

    SCORE_AUTHORITY:
      "SCORE_AUTHORITY",

    PROFESSIONAL_ROLE_INTAKE:
      "PROFESSIONAL_ROLE_INTAKE_AUTHORITY",

    PROFESSIONAL_OPERATIONS:
      "PROFESSIONAL_OPERATIONS_AUTHORITY",

    COMMUNICATION_GOVERNANCE:
      "COMMUNICATION_GOVERNANCE_AUTHORITY",

    CRYSTAL_EXPOSURE_MEDIA:
      "CRYSTAL_EXPOSURE_MEDIA_AUTHORITY",

    RUNTIME_AUTHORITY:
      "ENTERPRISE_RUNTIME_AUTHORITY",

    VERIFICATION_AUTHORITY:
      "VERIFICATION_AUTHORITY"
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

  const RUNTIME_CONTEXT_FIELDS = deepFreeze([
    "runtime_id",
    "session_id",
    "user_id",
    "role",
    "role_id",
    "workspace_id",
    "athlete_id",
    "snapshot_id",
    "organization_id"
  ]);

  /*
  ========================================================
  VERIFIED DEPENDENCY CATALOG
  ========================================================

  Repository presence is established by approved engineering
  evidence or the approved Page Registry dependency catalog.

  Catalog presence verifies the filename as a repository asset.
  It does not independently certify every internal API.
  ========================================================
  */

  const VERIFIED_DEPENDENCY_CATALOG = deepFreeze({
    "statscore-page-map.js": {
      dependency_id: "SC_DEP_PAGE_MAP",
      authority_class:
        "PAGE_REGISTRY_AUTHORITY",
      owner_stream:
        "ENTERPRISE_PAGE_REGISTRY_AUTHORITY"
    },

    "statscore-dashboard-map.js": {
      dependency_id:
        "SC_DEP_DASHBOARD_REGISTRY",
      authority_class:
        "DASHBOARD_REGISTRY_AUTHORITY",
      owner_stream:
        "ENTERPRISE_DASHBOARD_REGISTRY_AUTHORITY"
    },

    "statscore-runtime-state-engine.js": {
      dependency_id:
        "SC_DEP_RUNTIME_STATE_ENGINE",
      authority_class:
        "RUNTIME_CONTEXT_AUTHORITY",
      owner_stream: OWNER_STREAM.STREAM_8
    },

    "statscore-routing.js": {
      dependency_id:
        "SC_DEP_ROUTING_AUTHORITY",
      authority_class:
        "ROUTING_AUTHORITY",
      owner_stream: OWNER_STREAM.STREAM_1
    },

    "statscore-role-access.js": {
      dependency_id:
        "SC_DEP_ACCESS_AUTHORITY",
      authority_class:
        "ACCESS_AUTHORITY",
      owner_stream: OWNER_STREAM.STREAM_1
    },

    "statscore-athlete-dashboard-engine.js": {
      dependency_id:
        "SC_DEP_ATHLETE_DASHBOARD_ENGINE",
      authority_class:
        "ATHLETE_DASHBOARD_RUNTIME_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_3
    },

    "statscore-snapshot-intake-engine.js": {
      dependency_id:
        "SC_DEP_SNAPSHOT_INTAKE_ENGINE",
      authority_class:
        "ATHLETE_SOURCE_RECORD_INTAKE_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_2
    },

    "statscore-role-dashboard-intake-engine.js": {
      dependency_id:
        "SC_DEP_ROLE_DASHBOARD_INTAKE_ENGINE",
      authority_class:
        "PROFESSIONAL_ROLE_INTAKE_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_4
    },

    "statscore-active-workspace-engine.js": {
      dependency_id:
        "SC_DEP_ACTIVE_WORKSPACE_ENGINE",
      authority_class:
        "PROFESSIONAL_WORKSPACE_RUNTIME_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_5
    },

    "statscore-doctrine.js": {
      dependency_id:
        "SC_DEP_ATHLETE_INTELLIGENCE_DOCTRINE",
      authority_class:
        "ATHLETE_INTELLIGENCE_DOCTRINE",
      owner_stream: OWNER_STREAM.STREAM_3
    },

    "statscore-engine-registry.js": {
      dependency_id:
        "SC_DEP_ENGINE_REGISTRY",
      authority_class:
        "ENGINE_REGISTRY",
      owner_stream: OWNER_STREAM.STREAM_8
    },

    "statscore-engine-execution.js": {
      dependency_id:
        "SC_DEP_ENGINE_EXECUTION",
      authority_class:
        "ENGINE_EXECUTION_COORDINATOR",
      owner_stream: OWNER_STREAM.STREAM_8
    },

    "statscore-engine-loader.js": {
      dependency_id:
        "SC_DEP_ENGINE_LOADER",
      authority_class:
        "ENGINE_LOADER",
      owner_stream: OWNER_STREAM.STREAM_8
    },

    "statscore-engine-health.js": {
      dependency_id:
        "SC_DEP_ENGINE_HEALTH",
      authority_class:
        "ENGINE_HEALTH_DIAGNOSTICS",
      owner_stream: OWNER_STREAM.STREAM_8
    },

    "statscore-engine-bus.js": {
      dependency_id:
        "SC_DEP_ENGINE_BUS",
      authority_class:
        "ENGINE_EVENT_BUS",
      owner_stream: OWNER_STREAM.STREAM_8
    },

    "statscore-data.js": {
      dependency_id:
        "SC_DEP_DATA_CONSUMER",
      authority_class:
        "DATA_ACCESS_INFRASTRUCTURE",
      owner_stream:
        "REPOSITORY_VERIFIED_AUTHORITY_UNCONFIRMED"
    },

    "statscore-production-matrix.js": {
      dependency_id:
        "SC_DEP_PRODUCTION_MATRIX",
      authority_class:
        "ATHLETE_PRODUCTION_INTELLIGENCE",
      owner_stream: OWNER_STREAM.STREAM_3
    },

    "statscore-academic-matrix.js": {
      dependency_id:
        "SC_DEP_ACADEMIC_MATRIX",
      authority_class:
        "ACADEMIC_INTELLIGENCE_MATRIX",
      owner_stream: OWNER_STREAM.STREAM_9
    },

    "statscore-intelligence-doctrine.js": {
      dependency_id:
        "SC_DEP_INTELLIGENCE_DOCTRINE",
      authority_class:
        "INTELLIGENCE_AUTHORITY_DOCTRINE",
      owner_stream: OWNER_STREAM.STREAM_9
    },

    "statscore-score-doctrine.js": {
      dependency_id:
        "SC_DEP_SCORE_DOCTRINE",
      authority_class:
        "SCORE_DOCTRINE",
      owner_stream: OWNER_STREAM.STREAM_9
    },

    "statscore-matrix-doctrine.js": {
      dependency_id:
        "SC_DEP_MATRIX_DOCTRINE",
      authority_class:
        "MATRIX_DOCTRINE",
      owner_stream: OWNER_STREAM.STREAM_9
    },

    "statscore-matrix-registry.js": {
      dependency_id:
        "SC_DEP_MATRIX_REGISTRY",
      authority_class:
        "MATRIX_REGISTRY",
      owner_stream: OWNER_STREAM.STREAM_9
    },

    "statscore-stream-9-authority.js": {
      dependency_id:
        "SC_DEP_STREAM_9_AUTHORITY",
      authority_class:
        "SCORE_AND_INTELLIGENCE_AUTHORITY",
      owner_stream: OWNER_STREAM.STREAM_9
    },

    "statscore-state-engine.js": {
      dependency_id:
        "SC_DEP_STATE_ENGINE",
      authority_class:
        "STATE_PROCESSING_ENGINE",
      owner_stream:
        "REPOSITORY_VERIFIED_AUTHORITY_UNCONFIRMED"
    },

    "statscore-synthesis-engine.js": {
      dependency_id:
        "SC_DEP_SYNTHESIS_ENGINE",
      authority_class:
        "INTELLIGENCE_SYNTHESIS_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_9
    },

    "statscore-scoring-engine.js": {
      dependency_id:
        "SC_DEP_SCORING_ENGINE",
      authority_class:
        "SPORT_SCORING_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_9
    },

    "statscore-trait-render-engine.js": {
      dependency_id:
        "SC_DEP_TRAIT_RENDER_ENGINE",
      authority_class:
        "TRAIT_PRESENTATION_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_3
    },

    "statscore-dynamic-athlete-engine.js": {
      dependency_id:
        "SC_DEP_DYNAMIC_ATHLETE_ENGINE",
      authority_class:
        "ATHLETE_RUNTIME_PRESENTATION_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_3
    },

    "statscore-athlete-search-engine.js": {
      dependency_id:
        "SC_DEP_ATHLETE_SEARCH_ENGINE",
      authority_class:
        "ATHLETE_SEARCH_ENGINE",
      owner_stream:
        "REPOSITORY_VERIFIED_AUTHORITY_UNCONFIRMED"
    },

    "statscore-evidence-engine.js": {
      dependency_id:
        "SC_DEP_EVIDENCE_ENGINE",
      authority_class:
        "EVIDENCE_PROCESSING_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_10
    },

    "statscore-verification-engine.js": {
      dependency_id:
        "SC_DEP_VERIFICATION_ENGINE",
      authority_class:
        "VERIFICATION_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_10
    },

    "statscore-evaluator-engine.js": {
      dependency_id:
        "SC_DEP_EVALUATOR_ENGINE",
      authority_class:
        "EVALUATION_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_10
    },

    "statscore-communication-engine.js": {
      dependency_id:
        "SC_DEP_COMMUNICATION_ENGINE",
      authority_class:
        "COMMUNICATION_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_6
    },

    "statscore-multibox-governance-engine.js": {
      dependency_id:
        "SC_DEP_MULTIBOX_GOVERNANCE_ENGINE",
      authority_class:
        "MULTIBOX_GOVERNANCE_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_6
    },

    "sc-receipt-ledger-engine.js": {
      dependency_id:
        "SC_DEP_RECEIPT_LEDGER_ENGINE",
      authority_class:
        "COMMUNICATION_RECEIPT_LEDGER",
      owner_stream: OWNER_STREAM.STREAM_6
    },

    "statscore-phnx-media-engine.js": {
      dependency_id:
        "SC_DEP_PHNX_MEDIA_ENGINE",
      authority_class:
        "PHNX_MEDIA_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_7
    },

    "statscore-crystal-engine.js": {
      dependency_id:
        "SC_DEP_CRYSTAL_ENGINE",
      authority_class:
        "CRYSTAL_INTELLIGENCE_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_7
    },

    "statscore-crystal-reports.js": {
      dependency_id:
        "SC_DEP_CRYSTAL_REPORTS",
      authority_class:
        "CRYSTAL_REPORT_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_7
    },

    "statscore-eligibility-engine.js": {
      dependency_id:
        "SC_DEP_ELIGIBILITY_ENGINE",
      authority_class:
        "ELIGIBILITY_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_9
    },

    "statscore-event-engine.js": {
      dependency_id:
        "SC_DEP_EVENT_ENGINE",
      authority_class:
        "EVENT_ENGINE",
      owner_stream:
        "REPOSITORY_VERIFIED_AUTHORITY_UNCONFIRMED"
    },

    "statscore-camp-combine-intelligence-engine.js": {
      dependency_id:
        "SC_DEP_CAMP_COMBINE_ENGINE",
      authority_class:
        "CAMP_COMBINE_INTELLIGENCE_ENGINE",
      owner_stream:
        "REPOSITORY_VERIFIED_AUTHORITY_UNCONFIRMED"
    },

    "statscore-self-healing-engine.js": {
      dependency_id:
        "SC_DEP_SELF_HEALING_ENGINE",
      authority_class:
        "SELF_HEALING_ENGINE",
      owner_stream: OWNER_STREAM.STREAM_8
    },

    "statscore-signal-governance.js": {
      dependency_id:
        "SC_DEP_SIGNAL_GOVERNANCE",
      authority_class:
        "SIGNAL_GOVERNANCE",
      owner_stream: OWNER_STREAM.STREAM_9
    }
  });

  /*
  ========================================================
  DASHBOARD REGISTRY
  ========================================================

  Only active registered pages from the approved Page Registry
  are used as operational destinations.

  Components that historically pointed to unregistered pages are
  either:
  - redirected to an approved registered destination; or
  - marked non-navigable.

  This registry does not manufacture missing pages.
  ========================================================
  */

  const DASHBOARD_REGISTRY = deepFreeze({
    athlete_dashboard: {
      dashboard_id: "SC_DASHBOARD_ATHLETE",
      canonical_page: "athlete-dashboard.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_ACTIVE,

      dashboard_type:
        DASHBOARD_TYPE.NAVIGATION_AWARENESS_DASHBOARD,

      owner_stream: OWNER_STREAM.STREAM_3,

      presentation_authority:
        SOURCE_AUTHORITY.ATHLETE_INTELLIGENCE,

      access_class:
        ACCESS_CLASS.AUTHENTICATED_DASHBOARD,

      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,

      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      audit_status: AUDIT_STATUS.PENDING,

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

      required_runtime_context: [
        "runtime_id",
        "athlete_id",
        "snapshot_id"
      ],

      verified_dependencies: [
        "statscore-athlete-dashboard-engine.js",
        "statscore-runtime-state-engine.js",
        "statscore-routing.js",
        "statscore-role-access.js",
        "statscore-page-map.js",
        "statscore-dashboard-map.js"
      ],

      doctrine:
        "Athlete Dashboard is a navigation and awareness consumer. It presents governed source-record facts, status outputs, and intelligence summaries. It does not create athlete identity, calculate intelligence, manufacture composite scores, or grant access.",

      components: {
        athlete_identity_header: {
          component_id:
            "SC_COMPONENT_ATHLETE_IDENTITY_HEADER",

          component_type:
            COMPONENT_TYPE.IDENTITY_HEADER,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label: "Athlete Profile",

          user_question:
            "Who am I in the system?",

          purpose:
            "Presents governed athlete identity and current profile context supplied by source-record and runtime authorities.",

          presentation_owner:
            OWNER_STREAM.STREAM_3,

          source_authorities: [
            SOURCE_AUTHORITY.ATHLETE_SOURCE_RECORD,
            SOURCE_AUTHORITY.RUNTIME_AUTHORITY
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "player-profile.html"
          },

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "athlete_id",
            "snapshot_id"
          ],

          value_visibility: {
            athlete_identity:
              VALUE_VISIBILITY.USER_VISIBLE,

            profile_status:
              VALUE_VISIBILITY.GOVERNED_VISIBLE,

            snapshot_id:
              VALUE_VISIBILITY.DIAGNOSTIC_ONLY,

            runtime_id:
              VALUE_VISIBILITY.RUNTIME_ONLY
          },

          verified_dependencies: [
            "statscore-data.js",
            "statscore-dynamic-athlete-engine.js",
            "statscore-runtime-state-engine.js",
            "statscore-page-map.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Consumes governed athlete identity and profile context. Does not create athlete_id, snapshot_id, release authority, or profile truth."
        },

        current_intelligence_standing: {
          component_id:
            "SC_COMPONENT_CURRENT_INTELLIGENCE_STANDING",

          component_type:
            COMPONENT_TYPE.STATUS_CARD,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label:
            "Current Intelligence Standing",

          user_question:
            "What is my current standing across the approved intelligence categories?",

          purpose:
            "Presents independently governed category outputs while the composite authority remains pending.",

          presentation_owner:
            OWNER_STREAM.STREAM_3,

          source_authorities: [
            SOURCE_AUTHORITY.SCORE_AUTHORITY,
            SOURCE_AUTHORITY.ATHLETE_INTELLIGENCE
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "player-profile.html"
          },

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "athlete_id",
            "snapshot_id"
          ],

          composite_status:
            COMPOSITE_STATUS.COMPOSITE_PENDING,

          approved_presentations: [
            "athletic_production_status",
            "academic_status",
            "approved_category_explanations",
            "COMPOSITE_PENDING"
          ],

          prohibited_presentations: [
            "manufactured_composite_score",
            "unapproved_overall_score",
            "naked_score_without_explanation"
          ],

          verified_dependencies: [
            "statscore-stream-9-authority.js",
            "statscore-intelligence-doctrine.js",
            "statscore-score-doctrine.js",
            "statscore-matrix-doctrine.js",
            "statscore-matrix-registry.js",
            "statscore-production-matrix.js",
            "statscore-academic-matrix.js",
            "statscore-runtime-state-engine.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Composite remains COMPOSITE_PENDING. The dashboard may present approved category outputs but may not manufacture an overall score."
        },

        athlete_profile_status: {
          component_id:
            "SC_COMPONENT_ATHLETE_PROFILE_STATUS",

          component_type:
            COMPONENT_TYPE.STATUS_CARD,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label: "Profile Status",

          user_question:
            "What is complete and what still requires attention?",

          purpose:
            "Presents governed profile-completion and record-maintenance status without manufacturing recommendations.",

          presentation_owner:
            OWNER_STREAM.STREAM_3,

          source_authorities: [
            SOURCE_AUTHORITY.ATHLETE_SOURCE_RECORD,
            SOURCE_AUTHORITY.ATHLETE_INTELLIGENCE
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "player-profile.html"
          },

          secondary_destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "snapshot-intake.html"
          },

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "athlete_id",
            "snapshot_id"
          ],

          verified_dependencies: [
            "statscore-snapshot-intake-engine.js",
            "statscore-dynamic-athlete-engine.js",
            "statscore-runtime-state-engine.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "The card consumes governed completeness and maintenance status. It does not create source-record identifiers or calculate an unapproved action plan."
        },

        athletic_production_summary: {
          component_id:
            "SC_COMPONENT_ATHLETIC_PRODUCTION_SUMMARY",

          component_type:
            COMPONENT_TYPE.SUMMARY_CARD,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label:
            "Athletic Production",

          user_question:
            "What does my verified athletic evidence show?",

          purpose:
            "Presents approved athletic production and trait summaries supplied by governed intelligence outputs.",

          presentation_owner:
            OWNER_STREAM.STREAM_3,

          source_authorities: [
            SOURCE_AUTHORITY.ATHLETE_INTELLIGENCE,
            SOURCE_AUTHORITY.SCORE_AUTHORITY,
            SOURCE_AUTHORITY.VERIFICATION_AUTHORITY
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "player-profile.html"
          },

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "athlete_id",
            "snapshot_id"
          ],

          verified_dependencies: [
            "statscore-production-matrix.js",
            "statscore-trait-render-engine.js",
            "statscore-evidence-engine.js",
            "statscore-verification-engine.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Presents governed production and evidence outputs. The dashboard does not calculate production scores or treat unverified claims as final truth."
        },

        academic_status_summary: {
          component_id:
            "SC_COMPONENT_ACADEMIC_STATUS_SUMMARY",

          component_type:
            COMPONENT_TYPE.SUMMARY_CARD,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label: "Academic Status",

          user_question:
            "What is my current governed academic standing?",

          purpose:
            "Presents approved academic status and available explanation without merging academic and athletic authority.",

          presentation_owner:
            OWNER_STREAM.STREAM_3,

          source_authorities: [
            SOURCE_AUTHORITY.SCORE_AUTHORITY,
            SOURCE_AUTHORITY.ATHLETE_SOURCE_RECORD
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "player-profile.html"
          },

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "athlete_id",
            "snapshot_id"
          ],

          verified_dependencies: [
            "statscore-academic-matrix.js",
            "statscore-stream-9-authority.js",
            "statscore-runtime-state-engine.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Academic status remains a distinct governed pathway. The dashboard does not manufacture eligibility determinations or combine academic status into an unapproved composite."
        },

        evidence_and_verification: {
          component_id:
            "SC_COMPONENT_EVIDENCE_VERIFICATION",

          component_type:
            COMPONENT_TYPE.NAVIGATION_CARD,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label:
            "Evidence & Verification",

          user_question:
            "What evidence is verified and what still requires review?",

          purpose:
            "Presents governed evidence and verification status and exposes the registered verification-request destination.",

          presentation_owner:
            OWNER_STREAM.STREAM_3,

          source_authorities: [
            SOURCE_AUTHORITY.VERIFICATION_AUTHORITY,
            SOURCE_AUTHORITY.ATHLETE_SOURCE_RECORD
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "verification-request.html"
          },

          secondary_destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "player-profile.html"
          },

          access_class:
            ACCESS_CLASS.GOVERNED_ACTION,

          required_runtime_context: [
            "runtime_id",
            "athlete_id",
            "snapshot_id"
          ],

          verified_dependencies: [
            "statscore-verification-engine.js",
            "statscore-evidence-engine.js",
            "statscore-role-access.js",
            "statscore-routing.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Component existence does not authorize a verification request. Access Authority and Verification Authority remain controlling."
        },

        governed_communication: {
          component_id:
            "SC_COMPONENT_GOVERNED_COMMUNICATION",

          component_type:
            COMPONENT_TYPE.NAVIGATION_CARD,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label: "Multi-Box",

          user_question:
            "Who can I communicate with through the governed system?",

          purpose:
            "Exposes the registered communication surface while preserving Stream 6 sender, recipient, window, guardian, and receipt authority.",

          presentation_owner:
            OWNER_STREAM.STREAM_3,

          source_authorities: [
            SOURCE_AUTHORITY.COMMUNICATION_GOVERNANCE,
            SOURCE_AUTHORITY.RUNTIME_AUTHORITY
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "multi-box.html"
          },

          access_class:
            ACCESS_CLASS.GOVERNED_COMMUNICATION,

          required_runtime_context: [
            "runtime_id",
            "athlete_id",
            "snapshot_id"
          ],

          verified_dependencies: [
            "statscore-communication-engine.js",
            "statscore-multibox-governance-engine.js",
            "sc-receipt-ledger-engine.js",
            "statscore-role-access.js",
            "statscore-routing.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Multi-Box remains a governed communication surface. The dashboard card does not determine recipients, communication windows, guardian permission, offers, or commitments."
        },

        exposure_status: {
          component_id:
            "SC_COMPONENT_EXPOSURE_STATUS",

          component_type:
            COMPONENT_TYPE.STATUS_CARD,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label: "Exposure Status",

          user_question:
            "How visible is my governed athlete profile?",

          purpose:
            "Presents governed exposure status without treating exposure as recruiting interest.",

          presentation_owner:
            OWNER_STREAM.STREAM_3,

          source_authorities: [
            SOURCE_AUTHORITY.CRYSTAL_EXPOSURE_MEDIA
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "player-profile.html"
          },

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "athlete_id",
            "snapshot_id"
          ],

          verified_dependencies: [
            "statscore-phnx-media-engine.js",
            "statscore-runtime-state-engine.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.FUNCTIONAL_ACTIVATION_REQUIRED,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Exposure status may describe visibility or media distribution only. It must not imply verified interest, communication, offer, or commitment."
        },

        recruiting_interest_status: {
          component_id:
            "SC_COMPONENT_RECRUITING_INTEREST_STATUS",

          component_type:
            COMPONENT_TYPE.STATUS_CARD,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label:
            "Recruiting Interest Status",

          user_question:
            "What verified recruiting-interest signals exist?",

          purpose:
            "Presents governed recruiting-interest status as a distinct signal class separate from exposure and communication.",

          presentation_owner:
            OWNER_STREAM.STREAM_3,

          source_authorities: [
            SOURCE_AUTHORITY.ATHLETE_INTELLIGENCE
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "player-profile.html"
          },

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "athlete_id",
            "snapshot_id"
          ],

          verified_dependencies: [
            "statscore-signal-governance.js",
            "statscore-runtime-state-engine.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.FUNCTIONAL_ACTIVATION_REQUIRED,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Recruiting interest must remain distinct from exposure, profile views, communication, offers, and commitments. Only governed interest classifications may be displayed."
        },

        crystal_intelligence_status: {
          component_id:
            "SC_COMPONENT_CRYSTAL_INTELLIGENCE_STATUS",

          component_type:
            COMPONENT_TYPE.STATUS_CARD,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label:
            "Crystal Intelligence",

          user_question:
            "Is a governed intelligence report available for my record?",

          purpose:
            "Presents Crystal artifact availability while routing only to an active registered destination.",

          presentation_owner:
            OWNER_STREAM.STREAM_3,

          source_authorities: [
            SOURCE_AUTHORITY.CRYSTAL_EXPOSURE_MEDIA,
            SOURCE_AUTHORITY.ATHLETE_INTELLIGENCE
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "player-profile.html"
          },

          planned_destination: {
            status:
              DESTINATION_STATUS.PLANNED_DESTINATION,

            page: "crystal-report.html",

            active: false
          },

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "athlete_id",
            "snapshot_id"
          ],

          verified_dependencies: [
            "statscore-crystal-engine.js",
            "statscore-crystal-reports.js",
            "statscore-runtime-state-engine.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "The historically referenced Crystal Report page is not an active Page Registry destination in this registry version. Player Profile remains the active explainability destination."
        },

        maintain_athlete_record: {
          component_id:
            "SC_COMPONENT_MAINTAIN_ATHLETE_RECORD",

          component_type:
            COMPONENT_TYPE.ACTION_CARD,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label:
            "Review Athlete Intake",

          user_question:
            "What source-record information should I review or maintain?",

          purpose:
            "Exposes the governed Snapshot Intake maintenance destination from the Athlete Dashboard.",

          presentation_owner:
            OWNER_STREAM.STREAM_3,

          action_authority:
            SOURCE_AUTHORITY.ATHLETE_SOURCE_RECORD,

          source_authorities: [
            SOURCE_AUTHORITY.ATHLETE_SOURCE_RECORD,
            SOURCE_AUTHORITY.RUNTIME_AUTHORITY
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "snapshot-intake.html"
          },

          access_class:
            ACCESS_CLASS.GOVERNED_ACTION,

          required_runtime_context: [
            "runtime_id",
            "athlete_id",
            "snapshot_id"
          ],

          verified_dependencies: [
            "statscore-snapshot-intake-engine.js",
            "statscore-role-access.js",
            "statscore-routing.js",
            "statscore-runtime-state-engine.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Returning athletes enter Snapshot Intake through this governed maintenance action. Stream 2 remains the source-record authority."
        }
      }
    },

    professional_dashboard: {
      dashboard_id:
        "SC_DASHBOARD_PROFESSIONAL",

      canonical_page:
        "role-dashboard.html",

      registration_status:
        REGISTRATION_STATUS.REGISTERED_ACTIVE,

      dashboard_type:
        DASHBOARD_TYPE.WORKSPACE_OPERATIONS_DASHBOARD,

      owner_stream:
        OWNER_STREAM.STREAM_5,

      presentation_authority:
        SOURCE_AUTHORITY.PROFESSIONAL_OPERATIONS,

      access_class:
        ACCESS_CLASS.AUTHENTICATED_DASHBOARD,

      construction_status:
        CONSTRUCTION_STATUS.PARTIAL,

      operational_status:
        OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

      audit_status:
        AUDIT_STATUS.PENDING,

      supported_roles: [
        "parent",
        "coach",
        "counselor",
        "recruiter",
        "evaluator",
        "program",
        "trainer"
      ],

      required_runtime_context: [
        "runtime_id",
        "role_id",
        "workspace_id"
      ],

      verified_dependencies: [
        "statscore-active-workspace-engine.js",
        "statscore-runtime-state-engine.js",
        "statscore-routing.js",
        "statscore-role-access.js",
        "statscore-page-map.js",
        "statscore-dashboard-map.js"
      ],

      doctrine:
        "Professional Dashboard is a shared workspace operations consumer. It presents modules according to authenticated role, governed professional identity, active_workspace_id, credential state, permission state, assignment context, and Access Authority decisions.",

      components: {
        active_workspace_context: {
          component_id:
            "SC_COMPONENT_ACTIVE_WORKSPACE_CONTEXT",

          component_type:
            COMPONENT_TYPE.IDENTITY_HEADER,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label:
            "Active Professional Workspace",

          user_question:
            "Which governed professional workspace is currently active?",

          purpose:
            "Presents the active professional identity and workspace context supplied by Stream 4 and Runtime Authority.",

          presentation_owner:
            OWNER_STREAM.STREAM_5,

          source_authorities: [
            SOURCE_AUTHORITY.PROFESSIONAL_ROLE_INTAKE,
            SOURCE_AUTHORITY.RUNTIME_AUTHORITY
          ],

          destination: {
            status:
              DESTINATION_STATUS.NON_NAVIGABLE_COMPONENT,

            page: null
          },

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "role_id",
            "workspace_id"
          ],

          value_visibility: {
            role:
              VALUE_VISIBILITY.USER_VISIBLE,

            workspace_id:
              VALUE_VISIBILITY.DIAGNOSTIC_ONLY,

            credential_status:
              VALUE_VISIBILITY.GOVERNED_VISIBLE,

            organization_id:
              VALUE_VISIBILITY.GOVERNED_VISIBLE
          },

          verified_dependencies: [
            "statscore-active-workspace-engine.js",
            "statscore-runtime-state-engine.js",
            "statscore-role-access.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Consumes active workspace context. It does not create professional identity, role_id, or workspace_id."
        },

        parent_workspace_module: {
          component_id:
            "SC_COMPONENT_PARENT_WORKSPACE_MODULE",

          component_type:
            COMPONENT_TYPE.WORKSPACE_MODULE,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label: "Parent Workspace",

          user_question:
            "What authorized parent or guardian operations are available?",

          purpose:
            "Exposes the registered parent workspace to an authenticated parent with governed workspace and resource authority.",

          presentation_owner:
            OWNER_STREAM.STREAM_5,

          source_authorities: [
            SOURCE_AUTHORITY.PROFESSIONAL_OPERATIONS,
            SOURCE_AUTHORITY.RUNTIME_AUTHORITY
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "parent.html"
          },

          supported_roles: ["parent"],

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "role_id",
            "workspace_id"
          ],

          verified_dependencies: [
            "statscore-active-workspace-engine.js",
            "statscore-role-access.js",
            "statscore-routing.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Role match alone is insufficient. Access remains governed by active workspace and assigned-resource context."
        },

        coach_workspace_module: {
          component_id:
            "SC_COMPONENT_COACH_WORKSPACE_MODULE",

          component_type:
            COMPONENT_TYPE.WORKSPACE_MODULE,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label: "Coach Workspace",

          user_question:
            "What authorized coach operations are available?",

          purpose:
            "Exposes the registered coach workspace to an authenticated coach with governed workspace authority.",

          presentation_owner:
            OWNER_STREAM.STREAM_5,

          source_authorities: [
            SOURCE_AUTHORITY.PROFESSIONAL_OPERATIONS,
            SOURCE_AUTHORITY.RUNTIME_AUTHORITY
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "coach.html"
          },

          supported_roles: ["coach"],

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "role_id",
            "workspace_id"
          ],

          verified_dependencies: [
            "statscore-active-workspace-engine.js",
            "statscore-role-access.js",
            "statscore-routing.js",
            "statscore-verification-engine.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Coach is a contributor and consumer. Coach input does not become final athlete truth without governed evidence."
        },

        counselor_workspace_module: {
          component_id:
            "SC_COMPONENT_COUNSELOR_WORKSPACE_MODULE",

          component_type:
            COMPONENT_TYPE.WORKSPACE_MODULE,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label:
            "Counselor Workspace",

          user_question:
            "What authorized counselor operations are available?",

          purpose:
            "Exposes the registered counselor workspace to an authenticated counselor with governed workspace authority.",

          presentation_owner:
            OWNER_STREAM.STREAM_5,

          source_authorities: [
            SOURCE_AUTHORITY.PROFESSIONAL_OPERATIONS,
            SOURCE_AUTHORITY.RUNTIME_AUTHORITY
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "counselor.html"
          },

          supported_roles: ["counselor"],

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "role_id",
            "workspace_id"
          ],

          verified_dependencies: [
            "statscore-active-workspace-engine.js",
            "statscore-role-access.js",
            "statscore-routing.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Counselor operations consume governed workspace, permission, and assigned-athlete context."
        },

        recruiter_workspace_module: {
          component_id:
            "SC_COMPONENT_RECRUITER_WORKSPACE_MODULE",

          component_type:
            COMPONENT_TYPE.WORKSPACE_MODULE,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label:
            "Recruiter Workspace",

          user_question:
            "What governed recruiter access is available?",

          purpose:
            "Exposes the registered recruiter-access surface to an authenticated recruiter after access and resource evaluation.",

          presentation_owner:
            OWNER_STREAM.STREAM_5,

          source_authorities: [
            SOURCE_AUTHORITY.PROFESSIONAL_OPERATIONS,
            SOURCE_AUTHORITY.RUNTIME_AUTHORITY
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "recruiter-access.html"
          },

          supported_roles: ["recruiter"],

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "role_id",
            "workspace_id"
          ],

          verified_dependencies: [
            "statscore-active-workspace-engine.js",
            "statscore-role-access.js",
            "statscore-routing.js",
            "statscore-signal-governance.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Recruiter role does not itself establish athlete access, visibility, interest, communication, offer, or commitment."
        },

        evaluator_workspace_module: {
          component_id:
            "SC_COMPONENT_EVALUATOR_WORKSPACE_MODULE",

          component_type:
            COMPONENT_TYPE.WORKSPACE_MODULE,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label:
            "Evaluator Workspace",

          user_question:
            "What governed evaluation operations are available?",

          purpose:
            "Exposes the registered evaluator workspace to an authenticated evaluator with governed workspace and resource authority.",

          presentation_owner:
            OWNER_STREAM.STREAM_5,

          source_authorities: [
            SOURCE_AUTHORITY.PROFESSIONAL_OPERATIONS,
            SOURCE_AUTHORITY.VERIFICATION_AUTHORITY
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "evaluator.html"
          },

          secondary_destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "verification-review.html"
          },

          supported_roles: ["evaluator"],

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "role_id",
            "workspace_id"
          ],

          verified_dependencies: [
            "statscore-active-workspace-engine.js",
            "statscore-evaluator-engine.js",
            "statscore-verification-engine.js",
            "statscore-role-access.js",
            "statscore-routing.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Evaluation and verification-review authority remain governed and resource-bound."
        },

        program_workspace_module: {
          component_id:
            "SC_COMPONENT_PROGRAM_WORKSPACE_MODULE",

          component_type:
            COMPONENT_TYPE.WORKSPACE_MODULE,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label:
            "Program Workspace",

          user_question:
            "What governed program operations are available?",

          purpose:
            "Exposes the registered program workspace under active workspace, organization, permission, and population context.",

          presentation_owner:
            OWNER_STREAM.STREAM_5,

          source_authorities: [
            SOURCE_AUTHORITY.PROFESSIONAL_OPERATIONS,
            SOURCE_AUTHORITY.RUNTIME_AUTHORITY
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "program.html"
          },

          supported_roles: ["program"],

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "role_id",
            "workspace_id"
          ],

          verified_dependencies: [
            "statscore-active-workspace-engine.js",
            "statscore-role-access.js",
            "statscore-routing.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Program access remains governed by active workspace, organization, assigned population, and resource authority."
        },

        trainer_workspace_module: {
          component_id:
            "SC_COMPONENT_TRAINER_WORKSPACE_MODULE",

          component_type:
            COMPONENT_TYPE.WORKSPACE_MODULE,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label:
            "Trainer Workspace",

          user_question:
            "What governed trainer operations are available?",

          purpose:
            "Exposes the registered trainer workspace to an authenticated trainer with governed workspace authority.",

          presentation_owner:
            OWNER_STREAM.STREAM_5,

          source_authorities: [
            SOURCE_AUTHORITY.PROFESSIONAL_OPERATIONS,
            SOURCE_AUTHORITY.RUNTIME_AUTHORITY
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "trainer.html"
          },

          supported_roles: ["trainer"],

          access_class:
            ACCESS_CLASS.GOVERNED_RESOURCE,

          required_runtime_context: [
            "runtime_id",
            "role_id",
            "workspace_id"
          ],

          verified_dependencies: [
            "statscore-active-workspace-engine.js",
            "statscore-role-access.js",
            "statscore-routing.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "Trainer is a canonical professional role and remains governed by active workspace and assigned-resource context."
        },

        professional_multibox_module: {
          component_id:
            "SC_COMPONENT_PROFESSIONAL_MULTIBOX_MODULE",

          component_type:
            COMPONENT_TYPE.WORKSPACE_MODULE,

          registration_status:
            REGISTRATION_STATUS.REGISTERED_ACTIVE,

          label:
            "Multi-Box Communication",

          user_question:
            "What governed communications are available from this workspace?",

          purpose:
            "Exposes the registered Multi-Box surface while preserving Stream 6 sender, recipient, window, guardian, and receipt authority.",

          presentation_owner:
            OWNER_STREAM.STREAM_5,

          source_authorities: [
            SOURCE_AUTHORITY.COMMUNICATION_GOVERNANCE,
            SOURCE_AUTHORITY.RUNTIME_AUTHORITY
          ],

          destination: {
            status:
              DESTINATION_STATUS.ACTIVE_REGISTERED_DESTINATION,

            page: "multi-box.html"
          },

          supported_roles: [
            "parent",
            "coach",
            "counselor",
            "recruiter",
            "evaluator",
            "program",
            "trainer"
          ],

          access_class:
            ACCESS_CLASS.GOVERNED_COMMUNICATION,

          required_runtime_context: [
            "runtime_id",
            "role_id",
            "workspace_id"
          ],

          verified_dependencies: [
            "statscore-communication-engine.js",
            "statscore-multibox-governance-engine.js",
            "sc-receipt-ledger-engine.js",
            "statscore-role-access.js",
            "statscore-routing.js"
          ],

          construction_status:
            CONSTRUCTION_STATUS.PARTIAL,

          operational_status:
            OPERATIONAL_STATUS.FUNCTIONAL_ACTIVATION_PENDING,

          doctrine:
            "The professional dashboard does not determine recipients, windows, permissions, offers, or commitments."
        }
      }
    }
  });

  /*
  ========================================================
  NON-ACTIVE REGISTRIES
  ========================================================

  Future, missing, unverified, or deprecated dashboard
  components must not appear in the active registry.
  ========================================================
  */

  const PLANNED_DASHBOARD_REGISTRY =
    deepFreeze({});

  const DEPRECATED_DASHBOARD_REGISTRY =
    deepFreeze({});

  /*
  ========================================================
  REQUIRED REGISTRY ENTITIES
  ========================================================
  */

  const REQUIRED_DASHBOARDS = deepFreeze([
    "athlete_dashboard",
    "professional_dashboard"
  ]);

  const REQUIRED_DASHBOARD_FIELDS = deepFreeze([
    "dashboard_id",
    "canonical_page",
    "registration_status",
    "dashboard_type",
    "owner_stream",
    "presentation_authority",
    "access_class",
    "construction_status",
    "operational_status",
    "audit_status",
    "supported_roles",
    "required_runtime_context",
    "verified_dependencies",
    "doctrine",
    "components"
  ]);

  const REQUIRED_COMPONENT_FIELDS = deepFreeze([
    "component_id",
    "component_type",
    "registration_status",
    "label",
    "user_question",
    "purpose",
    "presentation_owner",
    "source_authorities",
    "destination",
    "access_class",
    "required_runtime_context",
    "verified_dependencies",
    "construction_status",
    "operational_status",
    "doctrine"
  ]);

  const VALID_HTML_FILENAME_PATTERN =
    /^[a-z0-9][a-z0-9-]*\.html$/;

  const VALID_JS_FILENAME_PATTERN =
    /^(?:sc|statscore)-[a-z0-9-]+\.js$/;

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

    Object.getOwnPropertyNames(value).forEach(
      key => {
        deepFreeze(value[key]);
      }
    );

    return Object.freeze(value);
  }

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(
        JSON.stringify(value)
      );
    }
  }

  function clean(value) {
    return String(value ?? "").trim();
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function normalizeRole(value) {
    const role =
      clean(value).toLowerCase();

    if (role === "administrator") {
      return "admin";
    }

    return role;
  }

  function isKnownRole(role) {
    return SUPPORTED_ROLES.includes(
      normalizeRole(role)
    );
  }

  function isKnownRuntimeField(field) {
    return RUNTIME_CONTEXT_FIELDS.includes(
      clean(field)
    );
  }

  function normalizeFilename(value) {
    const raw = clean(value);

    if (!raw) {
      return "";
    }

    let url;

    try {
      url = new URL(
        raw,
        window.location.href
      );
    } catch (_) {
      return raw.toLowerCase();
    }

    if (
      url.origin !==
      window.location.origin
    ) {
      return "";
    }

    return (
      url.pathname
        .split("/")
        .filter(Boolean)
        .pop() ||
      "index.html"
    ).toLowerCase();
  }

  function isVerifiedDependency(filename) {
    return Object.prototype
      .hasOwnProperty.call(
        VERIFIED_DEPENDENCY_CATALOG,
        clean(filename)
      );
  }

  function getPageMapAuthority() {
    return (
      window.STATScorePageMap ||
      window.STATScore?.PageMap ||
      null
    );
  }

  function validateDestinationWithPageMap(
    destination
  ) {
    const filename =
      normalizeFilename(destination);

    if (!filename) {
      return {
        valid: false,
        registered: false,
        filename: null,
        reason:
          "Destination filename is invalid."
      };
    }

    const pageMap =
      getPageMapAuthority();

    if (
      !pageMap ||
      typeof pageMap
        .isRegisteredDestination !==
        "function"
    ) {
      return {
        valid: false,
        registered: false,
        filename,
        reason:
          "Page Registry Authority is unavailable."
      };
    }

    const registered =
      pageMap.isRegisteredDestination(
        filename
      );

    return {
      valid: registered,
      registered,
      filename,

      reason: registered
        ? "Destination is active in the Page Registry."
        : "Destination is not active in the Page Registry."
    };
  }

  /*
  ========================================================
  QUERY SERVICES
  ========================================================
  */

  function isRegisteredDashboard(
    dashboardReference
  ) {
    const reference =
      clean(dashboardReference);

    if (!reference) {
      return false;
    }

    if (
      Object.prototype
        .hasOwnProperty.call(
          DASHBOARD_REGISTRY,
          reference
        )
    ) {
      return true;
    }

    const filename =
      normalizeFilename(reference);

    return Object.values(
      DASHBOARD_REGISTRY
    ).some(
      dashboard =>
        dashboard.canonical_page ===
        filename
    );
  }

  function getDashboard(
    dashboardReference
  ) {
    const reference =
      clean(dashboardReference);

    if (!reference) {
      return null;
    }

    if (
      Object.prototype
        .hasOwnProperty.call(
          DASHBOARD_REGISTRY,
          reference
        )
    ) {
      return clone(
        DASHBOARD_REGISTRY[reference]
      );
    }

    const filename =
      normalizeFilename(reference);

    const dashboard =
      Object.values(
        DASHBOARD_REGISTRY
      ).find(
        entry =>
          entry.canonical_page ===
          filename ||
          entry.dashboard_id ===
          reference
      );

    return clone(
      dashboard || null
    );
  }

  function getDashboards() {
    return clone(
      Object.values(
        DASHBOARD_REGISTRY
      )
    );
  }

  function getDashboardKeys() {
    return Object.keys(
      DASHBOARD_REGISTRY
    );
  }

  function getDashboardCount() {
    return Object.keys(
      DASHBOARD_REGISTRY
    ).length;
  }

  function getComponentsForDashboard(
    dashboardReference
  ) {
    const dashboard =
      getDashboard(
        dashboardReference
      );

    if (!dashboard) {
      return [];
    }

    return clone(
      Object.values(
        dashboard.components
      )
    );
  }

  function getComponent(
    componentReference
  ) {
    const reference =
      clean(componentReference);

    if (!reference) {
      return null;
    }

    for (
      const dashboard of
      Object.values(
        DASHBOARD_REGISTRY
      )
    ) {
      for (
        const [
          componentKey,
          component
        ] of Object.entries(
          dashboard.components
        )
      ) {
        if (
          componentKey === reference ||
          component.component_id ===
            reference
        ) {
          return clone({
            dashboard_id:
              dashboard.dashboard_id,

            dashboard_page:
              dashboard.canonical_page,

            component_key:
              componentKey,

            ...component
          });
        }
      }
    }

    return null;
  }

  function getComponentCount() {
    return Object.values(
      DASHBOARD_REGISTRY
    ).reduce(
      (total, dashboard) =>
        total +
        Object.keys(
          dashboard.components
        ).length,
      0
    );
  }

  function getComponentsByType(
    componentType
  ) {
    const type =
      clean(componentType);

    const matches = [];

    Object.values(
      DASHBOARD_REGISTRY
    ).forEach(dashboard => {
      Object.entries(
        dashboard.components
      ).forEach(
        ([
          componentKey,
          component
        ]) => {
          if (
            component.component_type ===
            type
          ) {
            matches.push({
              dashboard_id:
                dashboard.dashboard_id,

              dashboard_page:
                dashboard.canonical_page,

              component_key:
                componentKey,

              ...clone(component)
            });
          }
        }
      );
    });

    return matches;
  }

  function getComponentsBySourceAuthority(
    sourceAuthority
  ) {
    const authority =
      clean(sourceAuthority);

    const matches = [];

    Object.values(
      DASHBOARD_REGISTRY
    ).forEach(dashboard => {
      Object.entries(
        dashboard.components
      ).forEach(
        ([
          componentKey,
          component
        ]) => {
          if (
            component
              .source_authorities
              .includes(authority)
          ) {
            matches.push({
              dashboard_id:
                dashboard.dashboard_id,

              dashboard_page:
                dashboard.canonical_page,

              component_key:
                componentKey,

              ...clone(component)
            });
          }
        }
      );
    });

    return matches;
  }

  function getComponentsForRole(
    role
  ) {
    const normalizedRole =
      normalizeRole(role);

    if (
      !isKnownRole(
        normalizedRole
      )
    ) {
      return [];
    }

    const results = [];

    Object.values(
      DASHBOARD_REGISTRY
    ).forEach(dashboard => {
      if (
        dashboard.supported_roles
          .length > 0 &&
        !dashboard.supported_roles
          .includes(normalizedRole)
      ) {
        return;
      }

      Object.entries(
        dashboard.components
      ).forEach(
        ([
          componentKey,
          component
        ]) => {
          const componentRoles =
            Array.isArray(
              component.supported_roles
            )
              ? component.supported_roles
              : dashboard
                  .supported_roles;

          if (
            componentRoles.length === 0 ||
            componentRoles.includes(
              normalizedRole
            )
          ) {
            results.push({
              dashboard_id:
                dashboard.dashboard_id,

              dashboard_page:
                dashboard.canonical_page,

              component_key:
                componentKey,

              ...clone(component)
            });
          }
        }
      );
    });

    return results;
  }

  function getActiveDestination(
    componentReference
  ) {
    const component =
      getComponent(
        componentReference
      );

    if (!component) {
      return null;
    }

    if (
      component.destination
        ?.status !==
      DESTINATION_STATUS
        .ACTIVE_REGISTERED_DESTINATION
    ) {
      return null;
    }

    const validation =
      validateDestinationWithPageMap(
        component.destination.page
      );

    if (!validation.valid) {
      return null;
    }

    return validation.filename;
  }

  function getVerifiedDependencies(
    dashboardOrComponentReference
  ) {
    const dashboard =
      getDashboard(
        dashboardOrComponentReference
      );

    if (dashboard) {
      return clone(
        dashboard
          .verified_dependencies
      );
    }

    const component =
      getComponent(
        dashboardOrComponentReference
      );

    return component
      ? clone(
          component
            .verified_dependencies
        )
      : [];
  }

  function getDependency(
    filename
  ) {
    return clone(
      VERIFIED_DEPENDENCY_CATALOG[
        clean(filename)
      ] || null
    );
  }

  function getDependencyCatalog() {
    return clone(
      VERIFIED_DEPENDENCY_CATALOG
    );
  }

  function getPlannedDashboards() {
    return clone(
      Object.values(
        PLANNED_DASHBOARD_REGISTRY
      )
    );
  }

  function getDeprecatedDashboards() {
    return clone(
      Object.values(
        DEPRECATED_DASHBOARD_REGISTRY
      )
    );
  }

  /*
  ========================================================
  VALIDATION
  ========================================================
  */

  function validateRegistry() {
    const errors = [];
    const warnings = [];

    const dashboardKeys =
      Object.keys(
        DASHBOARD_REGISTRY
      );

    const dashboardIds =
      new Set();

    const componentIds =
      new Set();

    const pageMap =
      getPageMapAuthority();

    REQUIRED_DASHBOARDS
      .forEach(
        dashboardKey => {
          if (
            !Object.prototype
              .hasOwnProperty.call(
                DASHBOARD_REGISTRY,
                dashboardKey
              )
          ) {
            errors.push({
              code:
                "REQUIRED_DASHBOARD_MISSING",

              dashboard:
                dashboardKey,

              message:
                `Required dashboard is missing: ${dashboardKey}`
            });
          }
        }
      );

    if (
      dashboardKeys.length === 0
    ) {
      errors.push({
        code:
          "DASHBOARD_REGISTRY_EMPTY",

        message:
          "Dashboard Registry contains no active dashboards."
      });
    }

    if (
      !pageMap ||
      typeof pageMap
        .isRegisteredDestination !==
        "function"
    ) {
      errors.push({
        code:
          "PAGE_REGISTRY_AUTHORITY_UNAVAILABLE",

        message:
          "Dashboard Registry validation requires the approved Page Registry Authority."
      });
    }

    Object.entries(
      DASHBOARD_REGISTRY
    ).forEach(
      ([
        dashboardKey,
        dashboard
      ]) => {
        REQUIRED_DASHBOARD_FIELDS
          .forEach(field => {
            if (
              !Object.prototype
                .hasOwnProperty.call(
                  dashboard,
                  field
                )
            ) {
              errors.push({
                code:
                  "DASHBOARD_FIELD_MISSING",

                dashboard:
                  dashboardKey,

                field,

                message:
                  `Dashboard is missing required field ${field}: ${dashboardKey}`
              });
            }
          });

        if (
          !clean(
            dashboard.dashboard_id
          )
        ) {
          errors.push({
            code:
              "DASHBOARD_ID_MISSING",

            dashboard:
              dashboardKey,

            message:
              `Dashboard ID is missing: ${dashboardKey}`
          });
        } else if (
          dashboardIds.has(
            dashboard.dashboard_id
          )
        ) {
          errors.push({
            code:
              "DUPLICATE_DASHBOARD_ID",

            dashboard:
              dashboardKey,

            dashboard_id:
              dashboard.dashboard_id,

            message:
              `Duplicate dashboard ID: ${dashboard.dashboard_id}`
          });
        } else {
          dashboardIds.add(
            dashboard.dashboard_id
          );
        }

        if (
          !VALID_HTML_FILENAME_PATTERN
            .test(
              dashboard
                .canonical_page
            )
        ) {
          errors.push({
            code:
              "INVALID_DASHBOARD_PAGE",

            dashboard:
              dashboardKey,

            page:
              dashboard
                .canonical_page,

            message:
              `Dashboard canonical_page is invalid: ${dashboard.canonical_page}`
          });
        } else if (
          pageMap &&
          !pageMap
            .isRegisteredDestination(
              dashboard
                .canonical_page
            )
        ) {
          errors.push({
            code:
              "DASHBOARD_PAGE_NOT_REGISTERED",

            dashboard:
              dashboardKey,

            page:
              dashboard
                .canonical_page,

            message:
              `Dashboard page is not active in the Page Registry: ${dashboard.canonical_page}`
          });
        }

        if (
          dashboard
            .registration_status !==
          REGISTRATION_STATUS
            .REGISTERED_ACTIVE
        ) {
          errors.push({
            code:
              "ACTIVE_DASHBOARD_STATUS_INVALID",

            dashboard:
              dashboardKey,

            message:
              `Active dashboard must use REGISTERED_ACTIVE: ${dashboardKey}`
          });
        }

        if (
          !Object.values(
            DASHBOARD_TYPE
          ).includes(
            dashboard
              .dashboard_type
          )
        ) {
          errors.push({
            code:
              "INVALID_DASHBOARD_TYPE",

            dashboard:
              dashboardKey,

            message:
              `Unsupported dashboard type: ${dashboard.dashboard_type}`
          });
        }

        if (
          !Array.isArray(
            dashboard
              .supported_roles
          )
        ) {
          errors.push({
            code:
              "DASHBOARD_ROLES_INVALID",

            dashboard:
              dashboardKey,

            message:
              "supported_roles must be an array."
          });
        } else {
          const duplicateRoles =
            dashboard
              .supported_roles
              .filter(
                (
                  role,
                  index,
                  values
                ) =>
                  values.indexOf(
                    role
                  ) !== index
              );

          if (
            duplicateRoles.length >
            0
          ) {
            errors.push({
              code:
                "DUPLICATE_DASHBOARD_ROLE",

              dashboard:
                dashboardKey,

              roles:
                unique(
                  duplicateRoles
                ),

              message:
                `Dashboard contains duplicate supported roles: ${dashboardKey}`
            });
          }

          dashboard
            .supported_roles
            .forEach(role => {
              if (
                !isKnownRole(role)
              ) {
                errors.push({
                  code:
                    "UNKNOWN_DASHBOARD_ROLE",

                  dashboard:
                    dashboardKey,

                  role,

                  message:
                    `Dashboard contains unsupported role: ${role}`
                });
              }
            });
        }

        if (
          !Array.isArray(
            dashboard
              .required_runtime_context
          )
        ) {
          errors.push({
            code:
              "DASHBOARD_RUNTIME_CONTEXT_INVALID",

            dashboard:
              dashboardKey,

            message:
              "required_runtime_context must be an array."
          });
        } else {
          dashboard
            .required_runtime_context
            .forEach(field => {
              if (
                !isKnownRuntimeField(
                  field
                )
              ) {
                errors.push({
                  code:
                    "UNKNOWN_DASHBOARD_RUNTIME_FIELD",

                  dashboard:
                    dashboardKey,

                  field,

                  message:
                    `Unknown dashboard runtime-context field: ${field}`
                });
              }
            });
        }

        validateDependencies(
          dashboard
            .verified_dependencies,
          {
            type:
              "dashboard",

            owner:
              dashboardKey
          },
          errors
        );

        if (
          !dashboard.components ||
          typeof dashboard
            .components !==
            "object" ||
          Array.isArray(
            dashboard.components
          )
        ) {
          errors.push({
            code:
              "DASHBOARD_COMPONENTS_INVALID",

            dashboard:
              dashboardKey,

            message:
              "Dashboard components must be an object."
          });

          return;
        }

        if (
          Object.keys(
            dashboard.components
          ).length === 0
        ) {
          warnings.push({
            code:
              "DASHBOARD_HAS_NO_COMPONENTS",

            dashboard:
              dashboardKey,

            message:
              `Dashboard has no registered components: ${dashboardKey}`
          });
        }

        Object.entries(
          dashboard.components
        ).forEach(
          ([
            componentKey,
            component
          ]) => {
            REQUIRED_COMPONENT_FIELDS
              .forEach(field => {
                if (
                  !Object.prototype
                    .hasOwnProperty.call(
                      component,
                      field
                    )
                ) {
                  errors.push({
                    code:
                      "COMPONENT_FIELD_MISSING",

                    dashboard:
                      dashboardKey,

                    component:
                      componentKey,

                    field,

                    message:
                      `Component is missing required field ${field}: ${dashboardKey}.${componentKey}`
                  });
                }
              });

            if (
              !clean(
                component
                  .component_id
              )
            ) {
              errors.push({
                code:
                  "COMPONENT_ID_MISSING",

                dashboard:
                  dashboardKey,

                component:
                  componentKey,

                message:
                  `Component ID is missing: ${dashboardKey}.${componentKey}`
              });
            } else if (
              componentIds.has(
                component
                  .component_id
              )
            ) {
              errors.push({
                code:
                  "DUPLICATE_COMPONENT_ID",

                dashboard:
                  dashboardKey,

                component:
                  componentKey,

                component_id:
                  component
                    .component_id,

                message:
                  `Duplicate component ID: ${component.component_id}`
              });
            } else {
              componentIds.add(
                component
                  .component_id
              );
            }

            if (
              !Object.values(
                COMPONENT_TYPE
              ).includes(
                component
                  .component_type
              )
            ) {
              errors.push({
                code:
                  "INVALID_COMPONENT_TYPE",

                dashboard:
                  dashboardKey,

                component:
                  componentKey,

                message:
                  `Unsupported component type: ${component.component_type}`
              });
            }

            if (
              component
                .registration_status !==
              REGISTRATION_STATUS
                .REGISTERED_ACTIVE
            ) {
              errors.push({
                code:
                  "ACTIVE_COMPONENT_STATUS_INVALID",

                dashboard:
                  dashboardKey,

                component:
                  componentKey,

                message:
                  "Active component must use REGISTERED_ACTIVE."
              });
            }

            if (
              !clean(
                component
                  .user_question
              )
            ) {
              errors.push({
                code:
                  "COMPONENT_USER_QUESTION_MISSING",

                dashboard:
                  dashboardKey,

                component:
                  componentKey,

                message:
                  "Dashboard component must answer a defined user question."
              });
            }

            if (
              !Array.isArray(
                component
                  .source_authorities
              ) ||
              component
                .source_authorities
                .length === 0
            ) {
              errors.push({
                code:
                  "COMPONENT_SOURCE_AUTHORITY_MISSING",

                dashboard:
                  dashboardKey,

                component:
                  componentKey,

                message:
                  "Dashboard component must declare at least one source authority."
              });
            }

            validateDestination(
              component.destination,
              {
                dashboard:
                  dashboardKey,

                component:
                  componentKey,

                destination_field:
                  "destination"
              },
              errors,
              warnings
            );

            if (
              component
                .secondary_destination
            ) {
              validateDestination(
                component
                  .secondary_destination,
                {
                  dashboard:
                    dashboardKey,

                  component:
                    componentKey,

                  destination_field:
                    "secondary_destination"
...

[Message clipped]  View entire message
