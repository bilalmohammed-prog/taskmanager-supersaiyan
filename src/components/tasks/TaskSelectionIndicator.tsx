import { CheckSquare, Square, SquareX } from "lucide-react";

type TaskSelectionIndicatorProps = {
  selected: boolean;
  deleteMode?: boolean;
  className?: string;
};

export function TaskSelectionIndicator({ selected, deleteMode = false, className = "" }: TaskSelectionIndicatorProps) {
  const Icon = deleteMode && selected ? SquareX : selected ? CheckSquare : Square;
  const colorClass = selected
    ? deleteMode
      ? "text-red-600"
      : "text-indigo-600"
    : deleteMode
      ? "text-indigo-400"
      : "text-indigo-500";

  return <Icon aria-hidden="true" className={`h-5 w-5 shrink-0 transition-colors ${colorClass} ${className}`.trim()} />;
}