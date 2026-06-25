(function(){
  "use strict";

  const ENGINE = "statscore-composite-intelligence-center.js";

  function getSnapshotId(){
    return (
      new URLSearchParams(window.location.search).get("snapshot_id") ||
      localStorage.getItem("STATSCORE_ACTIVE_SNAPSHOT_ID") ||
      ""
    );
  }

  function openCompositeCenter(){
    const snapshotId = getSnapshotId();

    let modal = document.getElementById("compositeIntelligenceCenter");

    if(!modal){
      modal = document.createElement("div");
      modal.id = "compositeIntelligenceCenter";
      modal.className = "composite-center-overlay";

      modal.innerHTML = `
        <div class="composite-center-panel">
          <button class="composite-close" type="button">×</button>

          <div class="composite-kicker">STATS-CORE Composite Intelligence Center</div>
          <h2>Why is the Composite Score Pending?</h2>

          <p class="composite-lead">
            STATS-CORE does not display a final Composite Score until the required
            intelligence layers are present, governed, verified, and explainable.
          </p>

          <div class="composite-status-box">
            <b>Current Status</b>
            <span>Composite Score Pending</span>
          </div>

          <div class="composite-grid">
            <div class="composite-item green">
              <b>Athletic Score</b>
              <span>Layer available</span>
            </div>
            <div class="composite-item green">
              <b>Production Score</b>
              <span>Season records loaded</span>
            </div>
            <div class="composite-item gold">
              <b>Verification Score</b>
              <span>Requires authority review</span>
            </div>
            <div class="composite-item gold">
              <b>Eligibility Score</b>
              <span>Needs eligibility confirmation</span>
            </div>
            <div class="composite-item gold">
              <b>Recruiting Readiness</b>
              <span>Pending full intelligence review</span>
            </div>
          </div>

          <div class="composite-section">
            <h3>Why this matters</h3>
            <p>
              This protects the athlete from being judged by an incomplete or misleading
              final score. Named intelligence layers may display individually, but the final
              STATS-CORE Composite remains locked until composite authority is activated.
            </p>
          </div>

          <div class="composite-section">
            <h3>Next Actions</h3>
            <ol>
              <li>Complete production verification.</li>
              <li>Confirm academic and eligibility standing.</li>
              <li>Complete recruiting readiness review.</li>
              <li>Unlock composite authority only when all required layers are explainable.</li>
            </ol>
          </div>

          <div class="composite-receipt">
            Snapshot ID: ${snapshotId || "No Snapshot Loaded"}<br>
            Engine: ${ENGINE}
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector(".composite-close").addEventListener("click", () => {
        modal.classList.remove("active");
      });

      modal.addEventListener("click", event => {
        if(event.target === modal) modal.classList.remove("active");
      });
    }

    modal.classList.add("active");
  }

  function bindCompositeGateway(){
    const card = document.querySelector(".index-card");
    if(!card) return;

    card.setAttribute("data-composite-gateway", "true");

    card.addEventListener("click", function(event){
      event.preventDefault();
      event.stopPropagation();
      openCompositeCenter();
    });
  }

  document.addEventListener("DOMContentLoaded", bindCompositeGateway);

  window.STATSCORE_COMPOSITE_INTELLIGENCE_CENTER = {
    engine: ENGINE,
    openCompositeCenter,
    bindCompositeGateway
  };

  console.info("[STATS-CORE] Composite Intelligence Center loaded.");
})(); 
