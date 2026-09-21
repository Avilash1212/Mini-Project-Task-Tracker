import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  Clock3,
  Copy,
  FolderKanban,
  LayoutDashboard,
  ListFilter,
  Menu,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey,
  getGetProjectQueryKey,
  getGetTaskQueryKey,
  getListProjectTasksQueryKey,
  getListProjectsQueryKey,
  getListTasksQueryKey,
  useCreateProject,
  useCreateTask,
  useDeleteProject,
  useDeleteTask,
  useDuplicateTask,
  useGetDashboardSummary,
  useGetProject,
  useGetTask,
  useListProjectTasks,
  useListProjects,
  useListTasks,
  useUpdateProject,
  useUpdateTask,
} from '@workspace/api-client-react';
import type {
  DashboardSummary,
  Project,
  ProjectInput,
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Route, Switch, Link, useLocation, useParams, Router as WouterRouter } from 'wouter';
import './index.css';

const queryClient = new QueryClient();

const today = new Date();
const isoToday = today.toISOString().slice(0, 10);
const dateKey = (date?: string | Date | null) =>
  date instanceof Date ? date.toISOString().slice(0, 10) : date?.slice(0, 10);
const formatDate = (date?: string | Date | null) => {
  const key = dateKey(date);
  return key ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${key}T12:00:00`)) : 'No date';
};
const fullDate = (date?: string | Date | null) => {
  const key = dateKey(date);
  return key ? new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${key}T12:00:00`)) : 'No date';
};
const statusLabel: Record<string, string> = { todo: 'To do', 'in-progress': 'In progress', completed: 'Completed' };
const priorityLabel: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/tasks', label: 'All tasks', icon: ClipboardList },
  ];
  return (
    <div className="app-noise min-h-[100dvh] bg-background text-foreground">
      <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[258px] flex-col bg-sidebar px-5 py-6 text-sidebar-foreground transition-transform duration-300 md:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="mb-12 flex items-center justify-between px-2">
          <Link href="/" className="focus-ring flex items-center gap-3" data-testid="link-brand">
            <span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-secondary text-sidebar-primary-foreground shadow-[0_5px_16px_hsl(69_72%_63%_/_0.18)]">
              <Sparkles className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="font-mono text-sm font-bold tracking-tight">nextstep<span className="text-secondary">.</span></span>
          </Link>
          <button className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation"><X className="h-4 w-4" /></button>
        </div>
        <div className="mb-3 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/45">Workspace</div>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? location === '/' : location.startsWith(href);
            return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={cn('focus-ring group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors', active ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground')} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon className={cn('h-[17px] w-[17px]', active ? 'text-secondary' : 'text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80')} strokeWidth={active ? 2.5 : 1.8} />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-secondary" />}
            </Link>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/50">Momentum</span>
            <Target className="h-4 w-4 text-secondary" />
          </div>
          <p className="text-sm leading-relaxed text-sidebar-foreground/80">Small steps add up. Keep the next one visible.</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sidebar/80"><div className="h-full w-[68%] rounded-full bg-secondary" /></div>
        </div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-40 bg-sidebar/40 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu overlay" data-testid="button-menu-overlay" />}
      <main className="min-h-[100dvh] md:pl-[258px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:px-10">
          <button className="rounded-xl p-2 text-muted-foreground hover:bg-muted md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu className="h-5 w-5" /></button>
          <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground md:flex"><span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Focus mode</div>
          <div className="ml-auto flex items-center gap-3">
            <button className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition hover:border-primary/30 hover:text-foreground sm:flex" data-testid="button-search-hint"><Search className="h-3.5 w-3.5" /> Search <kbd className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">/</kbd></button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 font-mono text-xs font-bold text-accent-foreground" data-testid="avatar-user">AR</div>
          </div>
        </header>
        <div className="mx-auto max-w-[1380px] px-5 py-8 md:px-10 md:py-10">{children}</div>
      </main>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
    <div className="rise-in">
      <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">{eyebrow}</div>
      <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground md:text-[42px] md:leading-[1.06]">{title}</h1>
      {description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>;
}

function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return <div className={cn('progress-sheen h-2 w-full rounded-full bg-muted', className)}><div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

function StatCard({ label, value, detail, icon: Icon, accent = 'primary' }: { label: string; value: string | number; detail: string; icon: typeof Check; accent?: 'primary' | 'coral' | 'lime' }) {
  return <div className="soft-shadow rise-in-1 rounded-2xl border border-border/80 bg-card p-5">
    <div className="mb-7 flex items-start justify-between"><span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span><span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', accent === 'coral' ? 'bg-accent/15 text-accent' : accent === 'lime' ? 'bg-secondary/30 text-primary' : 'bg-primary/10 text-primary')}><Icon className="h-4 w-4" /></span></div>
    <div className="text-3xl font-semibold tracking-[-0.04em]">{value}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div>
  </div>;
}

function Dashboard() {
  const { data, isLoading, isError, refetch } = useGetDashboardSummary();
  const { data: tasks } = useListTasks({ due: 'this-week', sort: 'due-date' });
  if (isLoading) return <LoadingState label="Getting your workspace ready" />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;
  const summary = data as DashboardSummary;
  const attention = (tasks ?? []).filter((task) => task.status !== 'completed').slice(0, 4);
  return <div>
    <PageHeading eyebrow="Monday, keep moving" title="Your next step is clear." description="A quick read on what is moving, what needs a nudge, and where your energy goes next." action={<Link href="/tasks" className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_hsl(167_34%_26%_/_0.16)] transition hover:-translate-y-0.5" data-testid="link-view-tasks">View task list <ArrowUpRight className="h-4 w-4" /></Link>} />
    <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="All tasks" value={summary.totalTasks} detail={`${summary.inProgressTasks} currently in progress`} icon={ClipboardList} />
      <StatCard label="Completed" value={`${summary.completionRate}%`} detail={`${summary.completedTasks} tasks checked off`} icon={CheckCircle2} accent="lime" />
      <StatCard label="Due today" value={summary.dueToday} detail={`${summary.dueThisWeek} due this week`} icon={Clock3} accent="coral" />
      <StatCard label="Overdue" value={summary.overdueTasks} detail={summary.overdueTasks ? 'Worth a look before new work' : 'Nothing waiting behind you'} icon={TriangleAlert} accent="coral" />
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <section className="soft-shadow rise-in-2 rounded-2xl border border-border/80 bg-card p-5 md:p-7">
        <div className="mb-7 flex items-start justify-between"><div><div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Project pulse</div><h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Progress, at a glance</h2></div><Link href="/projects" className="focus-ring text-xs font-semibold text-primary hover:underline" data-testid="link-all-projects">All projects</Link></div>
        {summary.projects.length === 0 ? <EmptyState icon={FolderKanban} title="No projects yet" description="Start with the project that is taking up the most space in your head." action={<Link href="/projects" className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground" data-testid="link-empty-create-project">Create a project</Link>} /> :
          <div className="space-y-5">{summary.projects.slice(0, 5).map((project, index) => <Link href={`/projects/${project.id}`} key={project.id} className={cn('focus-ring block rounded-xl p-2 transition hover:bg-muted/70', `rise-in-${Math.min(index + 1, 3)}`)} data-testid={`card-dashboard-project-${project.id}`}>
            <div className="mb-2 flex items-center justify-between gap-4"><span className="truncate text-sm font-semibold">{project.name}</span><span className="font-mono text-xs text-primary">{project.progress}%</span></div>
            <ProgressBar value={project.progress} /><div className="mt-2 flex justify-between text-[11px] text-muted-foreground"><span>{project.completedTaskCount} of {project.taskCount} tasks complete</span><span>{project.targetDate ? `Target ${formatDate(project.targetDate)}` : 'No target date'}</span></div>
          </Link>)}</div>}
      </section>
      <section className="soft-shadow rise-in-3 rounded-2xl border border-border/80 bg-primary p-5 text-primary-foreground md:p-7">
        <div className="mb-8 flex items-start justify-between"><div><div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary-foreground/55">Needs attention</div><h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Keep the chain going.</h2></div><div className="rounded-xl bg-primary-foreground/10 p-2 text-secondary"><ArrowDownUp className="h-4 w-4" /></div></div>
        {attention.length === 0 ? <div className="flex min-h-[190px] flex-col justify-center rounded-xl border border-primary-foreground/10 p-5"><CheckCircle2 className="mb-4 h-7 w-7 text-secondary" /><p className="font-semibold">You are caught up.</p><p className="mt-1 text-sm text-primary-foreground/60">A rare and satisfying view. Enjoy it, then pick your next challenge.</p></div> :
          <div className="space-y-2">{attention.map((task) => <Link key={task.id} href="/tasks" className="focus-ring group flex items-center gap-3 rounded-xl border border-primary-foreground/10 bg-primary-foreground/[.06] p-3 transition hover:bg-primary-foreground/[.11]" data-testid={`card-attention-task-${task.id}`}><span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border', task.status === 'in-progress' ? 'border-secondary bg-secondary/15 text-secondary' : 'border-primary-foreground/25 text-primary-foreground/40')}><Circle className="h-3 w-3" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{task.name}</span><span className="mt-0.5 block text-[11px] text-primary-foreground/55">{task.projectName} · {task.dueDate ? formatDate(task.dueDate) : 'No date'}</span></span><ArrowUpRight className="h-4 w-4 text-primary-foreground/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>)}</div>}
        <Link href="/tasks" className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-secondary hover:underline" data-testid="link-attention-tasks">See the full list <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </section>
    </div>
  </div>;
}

function ProjectsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useListProjects();
  const create = useCreateProject();
  const del = useDeleteProject();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [query, setQuery] = useState('');
  const projects = (data ?? []).filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const openCreate = () => { setEditing(null); setModal('create'); };
  const submit = (input: ProjectInput) => {
    if (editing) return;
    create.mutate({ data: input }, { onSuccess: (project) => { qc.invalidateQueries({ queryKey: getListProjectsQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setModal(null); } });
  };
  const remove = (project: Project) => { if (window.confirm(`Delete "${project.name}" and its tasks?`)) del.mutate({ id: project.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListProjectsQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); } }); };
  if (isLoading) return <LoadingState label="Loading projects" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  return <div>
    <PageHeading eyebrow="Your workspace" title="Projects with a pulse." description="Keep the outcome visible, then let the tasks do the heavy lifting." action={<button onClick={openCreate} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_hsl(167_34%_26%_/_0.16)] transition hover:-translate-y-0.5" data-testid="button-create-project"><Plus className="h-4 w-4" /> New project</button>} />
    <div className="mb-6 flex max-w-md items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm"><Search className="h-4 w-4 text-muted-foreground" /><input className="focus-ring min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a project" data-testid="input-search-projects" /></div>
    {projects.length === 0 ? <EmptyState icon={FolderKanban} title={query ? 'No matching projects' : 'Your project shelf is empty'} description={query ? 'Try a different name.' : 'A project gives your next actions somewhere to land.'} action={!query && <button onClick={openCreate} className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground" data-testid="button-empty-create-project">Create your first project</button>} /> :
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{projects.map((project, i) => <div key={project.id} className={cn('soft-shadow group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 transition hover:-translate-y-1 hover:border-primary/25', `rise-in-${Math.min(i + 1, 3)}`)} data-testid={`card-project-${project.id}`}>
        <div className="mb-8 flex items-start justify-between"><span className="rounded-full bg-secondary/25 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-primary">{project.category || 'Project'}</span><div className="flex gap-1 opacity-0 transition group-hover:opacity-100"><Link href={`/projects/${project.id}`} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid={`link-edit-project-${project.id}`}><Pencil className="h-3.5 w-3.5" /></Link><button onClick={() => remove(project)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent/15 hover:text-accent" aria-label={`Delete ${project.name}`} data-testid={`button-delete-project-${project.id}`}><Trash2 className="h-3.5 w-3.5" /></button></div></div>
        <Link href={`/projects/${project.id}`} className="focus-ring block" data-testid={`link-project-${project.id}`}><h2 className="line-clamp-2 min-h-[56px] text-xl font-semibold tracking-[-0.04em]">{project.name}</h2><p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-relaxed text-muted-foreground">{project.description || 'No description yet.'}</p><div className="mt-7 flex items-center justify-between text-xs"><span className="font-medium text-muted-foreground">{project.completedTaskCount} / {project.taskCount} complete</span><span className="font-mono font-bold text-primary">{project.progress}%</span></div><ProgressBar value={project.progress} className="mt-2" /><div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {project.targetDate ? `Target ${formatDate(project.targetDate)}` : 'No target date'}</div></Link>
      </div>)}</div>}
    {modal === 'create' && <ProjectModal onClose={() => setModal(null)} onSubmit={submit} pending={create.isPending} />}
  </div>;
}

function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const qc = useQueryClient();
  const projectQuery = useGetProject(projectId, { query: { queryKey: getGetProjectQueryKey(projectId) } });
  const tasksQuery = useListProjectTasks(projectId, { query: { queryKey: getListProjectTasksQueryKey(projectId) } });
  const update = useUpdateProject();
  const create = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [editingProject, setEditingProject] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const project = projectQuery.data;
  if (projectQuery.isLoading) return <LoadingState label="Opening project" />;
  if (projectQuery.isError || !project) return <ErrorState onRetry={() => projectQuery.refetch()} />;
  const tasks = tasksQuery.data ?? [];
  const completeTask = (task: Task) => updateTask.mutate({ id: task.id, data: { status: task.status === 'completed' ? 'todo' : 'completed' as TaskStatus } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId) }); qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); } });
  return <div>
    <Link href="/projects" className="focus-ring mb-7 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground" data-testid="link-back-projects"><ArrowLeft className="h-4 w-4" /> All projects</Link>
    <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70"><span className="h-2 w-2 rounded-full bg-secondary" /> {project.category || 'Project'}</div><h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] md:text-6xl">{project.name}</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{project.description || 'Give this project a sentence so future-you knows why it matters.'}</p></div><div className="flex gap-2"><button onClick={() => setEditingProject(true)} className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-primary/30" data-testid="button-edit-project"><Pencil className="h-4 w-4" /> Edit details</button><button onClick={() => setTaskModal(true)} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5" data-testid="button-add-project-task"><Plus className="h-4 w-4" /> Add task</button></div></div>
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-primary p-5 text-primary-foreground"><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary-foreground/55">Completion</div><div className="mt-3 text-4xl font-semibold tracking-[-0.06em]">{project.progress}%</div><ProgressBar value={project.progress} className="mt-4 bg-primary-foreground/15 [&>div]:bg-secondary" /></div><div className="rounded-2xl border border-border bg-card p-5"><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Target date</div><div className="mt-3 text-xl font-semibold">{fullDate(project.targetDate)}</div><div className="mt-1 text-xs text-muted-foreground">{project.targetDate ? 'Keep the finish line in view' : 'Add one to create a finish line'}</div></div><div className="rounded-2xl border border-border bg-card p-5"><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Outcome</div><div className="mt-3 line-clamp-2 text-sm font-medium leading-relaxed">{project.expectedOutcome || 'What does done look like?'}</div></div></div>
    <section className="soft-shadow rounded-2xl border border-border/80 bg-card p-5 md:p-7"><div className="mb-6 flex items-center justify-between"><div><div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Project tasks</div><h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">{tasks.length} next actions</h2></div><span className="rounded-full bg-muted px-3 py-1.5 font-mono text-[10px] text-muted-foreground">{tasks.filter(t => t.status === 'completed').length} done</span></div>
      {tasksQuery.isLoading ? <SkeletonRows /> : tasks.length === 0 ? <EmptyState icon={ClipboardList} title="No next actions yet" description="Turn the outcome above into one small, concrete thing you can do." action={<button onClick={() => { setEditingTask(null); setTaskModal(true); }} className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground" data-testid="button-empty-add-task">Add a task</button>} /> :
        <div className="space-y-2">{tasks.map(task => <TaskRow key={task.id} task={task} onToggle={() => completeTask(task)} onEdit={() => { setEditingTask(task); setTaskModal(true); }} compact />)}</div>}
    </section>
    {editingProject && <ProjectModal project={project} onClose={() => setEditingProject(false)} pending={update.isPending} onSubmit={(input) => update.mutate({ id: projectId, data: input }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }); qc.invalidateQueries({ queryKey: getListProjectsQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setEditingProject(false); } })} />}
    {taskModal && <TaskModal task={editingTask ?? undefined} projectId={projectId} projects={[project]} onClose={() => setTaskModal(false)} pending={create.isPending || updateTask.isPending} onSubmit={(input) => editingTask ? updateTask.mutate({ id: editingTask.id, data: input }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId) }); qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }); setTaskModal(false); setEditingTask(null); } }) : create.mutate({ data: input }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId) }); qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }); setTaskModal(false); } })} />}
  </div>;
}

