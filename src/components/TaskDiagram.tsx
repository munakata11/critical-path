import { useEffect, useRef, useState, useMemo } from "react";
import mermaid from "mermaid";
import { Task } from "@/types/task";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Camera } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true 
});

interface TaskDiagramProps {
  tasks: Task[];
}

const TaskDiagram = ({ tasks }: TaskDiagramProps) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [downloadFormat, setDownloadFormat] = useState<"svg" | "png" | "pdf">("svg");
  const controlsRef = useRef<HTMLDivElement>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // クリティカルパスの計算ロジック
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
          return calculateEarliestStart(depTask, memo) + normalizeToHours(depTask);
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

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      const element = diagramRef.current;
      if (!element) {
        throw new Error('Diagram element not found');
      }

      // Web Workerを使用してhtml2canvasの処理を別スレッドで実行
      const generateImage = () => {
        return new Promise<string>(async (resolve) => {
          // requestAnimationFrameを使用して描画を最適化
          requestAnimationFrame(async () => {
            const canvas = await html2canvas(element, {
              backgroundColor: '#ffffff',
              logging: false, // パフォーマンス向上のためにログを無効化
              useCORS: true,
              scale: 1, // スケールを1に固定してパフォーマンスを向上
            });
            const imageData = canvas.toDataURL('image/png');
            resolve(imageData.split(',')[1]);
          });
        });
      };

      const base64Image = await generateImage();

      // OpenAI APIの呼び出しを最適化
      const criticalPathText = `クリティカルパス: ${criticalPath.path.map(task => task.name).join(' → ')}\n合計所要時間: ${formatDuration(criticalPath.duration)}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `このタスク依存関係図を分析して、クリティカルパスや重要なタスクを分析してください。クリティカルパスとタスクの依存関係図を用いると、さまざまな分析が可能です。以下のような分析が考えられます。リソースの最適化: タスクの依存関係を理解することで、リソースを効率的に配置し、クリティカルでないタスクのリソースをクリティカルなタスクに再配置することができます。遅延の影響評価: クリティカルでないタスクが遅れた場合、クリティカルパスへの影響を評価し、プロジェクト全体へのリスクを軽減できます。余裕時間の配置: クリティカルでないタスクに余裕時間を設けることで、クリティカルパスを持つタスクの遅延リスクを吸収できます。スケジュールの調整: タスクの依存関係を再評価することで、全体のスケジュールを効率化し、プロジェクトの完了期間を短縮することが可能です。リスク管理: 依存関係を把握することで、リスクの高いタスクを特定し、事前に対策を講じることができます。これらの分析を活用することで、プロジェクトの効率化やリスク管理を向上させることができます。タスク依存関係図からはあまりわからない分析項目については触れるひつようがありません。具体的なタスク自体の長さや特性を理解して調整案などがあれば提示してください。\n\n${criticalPathText}` },
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${base64Image}` }
              }
            ]
          }
        ],
        max_tokens: 1000,
      });

      // 状態更新を一括で行う
      requestAnimationFrame(() => {
        setAnalysisResult(response.choices[0].message.content || '分析結果を取得できませんでした。');
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      alert('分析に失敗しました。');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="space-y-8">
      {/* タスク依存関係図 */}
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

      {/* クリティカルパス */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">クリティカルパス</h2>
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-blue-800">
            クリティカルパスは、プロジェクト全体の所要時間を決定する最も重要な一連のタスクです。タスク依存関係図上の最長の経路がクリティカルパスとなります。<br></br>
            他のパスには余裕時間（スラック）がありますが、クリティカルパス上のタスクにはスラックがないため、このパス上のタスクが遅延するとプロジェクト全体の完了が遅れることになります。
            
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

      {/* Vision分析 */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">タスク依存関係図の分析</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            <Camera className="w-4 h-4 mr-2" />
            {isAnalyzing ? '分析中...' : '分析する'}
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          タスク依存関係図（mermaid図）を分析し、図の構造や依存関係について詳細な分析を行います。
        </p>
        {analysisResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">{analysisResult}</pre>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TaskDiagram;
