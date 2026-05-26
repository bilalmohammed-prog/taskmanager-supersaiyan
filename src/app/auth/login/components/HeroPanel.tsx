import type { ReactNode } from "react";

type WorkflowStep = {
  label: string;
  icon: ReactNode;
};

type Metric = {
  label: string;
  value: string;
};

type HeroPanelProps = {
  workflowSteps: WorkflowStep[];
  metrics: Metric[];
};

export function HeroPanel({ workflowSteps, metrics }: HeroPanelProps) {
  return (
    <div className="w-full lg:w-[58%]">
      <div className="mb-10 inline-flex items-center rounded-full border border-[#E4E1F7] bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#5B3DF5] shadow-sm">
        AI-POWERED SPRINT PLANNING FOR DEV TEAMS
      </div>

      <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 md:text-5xl">
        One-click sprint planning.
        <br />
        Deterministic task allocation.
      </h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600">
        Stop dragging tickets. Define team roles, import tasks, and let FlashAssign generate optimal
        sprint assignments automatically. Review and approve in seconds.
      </p>

      <div className="mt-10 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5B3DF5] text-white shadow-[0_18px_40px_-24px_rgba(91,61,245,0.8)]">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
            <path d="M13 2 6 13h5l-1 9 7-11h-5l1-9Z" />
          </svg>
        </div>
        <div>
          <div className="text-xl font-semibold text-[#3E2ECC]">FlashAssign</div>
          <div className="text-sm text-slate-500">Plan smarter. Deliver faster.</div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        {workflowSteps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E4E1F7] bg-white text-[#5B3DF5] shadow-sm">
              {step.icon}
            </div>
            <div className="text-sm font-medium text-slate-700">{step.label}</div>
            {index < workflowSteps.length - 1 && (
              <span className="text-base text-[#B6B0E9]">→</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-[#E9E7F8] bg-white/80 p-4 shadow-[0_16px_40px_-28px_rgba(91,61,245,0.6)]"
          >
            <div className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-xs text-slate-500">
        Built for engineering teams. Trusted by builders.
      </div>
    </div>
  );
}
