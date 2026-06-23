/* =========================================================
   STATS-CORE™
   STREAM 4 — ROLE INTAKE CORE ENGINE
   File: statscore-role-intake-core.js

   Purpose:
   Shared Supabase-backed intake infrastructure for all
   non-athlete role intake pages.

   Owns:
   - role validation against login role
   - draft save / restore
   - role context creation
   - receipt creation
   - dashboard handoff
   - Multi-Box FROM identity setup

   Does NOT own:
   - login credentials
   - authentication
   - athlete source records
   - dashboard workspace behavior
   - Multi-Box message sending
   - Crystal Reports
   ========================================================= */

(function(){
  "use strict";

  const CORE_VERSION = "STREAM_4_ROLE_INTAKE_CORE_V1";

  const TABLE_CONTEXTS = "sc_role_intake_contexts";
  const TABLE_RECEIPTS = "sc_role_intake_receipts";
  const TABLE_DRAFTS = "sc_role_intake_drafts";
  const TABLE_SPECIALIZATIONS = "sc_role_specializations";

  const CURRENT_USER_KEYS = [
    "STATSCORE_CURRENT_USER",
    "STATSCORE_USER",
    "statscore_current_user"
  ];

  const CURRENT_ROLE_KEYS = [
    "STATSCORE_CURRENT_ROLE",
    "STATSCORE_LOGIN_ROLE",
    "statscore_current_role"
  ];

  function getSupabase(){
    if(window.STATSCORE_SUPABASE) return window.STATSCORE_SUPABASE;
    if(window.supabaseClient) return window.supabaseClient;
    if(window.STATSCORE?.supabase) return window.STATSCORE.supabase;
    return null;
  }

  function safeJson(raw, fallback = null){
    try{
      if(!raw) return fallback;
      return JSON.parse(raw);
    }catch(err){
      return fallback;
    }
  }

  function getStoredJson(keys){
    for(const key of keys){
      const parsed = safeJson(localStorage.getItem(key), null);
      if(parsed) return parsed;
    }
    return null;
  }

  function getStoredText(keys){
    for(const key of keys){
      const value = localStorage.getItem(key);
      if(value) return value;
    }
    return "";
  }

  function normalizeRole(role){
    const raw = String(role || "").trim().toLowerCase();

    if(raw === "parent_guardian") return "parent";
    if(raw === "guardian") return "parent";
    if(raw === "evaluator") return "trainer";
    if(raw === "evaluator_trainer") return "trainer";
    if(raw === "trainer_evaluator") return "trainer";

    return raw;
  }

  function uuidLike(value){
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
  }

  function getCurrentUser(){
    const user = getStoredJson(CURRENT_USER_KEYS) || {};

    return {
      user_id:
        user.user_id ||
        user.sc_user_id ||
        user.statscore_user_id ||
        user.id ||
        localStorage.getItem("STATSCORE_CURRENT_USER_ID") ||
        localStorage.getItem("user_id") ||
        "",

      email:
        user.email ||
        localStorage.getItem("STATSCORE_CURRENT_USER_EMAIL") ||
        localStorage.getItem("email") ||
        "",

      display_name:
        user.display_name ||
        user.full_name ||
        user.name ||
        localStorage.getItem("STATSCORE_CURRENT_USER_NAME") ||
        ""
    };
  }

  function getCurrentRole(){
    const roleObj = getStoredJson(CURRENT_ROLE_KEYS);
    const roleText = getStoredText(CURRENT_ROLE_KEYS);

    if(roleObj && typeof roleObj === "object"){
      return {
        role_name: normalizeRole(roleObj.role_name || roleObj.role || roleObj.name),
        sc_role_id: roleObj.sc_role_id || roleObj.role_id || ""
      };
    }

    return {
      role_name: normalizeRole(roleText),
      sc_role_id: localStorage.getItem("STATSCORE_CURRENT_SC_ROLE_ID") || ""
    };
  }

  async function resolveRole(roleName){
    const supabase = getSupabase();
    const normalized = normalizeRole(roleName);

    const current = getCurrentRole();

    if(current.sc_role_id && current.role_name === normalized){
      return {
        sc_role_id: current.sc_role_id,
        role_name: normalized
      };
    }

    if(!supabase){
      throw new Error("Supabase client unavailable. Confirm statscore-data.js loads before this core engine.");
    }

    const { data, error } = await supabase
      .from("sc_roles")
      .select("sc_role_id, role_name")
      .eq("role_name", normalized)
      .maybeSingle();

    if(error) throw error;
    if(!data) throw new Error(`Role not found in sc_roles: ${normalized}`);

    return data;
  }

  function validateLoginRole(expectedRole){
    const expected = normalizeRole(expectedRole);
    const current = getCurrentRole();

    if(!current.role_name){
      return {
        ok: false,
        message: "No login role found. User must log in before submitting role intake."
      };
    }

    if(current.role_name !== expected){
      return {
        ok: false,
        message: `Role mismatch. Login role is ${current.role_name}; this page requires ${expected}.`
      };
    }

    return { ok: true, message: "Role validated." };
  }

  async function saveDraft(config){
    const supabase = getSupabase();
    if(!supabase) throw new Error("Supabase client unavailable.");

    const user = getCurrentUser();
    const role = await resolveRole(config.role_name);

    if(!uuidLike(user.user_id)){
      throw new Error("Missing valid logged-in user_id. Draft cannot be saved.");
    }

    const payload = {
      user_id: user.user_id,
      sc_role_id: role.sc_role_id,
      role_name: role.role_name,
      source_page: config.source_page,
      draft_status: "active",
      draft_payload: config.draft_payload || {}
    };

    const { data, error } = await supabase
      .from(TABLE_DRAFTS)
      .upsert(payload, {
        onConflict: "user_id,role_name,source_page"
      })
      .select()
      .single();

    if(error) throw error;

    return data;
  }

  async function restoreDraft(roleName, sourcePage){
    const supabase = getSupabase();
    if(!supabase) throw new Error("Supabase client unavailable.");

    const user = getCurrentUser();
    const role = await resolveRole(roleName);

    if(!uuidLike(user.user_id)){
      return null;
    }

    const { data, error } = await supabase
      .from(TABLE_DRAFTS)
      .select("*")
      .eq("user_id", user.user_id)
      .eq("role_name", role.role_name)
      .eq("source_page", sourcePage)
      .eq("draft_status", "active")
      .maybeSingle();

    if(error) throw error;
    return data;
  }

  async function fetchSpecializations(roleName){
    const supabase = getSupabase();
    if(!supabase) throw new Error("Supabase client unavailable.");

    const normalized = normalizeRole(roleName);

    const { data, error } = await supabase
      .from(TABLE_SPECIALIZATIONS)
      .select("*")
      .eq("role_name", normalized)
      .eq("active", true)
      .order("specialization_label", { ascending: true });

    if(error) throw error;
    return data || [];
  }

  async function createRoleContext(config){
    const supabase = getSupabase();
    if(!supabase) throw new Error("Supabase client unavailable.");

    const expectedRole = normalizeRole(config.role_name);
    const validation = validateLoginRole(expectedRole);

    if(!validation.ok){
      throw new Error(validation.message);
    }

    const user = getCurrentUser();
    const role = await resolveRole(expectedRole);

    if(!uuidLike(user.user_id)){
      throw new Error("Missing valid logged-in user_id. Role intake cannot be created.");
    }

    const displayName =
      config.display_name ||
      user.display_name ||
      config.identity_context?.full_name ||
      config.identity_context?.name ||
      config.identity_context?.organization_name ||
      "STATS-CORE Role User";

    const nextPage =
      config.next_page ||
      `role-dashboard.html?role=${encodeURIComponent(role.role_name)}`;

    const contextPayload = {
      user_id: user.user_id,
      sc_role_id: role.sc_role_id,
      role_name: role.role_name,

      display_name: displayName,
      email: config.email || user.email || null,
      phone: config.phone || null,

      intake_status: config.intake_status || "active",
      verification_status: config.verification_status || "unverified",

      primary_sport: config.primary_sport || null,
      sport_scope: config.sport_scope || [],

      identity_context: config.identity_context || {},
      operating_context: config.operating_context || {},
      dashboard_context: config.dashboard_context || {},
      multibox_context: config.multibox_context || {},
      permissions_context: config.permissions_context || {},

      source_page: config.source_page,
      next_page: nextPage
    };

    const { data: context, error: contextError } = await supabase
      .from(TABLE_CONTEXTS)
      .insert(contextPayload)
      .select()
      .single();

    if(contextError) throw contextError;

    const receiptPayload = {
      role_context_id: context.role_context_id,
      role_instance_id: context.role_instance_id,
      role_name: context.role_name,
      action_type: config.action_type || "role_intake_created",
      action_status: "created",
      receipt_payload: {
        core_version: CORE_VERSION,
        source_page: config.source_page,
        next_page: nextPage,
        primary_sport: config.primary_sport || null,
        sport_scope: config.sport_scope || [],
        display_name: displayName,
        created_at: new Date().toISOString()
      }
    };

    const { data: receipt, error: receiptError } = await supabase
      .from(TABLE_RECEIPTS)
      .insert(receiptPayload)
      .select()
      .single();

    if(receiptError) throw receiptError;

    registerRuntimeHandoff(context, receipt);

    return {
      context,
      receipt,
      handoff: buildHandoff(context, receipt)
    };
  }

  function buildHandoff(context, receipt){
    return {
      role_context_id: context.role_context_id,
      role_instance_id: context.role_instance_id,
      receipt_id: receipt.receipt_id,
      role_name: context.role_name,
      sc_role_id: context.sc_role_id,
      user_id: context.user_id,
      display_name: context.display_name,
      next_page: context.next_page,
      source_page: context.source_page,
      multibox_context: context.multibox_context,
      dashboard_context: context.dashboard_context,
      primary_sport: context.primary_sport,
      sport_scope: context.sport_scope
    };
  }

  function registerRuntimeHandoff(context, receipt){
    const handoff = buildHandoff(context, receipt);

    localStorage.setItem("STATSCORE_CURRENT_ROLE", context.role_name);
    localStorage.setItem("STATSCORE_CURRENT_SC_ROLE_ID", context.sc_role_id);
    localStorage.setItem("STATSCORE_CURRENT_ROLE_CONTEXT_ID", context.role_context_id);
    localStorage.setItem("STATSCORE_CURRENT_ROLE_INSTANCE_ID", context.role_instance_id);
    localStorage.setItem("STATSCORE_CURRENT_ROLE_CONTEXT", JSON.stringify(context));
    localStorage.setItem("STATSCORE_CURRENT_ROLE_HANDOFF", JSON.stringify(handoff));

    localStorage.setItem("STATSCORE_MULTIBOX_FROM_ROLE", context.role_name);
    localStorage.setItem("STATSCORE_MULTIBOX_FROM_ROLE_ID", context.role_instance_id);
    localStorage.setItem("STATSCORE_MULTIBOX_FROM_LABEL", context.display_name);
    localStorage.setItem("STATSCORE_MULTIBOX_FROM_CONTEXT", JSON.stringify(context.multibox_context || {}));
  }

  async function createReceipt(config){
    const supabase = getSupabase();
    if(!supabase) throw new Error("Supabase client unavailable.");

    const payload = {
      role_context_id: config.role_context_id,
      role_instance_id: config.role_instance_id,
      role_name: normalizeRole(config.role_name),
      action_type: config.action_type,
      action_status: config.action_status || "created",
      receipt_payload: config.receipt_payload || {}
    };

    const { data, error } = await supabase
      .from(TABLE_RECEIPTS)
      .insert(payload)
      .select()
      .single();

    if(error) throw error;
    return data;
  }

  window.STATSCORE_ROLE_INTAKE_CORE = {
    version: CORE_VERSION,
    normalizeRole,
    getCurrentUser,
    getCurrentRole,
    validateLoginRole,
    resolveRole,
    fetchSpecializations,
    saveDraft,
    restoreDraft,
    createRoleContext,
    createReceipt,
    registerRuntimeHandoff
  };

})(); 
