export interface Task {
  id: number;
  name: string;
  duration: number;
  dependencies: number[];
}