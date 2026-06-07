"use client";

/**
 * DateInput — fully custom calendar date picker.
 * Click the input → popover calendar appears.
 * No OS-native date picker. Output: ISO YYYY-MM-DD string.
 */

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

// ── constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ── helpers ──────────────────────────────────────────────────────────────────

function parseISO(value: string) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(value: string) {
  const d = parseISO(value);
  if (!d) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }); // e.g. "05 Jun 2026"
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a: Date | null, b: Date) {
  if (!a) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ── sub-components ───────────────────────────────────────────────────────────

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ── main component ───────────────────────────────────────────────────────────

interface Props {
  id?: string;
  value: string;          // ISO: YYYY-MM-DD or ""
  onChange: (iso: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  align?: "left" | "right";
}

export function DateInput({
  id,
  value,
  onChange,
  disabled,
  placeholder = "Select date",
  className,
  buttonClassName,
  align = "left",
}: Props) {
  const today = new Date();
  const selected = parseISO(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    selected?.getFullYear() ?? today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selected?.getMonth() ?? today.getMonth()
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClose(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClose);
    return () => document.removeEventListener("mousedown", handleClose);
  }, [open]);

  // Sync view when value changes externally
  useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day: number) {
    onChange(toISO(new Date(viewYear, viewMonth, day)));
    setOpen(false);
  }

  // Build calendar grid
  const startDay = startOfMonth(viewYear, viewMonth);
  const totalDays = daysInMonth(viewYear, viewMonth);
  // cells: nulls for leading blanks + day numbers
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger input */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={cn(
          "w-full flex items-center gap-2 rounded-doodle-input border-doodle-input bg-white px-3 py-2 text-sm shadow-doodle-sm text-left transition-colors",
          "focus:outline-none focus:ring-0 focus:bg-[#fffdf0]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          open && "bg-[#fffdf0]",
          !value && "text-gray-500 font-sans",
          buttonClassName
        )}
      >
        <CalendarIcon className="w-4 h-4 text-black flex-shrink-0" />
        <span className="flex-1 font-bold text-black">{value ? formatDisplay(value) : placeholder}</span>
        {value && (
          <span
            role="button"
            aria-label="Clear date"
            className="text-gray-500 hover:text-black transition-colors font-bold text-lg"
            onMouseDown={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          >
            ×
          </span>
        )}
      </button>

      {/* Calendar popover — absolute inside containerRef, unaffected by parent transform */}
      {open && (
        <div
          data-date-popover
          className={cn(
            "absolute z-[9999] w-[min(288px,calc(100vw-1.5rem))] bg-white rounded-doodle border-doodle shadow-doodle p-3 sm:p-4 mt-1.5",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-sm hover:bg-pastel-blue transition-colors text-black font-bold"
            >
              <ChevronLeft />
            </button>
            <span className="text-lg font-bold text-black select-none tracking-wide">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-sm hover:bg-pastel-blue transition-colors text-black font-bold"
            >
              <ChevronRight />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-bold text-gray-500 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-1 gap-x-1">
            {cells.map((day, idx) => {
              if (!day)
                return <div key={`blank-${idx}`} />;

              const date = new Date(viewYear, viewMonth, day);
              const isSelected = isSameDay(selected, date);
              const isToday = isSameDay(today, date);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    "h-8 w-full rounded-sm text-sm transition-colors border-2 border-transparent font-bold",
                    isSelected
                      ? "bg-pastel-pink border-black text-black"
                      : isToday
                      ? "bg-pastel-blue text-black hover:border-black"
                      : "text-black hover:bg-paper hover:border-black"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer — Today shortcut */}
          <div className="mt-4 pt-3 border-t-2 border-black flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                onChange(toISO(today));
                setViewYear(today.getFullYear());
                setViewMonth(today.getMonth());
                setOpen(false);
              }}
              className="text-sm font-bold text-black hover:underline underline-offset-4 decoration-2 transition-all"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-bold text-gray-500 hover:text-black transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
