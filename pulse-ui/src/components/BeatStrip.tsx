import type { BeatStatus } from "../data/fixtures";

const toneCls: Record<BeatStatus, string> = {
  up: "bg-success-fg/55",
  warn: "bg-warning-fg/65",
  down: "bg-destructive/95",
  maint: "bg-info-fg/55",
  unknown: "bg-secondary",
};

export default function BeatStrip({
  beats,
  height = 18,
  gap = 2,
  rounded = true,
}: {
  beats: BeatStatus[];
  height?: number;
  gap?: number;
  rounded?: boolean;
}) {
  // If all beats are "up", render a single bar instead of N rectangles — saves DOM,
  // matches the visual story ("clean horizon").
  const allClean = beats.every((b) => b === "up");
  if (allClean) {
    return (
      <div
        className={`w-full bg-success-fg/55 ${rounded ? "rounded-sm" : ""}`}
        style={{ height }}
      />
    );
  }
  return (
    <div
      className="flex w-full"
      style={{ gap, height }}
    >
      {beats.map((b, i) => (
        <span
          key={i}
          className={`flex-1 ${rounded ? "rounded-[1px]" : ""} ${toneCls[b]}`}
        />
      ))}
    </div>
  );
}
