import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/types/task";
import { X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TaskListProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

const TaskList = ({ tasks, setTasks }: TaskListProps) => {
  const updateTask = (taskId: number, updates: Partial<Task>) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

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
      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タスク名</TableHead>
              <TableHead>所要時間</TableHead>
              <TableHead>単位</TableHead>
              <TableHead>依存タスク</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Input
                    value={task.name}
                    onChange={(e) => updateTask(task.id, { name: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={task.duration}
                    onChange={(e) => updateTask(task.id, { duration: Number(e.target.value) })}
                    min={0}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={task.unit}
                    onValueChange={(value: "hours" | "days") => updateTask(task.id, { unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">日</SelectItem>
                      <SelectItem value="hours">時間</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Select
                      onValueChange={(value) => addDependency(task.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="依存タスクを追加" />
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
                    {task.dependencies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
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
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTask(task.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {tasks.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            タスクがありません。新しいタスクを追加してください。
          </div>
        )}
      </Card>
    </div>
  );
};

export default TaskList;