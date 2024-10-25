import { Card } from "@/components/ui/card";
import { Task } from "@/types/task";
import { useMemo } from "react";

interface CriticalPathProps {
  tasks: Task[];
}

const CriticalPath = ({ tasks }: CriticalPathProps) => {
  const criticalPath = useMemo(() => {
    if (tasks.length === 0) return { path: [], duration: 0 };

    const normalizeToHours = (task: Task) => {
      return task.unit === "days" ? task.duration * 24 : task.duration;
    };

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
            calculateEarliestStart(depTask, memo) + normalizeToHours(depTask)
          );
        })
      );

      memo.set(task.id, maxDependencyEnd);
      return maxDependencyEnd;
    };

    const memo = new Map<number, number>();
    const endTasks = tasks.filter(
      (task) => !tasks.some((t) => t.dependencies.includes(task.id))
    );

    let maxDuration = 0;
    let criticalEndTask: Task | null = null;

    endTasks.forEach((task) => {
      const duration = calculateEarliestStart(task, memo) + normalizeToHours(task);
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
            calculateEarliestStart(depTask, memo) + normalizeToHours(depTask) ===
            earliestStart
        );

      currentTask = criticalDependency;
    }

    return { path, duration: maxDuration };
  }, [tasks]);

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours}時間`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return `${days}日`;
    }
    return `${days}日と${remainingHours}時間`;
  };

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">クリティカルパス</h2>
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <p className="text-sm text-blue-800">
          クリティカルパスは、プロジェクト全体の所要時間を決定する最も重要な一連のタスクです。
          このパス上のタスクが遅延すると、プロジェクト全体の完了が遅れることになります。
          他のパスには余裕時間（スラック）がありますが、クリティカルパス上のタスクにはスラックがありません。
        </p>
      </div>
      {criticalPath.path.length > 0 ? (
        <>
          <div className="mb-4">
            <span className="font-medium">合計所要時間: </span>
            {formatDuration(criticalPath.duration)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {criticalPath.path.map((task, index) => (
              <div key={task.id} className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded whitespace-nowrap">
                  {task.name} ({task.duration || ""}{task.unit === "days" ? "日" : "時間"})
                </div>
                {index < criticalPath.path.length - 1 && (
                  <div className="text-blue-500 font-bold">→</div>
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
  );
};

export default CriticalPath;
