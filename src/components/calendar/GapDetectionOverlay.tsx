"use client";

interface GapInfo {
  personaHandle: string;
  startHour: number;
  endHour: number;
  color: string;
}

interface GapDetectionOverlayProps {
  gaps: GapInfo[];
}

const HOUR_HEIGHT = 48;
const START_HOUR = 6;

export function GapDetectionOverlay({ gaps }: GapDetectionOverlayProps) {
  return (
    <>
      {gaps.map((gap, idx) => {
        const top = (gap.startHour - START_HOUR) * HOUR_HEIGHT;
        const height = (gap.endHour - gap.startHour) * HOUR_HEIGHT;

        return (
          <div
            key={idx}
            className="absolute left-1 right-1 rounded-md flex items-center justify-center pointer-events-none"
            style={{
              top: `${top}px`,
              height: `${height}px`,
              backgroundColor: `color-mix(in srgb, ${gap.color} 6%, transparent)`,
            }}
          >
            <span
              className="text-[10px] font-medium opacity-50"
              style={{ color: gap.color }}
            >
              {gap.personaHandle}
            </span>
          </div>
        );
      })}
    </>
  );
}
