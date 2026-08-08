/* =========================================================
   STATS-CORE™
   STREAM 4 — ROLE INTAKE CORE ENGINE
   File: statscore-role-intake-core.js

   Version:
   STREAM_4_ROLE_INTAKE_CORE_V2.2_TRANSACTION_HARDENED

   Purpose:
   Shared governed intake infrastructure for all
   non-athlete professional role intake pages.

   Constitutional Authority Model:
   - CONSUMES Initial Authentication Context from Stream 1
   - NEVER manufactures authenticated identity or role
   - NEVER reads Stream 4 operational state as login authority
   - NEVER treats browser recovery state as persistence truth
   - PRODUCES Stream 4 professional operating context only
   - Completes Role Context + Receipt through governed,
     atomic, idempotent database manufacturing

   Approved Stream 1 Authentication Contract:
   1. session_id
   2. user_id
   3. role
   4. entry_intent
   5. authenticated_at
   6. authentication_source
   7. requested_destination

   Owns:
   - deterministic Stream 1 authentication-context consumption
   - role validation against authenticated authority
   - registered role-record resolution
   - draft save / restore
   - transaction correlation
   - atomic role-context + receipt manufacture
   - authoritative transaction recovery
   - dashboard/runtime handoff publication
   - Multi-Box FROM identity setup

   Does NOT own:
   - login credentials
   - authentication
   - Stream 1 authentication persistence
   - Stream 1 authority precedence
   - athlete source records
   - dashboard workspace behavior
   - Multi-Box message sending
   - Crystal Reports
   ========================================================= */

