import type { Category } from "@/types";
import { cn } from "@/lib/utils/cn";

interface Props {
  category: Category | null | undefined;
  className?: string;
}

/**
 * Renders a pill badge for a given category using its stored hex color.
 * Falls back to a neutral "Uncategorized" pill when no category is provided.
 */
export function CategoryBadge({ category, className }: Props) {
  if (!category) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          "bg-gray-100 text-gray-500",
          className
        )}
      >
        Uncategorized
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white",
        className
      )}
      style={{ backgroundColor: category.color }}
    >
      {category.name}
    </span>
  );
}
