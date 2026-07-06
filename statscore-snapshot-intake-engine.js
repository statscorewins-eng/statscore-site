async function insertSnapshot(row){
  const db = getDb();
  const cleanRow = filterSnapshotSchema(row || {});
  const incomingSnapshotId =
    cleanRow.snapshot_id ||
    row?.snapshot_id ||
    getActiveSnapshotId();

  if(window.STATSCORE_DEBUG){
    console.log("SNAPSHOT INSERT ROW:", row);
    console.log("SNAPSHOT CLEAN ROW:", cleanRow);
    console.log("SNAPSHOT RESOLVED ID:", incomingSnapshotId);
  }

  /*
  ==========================================================
  GOVERNED UPDATE MODE
  ==========================================================
  If snapshot_id exists, this is not a duplicate check.
  This is a governed source-record update.
  */
  if(incomingSnapshotId){
    const { data: existingData, error: existingError } = await db
      .from(SNAPSHOT_TABLE)
      .select("*")
      .eq("snapshot_id", incomingSnapshotId)
      .maybeSingle();

    if(existingError){
      console.error("Snapshot lookup by snapshot_id failed:", existingError);
      throw new Error(existingError.message || "Snapshot lookup failed.");
    }

    if(existingData){
      const updatePayload = {
        ...cleanRow,
        snapshot_id: existingData.snapshot_id,
        athlete_id: existingData.athlete_id || cleanRow.athlete_id || row?.athlete_id || null,
        updated_at: nowISO(),
        last_source_update_at: nowISO(),
        source_record_status: cleanRow.source_record_status || existingData.source_record_status || "updated"
      };

      await writeSnapshotAuditReceipt({
        action: "SNAPSHOT_SOURCE_UPDATE",
        snapshot_id: existingData.snapshot_id,
        athlete_id: updatePayload.athlete_id,
        before_record: existingData,
        after_record: updatePayload
      });

      const { data, error } = await db
        .from(SNAPSHOT_TABLE)
        .update(updatePayload)
        .eq("snapshot_id", existingData.snapshot_id)
        .select("*")
        .single();

      if(error){
        console.error("statscore_snapshots update failed:", error);
        throw new Error(error.message || "Snapshot update failed.");
      }

      setActiveSnapshotId(data.snapshot_id);
      return data;
    }
  }

  /*
  ==========================================================
  LEGACY SAFETY CHECK
  ==========================================================
  This prevents accidental duplicate creation when old flows submit
  without snapshot_id. It does NOT use browser confirm().
  */
  const { data: possibleExisting, error: possibleError } = await db
    .from(SNAPSHOT_TABLE)
    .select("*")
    .eq("first_name", cleanRow.first_name || "")
    .eq("last_name", cleanRow.last_name || "")
    .eq("primary_sport", cleanRow.primary_sport || "")
    .eq("school_program", cleanRow.school_program || "")
    .eq("graduation_class", cleanRow.graduation_class || "")
    .maybeSingle();

  if(possibleError){
    console.warn("Existing snapshot safety check failed:", possibleError);
  }

  if(possibleExisting?.snapshot_id){
    throw new Error(
      "Existing athlete source record found. Reload this intake using snapshot_id before updating."
    );
  }

  /*
  ==========================================================
  CREATE MODE
  ==========================================================
  No snapshot_id exists. Create official athlete source record.
  */
  const createPayload = {
    ...cleanRow,
    snapshot_id: cleanRow.snapshot_id || generateSnapshotId(),
    athlete_id: cleanRow.athlete_id || row?.athlete_id || generateAthleteId(),
    source_record_status: cleanRow.source_record_status || "created",
    created_at: cleanRow.created_at || nowISO(),
    updated_at: nowISO(),
    last_source_update_at: nowISO()
  };

  const { data, error } = await db
    .from(SNAPSHOT_TABLE)
    .insert(createPayload)
    .select("*")
    .single();

  if(error){
    console.error("statscore_snapshots insert failed:", error);
    throw new Error(error.message || "Snapshot insert failed.");
  }

  await writeSnapshotAuditReceipt({
    action: "SNAPSHOT_SOURCE_CREATE",
    snapshot_id: data.snapshot_id,
    athlete_id: data.athlete_id,
    before_record: null,
    after_record: data
  });

  setActiveSnapshotId(data.snapshot_id);
  return data;
}

/*
==========================================================
STREAM 2 SNAPSHOT HELPERS
==========================================================
*/

function getActiveSnapshotId(){
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("snapshot_id") ||
    localStorage.getItem("STATSCORE_ACTIVE_SNAPSHOT_ID") ||
    sessionStorage.getItem("STATSCORE_ACTIVE_SNAPSHOT_ID") ||
    null
  );
}

function setActiveSnapshotId(snapshotId){
  if(!snapshotId) return;
  localStorage.setItem("STATSCORE_ACTIVE_SNAPSHOT_ID", snapshotId);
  sessionStorage.setItem("STATSCORE_ACTIVE_SNAPSHOT_ID", snapshotId);
}

function generateSnapshotId(){
  if(window.crypto?.randomUUID){
    return window.crypto.randomUUID();
  }

  return "snapshot_" + Date.now() + "_" + Math.random().toString(36).slice(2);
}

function generateAthleteId(){
  if(window.crypto?.randomUUID){
    return "athlete_" + window.crypto.randomUUID();
  }

  return "athlete_" + Date.now() + "_" + Math.random().toString(36).slice(2);
}

async function writeSnapshotAuditReceipt(receipt){
  try{
    if(!receipt?.snapshot_id) return;

    const db = getDb();

    const payload = {
      receipt_type: receipt.action || "SNAPSHOT_SOURCE_EVENT",
      snapshot_id: receipt.snapshot_id,
      athlete_id: receipt.athlete_id || null,
      before_record: receipt.before_record || null,
      after_record: receipt.after_record || null,
      created_at: nowISO()
    };

    /*
    Optional audit table.
    If the table does not exist yet, this will fail safely
    without blocking Snapshot Intake.
    */
    const { error } = await db
      .from("sc_snapshot_audit_receipts")
      .insert(payload);

    if(error && window.STATSCORE_DEBUG){
      console.warn("Snapshot audit receipt not written:", error);
    }
  }catch(err){
    if(window.STATSCORE_DEBUG){
      console.warn("Snapshot audit receipt skipped:", err);
    }
  }
} 
