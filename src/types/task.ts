export interface Task {
  id: number;
  name: string;
  duration: number;
  unit: "hours" | "days";
  dependencies: number[];
}