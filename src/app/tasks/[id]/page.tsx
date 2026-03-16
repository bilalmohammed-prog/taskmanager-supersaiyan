import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { listComments } from "@/actions/comment/list";
import { createComment } from "@/actions/comment/create";
import { updateTask } from "@/actions/task/update";
import { getTaskById } from "@/services/task/task.service";
import { listAssignments } from "@/services/resource/assignment.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type TaskDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id: taskId } = await params;
  const ctx = await requireOrgContext();

  const [task, commentRows, assignmentRows] = await Promise.all([
    getTaskById(ctx.supabase, { organizationId: ctx.organizationId, taskId }),
    listComments(taskId),
    listAssignments(ctx.supabase, { organizationId: ctx.organizationId, taskId }),
  ]);

  if (!task) notFound();

  async function setStatusMutation(formData: FormData) {
    "use server";
    const status = String(formData.get("status") ?? "");
    if (!status) return;

    const orgCtx = await requireOrgContext();
    await updateTask(
      taskId,
      { status: status as "todo" | "in_progress" | "blocked" | "done" },
      orgCtx.organizationId
    );
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/dashboard");
  }

  async function createCommentMutation(formData: FormData) {
    "use server";
    const content = String(formData.get("content") ?? "").trim();
    if (!content) return;

    await createComment(taskId, content);
    revalidatePath(`/tasks/${taskId}`);
  }

  return (
    <div className="w-full max-w-5xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
          <CardDescription>Task detail, assignment status, and comments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Status: {task.status ?? "todo"}</Badge>
            {task.due_date && <Badge variant="outline">Due: {task.due_date}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{task.description ?? "No description provided."}</p>
          <form action={setStatusMutation} className="flex flex-wrap items-center gap-3">
            <select
              name="status"
              defaultValue={task.status ?? "todo"}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="todo">todo</option>
              <option value="in_progress">in_progress</option>
              <option value="blocked">blocked</option>
              <option value="done">done</option>
            </select>
            <Button type="submit">Update Status</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Status</CardTitle>
          <CardDescription>Current and historical assignments for this task.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {assignmentRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignments yet.</p>
          ) : (
            assignmentRows.map((assignment) => (
              <div key={assignment.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">{assignment.profile?.name ?? assignment.user_id}</p>
                <p className="text-xs text-muted-foreground">Assignment ID: {assignment.id}</p>
                <p className="text-xs text-muted-foreground">
                  Status: {assignment.end_time ? "Completed" : "Active"}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
          <CardDescription>Threaded updates for this task.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={createCommentMutation} className="space-y-2">
            <Textarea name="content" placeholder="Add a comment..." required />
            <Button type="submit">Post Comment</Button>
          </form>
          <div className="space-y-2">
            {commentRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            ) : (
              commentRows.map((comment) => (
                <div key={comment.id} className="rounded-md border border-border p-3">
                  <p className="text-sm">{comment.content}</p>
                  <p className="text-xs text-muted-foreground">
                    by {comment.author?.full_name ?? comment.user_id ?? "unknown"} at {comment.created_at ?? "-"}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
