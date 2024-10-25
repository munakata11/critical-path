import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import TaskList from "@/components/TaskList";
import CriticalPath from "@/components/CriticalPath";
import TaskDiagram from "@/components/TaskDiagram";
import { Task } from "@/types/task";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDuration, setNewTaskDuration] = useState("");
  const [newTaskUnit, setNewTaskUnit] = useState<"hours" | "days">("days");
  const { toast } = useToast();

  const addTask = () => {
    if (!newTaskName || !newTaskDuration) {
      toast({
        title: "エラー",
        description: "タスク名と所要時間を入力してください",
        variant: "destructive",
      });
      return;
    }

    const duration = parseInt(newTaskDuration);
    if (isNaN(duration) || duration <= 0) {
      toast({
        title: "エラー",
        description: "有効な所要時間を入力してください",
        variant: "destructive",
      });
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      name: newTaskName,
      duration,
      unit: newTaskUnit,
      dependencies: [],
    };

    setTasks([...tasks, newTask]);
    setNewTaskName("");
    setNewTaskDuration("");
    toast({
      title: "タスクを追加しました",
      description: `${newTaskName} (${duration}${newTaskUnit === "days" ? "日" : "時間"})`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">クリティカルパス分析</h1>
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h2 className="font-semibold text-blue-900">使い方</h2>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>タスク名と所要時間（日数または時間）を入力して追加ボタンをクリックします</li>
              <li>タスク一覧から、各タスクの依存関係を設定します</li>
              <li>依存関係図が自動的に更新され、クリティカルパスが表示されます</li>
              <li>クリティカルパスは、プロジェクト全体の所要時間に影響を与える重要な経路です</li>
            </ol>
          </div>
        </div>
        
        <Card className="p-6">
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="タスク名"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="所要時間"
              type="number"
              value={newTaskDuration}
              onChange={(e) => setNewTaskDuration(e.target.value)}
              className="w-32"
            />
            <Select value={newTaskUnit} onValueChange={(value: "hours" | "days") => setNewTaskUnit(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">日</SelectItem>
                <SelectItem value="hours">時間</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addTask}>
              <Plus className="w-4 h-4 mr-2" />
              追加
            </Button>
          </div>

          <div className="grid gap-8">
            <TaskList tasks={tasks} setTasks={setTasks} />
            <TaskDiagram tasks={tasks} />
            <CriticalPath tasks={tasks} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;