import type { Category } from "@/types";
import { cn } from "@/lib/utils/cn";
import { CategoryIcon } from "../ui/CategoryIcon";

interface Props {
  category: Category | null | undefined;
  className?: string;
  showIcon?: boolean;
}

/**
 * Renders a pill badge for a given category using its stored hex color.
 * Falls back to a neutral "Uncategorized" pill when no category is provided.
 */
export function CategoryBadge({ category, className, showIcon = true }: Props) {
  if (!category) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-doodle border-2 border-black text-xs font-bold shadow-doodle-sm",
          "bg-gray-100 text-gray-500",
          className
        )}
      >
        {showIcon && <CategoryIcon name="misc" className="w-3.5 h-3.5" strokeWidth={2.5} />}
        Uncategorized
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-doodle border-2 border-black text-xs font-bold shadow-doodle-sm text-black",
        className
      )}
      style={{ backgroundColor: category.color }}
    >
      {showIcon && <CategoryIcon name={category.name} icon={category.icon} className="w-3.5 h-3.5" strokeWidth={2.5} />}
      {category.name}
    </span>
  );
}
