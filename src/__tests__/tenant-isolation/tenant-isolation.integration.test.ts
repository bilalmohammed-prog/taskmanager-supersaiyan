import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import {
  cleanupTenantIsolationFixture,
  createTenantIsolationFixture,
  type TenantIsolationFixture,
} from "./fixtures";

describe("tenant isolation integration", () => {
  let fixture: TenantIsolationFixture;

  before(async () => {
    fixture = await createTenantIsolationFixture();
  });

  after(async () => {
    await cleanupTenantIsolationFixture();
  });

  test("1) org A user cannot read org B projects/tasks/assignments", async () => {
    const actor = fixture.userAMember.client;

    const [projectsRes, tasksRes, assignmentsRes] = await Promise.all([
      actor.from("projects").select("id").eq("organization_id", fixture.orgB.id),
      actor.from("tasks").select("id").eq("organization_id", fixture.orgB.id),
      actor.from("assignments").select("id").eq("organization_id", fixture.orgB.id),
    ]);

    assert.ifError(projectsRes.error);
    assert.ifError(tasksRes.error);
    assert.ifError(assignmentsRes.error);
    assert.equal(projectsRes.data?.length ?? 0, 0);
    assert.equal(tasksRes.data?.length ?? 0, 0);
    assert.equal(assignmentsRes.data?.length ?? 0, 0);
  });

  test("2) role downgrade: member cannot perform admin actions", async () => {
    const memberClient = fixture.userAMember.client;

    const managerEmployeeInsert = await memberClient.from("manager_employees").insert({
      organization_id: fixture.orgA.id,
      manager_id: fixture.userAOwner.user.id,
      employee_id: fixture.userAMember.user.id,
    });

    assert.ok(
      managerEmployeeInsert.error,
      "Expected employee role to be blocked from manager_employees mutation"
    );
  });

  test("3) project member cannot access tasks in projects they are not in", async () => {
    const memberClient = fixture.userAMember.client;

    const hiddenProjectTasks = await memberClient
      .from("tasks")
      .select("id,project_id")
      .eq("organization_id", fixture.orgA.id)
      .eq("project_id", fixture.projectAHidden.id)
      .is("deleted_at", null);

    assert.ifError(hiddenProjectTasks.error);
    assert.equal(
      hiddenProjectTasks.data?.length ?? 0,
      0,
      "Project member should not read tasks for projects they are not a member of"
    );
  });

  test("4) assignment leakage: user cannot view another org assignments", async () => {
    const actor = fixture.userAMember.client;
    const foreignAssignments = await actor
      .from("assignments")
      .select("id,organization_id")
      .eq("organization_id", fixture.orgB.id);

    assert.ifError(foreignAssignments.error);
    assert.equal(foreignAssignments.data?.length ?? 0, 0);
  });
});
