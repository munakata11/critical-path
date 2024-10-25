import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { Task } from "@/types/task";
import { Card } from "@/components/ui/card";

interface TaskDiagramProps {
  tasks: Task[];
}

const TaskDiagram = ({ tasks }: TaskDiagramProps) => {
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!diagramRef.current) return;

    const generateDiagram = async () => {
      diagramRef.current!.innerHTML = "";

      let diagram = "graph LR;\n";
      
      // Add START node for tasks without dependencies
      const startTasks = tasks.filter(task => task.dependencies.length === 0);
      if (startTasks.length > 0) {
        diagram += "START((START));\n";
        startTasks.forEach(task => {
          diagram += `START --> ${task.id};\n`;
        });
      }

      tasks.forEach((task) => {
        diagram += `${task.id}["${task.name}<br/>${task.duration}${task.unit === "days" ? "日" : "時間"}"];\n`;
        
        task.dependencies.forEach((depId) => {
          diagram += `${depId} --> ${task.id};\n`;
        });
      });

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