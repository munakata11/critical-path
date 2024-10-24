import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/types/task";
import { ArrowRight, X } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

const TaskList = ({ tasks, setTasks }: TaskListProps) => {
  const addDependency = (taskId: number, dependencyId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              dependencies: [...task.dependencies, parseInt(dependencyId)],
            }
          : task
      )
    );
  };

  const removeDependency = (taskId: number, dependencyId: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              dependencies: task.dependencies.filter((id) => id !== dependencyId),
            }
          : task
      )
    );
  };

  const removeTask = (taskId: number) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">タスク一覧</h2>
      {tasks.map((task) => (
        <Card key={task.id} className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">
              {task.name} ({task.duration}日)
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeTask(task.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <Select
                onValueChange={(value) => addDependency(task.id, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="依存関係を追加" />
                </SelectTrigger>
                <SelectContent>
                  {tasks
                    .filter(
                      (t) =>
                        t.id !== task.id &&
                        !task.dependencies.includes(t.id)
                    )
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {task.dependencies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {task.dependencies.map((depId) => {
                  const depTask = tasks.find((t) => t.id === depId);
                  return (
                    depTask && (
                      <div
                        key={depId}
                        className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1 text-sm"
                      >
                        {depTask.name}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => removeDependency(task.id, depId)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      ))}
      {tasks.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          タスクがありません。新しいタスクを追加してください。
        </div>
      )}
    </div>
  );
};

export default TaskList;