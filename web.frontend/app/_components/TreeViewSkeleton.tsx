"use client";

import { Skeleton } from "@heroui/react";

const ROW_HEIGHT = "h-7"; /* matches Tree rowHeight={28} */
const INDENT_PX = 20; /* matches Tree indent={20} */

type SkeletonRow =
  | { kind: "folder"; level: number; nameWidth: string }
  | { kind: "file"; level: number; nameWidth: string };

const ROWS: SkeletonRow[] = [
  { kind: "folder", level: 0, nameWidth: "w-[42%]" },
  { kind: "file", level: 1, nameWidth: "w-[55%]" },
  { kind: "file", level: 1, nameWidth: "w-[48%]" },
  { kind: "folder", level: 0, nameWidth: "w-[38%]" },
  { kind: "file", level: 1, nameWidth: "w-[62%]" },
  { kind: "folder", level: 1, nameWidth: "w-[36%]" },
  { kind: "file", level: 2, nameWidth: "w-[50%]" },
  { kind: "file", level: 2, nameWidth: "w-[44%]" },
  { kind: "file", level: 2, nameWidth: "w-[58%]" },
  { kind: "folder", level: 0, nameWidth: "w-[40%]" },
  { kind: "file", level: 1, nameWidth: "w-[70%]" },
  { kind: "file", level: 1, nameWidth: "w-[52%]" },
];

/**
 * Placeholder rows while the file tree root is loading (matches sidebar tree density).
 */
export function TreeViewSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading file tree"
      className="flex min-h-0 flex-1 flex-col gap-0.5 py-0.5"
      role="status"
    >
      {ROWS.map((row, i) => {
        const pad = row.level * INDENT_PX;

        if (row.kind === "folder") {
          return (
            <div
              key={i}
              className={`flex ${ROW_HEIGHT} max-w-full items-center gap-1`}
              style={{ paddingLeft: pad }}
            >
              <Skeleton
                animationType="shimmer"
                className="size-3.5 shrink-0 rounded-sm"
              />
              <Skeleton
                animationType="shimmer"
                className={`h-3 max-w-full shrink ${row.nameWidth} rounded-md`}
              />
            </div>
          );
        }

        return (
          <div
            key={i}
            className={`flex ${ROW_HEIGHT} max-w-full items-center`}
            style={{ paddingLeft: pad }}
          >
            <Skeleton
              animationType="shimmer"
              className={`h-3 max-w-full ${row.nameWidth} rounded-md`}
            />
          </div>
        );
      })}
    </div>
  );
}
