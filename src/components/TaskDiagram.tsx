import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { Task } from "@/types/task";
import { Card } from "@/components/ui/card";

interface TaskDiagramProps {
  tasks: Task[];
}

const TaskDiagram = ({ tasks }: TaskDiagramProps) => {
  const diagramRef = useRef<HTMLDivElement>(null);

  const findCriticalPath = (tasks: Task[]) => {
    const memo = new Map<number, number>();
    
    const calculateEarliestStart = (task: Task) => {
      if (memo.has(task.id)) return memo.get(task.id)!;

      if (task.dependencies.length === 0) {
        memo.set(task.id, 0);
        return 0;
      }

      const maxDependencyEnd = Math.max(
        ...task.dependencies.map((depId) => {
          const depTask = tasks.find((t) => t.id === depId)!;
          return calculateEarliestStart(depTask) + depTask.duration;
        })
      );

      memo.set(task.id, maxDependencyEnd);
      return maxDependencyEnd;
    };

    const endTasks = tasks.filter(
      (task) => !tasks.some((t) => t.dependencies.includes(task.id))
    );

    let maxDuration = 0;
    let criticalEndTask: Task | null = null;

    endTasks.forEach((task) => {
      const duration = calculateEarliestStart(task) + task.duration;
      if (duration > maxDuration) {
        maxDuration = duration;
        criticalEndTask = task;
      }
    });

    if (!criticalEndTask) return { path: new Set<number>(), duration: 0 };

    const criticalPath = new Set<number>();
    let currentTask: Task | undefined = criticalEndTask;

    while (currentTask) {
      criticalPath.add(currentTask.id);
      const earliestStart = memo.get(currentTask.id)!;
      
      const criticalDependency = currentTask.dependencies
        .map((depId) => tasks.find((t) => t.id === depId)!)
        .find(
          (depTask) =>
            calculateEarliestStart(depTask) + depTask.duration === earliestStart
        );

      currentTask = criticalDependency;
    }

    return { path: criticalPath, duration: maxDuration };
  };

  useEffect(() => {
    if (!diagramRef.current) return;

    const generateDiagram = async () => {
      diagramRef.current!.innerHTML = "";
      const { path: criticalPath } = findCriticalPath(tasks);

      let diagram = "graph TD;\n";
      
      tasks.forEach((task) => {
        diagram += `${task.id}["${task.name}<br/>${task.duration}${task.unit === "days" ? "日" : "時間"}"];\n`;
        
        task.dependencies.forEach((depId) => {
          diagram += `${depId} --> ${task.id};\n`;
        });
      });

      mermaid.initialize({ startOnLoad: true, theme: "neutral" });
      
      try {
        const { svg } = await mermaid.render("diagram", diagram);
        diagramRef.current!.innerHTML = svg;
      } catch (error) {
        console.error("Failed to render diagram:", error);
      }
    };

    generateDiagram();
  }, [tasks]);

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">タスク依存関係図</h2>
      <p className="text-sm text-gray-600 mb-4">
        タスク間の依存関係を図示しています。各ノードはタスクを表し、矢印は依存関係を示します。
      </p>
      <div ref={diagramRef} className="w-full overflow-x-auto" />
    </Card>
  );
};

export default TaskDiagram;