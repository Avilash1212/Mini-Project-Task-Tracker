import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, projectsTable, tasksTable } from "@workspace/db";
import {
  CreateTaskBody,
  CreateTaskResponse,
  DeleteTaskParams,
  DuplicateTaskParams,
  DuplicateTaskResponse,
  GetTaskParams,
  GetTaskResponse,
  ListTasksQueryParams,
  ListTasksResponse,
  UpdateTaskBody,
  UpdateTaskParams,
  UpdateTaskResponse,
} from "@workspace/api-zod";
import { dateInputKey, getTaskRow, getTaskRows, serializeTask } from "../lib/tracker";

const router: IRouter = Router();

router.get("/tasks", async (req, res): Promise<void> => {
  const parsed = ListTasksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = await getTaskRows(parsed.data);
  res.json(ListTasksResponse.parse(rows.map(serializeTask)));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db.select({ id: projectsTable.id }).from(projectsTable).where(eq(projectsTable.id, parsed.data.projectId));
  if (!project) {
    res.status(400).json({ error: "Project not found." });
    return;
  }
  const [task] = await db.insert(tasksTable).values({
    ...parsed.data,
    notes: parsed.data.notes ?? "",
    dueDate: dateInputKey(parsed.data.dueDate) ?? null,
    assignee: parsed.data.assignee ?? null,
  }).returning();
  const result = await getTaskRow(task.id);
  res.status(201).json(CreateTaskResponse.parse(result ? serializeTask(result) : result));
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = await getTaskRow(params.data.id);
  if (!result) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(GetTaskResponse.parse(serializeTask(result)));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const current = await getTaskRow(params.data.id);
  if (!current) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  if (parsed.data.projectId !== undefined) {
    const [project] = await db.select({ id: projectsTable.id }).from(projectsTable).where(eq(projectsTable.id, parsed.data.projectId));
    if (!project) {
      res.status(400).json({ error: "Project not found." });
      return;
    }
  }

  await db.update(tasksTable).set({
    ...parsed.data,
    notes: parsed.data.notes === undefined ? undefined : parsed.data.notes,
    dueDate: parsed.data.dueDate === undefined ? undefined : dateInputKey(parsed.data.dueDate),
    assignee: parsed.data.assignee === undefined ? undefined : parsed.data.assignee,
    updatedAt: new Date(),
  }).where(eq(tasksTable.id, params.data.id));
  const result = await getTaskRow(params.data.id);
  res.json(UpdateTaskResponse.parse(result ? serializeTask(result) : result));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/tasks/:id/duplicate", async (req, res): Promise<void> => {
  const params = DuplicateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const current = await getTaskRow(params.data.id);
  if (!current) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const [task] = await db.insert(tasksTable).values({
    projectId: current.task.projectId,
    name: `Copy of ${current.task.name}`.slice(0, 160),
    notes: current.task.notes,
    status: "todo",
    priority: current.task.priority,
    dueDate: current.task.dueDate,
    assignee: current.task.assignee,
  }).returning();
  const result = await getTaskRow(task.id);
  res.status(201).json(DuplicateTaskResponse.parse(result ? serializeTask(result) : result));
});

export default router;