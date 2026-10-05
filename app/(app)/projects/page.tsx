import { ProjectList } from '@/components/projects/project-list';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and monitor all your engineering projects
        </p>
      </div>
      <ProjectList />
    </div>
  );
}
