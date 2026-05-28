/* ============================================================
   STATScore™ Runtime Integration Test Pack
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Phase 1 System Validation → Engine Sync → Runtime Receipts
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-runtime-integration-test-pack";
  const VERSION = "v1.0-phase1-validation";

  const REQUIRED_ENGINES = [
    "STATScoreAthleteSearch",
    "STATScorePositionMatrixEngine",
    "STATScoreTraitRenderEngine",
    "STATScoreFootballScoringEngine",
    "STATScoreVerificationEngine",
    "STATScoreEvidenceEngine",
    "STATScoreReadinessEngine",
    "STATScorePathwayIntelligenceEngine",
    "STATScoreNCAAEligibilityIntelligenceEngine",
    "STATScoreCrystalReportEngine",
    "STATScoreProgramIntelligenceEngine",
    "STATScorePHNXRankingEngine",
    "STATScoreMultiBoxGovernanceEngine",
    "STATScoreCampCombineIntelligenceEngine",
    "STATScoreRecruiterVerificationEngine"
  ];

  function log(message, payload) {
    console.log(`[STATScore Runtime Test Pack] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Runtime Test Pack] ${message}`, payload || "");
  }

  function exists(path) {
    return !!window[path];
  }

  function now() {
    return new Date().toISOString();
  }

  function makeReceipt(type, result) {
    return {
      receipt_id:
        "runtime_test_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 8),

      engine_id: ENGINE_ID,
      version: VERSION,

      receipt_type: type,
      result,

      created_at: now()
    };
  }

  function checkEnginePresence() {
    const checks = REQUIRED_ENGINES.map((engineName) => ({
      engine: engineName,
      present: exists(engineName)
    }));

    const missing = checks.filter((item) => !item.present);

    return {
      ok: missing.length === 0,
      total_required: REQUIRED_ENGINES.length,
      total_present: checks.filter((item) => item.present).length,
      missing,
      checks
    };
  }

  function checkSharedRuntimeObjects() {
    const objects = {
      current_athlete:
        !!(
          window.STATScoreCurrentAthlete ||
          window.STATScoreCurrentSnapshot ||
          window.__STATSCORE_CURRENT_ATHLETE__
        ),

      football_score:
        !!window.STATScoreCurrentFootballScore,

      verification:
        !!window.STATScoreCurrentVerification,

      evidence:
        !!window.STATScoreCurrentEvidence,

      readiness:
        !!window.STATScoreCurrentReadiness,

      pathway:
        !!window.STATScoreCurrentPathway,

      ncaa_eligibility:
        !!window.STATScoreCurrentNCAAEligibility,

      crystal_report_html:
        !!window.STATScoreCurrentCrystalReportHTML,

      program_intelligence:
        !!window.STATScoreCurrentProgramIntelligence,

      phnx_ranking_board:
        !!window.STATScoreCurrentPHNXRankingBoard,

      multibox_evaluation:
        !!window.STATScoreLastMultiBoxEvaluation,

      camp_combine_matches:
        Array.isArray(window.STATScoreCurrentCampCombineMatches),

      recruiter_verification:
        !!window.STATScoreCurrentRecruiterVerification
    };

    const presentCount =
      Object.values(objects).filter(Boolean).length;

    return {
      ok: presentCount >= 5,
      present_count: presentCount,
      total_checked: Object.keys(objects).length,
      objects
    };
  }

  function validateAthleteIntelligenceCorridor() {
    const athlete =
      window.STATScoreCurrentAthlete ||
      window.STATScoreCurrentSnapshot ||
      window.__STATSCORE_CURRENT_ATHLETE__ ||
      null;

    const score =
      window.STATScoreCurrentFootballScore || null;

    const verification =
      window.STATScoreCurrentVerification || null;

    const evidence =
      window.STATScoreCurrentEvidence || null;

    const readiness =
      window.STATScoreCurrentReadiness || null;

    const pathway =
      window.STATScoreCurrentPathway || null;

    const eligibility =
      window.STATScoreCurrentNCAAEligibility || null;

    const checks = {
      athlete_loaded: !!athlete,
      score_generated: !!(score && score.ok),
      verification_generated: !!(verification && verification.ok),
      evidence_generated: !!(evidence && evidence.ok),
      readiness_generated: !!(readiness && readiness.ok),
      pathway_generated: !!(pathway && pathway.ok),
      eligibility_generated: !!(eligibility && eligibility.ok)
    };

    return {
      ok: Object.values(checks).filter(Boolean).length >= 5,
      checks,
      athlete_id: athlete?.athlete_id || null,
      snapshot_id: athlete?.snapshot_id || null,
      score_final: score?.score_final || null,
      readiness_score: readiness?.readiness_score || null,
      pathway: pathway?.primary_pathway || null,
      eligibility_status: eligibility?.eligibility_status || null
    };
  }

  function validateCrystalReport() {
    const engine =
      window.STATScoreCrystalReportEngine ||
      window.STATScore?.CrystalReportEngine ||
      null;

    if (!engine?.generateAthleteCrystalReport) {
      return {
        ok: false,
        reason: "Crystal Report Engine unavailable."
      };
    }

    const result =
      engine.generateAthleteCrystalReport();

    return {
      ok: !!(result && result.ok && result.html),
      type: result?.type || null,
      html_length: result?.html?.length || 0
    };
  }

  function validateProgramRankingCorridor() {
    const programEngine =
      window.STATScoreProgramIntelligenceEngine ||
      window.STATScore?.ProgramIntelligenceEngine ||
      null;

    const rankingEngine =
      window.STATScorePHNXRankingEngine ||
      window.STATScore?.PHNXRankingEngine ||
      null;

    if (!programEngine || !rankingEngine) {
      return {
        ok: false,
        reason: "Program or PHNX Ranking engine unavailable."
      };
    }

    const demoPrograms = [
      {
        program_name: "PHNX Demo Elite",
        organization_id: "program_demo_001",
        total_athletes: 40,
        active_athletes: 36,
        verified_athletes: 28,
        updated_profiles: 34,
        total_coaches: 6,
        active_coach_evaluators: 5,
        total_evaluations_submitted: 18,
        recruiter_visits: 6,
        verified_recruiter_interactions: 9,
        recruiting_event_attendance: 5,
        on_track_athletes: 30,
        partial_track_athletes: 8,
        off_track_athletes: 2,
        d1_placements: 2,
        d2_placements: 5,
        naia_placements: 4,
        juco_placements: 3,
        verified_evaluators: 4,
        evidence_uploads: 20,
        confidence_reviews: 10
      },
      {
        program_name: "Gulf Coast Rising",
        organization_id: "program_demo_002",
        total_athletes: 30,
        active_athletes: 20,
        verified_athletes: 12,
        updated_profiles: 14,
        total_coaches: 4,
        active_coach_evaluators: 2,
        total_evaluations_submitted: 7,
        recruiter_visits: 2,
        verified_recruiter_interactions: 3,
        recruiting_event_attendance: 2,
        on_track_athletes: 16,
        partial_track_athletes: 10,
        off_track_athletes: 4,
        d1_placements: 0,
        d2_placements: 2,
        naia_placements: 2,
        juco_placements: 3,
        verified_evaluators: 1,
        evidence_uploads: 7,
        confidence_reviews: 4
      }
    ];

    const board =
      rankingEngine.buildProgramBoard(demoPrograms, {
        board_type: "PROGRAM_TOP_10",
        limit: 10
      });

    return {
      ok: !!(board && board.ok && board.board?.length),
      board_count: board?.board?.length || 0,
      top_program: board?.board?.[0]?.program_name || null,
      top_score: board?.board?.[0]?.program_score || null
    };
  }

  function validateRecruiterGovernanceCorridor() {
    const recruiterEngine =
      window.STATScoreRecruiterVerificationEngine ||
      window.STATScore?.RecruiterVerificationEngine ||
      null;

    const multiboxEngine =
      window.STATScoreMultiBoxGovernanceEngine ||
      window.STATScore?.MultiBoxGovernanceEngine ||
      null;

    if (!recruiterEngine || !multiboxEngine) {
      return {
        ok: false,
        reason: "Recruiter Verification or Multi-Box Governance engine unavailable."
      };
    }

    const recruiter = {
      recruiter_id: "rec_demo_001",
      verified_recruiter_id: "PHNX-REC-DEMO-001",
      recruiter_name: "Demo Recruiter",
      school_program: "Demo State University",
      division: "D2",
      role: "Assistant Coach",
      email: "coach@demostate.edu",
      verification_status: "VERIFIED",
      coach_outreach_count: 4,
      athlete_profile_views: 8,
      verified_meetings: 2,
      camp_attendance_count: 2,
      follow_up_count: 3,
      response_rate: 82,
      ncaa_rules_acknowledged: true
    };

    const verification =
      recruiterEngine.verifyRecruiter(recruiter);

    const athlete =
      window.STATScoreCurrentAthlete ||
      window.STATScoreCurrentSnapshot ||
      window.__STATSCORE_CURRENT_ATHLETE__ ||
      {
        athlete_id: "demo_athlete",
        snapshot_id: "demo_snapshot",
        graduation_class: "2027",
        guardian_name: "Demo Guardian",
        guardian_email: "guardian@example.com"
      };

    const communication =
      multiboxEngine.evaluateCommunication({
        athlete,
        from_role: "RECRUITER",
        to_role: "ATHLETE",
        actor: recruiter,
        target: athlete,
        message_type: "RECRUITING_INTEREST",
        subject: "Demo governed contact"
      });

    return {
      ok: !!(
        verification &&
        verification.ok &&
        communication &&
        communication.ok
      ),
      recruiter_status: verification?.verification_status || null,
      trust_score: verification?.trust_score || null,
      communication_status: communication?.decision?.status || null,
      route: communication?.decision?.route || null,
      receipt_id: communication?.receipt?.receipt_id || null
    };
  }

  function validateCampCombineCorridor() {
    const campEngine =
      window.STATScoreCampCombineIntelligenceEngine ||
      window.STATScore?.CampCombineIntelligenceEngine ||
      null;

    if (!campEngine) {
      return {
        ok: false,
        reason: "Camp/Combine Intelligence engine unavailable."
      };
    }

    const athlete =
      window.STATScoreCurrentAthlete ||
      window.STATScoreCurrentSnapshot ||
      window.__STATSCORE_CURRENT_ATHLETE__ ||
      {
        athlete_id: "demo_athlete",
        snapshot_id: "demo_snapshot",
        athlete_display_name: "Demo Athlete",
        primary_sport: "football",
        primary_position: "QB",
        city_state: "Pensacola, FL"
      };

    const systems = {
      athlete,
      readiness:
        window.STATScoreCurrentReadiness ||
        { readiness_score: 76 },

      pathway:
        window.STATScoreCurrentPathway ||
        { primary_pathway: "D2", primary_pathway_label: "NCAA Division II" },

      eligibility:
        window.STATScoreCurrentNCAAEligibility ||
        { eligibility_status: "ON_TRACK" }
    };

    const events = [
      {
        event_id: "event_demo_001",
        event_name: "PHNX Verified Exposure Camp",
        event_type: "HYBRID",
        sport: "football",
        positions: ["QB", "WR", "DB"],
        division_focus: "D2",
        region: "FL",
        requires_ncaa_on_track: true,
        development_focus: true,
        attending_recruiters: [
          {
            recruiter_id: "rec_demo_001",
            verified_recruiter_id: "PHNX-REC-DEMO-001",
            recruiter_name: "Demo Recruiter",
            school_program: "Demo State University",
            sports: ["football"],
            positions: ["QB"],
            division_focus: ["D2"]
          }
        ]
      }
    ];

    const ranked =
      campEngine.rankEvents(events, systems);

    return {
      ok: Array.isArray(ranked) && ranked.length > 0,
      top_event: ranked?.[0]?.event_name || null,
      match_score: ranked?.[0]?.match_score || null,
      match_level: ranked?.[0]?.match_level || null,
      meeting_targets: ranked?.[0]?.meeting_targets?.length || 0
    };
  }

  function runFullPhase1Test() {
    const startedAt = now();

    const result = {
      ok: false,
      engine_id: ENGINE_ID,
      version: VERSION,
      started_at: startedAt,

      tests: {
        engine_presence:
          checkEnginePresence(),

        shared_runtime_objects:
          checkSharedRuntimeObjects(),

        athlete_intelligence_corridor:
          validateAthleteIntelligenceCorridor(),

        crystal_report:
          validateCrystalReport(),

        program_ranking_corridor:
          validateProgramRankingCorridor(),

        recruiter_governance_corridor:
          validateRecruiterGovernanceCorridor(),

        camp_combine_corridor:
          validateCampCombineCorridor()
      }
    };

    const testValues =
      Object.values(result.tests);

    const passCount =
      testValues.filter((test) => test.ok).length;

    result.pass_count = passCount;
    result.total_tests = testValues.length;
    result.phase1_score =
      Math.round((passCount / testValues.length) * 100);

    result.ok =
      result.phase1_score >= 80 &&
      result.tests.engine_presence.ok;

    result.status =
      result.ok
        ? "PHASE_1_RUNTIME_VALIDATED"
        : "PHASE_1_RUNTIME_REQUIRES_REVIEW";

    result.receipt =
      makeReceipt("PHASE_1_RUNTIME_INTEGRATION_TEST", {
        status: result.status,
        phase1_score: result.phase1_score,
        pass_count: result.pass_count,
        total_tests: result.total_tests
      });

    result.completed_at =
      now();

    window.STATScorePhase1RuntimeTestResult =
      result;

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit(
        "phase1_runtime_test_completed",
        result
      );
    }

    log("Full Phase 1 test completed.", result);

    return result;
  }

  function renderTestResult(container, result) {
    if (!container || !result) return false;

    const color =
      result.ok ? "#37d67a" : "#ffb100";

    container.innerHTML = `
      <div style="
        border:1px solid ${color};
        background:rgba(255,255,255,.035);
        padding:20px;
        color:#f4f2ef;
        box-shadow:0 12px 28px rgba(0,0,0,.38);
      ">

        <div style="
          color:${color};
          font-size:12px;
          font-weight:1000;
          letter-spacing:.18em;
          text-transform:uppercase;
        ">
          Runtime Integration Test
        </div>

        <div style="
          margin-top:10px;
          font-size:34px;
          font-weight:1000;
          color:${color};
        ">
          ${result.phase1_score}%
        </div>

        <div style="
          margin-top:8px;
          color:#9fe7ff;
          font-size:12px;
          letter-spacing:.12em;
          text-transform:uppercase;
          font-weight:900;
        ">
          ${result.status}
        </div>

        <div style="
          margin-top:16px;
          display:grid;
          gap:10px;
        ">
          ${Object.entries(result.tests).map(([key, test]) => `
            <div style="
              border:1px solid rgba(255,255,255,.1);
              background:rgba(0,0,0,.22);
              padding:12px;
              display:flex;
              justify-content:space-between;
              gap:12px;
              align-items:center;
            ">
              <div style="
                font-size:12px;
                font-weight:900;
                letter-spacing:.1em;
                text-transform:uppercase;
              ">
                ${key.replace(/_/g, " ")}
              </div>

              <div style="
                color:${test.ok ? "#37d67a" : "#ff3434"};
                font-weight:1000;
              ">
                ${test.ok ? "PASS" : "REVIEW"}
              </div>
            </div>
          `).join("")}
        </div>

        <div style="
          margin-top:16px;
          border-top:1px solid rgba(255,255,255,.1);
          padding-top:12px;
          color:#7f8a99;
          font-size:11px;
          line-height:1.45;
        ">
          Receipt:
          ${result.receipt.receipt_id}
        </div>

      </div>
    `;

    return true;
  }

  function runAndRender() {
    const result =
      runFullPhase1Test();

    const panel =
      document.querySelector("#scRuntimeIntegrationTestPanel") ||
      document.querySelector("[data-runtime-integration-test]");

    if (panel) {
      renderTestResult(panel, result);
    }

    return result;
  }

  function init() {
    if (window.__STATSCORE_RUNTIME_INTEGRATION_TEST_PACK__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_RUNTIME_INTEGRATION_TEST_PACK__ = true;

    window.STATScoreRuntimeIntegrationTestPack = {
      engine_id: ENGINE_ID,
      version: VERSION,

      required_engines: REQUIRED_ENGINES,

      checkEnginePresence,
      checkSharedRuntimeObjects,
      validateAthleteIntelligenceCorridor,
      validateCrystalReport,
      validateProgramRankingCorridor,
      validateRecruiterGovernanceCorridor,
      validateCampCombineCorridor,
      runFullPhase1Test,
      renderTestResult,
      runAndRender
    };

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.RuntimeIntegrationTestPack =
      window.STATScoreRuntimeIntegrationTestPack;

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE"
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(); 