(function(){
  "use strict";

  const CORE_VERSION =
    "STREAM_4_ROLE_INTAKE_CORE_V2.2_TRANSACTION_HARDENED";

  const AUTH_CONTEXT_CONTRACT =
    "STATSCORE-INITIAL-AUTHENTICATION-CONTEXT-V1.0.0";

  const AUTHORITY_ID =
    "statscore-authentication-context";

  const TABLE_DRAFTS =
    "sc_role_intake_drafts";

  const TABLE_SPECIALIZATIONS =
    "sc_role_specializations";

  const TRANSACTION_RPC =
    "sc_stream4_complete_role_intake";

  /*
   * Browser state contains ONLY a transaction correlation
   * pointer. It contains no context, receipt, handoff,
   * persistence evidence, or authoritative manufacturing data.
   */
  const TRANSACTION_POINTER_KEY =
    "STATSCORE_STREAM4_ROLE_INTAKE_TRANSACTION_POINTER_V1";

  const TRANSACTION_STATUS = Object.freeze({
    COMPLETE:
      "context_persisted_receipt_complete",

    INDETERMINATE:
      "commit_state_indeterminate"
  });

  /*
   * Stream 4 consumer cache.
   *
   * This is NOT authentication authority.
   * It is only an in-memory reference to the context already
   * validated and returned by Stream 1.
   */
  let AUTHORITY_CACHE = null;

  /* =========================================================
     BASIC UTILITIES
     ========================================================= */

  function getSupabase(){
    if(window.STATSCORE_SUPABASE){
      return window.STATSCORE_SUPABASE;
    }

    if(window.supabaseClient){
      return window.supabaseClient;
    }

    if(window.STATSCORE?.supabase){
      return window.STATSCORE.supabase;
    }

    return null;
  }

  function normalizeRole(role){
    const raw =
      String(role || "")
        .trim()
        .toLowerCase();

    if(raw === "parent_guardian"){
      return "parent";
    }

    if(raw === "guardian"){
      return "parent";
    }

    /*
     * Evaluator and Trainer remain constitutionally distinct.
     */
    return raw;
  }

  function uuidLike(value){
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(String(value || ""));
  }

  /* =========================================================
     STREAM 1 AUTHENTICATION AUTHORITY
     ========================================================= */

  function getAuthenticationAuthorityApi(){
    const authority =
      window.STATSCORE_AUTH_CONTEXT;

    if(
      !authority ||
      typeof authority.get !== "function"
    ){
      throw new Error(
        "Approved Stream 1 Authentication Context Authority is unavailable."
      );
    }

    return authority;
  }

  function validateConsumedAuthority(context){
    /*
     * Stream 1 owns complete seven-field schema validation.
     * Stream 4 validates only the values required for its
     * admission and manufacturing contract.
     */

    if(
      !context ||
      typeof context !== "object"
    ){
      return {
        ok: false,
        context: null,
        message:
          "No approved Initial Authentication Context is available."
      };
    }

    const sessionId =
      String(context.session_id || "")
        .trim();

    const userId =
      String(context.user_id || "")
        .trim();

    const role =
      normalizeRole(
        context.role
      );

    if(!sessionId){
      return {
        ok: false,
        context,
        message:
          "Initial Authentication Context does not contain session_id."
      };
    }

    if(!userId){
      return {
        ok: false,
        context,
        message:
          "Initial Authentication Context does not contain user_id."
      };
    }

    if(!role){
      return {
        ok: false,
        context,
        message:
          "Initial Authentication Context does not contain an authenticated role."
      };
    }

    return {
      ok: true,

      context,

      session_id:
        sessionId,

      user: {
        user_id:
          userId
      },

      role: {
        role_name:
          role,

        /*
         * Stream 1 does not publish sc_role_id.
         * Stream 4 resolves that separately from sc_roles.
         */
        sc_role_id:
          ""
      },

      entry_intent:
        String(
          context.entry_intent || ""
        ).trim(),

      authenticated_at:
        String(
          context.authenticated_at || ""
        ).trim(),

      authentication_source:
        String(
          context.authentication_source || ""
        ).trim(),

      requested_destination:
        String(
          context.requested_destination || ""
        ).trim(),

      message:
        "Approved Stream 1 Initial Authentication Context consumed."
    };
  }

  /*
   * Name retained for controller compatibility.
   *
   * Stream 4 does not read sessionStorage directly.
   * Stream 1 STATSCORE_AUTH_CONTEXT.get() owns restoration
   * and runtime/persisted authority precedence.
   */
  function restoreAuthenticationAuthority(){
    AUTHORITY_CACHE = null;

    const authorityApi =
      getAuthenticationAuthorityApi();

    const context =
      authorityApi.get();

    const result =
      validateConsumedAuthority(
        context
      );

    if(!result.ok){
      return result;
    }

    AUTHORITY_CACHE =
      result.context;

    return result;
  }

  function getAuthenticationAuthority(){
    if(!AUTHORITY_CACHE){
      return {
        ok: false,
        context: null,
        message:
          "Stream 1 Authentication Context has not been established for Professional Role Intake."
      };
    }

    return validateConsumedAuthority(
      AUTHORITY_CACHE
    );
  }

  function requireAuthenticationAuthority(){
    const authority =
      getAuthenticationAuthority();

    if(!authority.ok){
      throw new Error(
        authority.message ||
        "Approved Stream 1 Authentication Context Authority is unavailable."
      );
    }

    return authority;
  }

  /* =========================================================
     AUTHENTICATED IDENTITY / ROLE CONSUMERS
     ========================================================= */

  function getCurrentUser(){
    const authority =
      requireAuthenticationAuthority();

    /*
     * Initial Authentication Context publishes only user_id
     * for identity authority.
     *
     * Email/display_name come from Stream 4 intake or another
     * separately governed enterprise identity source.
     */
    return {
      user_id:
        authority.user.user_id,

      email:
        "",

      display_name:
        ""
    };
  }

  function getCurrentRole(){
    const authority =
      requireAuthenticationAuthority();

    return {
      role_name:
        authority.role.role_name,

      sc_role_id:
        ""
    };
  }

  /* =========================================================
     REGISTERED ROLE RESOLUTION
     ========================================================= */

  async function resolveRole(roleName){
    const authority =
      requireAuthenticationAuthority();

    const normalized =
      normalizeRole(
        roleName
      );

    if(!normalized){
      throw new Error(
        "Professional role cannot be resolved because the requested role is empty."
      );
    }

    if(
      authority.role.role_name !==
      normalized
    ){
      throw new Error(
        `Role mismatch. Authenticated role is ${authority.role.role_name}; requested role record is ${normalized}.`
      );
    }

    const supabase =
      getSupabase();

    if(!supabase){
      throw new Error(
        "Supabase client unavailable. Confirm statscore-data.js loads before the Stream 4 Role Intake Core."
      );
    }

    /*
     * Registry resolution does not prove authentication.
     * Authentication has already been established by Stream 1.
     */
    const { data, error } =
      await supabase
        .from("sc_roles")
        .select(
          "sc_role_id, role_name"
        )
        .eq(
          "role_name",
          normalized
        )
        .maybeSingle();

    if(error){
      throw error;
    }

    if(!data){
      throw new Error(
        `Authenticated role is not registered in sc_roles: ${normalized}`
      );
    }

    return {
      sc_role_id:
        data.sc_role_id,

      role_name:
        normalizeRole(
          data.role_name
        )
    };
  }

  /* =========================================================
     INDEPENDENT ROLE VALIDATION
     ========================================================= */

  function validateLoginRole(expectedRole){
    const authority =
      getAuthenticationAuthority();

    if(!authority.ok){
      return {
        ok: false,
        message:
          authority.message ||
          "Authenticated role authority unavailable."
      };
    }

    const expected =
      normalizeRole(
        expectedRole
      );

    if(!expected){
      return {
        ok: false,
        message:
          "Professional operating role is missing."
      };
    }

    const authenticatedRole =
      authority.role.role_name;

    if(
      authenticatedRole !==
      expected
    ){
      return {
        ok: false,
        message:
          `Role mismatch. Authenticated role is ${authenticatedRole}; requested professional operating role is ${expected}.`
      };
    }

    return {
      ok: true,
      message:
        "Professional operating role validated against Stream 1 Authentication Context Authority."
    };
  }

  /* =========================================================
     TRANSACTION CORRELATION POINTER
     ========================================================= */

  function getTransactionPointer(){
    try{
      const value =
        sessionStorage.getItem(
          TRANSACTION_POINTER_KEY
        );

      const normalized =
        String(value || "")
          .trim();

      if(!normalized){
        return "";
      }

      /*
       * Invalid browser pointer is never accepted as a valid
       * transaction identifier.
       */
      if(!uuidLike(normalized)){
        return "";
      }

      return normalized;

    }catch(err){
      return "";
    }
  }

  function setTransactionPointer(transactionId){
    if(!uuidLike(transactionId)){
      throw new Error(
        "Invalid Stream 4 manufacturing transaction identifier."
      );
    }

    sessionStorage.setItem(
      TRANSACTION_POINTER_KEY,
      transactionId
    );

    return transactionId;
  }

  function clearTransactionPointer(){
    try{
      sessionStorage.removeItem(
        TRANSACTION_POINTER_KEY
      );
    }catch(err){
      /*
       * Pointer cleanup failure does not alter authoritative
       * database truth.
       */
    }
  }

  function getOrCreateTransactionId(){
    const existing =
      getTransactionPointer();

    if(existing){
      return existing;
    }

    if(
      !window.crypto ||
      typeof window.crypto.randomUUID !==
        "function"
    ){
      throw new Error(
        "Secure transaction identifier generation is unavailable."
      );
    }

    return setTransactionPointer(
      window.crypto.randomUUID()
    );
  }

  function getActiveManufacturingTransactionId(){
    return getTransactionPointer();
  }

  /* =========================================================
     SPECIALIZATIONS
     ========================================================= */

  async function fetchSpecializations(roleName){
    requireAuthenticationAuthority();

    const validation =
      validateLoginRole(
        roleName
      );

    if(!validation.ok){
      throw new Error(
        validation.message
      );
    }

    const supabase =
      getSupabase();

    if(!supabase){
      throw new Error(
        "Supabase client unavailable."
      );
    }

    const normalized =
      normalizeRole(
        roleName
      );

    const { data, error } =
      await supabase
        .from(
          TABLE_SPECIALIZATIONS
        )
        .select("*")
        .eq(
          "role_name",
          normalized
        )
        .eq(
          "active",
          true
        )
        .order(
          "specialization_label",
          {
            ascending: true
          }
        );

    if(error){
      throw error;
    }

    return data || [];
  }

  /* =========================================================
     DRAFT SAVE
     ========================================================= */

  async function saveDraft(config){
    const authority =
      requireAuthenticationAuthority();

    const validation =
      validateLoginRole(
        config.role_name
      );

    if(!validation.ok){
      throw new Error(
        validation.message
      );
    }

    const supabase =
      getSupabase();

    if(!supabase){
      throw new Error(
        "Supabase client unavailable."
      );
    }

    const userId =
      authority.user.user_id;

    if(!uuidLike(userId)){
      throw new Error(
        "Missing valid authenticated user_id. Draft cannot be saved."
      );
    }

    const role =
      await resolveRole(
        config.role_name
      );

    const payload = {
      user_id:
        userId,

      sc_role_id:
        role.sc_role_id,

      role_name:
        role.role_name,

      source_page:
        config.source_page,

      draft_status:
        "active",

      draft_payload:
        config.draft_payload ||
        {}
    };

    const { data, error } =
      await supabase
        .from(TABLE_DRAFTS)
        .upsert(
          payload,
          {
            onConflict:
              "user_id,role_name,source_page"
          }
        )
        .select()
        .single();

    if(error){
      throw error;
    }

    return data;
  }

  /* =========================================================
     DRAFT RESTORE
     ========================================================= */

  async function restoreDraft(
    roleName,
    sourcePage
  ){
    const authority =
      requireAuthenticationAuthority();

    const validation =
      validateLoginRole(
        roleName
      );

    if(!validation.ok){
      throw new Error(
        validation.message
      );
    }

    const supabase =
      getSupabase();

    if(!supabase){
      throw new Error(
        "Supabase client unavailable."
      );
    }

    const userId =
      authority.user.user_id;

    if(!uuidLike(userId)){
      return null;
    }

    const role =
      await resolveRole(
        roleName
      );

    const { data, error } =
      await supabase
        .from(TABLE_DRAFTS)
        .select("*")
        .eq(
          "user_id",
          userId
        )
        .eq(
          "role_name",
          role.role_name
        )
        .eq(
          "source_page",
          sourcePage
        )
        .eq(
          "draft_status",
          "active"
        )
        .maybeSingle();

    if(error){
      throw error;
    }

    return data;
  }

  /* =========================================================
     STREAM 4 HANDOFF
     ========================================================= */

  function buildHandoff(
    context,
    receipt
  ){
    return {
      manufacturing_transaction_id:
        context.manufacturing_transaction_id ||
        receipt.manufacturing_transaction_id ||
        null,

      role_context_id:
        context.role_context_id,

      role_instance_id:
        context.role_instance_id,

      receipt_id:
        receipt.receipt_id,

      role_name:
        context.role_name,

      sc_role_id:
        context.sc_role_id,

      user_id:
        context.user_id,

      display_name:
        context.display_name,

      next_page:
        context.next_page,

      source_page:
        context.source_page,

      multibox_context:
        context.multibox_context,

      dashboard_context:
        context.dashboard_context,

      primary_sport:
        context.primary_sport,

      sport_scope:
        context.sport_scope
    };
  }

  /*
   * Values published here are Stream 4 operational state.
   *
   * They are never authentication authority.
   */
  function registerRuntimeHandoff(
    context,
    receipt
  ){
    if(!context || !receipt){
      throw new Error(
        "Authoritative context and receipt are required before Stream 4 runtime handoff."
      );
    }

    const handoff =
      buildHandoff(
        context,
        receipt
      );

    localStorage.setItem(
      "STATSCORE_CURRENT_ROLE",
      context.role_name
    );

    localStorage.setItem(
      "STATSCORE_CURRENT_SC_ROLE_ID",
      context.sc_role_id
    );

    localStorage.setItem(
      "STATSCORE_CURRENT_ROLE_CONTEXT_ID",
      context.role_context_id
    );

    localStorage.setItem(
      "STATSCORE_CURRENT_ROLE_INSTANCE_ID",
      context.role_instance_id
    );

    localStorage.setItem(
      "STATSCORE_CURRENT_ROLE_CONTEXT",
      JSON.stringify(
        context
      )
    );

    localStorage.setItem(
      "STATSCORE_CURRENT_ROLE_HANDOFF",
      JSON.stringify(
        handoff
      )
    );

    localStorage.setItem(
      "STATSCORE_MULTIBOX_FROM_ROLE",
      context.role_name
    );

    localStorage.setItem(
      "STATSCORE_MULTIBOX_FROM_ROLE_ID",
      context.role_instance_id
    );

    localStorage.setItem(
      "STATSCORE_MULTIBOX_FROM_LABEL",
      context.display_name
    );

    localStorage.setItem(
      "STATSCORE_MULTIBOX_FROM_CONTEXT",
      JSON.stringify(
        context.multibox_context ||
        {}
      )
    );

    return handoff;
  }

  /* =========================================================
     ATOMIC PROFESSIONAL ROLE INTAKE MANUFACTURE
     ========================================================= */

  async function createRoleContext(config){
    const authority =
      requireAuthenticationAuthority();

    const expectedRole =
      normalizeRole(
        config.role_name
      );

    const validation =
      validateLoginRole(
        expectedRole
      );

    if(!validation.ok){
      throw new Error(
        validation.message
      );
    }

    const supabase =
      getSupabase();

    if(!supabase){
      throw new Error(
        "Supabase client unavailable."
      );
    }

    const userId =
      authority.user.user_id;

    if(!uuidLike(userId)){
      throw new Error(
        "Missing valid authenticated user_id. Professional Role Intake cannot be created."
      );
    }

    const role =
      await resolveRole(
        expectedRole
      );

    const displayName =
      config.display_name ||
      config.identity_context
        ?.professional_identity
        ?.full_name ||
      config.identity_context
        ?.full_name ||
      config.identity_context
        ?.name ||
      config.identity_context
        ?.organization_name ||
      "STATS-CORE Professional";

    const nextPage =
      config.next_page ||
      `role-dashboard.html?role=${encodeURIComponent(role.role_name)}`;

    /*
     * Transaction-specific correlation is generated before
     * persistence and retained across an ambiguous response.
     */
    const transactionId =
      getOrCreateTransactionId();

    const contextPayload = {
      user_id:
        userId,

      sc_role_id:
        role.sc_role_id,

      role_name:
        role.role_name,

      display_name:
        displayName,

      email:
        config.email ||
        null,

      phone:
        config.phone ||
        null,

      intake_status:
        config.intake_status ||
        "active",

      verification_status:
        config.verification_status ||
        "unverified",

      primary_sport:
        config.primary_sport ||
        null,

      sport_scope:
        config.sport_scope ||
        [],

      identity_context:
        config.identity_context ||
        {},

      operating_context:
        config.operating_context ||
        {},

      dashboard_context:
        config.dashboard_context ||
        {},

      multibox_context:
        config.multibox_context ||
        {},

      permissions_context:
        config.permissions_context ||
        {},

      source_page:
        config.source_page,

      next_page:
        nextPage
    };

    const receiptPayload = {
      action_type:
        config.action_type ||
        "role_intake_created",

      action_status:
        "created",

      receipt_payload: {
        core_version:
          CORE_VERSION,

        manufacturing_transaction_id:
          transactionId,

        authentication_authority:
          AUTHORITY_ID,

        authentication_context_contract:
          AUTH_CONTEXT_CONTRACT,

        authenticated_session_id:
          authority.session_id,

        authentication_source:
          authority.authentication_source,

        authenticated_at:
          authority.authenticated_at,

        source_page:
          config.source_page,

        next_page:
          nextPage,

        primary_sport:
          config.primary_sport ||
          null,

        sport_scope:
          config.sport_scope ||
          [],

        display_name:
          displayName,

        created_at:
          new Date()
            .toISOString()
      }
    };

    /*
     * One governed RPC invocation constitutes one atomic
     * database manufacturing transaction.
     *
     * Context and receipt do not independently commit through
     * this Stream 4 production path.
     */
    const {
      data,
      error
    } =
      await supabase.rpc(
        TRANSACTION_RPC,
        {
          p_transaction_id:
            transactionId,

          p_context_payload:
            contextPayload,

          p_receipt_payload:
            receiptPayload
        }
      );

    /*
     * A client-visible transport/RPC error cannot safely be
     * represented as confirmed non-commit.
     *
     * Preserve only the transaction pointer. Retry resolves
     * authoritative database truth using the same transaction.
     */
    if(error){
      return {
        transaction_status:
          TRANSACTION_STATUS
            .INDETERMINATE,

        manufacturing_transaction_id:
          transactionId,

        context:
          null,

        receipt:
          null,

        handoff:
          null,

        retry_required:
          true,

        error
      };
    }

    if(
      !data ||
      data.transaction_status !==
        TRANSACTION_STATUS.COMPLETE
    ){
      return {
        transaction_status:
          TRANSACTION_STATUS
            .INDETERMINATE,

        manufacturing_transaction_id:
          transactionId,

        context:
          null,

        receipt:
          null,

        handoff:
          null,

        retry_required:
          true
      };
    }

    /*
     * Only authoritative records returned by governed
     * persistence may manufacture runtime handoff.
     */
    const context =
      data.context;

    const receipt =
      data.receipt;

    if(
      !context ||
      !receipt
    ){
      return {
        transaction_status:
          TRANSACTION_STATUS
            .INDETERMINATE,

        manufacturing_transaction_id:
          transactionId,

        context:
          null,

        receipt:
          null,

        handoff:
          null,

        retry_required:
          true
      };
    }

    if(
      String(
        context.manufacturing_transaction_id ||
        ""
      ) !== transactionId
    ){
      return {
        transaction_status:
          TRANSACTION_STATUS
            .INDETERMINATE,

        manufacturing_transaction_id:
          transactionId,

        context:
          null,

        receipt:
          null,

        handoff:
          null,

        retry_required:
          true
      };
    }

    if(
      String(
        receipt.manufacturing_transaction_id ||
        ""
      ) !== transactionId
    ){
      return {
        transaction_status:
          TRANSACTION_STATUS
            .INDETERMINATE,

        manufacturing_transaction_id:
          transactionId,

        context:
          null,

        receipt:
          null,

        handoff:
          null,

        retry_required:
          true
      };
    }

    if(
      String(context.user_id || "") !==
      String(userId)
    ){
      throw new Error(
        "Recovered Stream 4 transaction user does not match authenticated authority."
      );
    }

    if(
      normalizeRole(
        context.role_name
      ) !== expectedRole
    ){
      throw new Error(
        "Recovered Stream 4 transaction role does not match authenticated authority."
      );
    }

    if(
      String(
        context.source_page || ""
      ) !== String(
        config.source_page || ""
      )
    ){
      throw new Error(
        "Recovered Stream 4 transaction source page does not match the active manufacturing request."
      );
    }

    if(
      String(
        receipt.role_context_id || ""
      ) !== String(
        context.role_context_id || ""
      )
    ){
      throw new Error(
        "Recovered Stream 4 receipt does not correlate to the authoritative role context."
      );
    }

    const handoff =
      registerRuntimeHandoff(
        context,
        receipt
      );

    /*
     * The transaction is conclusively complete from the
     * client's perspective. A future new intake receives a
     * new transaction ID.
     */
    clearTransactionPointer();

    return {
      transaction_status:
        TRANSACTION_STATUS.COMPLETE,

      manufacturing_transaction_id:
        transactionId,

      recovered:
        Boolean(
          data.recovered
        ),

      context,

      receipt,

      handoff
    };
  }

  /* =========================================================
     ADDITIONAL RECEIPT CREATION
     ========================================================= */

  async function createReceipt(config){
    requireAuthenticationAuthority();

    const validation =
      validateLoginRole(
        config.role_name
      );

    if(!validation.ok){
      throw new Error(
        validation.message
      );
    }

    const supabase =
      getSupabase();

    if(!supabase){
      throw new Error(
        "Supabase client unavailable."
      );
    }

    const payload = {
      role_context_id:
        config.role_context_id,

      role_instance_id:
        config.role_instance_id,

      role_name:
        normalizeRole(
          config.role_name
        ),

      action_type:
        config.action_type,

      action_status:
        config.action_status ||
        "created",

      receipt_payload:
        config.receipt_payload ||
        {}
    };

    const { data, error } =
      await supabase
        .from(
          "sc_role_intake_receipts"
        )
        .insert(
          payload
        )
        .select()
        .single();

    if(error){
      throw error;
    }

    return data;
  }

  /* =========================================================
     PUBLIC STREAM 4 CORE
     ========================================================= */

  window.STATSCORE_ROLE_INTAKE_CORE = {
    version:
      CORE_VERSION,

    TRANSACTION_STATUS,

    normalizeRole,

    restoreAuthenticationAuthority,
    getAuthenticationAuthority,
    requireAuthenticationAuthority,

    getCurrentUser,
    getCurrentRole,

    validateLoginRole,
    resolveRole,

    fetchSpecializations,

    saveDraft,
    restoreDraft,

    createRoleContext,
    createReceipt,

    registerRuntimeHandoff,

    getActiveManufacturingTransactionId
  };

})(); 
