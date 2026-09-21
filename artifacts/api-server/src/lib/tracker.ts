import { and, asc, desc, eq, ilike, isNull, lt, lte, gte, ne, or } from "drizzle-orm";
import { db, projectsTable, tasksTable } from "@workspace/db";

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const dateInputKey = (value: Date | string | null | undefined) =>
  value == null ? value : value instanceof Date ? value.toISOString().slice(0, 10) : value;

export const addDays = (dateKey: string, days: number) => {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const isValidDateRange = (startDate?: string | null, targetDate?: string | null) =>
  !startDate || !targetDate || startDate <= targetDate;

export async function getProjectsWithProgress() {
  const [projects, tasks] = await Promise.all([
    db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt)),
    db.select().from(tasksTable),
  ]);

  return projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    const completedTaskCount = projectTasks.filter((task) => task.status === "completed").length;
    return {
      ...project,
      taskCount: projectTasks.length,
      completedTaskCount,
      progress: projectTasks.length ? Math.round((completedTaskCount / projectTasks.length) * 100) : 0,
    };
  });
}

export async function getProjectWithProgress(id: number) {
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) return undefined;
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.projectId, id));
  const completedTaskCount = tasks.filter((task) => task.status === "completed").length;
  return {
    ...project,
    taskCount: tasks.length,
    completedTaskCount,
    progress: tasks.length ? Math.round((completedTaskCount / tasks.length) * 100) : 0,
  };
}

export function serializeProject(project: Awaited<ReturnType<typeof getProjectWithProgress>>) {
  if (!project) return undefined;
  return {
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function serializeTask(row: { task: typeof tasksTable.$inferSelect; projectName: string }) {
  return {
    ...row.task,
    projectName: row.projectName,
    createdAt: row.task.createdAt.toISOString(),
    updatedAt: row.task.updatedAt.toISOString(),
  };
}

export async function getTaskRows(options?: {
  projectId?: number;
  search?: string;
  status?: string;
  priority?: string;
  due?: string;
  sort?: string;
}) {
  const conditions = [];
  if (options?.projectId) conditions.push(eq(tasksTable.projectId, options.projectId));
  if (options?.search) {
    conditions.push(or(ilike(tasksTable.name, `%${options.search}%`), ilike(tasksTable.notes, `%${options.search}%`)));
  }
  if (options?.status) conditions.push(eq(tasksTable.status, options.status));
  if (options?.priority) conditions.push(eq(tasksTable.priority, options.priority));

  const today = todayKey();
  const weekEnd = addDays(today, 6);
  if (options?.due === "overdue") conditions.push(and(lt(tasksTable.dueDate, today), ne(tasksTable.status, "completed")));
  if (options?.due === "today") conditions.push(eq(tasksTable.dueDate, today));
  if (options?.due === "this-week") conditions.push(and(gte(tasksTable.dueDate, today), lte(tasksTable.dueDate, weekEnd)));
  if (options?.due === "no-date") conditions.push(isNull(tasksTable.dueDate));

  const orderBy = options?.sort === "priority"
    ? asc(tasksTable.priority)
    : options?.sort === "status"
      ? asc(tasksTable.status)
      : asc(tasksTable.dueDate);

  return db
    .select({ task: tasksTable, projectName: projectsTable.name })
    .from(tasksTable)
    .innerJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(orderBy, desc(tasksTable.createdAt));
}

export async function getTaskRow(id: number) {
  const [row] = await db
    .select({ task: tasksTable, projectName: projectsTable.name })
    .from(tasksTable)
    .innerJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
    .where(eq(tasksTable.id, id));
  return row;
}