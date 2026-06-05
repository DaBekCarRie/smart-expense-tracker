import React from "react";
import { cn } from "@/lib/utils/cn";
import {
  Tag,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Briefcase,
  Heart,
  Zap,
  Music,
  Film,
  Coffee,
  Plane,
  Gift,
  Smartphone,
  Laptop,
  Dumbbell,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Tag,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Briefcase,
  Heart,
  Zap,
  Music,
  Film,
  Coffee,
  Plane,
  Gift,
  Smartphone,
  Laptop,
  Dumbbell,
};

interface CategoryIconProps {
  name: string;
  icon?: string | null;
  className?: string;
  strokeWidth?: number;
}

/**
 * Custom hand-drawn SVG icons for expense categories.
 * Each icon features a wobbly, hand-sketched line style matching the doodle aesthetic.
 * Now supports lucide-react icons as well.
 */
export function CategoryIcon({
  name,
  icon,
  className,
  strokeWidth = 2.2,
}: CategoryIconProps) {
  // 1. If a specific lucide icon name is provided, use it.
  if (icon && ICON_MAP[icon]) {
    const LucideIcon = ICON_MAP[icon];
    return (
      <LucideIcon
        className={cn("w-6 h-6", className)}
        strokeWidth={strokeWidth}
      />
    );
  }

  const normName = name.toLowerCase().trim();

  // FOOD & DRINK / DINING / CAFE
  if (
    normName.includes("food") ||
    normName.includes("drink") ||
    normName.includes("dining") ||
    normName.includes("cafe") ||
    normName.includes("grocery")
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("w-6 h-6", className)}
      >
        {/* Sketched Apple outline */}
        <path d="M12 21a5 5 0 0 1-4.5-3.5A6 6 0 0 1 12 7a6 6 0 0 1 4.5 10.5A5 5 0 0 1 12 21z" />
        {/* Apple stem */}
        <path d="M12 7c-.5-1.5 0-3 1-3.5" />
        {/* Leaf */}
        <path d="M12.5 5.5c1.5-.5 3 0 3.5 1-.5 1.5-2 1.5-3.5 1z" />
      </svg>
    );
  }

  // RENT / HOUSING / HOME
  if (
    normName.includes("rent") ||
    normName.includes("housing") ||
    normName.includes("home") ||
    normName.includes("accommodation")
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("w-6 h-6", className)}
      >
        {/* Sketched House Roof */}
        <path d="M2.5 12.5 L11.8 3.5 C12.1 3.2 12.5 3.2 12.8 3.5 L21.5 12.5" />
        {/* Walls */}
        <path d="M4.8 11.2v8.5a1.5 1.5 0 0 0 1.5 1.5h11.4a1.5 1.5 0 0 0 1.5-1.5v-8.5" />
        {/* Window */}
        <path d="M9 14h6v4H9z" />
        <path d="M12 14v4" />
        <path d="M9 16h6" />
        {/* Chimney */}
        <path d="M17.5 5.5v3.5" />
      </svg>
    );
  }

  // TRANSPORT / TRAVEL / CAR / GAS
  if (
    normName.includes("transport") ||
    normName.includes("travel") ||
    normName.includes("car") ||
    normName.includes("gas") ||
    normName.includes("taxi")
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("w-6 h-6", className)}
      >
        {/* Sketched Car Body */}
        <path d="M3.2 14.5c.2-.5.5-.8.8-1L6.5 9h11.2l2.5 4.5c.3.2.6.5.8 1a1.5 1.5 0 0 1-1.3 2H4.5a1.5 1.5 0 0 1-1.3-2.5z" />
        {/* Wheels */}
        <circle cx="7.5" cy="18" r="2.2" />
        <circle cx="16.5" cy="18" r="2.2" />
        {/* Window separator */}
        <path d="M12 9v4.5" />
      </svg>
    );
  }

  // BILLS / UTILITIES / INSURANCE
  if (
    normName.includes("bill") ||
    normName.includes("utility") ||
    normName.includes("utilities") ||
    normName.includes("insurance") ||
    normName.includes("invoice")
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("w-6 h-6", className)}
      >
        {/* Sketched Receipt/Bill paper */}
        <path d="M5 3.5l2 1 2.5-1 2.5 1 2.5-1 2.5 1 2-1v17l-2 1-2.5-1-2.5 1-2.5-1-2.5 1-2.5-1-2 1v-17z" />
        {/* Text lines */}
        <path d="M8 8h8" />
        <path d="M8 12h6" />
        <path d="M8 16h8" />
      </svg>
    );
  }

  // SHOPPING / ENTERTAINMENT
  if (
    normName.includes("shopping") ||
    normName.includes("entertainment") ||
    normName.includes("gift") ||
    normName.includes("store")
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("w-6 h-6", className)}
      >
        {/* Sketched Shopping Bag */}
        <path d="M5.5 8.5 L18.5 8.5 L20 20.5 C20 21 19.5 21.5 19 21.5 L5 21.5 C4.5 21.5 4 21 4 20.5 L5.5 8.5 Z" />
        {/* Handles */}
        <path d="M9 8.5a3 3 0 0 1 6 0" />
      </svg>
    );
  }

  // SALARY / INCOME / INVESTMENTS
  if (
    normName.includes("salary") ||
    normName.includes("income") ||
    normName.includes("investment") ||
    normName.includes("cash") ||
    normName.includes("money") ||
    normName.includes("piggy")
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("w-6 h-6", className)}
      >
        {/* Piggy Bank body */}
        <path d="M19 11a6.5 6.5 0 0 0-11.5-4C5 8.5 5 11 6.5 13.5c.5.8 1 1.5 2 2 .5 1.5 1.5 2 2.5 2H13c1 0 2-.5 2.5-2 .8-.2 1.5-.8 2-1.5a6.5 6.5 0 0 0 1.5-3z" />
        {/* Pig Snout */}
        <path d="M19.5 9.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5" />
        {/* Legs */}
        <path d="M9.5 17.5v2.5" />
        <path d="M14.5 17.5v2.5" />
        {/* Coin Slot */}
        <path d="M11 6.5h3" />
      </svg>
    );
  }

  // DEFAULT / MISC / OTHERS
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-6 h-6", className)}
    >
      {/* Sketched Star / Sparkle */}
      <path d="M12 2l2.5 6.5L21 11l-5.5 4.5L17 22l-5-4-5 4 1.5-6.5L3 11l6.5-2.5z" />
    </svg>
  );
}
