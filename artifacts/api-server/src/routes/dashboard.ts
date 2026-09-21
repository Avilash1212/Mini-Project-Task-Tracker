import { Router, type IRouter } from "express";
import { ne } from "drizzle-orm";
import { db, projectsTable, tasksTable } from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { addDays, getProjectsWithProgress, todayKey } from "../lib/tracker";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [tasks, projects] = await Promise.all([
    db.select().from(tasksTable),
    getProjectsWithProgress(),
  ]);
  const today = todayKey();
  const weekEnd = addDays(today, 6);
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.filter((task) => task.status === "completed");
  const inProgressTasks = tasks.filter((task) => task.status === "in-progress");
  const overdueTasks = openTasks.filter((task) => task.dueDate != null && task.dueDate < today);
  const dueToday = openTasks.filter((task) => task.dueDate === today);
  const dueThisWeek = openTasks.filter((task) => task.dueDate != null && task.dueDate >= today && task.dueDate <= weekEnd);

  const result = {
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    inProgressTasks: inProgressTasks.length,
    overdueTasks: overdueTasks.length,
    completionRate: tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    dueToday: dueToday.length,
    dueThisWeek: dueThisWeek.length,
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      progress: project.progress,
      taskCount: project.taskCount,
      completedTaskCount: project.completedTaskCount,
      targetDate: project.targetDate,
    })),
  };
  res.json(GetDashboardSummaryResponse.parse(result));
});

export default router;