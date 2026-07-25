import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SegmentOption<T extends string | number> = {
  value: T;
  label: string;
};

/** Soft living-room segment control built on shadcn Button. */
export function SegmentGroup<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex gap-1 rounded-ui bg-secondary/80 p-1", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Button
            key={String(opt.value)}
            type="button"
            variant={active ? "segment-active" : "segment"}
            size="sm"
            className="flex-1"
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
