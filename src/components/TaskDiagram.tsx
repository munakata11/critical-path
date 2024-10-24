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
      // Clear previous diagram
      diagramRef.current!.innerHTML = "";

      // Generate mermaid diagram definition
      let diagram = "graph TD;\n";
      
      tasks.forEach((task) => {
        // Add task node
        diagram += `${task.id}["${task.name}<br/>${task.duration}日"];\n`;
        
        // Add dependencies
        task.dependencies.forEach((depId) => {
          diagram += `${depId} --> ${task.id};\n`;
        });
      });

      // Initialize mermaid
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
      <div ref={diagramRef} className="w-full overflow-x-auto" />
    </Card>
  );
};

export default TaskDiagram;