async function insertSnapshot(row){ 
  const db = getDb();
  const cleanRow = filterSnapshotSchema(row);
  console.log("SNAPSHOT INSERT ROW:", row);
console.log("SNAPSHOT CLEAN ROW:", cleanRow);
console.log("SNAPSHOT SCORE CHECK:", {
  row_snapshot_score: row.snapshot_score,
  row_statscore_snapshot_score: row.statscore_snapshot_score,
  clean_snapshot_score: cleanRow.snapshot_score,
  clean_statscore_snapshot_score: cleanRow.statscore_snapshot_score
}); 

  const { data: existingData, error: existingError } = await db
    .from(SNAPSHOT_TABLE)
    .select("*")
    .eq("first_name", cleanRow.first_name)
    .eq("last_name", cleanRow.last_name)
    .eq("primary_sport", cleanRow.primary_sport)
    .eq("school_program", cleanRow.school_program)
    .eq("graduation_class", cleanRow.graduation_class)
    .maybeSingle();

  if (existingError){
    console.warn("Existing snapshot check failed:", existingError);
  }

  if(existingData){
    const replace = confirm(
      "A snapshot intake record for this athlete already exists. Do you want to update it?"
    );

    if(!replace){
      return existingData;
    }

    const { data, error } = await db
      .from(SNAPSHOT_TABLE)
      .update({
        ...cleanRow,
        snapshot_id: existingData.snapshot_id,
        updated_at: nowISO()
      })
      .eq("snapshot_id", existingData.snapshot_id)
      .select("*")
      .single();

    if(error){
      console.error("statscore_snapshots update failed:", error);
      throw new Error(error.message || "Snapshot update failed.");
    }

    return data;
  }

  const { data, error } = await db
    .from(SNAPSHOT_TABLE)
    .insert(cleanRow)
    .select("*")
    .single();

  if(error){
    console.error("statscore_snapshots insert failed:", error);
    throw new Error(error.message || "Snapshot insert failed.");
  }

  return data;
} 
