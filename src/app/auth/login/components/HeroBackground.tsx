import { CircuitDecor } from "./CircuitDecor";

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(91,61,245,0.08),transparent_70%)]" />
      <div className="absolute -right-32 top-12 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(91,61,245,0.06),transparent_70%)]" />
      <CircuitDecor className="absolute left-0 top-0 h-48 w-72 text-[#C9C3F4]" position="tl" />
      <CircuitDecor
        className="absolute bottom-0 right-0 h-52 w-80 text-[#C9C3F4]"
        position="br"
      />
    </div>
  );
}
