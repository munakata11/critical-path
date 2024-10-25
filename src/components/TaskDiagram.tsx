import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Task } from "@/types/task";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface TaskDiagramProps {
  tasks: Task[];
}

const TaskDiagram = ({ tasks }: TaskDiagramProps) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [downloadFormat, setDownloadFormat] = useState<"svg" | "png" | "pdf">("svg");
  const controlsRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    try {
      // 一時的にコントロールを非表示にする
      if (controlsRef.current) {
        controlsRef.current.style.display = 'none';
      }

      const element = diagramRef.current;
      if (!element) {
        throw new Error('Diagram element not found');
      }

      const svgElement = element.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      if (downloadFormat === 'svg') {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'task-diagram.svg';
        link.click();
        URL.revokeObjectURL(url);
      } else if (downloadFormat === 'png') {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
        });
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = 'task-diagram.png';
        link.click();
      } else if (downloadFormat === 'pdf') {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('task-diagram.pdf');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('ダウンロードに失敗しました。');
    } finally {
      // コントロールを再表示
      if (controlsRef.current) {
        controlsRef.current.style.display = 'flex';
      }
    }
  };

  useEffect(() => {
    if (!diagramRef.current) return;

    const generateDiagram = async () => {
      diagramRef.current!.innerHTML = "";

      let diagram = "graph LR;\n";
      
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">タスク依存関係図</h2>
        <div ref={controlsRef} className="flex items-center gap-2">
          <Select value={downloadFormat} onValueChange={(value: "svg" | "png" | "pdf") => setDownloadFormat(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="svg">SVG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            ダウンロード
          </Button>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        タスク間の依存関係を図示しています。各ノードはタスクを表し、矢印は依存関係を示します。
      </p>
      <div ref={diagramRef} className="w-full overflow-x-auto pl-4" />
    </Card>
  );
};

export default TaskDiagram;
