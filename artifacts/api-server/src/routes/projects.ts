import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, projectsTable } from "@workspace/db";
import {
  CreateProjectBody,
  CreateProjectResponse,
  DeleteProjectParams,
  GetProjectParams,
  GetProjectResponse,
  ListProjectTasksParams,
  ListProjectTasksResponse,
  ListProjectsResponse,
  UpdateProjectBody,
  UpdateProjectParams,
  UpdateProjectResponse,
} from "@workspace/api-zod";
import { dateInputKey, getProjectWithProgress, getProjectsWithProgress, getTaskRows, isValidDateRange, serializeProject, serializeTask } from "../lib/tracker";

const router: IRouter = Router();

router.get("/projects", async (_req, res): Promise<void> => {
  const projects = await getProjectsWithProgress();
  res.json(ListProjectsResponse.parse(projects.map((project) => serializeProject(project))));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!isValidDateRange(dateInputKey(parsed.data.startDate), dateInputKey(parsed.data.targetDate))) {
    res.status(400).json({ error: "Target date must be on or after the start date." });
    return;
  }

  const [project] = await db.insert(projectsTable).values({
    ...parsed.data,
    startDate: dateInputKey(parsed.data.startDate),
    targetDate: dateInputKey(parsed.data.targetDate),
    category: parsed.data.category ?? null,
  }).returning();
  const result = serializeProject(await getProjectWithProgress(project.id));
  res.status(201).json(CreateProjectResponse.parse(result));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = serializeProject(await getProjectWithProgress(params.data.id));
  if (!result) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(GetProjectResponse.parse(result));
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const current = await getProjectWithProgress(params.data.id);
  if (!current) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const startDate = parsed.data.startDate === undefined ? current.startDate : dateInputKey(parsed.data.startDate);
  const targetDate = parsed.data.targetDate === undefined ? current.targetDate : dateInputKey(parsed.data.targetDate);
  if (!isValidDateRange(startDate, targetDate)) {
    res.status(400).json({ error: "Target date must be on or after the start date." });
    return;
  }

  const [project] = await db.update(projectsTable).set({
    ...parsed.data,
    startDate: parsed.data.startDate === undefined ? undefined : dateInputKey(parsed.data.startDate),
    targetDate: parsed.data.targetDate === undefined ? undefined : dateInputKey(parsed.data.targetDate),
    category: parsed.data.category === undefined ? undefined : parsed.data.category,
    updatedAt: new Date(),
  }).where(eq(projectsTable.id, params.data.id)).returning();
  const result = serializeProject(await getProjectWithProgress(project.id));
  res.json(UpdateProjectResponse.parse(result));
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id)).returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/projects/:id/tasks", async (req, res): Promise<void> => {
  const params = ListProjectTasksParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const project = await getProjectWithProgress(params.data.id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const rows = await getTaskRows({ projectId: params.data.id, sort: "due-date" });
  res.json(ListProjectTasksResponse.parse(rows.map(serializeTask)));
});

export default router;