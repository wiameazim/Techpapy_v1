export function CircularMotif({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute select-none ${className}`}
    >
      <div className="relative h-full w-full">
        <div className="glow-orb animate-drift absolute inset-0 bg-signal opacity-30 blur-[70px]" />
        <div className="glow-orb animate-drift-reverse absolute inset-[18%] bg-ink opacity-[0.15] blur-[50px]" />
      </div>
    </div>
  );
}
