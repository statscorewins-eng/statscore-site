/*!
* =============================================================================
* STATS-CORE™
* Master System Operations Map
* -----------------------------------------------------------------------------
* File:
*     statscore-system-operations-map.js
*
* Purpose:
*     Provide one operational authority map for STATS-CORE pages, engines,
*     ownership, dependencies, route flow, troubleshooting, and break detection.
*
* Doctrine:
*     This file DOES NOT calculate athlete intelligence.
*     This file DOES NOT render dashboards.
*     This file maps the system so failures, ownership, and dependencies
*     can be traced from one source.
*
* Version:
*     1.0.0
*
* Status:
*     OPERATIONAL FOUNDATION
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE = "statscore-system-operations-map.js";

    const STATSCORE_SYSTEM_OPERATIONS_MAP = Object.freeze({

        map_key: "STATSCORE_SYSTEM_OPERATIONS_MAP",
        map_name: "STATS-CORE Master System Operations Map",
        version: "1.0.0",
        status: "ACTIVE",

        doctrine: Object.freeze({
            one_page_system_visibility: true,
            one_owner_per_file_required: true,
            pages_do_not_own_engines: true,
            engines_do_not_own_pages: true,
            dashboards_consume_intelligence: true,
            scoring_authority_must_be_explicit: true,
            breakpoints_must_be_traceable: true
        }),

        pages: Object.freeze({

            "index.html": {
                owner_stream: "STREAM_1_PUBLIC_ACCESS_LOGIN",
                purpose: "Public entry page and system front door.",
                route_in: "public",
                route_out: ["login.html"],
                required_scripts: [],
                consumes: [],
                produces: ["public_access_intent"],
                failure_checks: [
                    "Page loads",
                    "Login route exists",
                    "Public access buttons route correctly"
                ]
            },

            "login.html": {
                owner_stream: "STREAM_1_PUBLIC_ACCESS_LOGIN",
                purpose: "User login, role identification, and route decision.",
                route_in: ["index.html"],
                route_out: [
                    "snapshot-intake.html",
                    "role-dashboard-intake.html",
                    "system.html"
                ],
                required_scripts: [
                    "statscore-data.js",
                    "statscore-routing.js"
                ],
                consumes: ["user_credentials", "role_selection"],
                produces: ["role", "role_id", "session_context"],
                failure_checks: [
                    "Supabase loaded",
                    "Role selected",
                    "Session created",
                    "Route decision executed"
                ]
            },

            "snapshot-intake.html": {
                owner_stream: "STREAM_2_ATHLETE_SOURCE_RECORD",
                purpose: "Create athlete source record and snapshot_id.",
                route_in: ["login.html"],
                route_out: [
                    "athlete-dashboard.html",
                    "player-profile.html",
                    "parent-approval.html"
                ],
                required_scripts: [
                    "statscore-data.js",
                    "statscore-routing.js"
                ],
                consumes: ["athlete_identity_input", "snapshot_form_input"],
                produces: ["athlete_id", "snapshot_id", "source_record"],
                failure_checks: [
                    "Form fields bind",
                    "Supabase insert succeeds",
                    "snapshot_id returned",
                    "localStorage snapshot_id saved",
                    "Next route receives snapshot_id"
                ]
            },

            "athlete-dashboard.html": {
                owner_stream: "STREAM_3_ATHLETE_INTELLIGENCE",
                purpose: "Primary athlete intelligence consumption and display dashboard.",
                route_in: ["snapshot-intake.html", "login.html"],
                route_out: [
                    "player-profile.html",
                    "athlete-production-record.html",
                    "multi-box.html",
                    "crystal-report.html"
                ],
                required_scripts: [
                    "statscore-data.js",
                    "statscore-doctrine.js",
                    "statscore-engine-registry.js",
                    "statscore-engine-execution.js",
                    "statscore-athlete-dashboard-engine.js"
                ],
                consumes: [
                    "snapshot_id",
                    "athlete_id",
                    "official_intelligence_package",
                    "production_summary",
                    "academic_summary",
                    "verification_summary"
                ],
                produces: [
                    "dashboard_render",
                    "intelligence_display",
                    "next_action_visibility"
                ],
                failure_checks: [
                    "snapshot_id exists",
                    "athlete_id resolves",
                    "required engines loaded",
                    "intelligence package available",
                    "DOM targets exist",
                    "dashboard render function executes"
                ]
            },

            "player-profile.html": {
                owner_stream: "STREAM_3_ATHLETE_INTELLIGENCE",
                purpose: "Explainable athlete profile consuming verified intelligence.",
                route_in: ["athlete-dashboard.html", "snapshot-intake.html"],
                route_out: ["crystal-report.html", "multi-box.html"],
                required_scripts: [
                    "statscore-data.js",
                    "statscore-explainability-engine.js"
                ],
                consumes: [
                    "snapshot_id",
                    "athlete_id",
                    "explainability",
                    "verification_status"
                ],
                produces: ["profile_render", "public_or_private_profile_view"],
                failure_checks: [
                    "snapshot_id exists",
                    "profile data loads",
                    "parent approval status checked",
                    "explainability object exists",
                    "profile sections render"
                ]
            },

            "athlete-production-record.html": {
                owner_stream: "STREAM_3_ATHLETE_INTELLIGENCE",
                purpose: "Verified season-by-season athlete production ledger.",
                route_in: ["athlete-dashboard.html"],
                route_out: ["athlete-dashboard.html", "player-profile.html"],
                required_scripts: [
                    "statscore-data.js",
                    "statscore-production-engine.js",
                    "statscore-production-router.js",
                    "statscore-athlete-production-record.js"
                ],
                consumes: ["snapshot_id", "athlete_id", "season_record_input"],
                produces: ["production_records", "career_totals", "production_receipt"],
                failure_checks: [
                    "snapshot_id exists",
                    "ledger container exists",
                    "production records query succeeds",
                    "ledger rows render",
                    "row click repopulates form",
                    "save/update succeeds"
                ]
            },

            "role-dashboard-intake.html": {
                owner_stream: "STREAM_4_ROLE_INTAKE",
                purpose: "Create non-athlete role identity and operating context.",
                route_in: ["login.html"],
                route_out: ["role-dashboard.html"],
                required_scripts: [
                    "statscore-data.js",
                    "statscore-routing.js"
                ],
                consumes: ["selected_role", "role_identity_input"],
                produces: ["role", "role_id", "role_context"],
                failure_checks: [
                    "Role selected",
                    "Role form validates",
                    "role_id created",
                    "role context stored",
                    "Route to role-dashboard.html succeeds"
                ]
            },

            "role-dashboard.html": {
                owner_stream: "STREAM_5_SHARED_ROLE_DASHBOARD_CRM",
                purpose: "Shared non-athlete role dashboard and CRM workspace.",
                route_in: ["role-dashboard-intake.html", "login.html"],
                route_out: [
                    "parent.html",
                    "coach.html",
                    "counselor.html",
                    "evaluator.html",
                    "program.html",
                    "recruiter-access.html",
                    "multi-box.html"
                ],
                required_scripts: [
                    "statscore-data.js",
                    "statscore-dashboard-map.js"
                ],
                consumes: ["role", "role_id", "role_context"],
                produces: ["role_workspace_render"],
                failure_checks: [
                    "role exists",
                    "role_id exists",
                    "role permissions load",
                    "correct role cards render",
                    "routes match role permissions"
                ]
            },

            "multi-box.html": {
                owner_stream: "STREAM_6_COMMUNICATION_GOVERNANCE",
                purpose: "Governed messaging, communication windows, receipts, and audit trail.",
                route_in: [
                    "athlete-dashboard.html",
                    "player-profile.html",
                    "role-dashboard.html"
                ],
                route_out: ["athlete-dashboard.html", "role-dashboard.html"],
                required_scripts: [
                    "statscore-data.js",
                    "statscore-communication-engine.js",
                    "statscore-compliance-engine.js"
                ],
                consumes: [
                    "role",
                    "role_id",
                    "athlete_id",
                    "snapshot_id",
                    "communication_window"
                ],
                produces: ["message_id", "message_receipt", "communication_audit"],
                failure_checks: [
                    "role context exists",
                    "target role selected",
                    "communication window checked",
                    "draft saves",
                    "send action creates receipt"
                ]
            },

            "crystal-report.html": {
                owner_stream: "STREAM_7_CRYSTAL_EXPOSURE_MEDIA",
                purpose: "Crystal Report generation and athlete intelligence packaging.",
                route_in: ["athlete-dashboard.html", "player-profile.html", "multi-box.html"],
                route_out: ["athlete-dashboard.html", "multi-box.html"],
                required_scripts: [
                    "statscore-data.js",
                    "statscore-crystal-engine.js",
                    "statscore-crystal-reports.js"
                ],
                consumes: [
                    "athlete_id",
                    "snapshot_id",
                    "official_intelligence_package",
                    "crystal_inputs"
                ],
                produces: ["crystal_report", "crystal_receipt"],
                failure_checks: [
                    "snapshot_id exists",
                    "Crystal engine loads",
                    "Crystal inputs exist",
                    "Report render target exists",
                    "Report generation succeeds"
                ]
            },

            "system.html": {
                owner_stream: "MASTER_INTEGRATION_STREAM",
                purpose: "Back-office administration, system oversight, health, registry, and operations.",
                route_in: ["login.html"],
                route_out: [
                    "index.html",
                    "login.html",
                    "athlete-dashboard.html",
                    "role-dashboard.html"
                ],
                required_scripts: [
                    "statscore-system-map.js",
                    "statscore-page-map.js",
                    "statscore-engine-registry.js",
                    "statscore-engine-loader.js",
                    "statscore-engine-health.js",
                    "statscore-system-operations-map.js"
                ],
                consumes: ["system_registry", "engine_registry", "page_registry"],
                produces: ["system_status", "health_report", "operations_map"],
                failure_checks: [
                    "System map loads",
                    "Page map loads",
                    "Engine registry loads",
                    "Health checks execute",
                    "Operations map renders"
                ]
            }

        }),

        engines: Object.freeze({

            "statscore-data.js": {
                owner_stream: "MASTER_INTEGRATION_STREAM",
                purpose: "Supabase connection and shared data access.",
                required_by: [
                    "login.html",
                    "snapshot-intake.html",
                    "athlete-dashboard.html",
                    "role-dashboard.html",
                    "multi-box.html",
                    "crystal-report.html",
                    "system.html"
                ],
                produces: ["supabase_client", "data_access"],
                failure_symptoms: [
                    "No data loads",
                    "snapshot_id cannot resolve",
                    "records fail to save"
                ]
            },

            "statscore-engine-registry.js": {
                owner_stream: "MASTER_INTEGRATION_STREAM",
                purpose: "Register official engines and expose system engine authority.",
                required_by: [
                    "athlete-dashboard.html",
                    "system.html"
                ],
                produces: ["engine_registry"],
                failure_symptoms: [
                    "Engines unavailable",
                    "Health checks cannot inspect engines",
                    "Execution layer cannot resolve engine"
                ]
            },

            "statscore-engine-execution.js": {
                owner_stream: "MASTER_INTEGRATION_STREAM",
                purpose: "Execute registered engines through governed runtime calls.",
                required_by: [
                    "athlete-dashboard.html",
                    "system.html"
                ],
                produces: ["engine_execution_result"],
                failure_symptoms: [
                    "Engine registered but not running",
                    "Dashboard receives no intelligence output"
                ]
            },

            "statscore-athlete-dashboard-engine.js": {
                owner_stream: "STREAM_3_ATHLETE_INTELLIGENCE",
                purpose: "Render Athlete Dashboard from official athlete intelligence outputs.",
                required_by: ["athlete-dashboard.html"],
                produces: ["dashboard_render"],
                failure_symptoms: [
                    "Dashboard shell loads but cards remain blank",
                    "Score ring does not update",
                    "Athlete context not displayed"
                ]
            },

            "statscore-production-engine.js": {
                owner_stream: "STREAM_3_ATHLETE_INTELLIGENCE",
                purpose: "Handle production record operations and production intelligence support.",
                required_by: [
                    "athlete-production-record.html",
                    "athlete-dashboard.html"
                ],
                produces: ["production_summary", "career_totals"],
                failure_symptoms: [
                    "Production ledger missing",
                    "Career totals blank",
                    "Season records do not populate"
                ]
            },

            "statscore-production-matrix.js": {
                owner_stream: "STREAM_3_ATHLETE_INTELLIGENCE",
                purpose: "Production scoring matrix under Phoenix Scoring Science Framework.",
                required_by: [
                    "athlete-dashboard.html",
                    "athlete-production-record.html"
                ],
                produces: ["production_score", "production_explanation"],
                failure_symptoms: [
                    "Production score missing",
                    "Production confidence missing",
                    "Composite score incomplete"
                ]
            },

            "statscore-academic-matrix.js": {
                owner_stream: "STREAM_3_ATHLETE_INTELLIGENCE",
                purpose: "Academic scoring matrix and academic standing intelligence.",
                required_by: ["athlete-dashboard.html", "player-profile.html"],
                produces: ["academic_score", "academic_explanation"],
                failure_symptoms: [
                    "Academic score missing",
                    "Eligibility support incomplete"
                ]
            },

            "statscore-explainability-engine.js": {
                owner_stream: "STREAM_3_ATHLETE_INTELLIGENCE",
                purpose: "Explain why scores, recommendations, and confidence outputs exist.",
                required_by: [
                    "athlete-dashboard.html",
                    "player-profile.html",
                    "crystal-report.html"
                ],
                produces: ["explainability"],
                failure_symptoms: [
                    "Score appears without reason",
                    "Crystal inputs incomplete",
                    "Profile explanation missing"
                ]
            },

            "statscore-crystal-engine.js": {
                owner_stream: "STREAM_7_CRYSTAL_EXPOSURE_MEDIA",
                purpose: "Prepare athlete intelligence for Crystal Report workflows.",
                required_by: ["crystal-report.html", "athlete-dashboard.html"],
                produces: ["crystal_inputs"],
                failure_symptoms: [
                    "Crystal report cannot generate",
                    "Crystal panel blank"
                ]
            },

            "statscore-communication-engine.js": {
                owner_stream: "STREAM_6_COMMUNICATION_GOVERNANCE",
                purpose: "Govern communication routing, messages, drafts, and receipts.",
                required_by: ["multi-box.html"],
                produces: ["communication_receipt"],
                failure_symptoms: [
                    "Message save fails",
                    "Send unavailable",
                    "Communication window not enforced"
                ]
            }

        }),

        core_flows: Object.freeze({

            athlete_primary_flow: [
                "index.html",
                "login.html",
                "snapshot-intake.html",
                "athlete-dashboard.html",
                "player-profile.html"
            ],

            athlete_production_flow: [
                "athlete-dashboard.html",
                "athlete-production-record.html",
                "statscore-production-engine.js",
                "statscore-production-matrix.js",
                "athlete-dashboard.html"
            ],

            intelligence_display_flow: [
                "snapshot_id",
                "athlete_id",
                "production_matrix",
                "academic_matrix",
                "verification",
                "explainability",
                "confidence",
                "STATScore",
                "athlete-dashboard.html"
            ],

            role_flow: [
                "login.html",
                "role-dashboard-intake.html",
                "role-dashboard.html",
                "role-specific workspace"
            ],

            communication_flow: [
                "athlete-dashboard.html",
                "multi-box.html",
                "statscore-communication-engine.js",
                "message_receipt"
            ],

            crystal_flow: [
                "athlete-dashboard.html",
                "statscore-crystal-engine.js",
                "crystal-report.html"
            ]

        }),

        troubleshooting: Object.freeze({

            athlete_dashboard_blank: [
                "Check snapshot_id in URL or localStorage.",
                "Check statscore-data.js loaded.",
                "Check Supabase client initialized.",
                "Check athlete-dashboard engine loaded.",
                "Check required DOM targets exist.",
                "Check intelligence package or fallback data returned.",
                "Check console errors."
            ],

            score_missing: [
                "Check scoring/matrix script loaded.",
                "Check athlete_id and snapshot_id exist.",
                "Check production records exist.",
                "Check academic records exist.",
                "Check matrix output returned.",
                "Check score render target exists."
            ],

            production_ledger_missing: [
                "Check snapshot_id.",
                "Check statscore_athlete_production_records table query.",
                "Check ledger container ID.",
                "Check renderProductionLedger function.",
                "Check row data shape."
            ],

            crystal_report_missing: [
                "Check crystal engine loaded.",
                "Check official intelligence or crystal inputs exist.",
                "Check report target container.",
                "Check route preserved snapshot_id."
            ],

            communication_failure: [
                "Check role context.",
                "Check target role.",
                "Check communication window status.",
                "Check compliance engine.",
                "Check message receipt creation."
            ]

        }),

        getPage: function (pageName) {
            return this.pages[pageName] || null;
        },

        getEngine: function (engineName) {
            return this.engines[engineName] || null;
        },

        listPages: function () {
            return Object.keys(this.pages);
        },

        listEngines: function () {
            return Object.keys(this.engines);
        },

        getPageDependencies: function (pageName) {
            const page = this.getPage(pageName);
            return page ? page.required_scripts : [];
        },

        getEngineConsumers: function (engineName) {
            const engine = this.getEngine(engineName);
            return engine ? engine.required_by : [];
        },

        getSystemStatus: function () {
            return {
                map_key: this.map_key,
                version: this.version,
                status: this.status,
                page_count: this.listPages().length,
                engine_count: this.listEngines().length,
                doctrine: this.doctrine
            };
        },

        inspectCurrentPage: function () {
            const path = global.location && global.location.pathname
                ? global.location.pathname.split("/").pop()
                : "";

            const pageName = path || "index.html";
            const page = this.getPage(pageName);

            return {
                current_page: pageName,
                registered: Boolean(page),
                page: page
            };
        }

    });

    global.STATScoreSystemOperationsMap = STATSCORE_SYSTEM_OPERATIONS_MAP;

    console.info("[STATS-CORE] System Operations Map loaded:", ENGINE);

})(window); 
