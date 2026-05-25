import { cn } from "@/lib/utils";

type PanelProps = {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Panel({ title, action, children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-blue-100/80 bg-white/92 p-5 shadow-panel backdrop-blur",
        className
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex min-h-8 items-center justify-between gap-3">
          {title ? <h2 className="text-base font-bold text-ink">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function TinyLink({ children }: { children: React.ReactNode }) {
  return (
    <button className="h-8 shrink-0 rounded-full px-3 text-xs font-semibold text-royal transition hover:bg-blue-50">
      {children}
    </button>
  );
}
