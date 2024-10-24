import { Card } from "@/components/ui/card";
import { Task } from "@/types/task";
import { useMemo } from "react";

interface CriticalPathProps {
  tasks: Task[];
}

const CriticalPath = ({ tasks }: CriticalPathProps) => {
  const criticalPath = useMemo(() => {
    if (tasks.length === 0) return { path: [], duration: 0 };

    const calculateEarliestStart = (task: Task, memo: Map<number, number>) => {
      if (memo.has(task.id)) return memo.get(task.id)!;

      if (task.dependencies.length === 0) {
        memo.set(task.id, 0);
        return 0;
      }

      const maxDependencyEnd = Math.max(
        ...task.dependencies.map((depId) => {
          const depTask = tasks.find((t) => t.id === depId)!;
          return (
            calculateEarliestStart(depTask, memo) + depTask.duration
          );
        })
      );

      memo.set(task.id, maxDependencyEnd);
      return maxDependencyEnd;
    };

    const memo = new Map<number, number>();
    const endTasks = tasks.filter(
      (task) =>
        !tasks.some((t) => t.dependencies.includes(task.id))
    );

    let maxDuration = 0;
    let criticalEndTask: Task | null = null;

    endTasks.forEach((task) => {
      const duration =
        calculateEarliestStart(task, memo) + task.duration;
      if (duration > maxDuration) {
        maxDuration = duration;
        criticalEndTask = task;
      }
    });

    if (!criticalEndTask) return { path: [], duration: 0 };

    const path: Task[] = [];
    let currentTask: Task | undefined = criticalEndTask;

    while (currentTask) {
      path.unshift(currentTask);
      const earliestStart = memo.get(currentTask.id)!;
      
      const criticalDependency = currentTask.dependencies
        .map((depId) => tasks.find((t) => t.id === depId)!)
        .find(
          (depTask) =>
            calculateEarliestStart(depTask, memo) + depTask.duration ===
            earliestStart
        );

      currentTask = criticalDependency;
    }

    return { path, duration: maxDuration };
  }, [tasks]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">クリティカルパス</h2>
      <Card className="p-4">
        {criticalPath.path.length > 0 ? (
          <>
            <div className="mb-4">
              <span className="font-medium">合計所要時間: </span>
              {criticalPath.duration}日
            </div>
            <div className="space-y-2">
              {criticalPath.path.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 p-2 bg-blue-50 rounded">
                    {task.name} ({task.duration}日)
                  </div>
                  {index < criticalPath.path.length - 1 && (
                    <div className="text-gray-400">↓</div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            タスクを追加してクリティカルパスを計算します
          </div>
        )}
      </Card>
    </div>
  );
};

export default CriticalPath;