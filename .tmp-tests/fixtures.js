"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTenantIsolationFixture = createTenantIsolationFixture;
exports.cleanupTenantIsolationFixture = cleanupTenantIsolationFixture;
const strict_1 = __importDefault(require("node:assert/strict"));
const node_crypto_1 = require("node:crypto");
const supabase_js_1 = require("@supabase/supabase-js");
const createdUsers = [];
const createdOrgIds = [];
function getRequiredEnv(name) {
    const value = process.env[name];
    strict_1.default.ok(value, `Missing required env var: ${name}`);
    return value;
}
function buildAnonClient() {
    return (0, supabase_js_1.createClient)(getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"), getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), { auth: { autoRefreshToken: false, persistSession: false } });
}
function buildAdminClient() {
    return (0, supabase_js_1.createClient)(process.env.SUPABASE_URL ?? getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"), getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { autoRefreshToken: false, persistSession: false } });
}
async function createUserIdentity(admin, emailPrefix) {
    const email = `${emailPrefix}-${(0, node_crypto_1.randomUUID)()}@example.test`;
    const password = `P@ssw0rd-${(0, node_crypto_1.randomUUID)()}`;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });
    strict_1.default.ifError(createError);
    strict_1.default.ok(created.user, "Failed to create auth user");
    createdUsers.push(created.user.id);
    const client = buildAnonClient();
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
        email,
        password,
    });
    strict_1.default.ifError(signInError);
    strict_1.default.ok(signInData.user, "Failed to sign in test user");
    return { user: signInData.user, client, password };
}
async function createTenantIsolationFixture() {
    const admin = buildAdminClient();
    const [userAOwner, userAMember, userBOwner] = await Promise.all([
        createUserIdentity(admin, "org-a-owner"),
        createUserIdentity(admin, "org-a-member"),
        createUserIdentity(admin, "org-b-owner"),
    ]);
    const [orgAResult, orgBResult] = await Promise.all([
        admin
            .from("organizations")
            .insert({ name: `Org A ${(0, node_crypto_1.randomUUID)()}`, slug: `org-a-${(0, node_crypto_1.randomUUID)().slice(0, 8)}` })
            .select("*")
            .single(),
        admin
            .from("organizations")
            .insert({ name: `Org B ${(0, node_crypto_1.randomUUID)()}`, slug: `org-b-${(0, node_crypto_1.randomUUID)().slice(0, 8)}` })
            .select("*")
            .single(),
    ]);
    strict_1.default.ifError(orgAResult.error);
    strict_1.default.ifError(orgBResult.error);
    strict_1.default.ok(orgAResult.data && orgBResult.data, "Failed to create org fixtures");
    const orgA = orgAResult.data;
    const orgB = orgBResult.data;
    createdOrgIds.push(orgA.id, orgB.id);
    const profileRows = [
        { id: userAOwner.user.id, active_organization_id: orgA.id, full_name: "Org A Owner" },
        { id: userAMember.user.id, active_organization_id: orgA.id, full_name: "Org A Member" },
        { id: userBOwner.user.id, active_organization_id: orgB.id, full_name: "Org B Owner" },
    ];
    const { error: profileError } = await admin.from("profiles").upsert(profileRows, { onConflict: "id" });
    strict_1.default.ifError(profileError);
    const membershipRows = [
        { organization_id: orgA.id, user_id: userAOwner.user.id, role: "owner" },
        { organization_id: orgA.id, user_id: userAMember.user.id, role: "employee" },
        { organization_id: orgB.id, user_id: userAOwner.user.id, role: "employee" },
        { organization_id: orgB.id, user_id: userBOwner.user.id, role: "owner" },
    ];
    const { error: memberError } = await admin.from("org_members").insert(membershipRows);
    strict_1.default.ifError(memberError);
    const [projectAVisibleRes, projectAHiddenRes, projectBRes] = await Promise.all([
        admin
            .from("projects")
            .insert({ organization_id: orgA.id, name: "A Visible Project", status: "active" })
            .select("*")
            .single(),
        admin
            .from("projects")
            .insert({ organization_id: orgA.id, name: "A Hidden Project", status: "active" })
            .select("*")
            .single(),
        admin
            .from("projects")
            .insert({ organization_id: orgB.id, name: "B Project", status: "active" })
            .select("*")
            .single(),
    ]);
    strict_1.default.ifError(projectAVisibleRes.error);
    strict_1.default.ifError(projectAHiddenRes.error);
    strict_1.default.ifError(projectBRes.error);
    strict_1.default.ok(projectAVisibleRes.data && projectAHiddenRes.data && projectBRes.data);
    const projectAVisible = projectAVisibleRes.data;
    const projectAHidden = projectAHiddenRes.data;
    const projectB = projectBRes.data;
    const { error: projectMemberError } = await admin.from("project_members").insert([
        {
            organization_id: orgA.id,
            project_id: projectAVisible.id,
            user_id: userAMember.user.id,
            role: "contributor",
        },
    ]);
    strict_1.default.ifError(projectMemberError);
    const [taskAVisibleRes, taskAHiddenRes, taskBRes] = await Promise.all([
        admin
            .from("tasks")
            .insert({
            organization_id: orgA.id,
            project_id: projectAVisible.id,
            title: "Task A Visible",
            status: "todo",
        })
            .select("*")
            .single(),
        admin
            .from("tasks")
            .insert({
            organization_id: orgA.id,
            project_id: projectAHidden.id,
            title: "Task A Hidden",
            status: "todo",
        })
            .select("*")
            .single(),
        admin
            .from("tasks")
            .insert({
            organization_id: orgB.id,
            project_id: projectB.id,
            title: "Task B",
            status: "todo",
        })
            .select("*")
            .single(),
    ]);
    strict_1.default.ifError(taskAVisibleRes.error);
    strict_1.default.ifError(taskAHiddenRes.error);
    strict_1.default.ifError(taskBRes.error);
    strict_1.default.ok(taskAVisibleRes.data && taskAHiddenRes.data && taskBRes.data);
    const taskAVisible = taskAVisibleRes.data;
    const taskAHidden = taskAHiddenRes.data;
    const taskB = taskBRes.data;
    const [assignmentARes, assignmentBRes] = await Promise.all([
        admin
            .from("assignments")
            .insert({
            organization_id: orgA.id,
            task_id: taskAVisible.id,
            user_id: userAMember.user.id,
            allocated_hours: 3,
        })
            .select("*")
            .single(),
        admin
            .from("assignments")
            .insert({
            organization_id: orgB.id,
            task_id: taskB.id,
            user_id: userBOwner.user.id,
            allocated_hours: 5,
        })
            .select("*")
            .single(),
    ]);
    strict_1.default.ifError(assignmentARes.error);
    strict_1.default.ifError(assignmentBRes.error);
    strict_1.default.ok(assignmentARes.data && assignmentBRes.data);
    const messageBRes = await admin
        .from("messages")
        .insert({
        organization_id: orgB.id,
        sender_id: userBOwner.user.id,
        recipient_id: userAOwner.user.id,
        content: "Org B private message",
    })
        .select("*")
        .single();
    strict_1.default.ifError(messageBRes.error);
    strict_1.default.ok(messageBRes.data);
    return {
        admin,
        userAOwner: { user: userAOwner.user, client: userAOwner.client },
        userAMember: { user: userAMember.user, client: userAMember.client },
        userBOwner: { user: userBOwner.user, client: userBOwner.client },
        orgA,
        orgB,
        projectAVisible,
        projectAHidden,
        projectB,
        taskAVisible,
        taskAHidden,
        taskB,
        assignmentA: assignmentARes.data,
        assignmentB: assignmentBRes.data,
        messageB: messageBRes.data,
    };
}
async function cleanupTenantIsolationFixture() {
    const admin = buildAdminClient();
    for (const orgId of createdOrgIds) {
        await admin.from("manager_employees").delete().eq("organization_id", orgId);
        await admin.from("messages").delete().eq("organization_id", orgId);
        await admin.from("assignments").delete().eq("organization_id", orgId);
        await admin.from("comments").delete().eq("organization_id", orgId);
        await admin.from("tasks").delete().eq("organization_id", orgId);
        await admin.from("project_members").delete().eq("organization_id", orgId);
        await admin.from("projects").delete().eq("organization_id", orgId);
        await admin.from("org_members").delete().eq("organization_id", orgId);
        await admin.from("organizations").delete().eq("id", orgId);
    }
    for (const userId of createdUsers) {
        await admin.from("profiles").delete().eq("id", userId);
        await admin.auth.admin.deleteUser(userId);
    }
}
