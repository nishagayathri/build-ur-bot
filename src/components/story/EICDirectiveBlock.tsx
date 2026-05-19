"use client";

interface EICDirectiveBlockProps {
  directive: string;
}

export function EICDirectiveBlock({ directive }: EICDirectiveBlockProps) {
  return (
    <div className="bg-muted/30 border-l-2 border-purple-500 p-4 rounded-r-lg">
      <span className="text-[11px] uppercase text-muted-foreground font-semibold mb-1 block">
        EIC Directive
      </span>
      <p className="italic text-[13px]">{directive}</p>
    </div>
  );
}