function TasksPage() {
  const qc = useQueryClient();
  const { data: projects } = useListProjects();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | TaskStatus>('all');
  const [priority, setPriority] = useState<'all' | TaskPriority>('all');
  const [due, setDue] = useState<'all' | 'overdue' | 'today' | 'this-week' | 'no-date'>('all');
  const [sort, setSort] = useState<'priority' | 'due-date' | 'status'>('due-date');
  const params = useMemo(() => ({ ...(search ? { search } : {}), ...(status !== 'all' ? { status } : {}), ...(priority !== 'all' ? { priority } : {}), ...(due !== 'all' ? { due } : {}), sort }), [search, status, priority, due, sort]);
  const tasksQuery = useListTasks(params);
  const create = useCreateTask();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const duplicate = useDuplicateTask();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: getListTasksQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); qc.invalidateQueries({ queryKey: getListProjectsQueryKey() }); };
  const toggle = (task: Task) => update.mutate({ id: task.id, data: { status: task.status === 'completed' ? 'todo' : 'completed' } }, { onSuccess: refresh });
  const remove = (task: Task) => { if (window.confirm(`Delete "${task.name}"?`)) del.mutate({ id: task.id }, { onSuccess: refresh }); };
  const openCreate = () => { setEditing(null); setModal(true); };
  const openEdit = (task: Task) => { setEditing(task); setModal(true); };
  return <div>
    <PageHeading eyebrow="The action list" title="Make progress visible." description="Search, sort, and shape the list until the next useful thing is obvious." action={<button onClick={openCreate} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_hsl(167_34%_26%_/_0.16)] transition hover:-translate-y-0.5" data-testid="button-create-task"><Plus className="h-4 w-4" /> New task</button>} />
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-sm lg:flex-row"><div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5"><Search className="h-4 w-4 text-muted-foreground" /><input className="focus-ring min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." data-testid="input-search-tasks" /></div><div className="flex flex-wrap gap-2"><FilterSelect label="Status" value={status} onChange={v => setStatus(v as typeof status)} options={[['all', 'All status'], ['todo', 'To do'], ['in-progress', 'In progress'], ['completed', 'Completed']]} /><FilterSelect label="Priority" value={priority} onChange={v => setPriority(v as typeof priority)} options={[['all', 'All priority'], ['high', 'High priority'], ['medium', 'Medium priority'], ['low', 'Low priority']]} /><FilterSelect label="Due" value={due} onChange={v => setDue(v as typeof due)} options={[['all', 'Any due date'], ['overdue', 'Overdue'], ['today', 'Today'], ['this-week', 'This week'], ['no-date', 'No date']]} /><label className="flex items-center gap-2 rounded-xl border border-border px-3 text-xs font-medium text-muted-foreground"><ArrowDownUp className="h-3.5 w-3.5" /><select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="bg-transparent py-2.5 outline-none" data-testid="select-sort-tasks"><option value="due-date">Due date</option><option value="priority">Priority</option><option value="status">Status</option></select></label></div></div>
    <section className="soft-shadow overflow-hidden rounded-2xl border border-border/80 bg-card">{tasksQuery.isLoading ? <SkeletonRows /> : tasksQuery.isError ? <ErrorState onRetry={() => tasksQuery.refetch()} /> : (tasksQuery.data ?? []).length === 0 ? <EmptyState icon={ListFilter} title="Nothing matches that view" description="Try clearing a filter, or make a fresh next action." action={<button onClick={openCreate} className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground" data-testid="button-empty-create-task">Create a task</button>} /> : <div>{(tasksQuery.data ?? []).map(task => <TaskRow key={task.id} task={task} onToggle={() => toggle(task)} onEdit={() => openEdit(task)} onDelete={() => remove(task)} onDuplicate={() => duplicate.mutate({ id: task.id }, { onSuccess: refresh })} />)}</div>}</section>
    {modal && <TaskModal task={editing ?? undefined} projects={projects ?? []} onClose={() => setModal(false)} pending={create.isPending || update.isPending} onSubmit={(input) => editing ? update.mutate({ id: editing.id, data: input }, { onSuccess: () => { refresh(); setModal(false); } }) : create.mutate({ data: input }, { onSuccess: () => { refresh(); setModal(false); } })} />}
  </div>;
}

function TaskRow({ task, onToggle, onEdit, onDelete, onDuplicate, compact = false }: { task: Task; onToggle: () => void; onEdit: () => void; onDelete?: () => void; onDuplicate?: () => void; compact?: boolean }) {
  return <div className={cn('group flex items-center gap-3 border-b border-border/70 px-4 py-4 transition last:border-0 hover:bg-muted/35 md:px-5', task.status === 'completed' && 'bg-muted/20')} data-testid={`row-task-${task.id}`}>
    <button onClick={onToggle} className={cn('focus-ring flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all', task.status === 'completed' ? 'check-pop border-primary bg-primary text-primary-foreground' : task.status === 'in-progress' ? 'border-secondary bg-secondary/25 text-primary' : 'border-border text-transparent hover:border-primary/60')} aria-label={`Mark ${task.name} ${task.status === 'completed' ? 'incomplete' : 'complete'}`} data-testid={`button-toggle-task-${task.id}`}>{task.status === 'completed' && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</button>
    <div className="min-w-0 flex-1"><div className={cn('truncate text-sm font-semibold', task.status === 'completed' && 'text-muted-foreground line-through')}>{task.name}</div><div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground"><span>{task.projectName}</span>{!compact && <><span className="text-border">/</span><span className={cn('font-medium', task.priority === 'high' ? 'text-accent' : task.priority === 'medium' ? 'text-primary' : '')}>{priorityLabel[task.priority]}</span></>}{task.dueDate && <><span className="text-border">/</span><span className={task.dueDate < isoToday && task.status !== 'completed' ? 'text-accent' : ''}>{formatDate(task.dueDate)}</span></>}</div></div>
    <span className={cn('hidden rounded-full px-2.5 py-1 font-mono text-[10px] font-bold sm:inline-flex', task.status === 'completed' ? 'bg-secondary/25 text-primary' : task.status === 'in-progress' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>{statusLabel[task.status]}</span>
    <div className="relative flex items-center"><button onClick={onEdit} className="rounded-lg p-2 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 focus:opacity-100" aria-label={`Edit ${task.name}`} data-testid={`button-edit-task-${task.id}`}><Pencil className="h-3.5 w-3.5" /></button>{!compact && <div className="flex opacity-0 transition group-hover:opacity-100 focus-within:opacity-100"><button onClick={onDuplicate} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Duplicate ${task.name}`} data-testid={`button-duplicate-task-${task.id}`}><Copy className="h-3.5 w-3.5" /></button><button onClick={onDelete} className="rounded-lg p-2 text-muted-foreground hover:bg-accent/15 hover:text-accent" aria-label={`Delete ${task.name}`} data-testid={`button-delete-task-${task.id}`}><Trash2 className="h-3.5 w-3.5" /></button></div>}</div>
  </div>;
}

function ProjectModal({ project, onClose, onSubmit, pending }: { project?: Project; onClose: () => void; onSubmit: (input: ProjectInput) => void; pending: boolean }) {
  const [form, setForm] = useState<ProjectInput>({ name: project?.name ?? '', description: project?.description ?? '', scope: project?.scope ?? '', startDate: dateKey(project?.startDate) ?? '', targetDate: dateKey(project?.targetDate) ?? '', expectedOutcome: project?.expectedOutcome ?? '', category: project?.category ?? '' });
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!form.name.trim()) return; onSubmit({ ...form, name: form.name.trim(), startDate: form.startDate || null, targetDate: form.targetDate || null, category: form.category || null }); };
  return <Modal title={project ? 'Edit project details' : 'Start a new project'} onClose={onClose}><form onSubmit={submit} className="space-y-4"><Field label="Project name"><input autoFocus required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="A clear, specific name" data-testid="input-project-name" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Category"><input value={form.category ?? ''} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Study, build, life..." data-testid="input-project-category" /></Field><Field label="Target date"><input type="date" value={form.targetDate ?? ''} onChange={e => setForm({ ...form, targetDate: e.target.value })} data-testid="input-project-target-date" /></Field></div><Field label="Why it matters"><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What is this project about?" data-testid="input-project-description" /></Field><Field label="Expected outcome"><textarea value={form.expectedOutcome} onChange={e => setForm({ ...form, expectedOutcome: e.target.value })} placeholder="What does done look like?" data-testid="input-project-outcome" /></Field><Field label="Scope"><textarea value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} placeholder="What is in and out?" data-testid="input-project-scope" /></Field><ModalActions onClose={onClose} pending={pending} submitLabel={project ? 'Save changes' : 'Create project'} /></form></Modal>;
}

function TaskModal({ task, projects, projectId, onClose, onSubmit, pending }: { task?: Task; projects: Project[]; projectId?: number; onClose: () => void; onSubmit: (input: TaskInput) => void; pending: boolean }) {
  const taskQuery = useGetTask(task?.id ?? 0, { query: { enabled: Boolean(task?.id), queryKey: getGetTaskQueryKey(task?.id ?? 0) } });
  const source = taskQuery.data ?? task;
  const [form, setForm] = useState<TaskInput>({ projectId: projectId ?? source?.projectId ?? projects[0]?.id ?? 0, name: source?.name ?? '', notes: source?.notes ?? '', status: source?.status ?? 'todo', priority: source?.priority ?? 'medium', dueDate: dateKey(source?.dueDate) ?? '', assignee: source?.assignee ?? '' });
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!form.name.trim() || !form.projectId) return; onSubmit({ ...form, name: form.name.trim(), dueDate: form.dueDate || null, assignee: form.assignee || null }); };
  return <Modal title={task ? 'Edit task' : 'Add a next action'} onClose={onClose}><form onSubmit={submit} className="space-y-4"><Field label="Task name"><input autoFocus required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Make it concrete and doable" data-testid="input-task-name" /></Field><Field label="Project"><select value={form.projectId} onChange={e => setForm({ ...form, projectId: Number(e.target.value) })} data-testid="select-task-project">{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Status"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as TaskStatus })} data-testid="select-task-status"><option value="todo">To do</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></Field><Field label="Priority"><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as TaskPriority })} data-testid="select-task-priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Due date"><input type="date" value={form.dueDate ?? ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} data-testid="input-task-due-date" /></Field><Field label="Assignee"><input value={form.assignee ?? ''} onChange={e => setForm({ ...form, assignee: e.target.value })} placeholder="Name (optional)" data-testid="input-task-assignee" /></Field></div><Field label="Notes"><textarea value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Helpful context, links, or a definition of done" data-testid="input-task-notes" /></Field><ModalActions onClose={onClose} pending={pending || taskQuery.isLoading} submitLabel={task ? 'Save task' : 'Add task'} /></form></Modal>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-primary/35 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:rounded-3xl md:p-8"><div className="mb-6 flex items-start justify-between"><div><div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">Nextstep</div><h2 className="text-2xl font-semibold tracking-[-0.04em]">{title}</h2></div><button onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close dialog" data-testid="button-close-dialog"><X className="h-5 w-5" /></button></div>{children}</div></div>;
}

function ModalActions({ onClose, pending, submitLabel }: { onClose: () => void; pending: boolean; submitLabel: string }) {
  return <div className="flex justify-end gap-2 border-t border-border/70 pt-5"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted" data-testid="button-cancel-dialog">Cancel</button><button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-60" data-testid="button-submit-dialog">{pending ? 'Saving…' : submitLabel}<Check className="h-4 w-4" /></button></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium"><span className="mb-2 block text-xs font-semibold text-foreground/75">{label}</span>{children}</label>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label className="flex items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium text-muted-foreground"><ListFilter className="h-3.5 w-3.5" /><select aria-label={label} value={value} onChange={e => onChange(e.target.value)} className="max-w-[105px] bg-transparent py-2.5 outline-none" data-testid={`select-filter-${label.toLowerCase()}`}>{options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select><ChevronDown className="h-3 w-3" /></label>;
}

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof FolderKanban; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center"><span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/25 text-primary"><Icon className="h-6 w-6" /></span><h3 className="text-lg font-semibold tracking-[-0.03em]">{title}</h3><p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function SkeletonRows() {
  return <div className="space-y-3 p-5">{[1, 2, 3].map(i => <div key={i} className="flex items-center gap-4 py-3"><div className="h-6 w-6 animate-pulse rounded-full bg-muted" /><div className="flex-1"><div className="h-3 w-2/5 animate-pulse rounded bg-muted" /><div className="mt-2 h-2 w-1/4 animate-pulse rounded bg-muted" /></div></div>)}</div>;
}

function LoadingState({ label }: { label: string }) {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center text-center"><div className="mb-5 h-10 w-10 animate-pulse rounded-2xl bg-secondary/60" /><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p></div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-accent/40 bg-accent/5 px-6 text-center"><TriangleAlert className="mb-4 h-7 w-7 text-accent" /><h3 className="text-lg font-semibold">That did not load.</h3><p className="mt-2 text-sm text-muted-foreground">The workspace is taking a breather. Try again.</p><button onClick={onRetry} className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground" data-testid="button-retry">Try again</button></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><AppShell><Switch><Route path="/" component={Dashboard} /><Route path="/projects" component={ProjectsPage} /><Route path="/projects/:id" component={ProjectPage} /><Route path="/tasks" component={TasksPage} /><Route component={NotFound} /></Switch></AppShell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter></QueryClientProvider>;
}

export default App;