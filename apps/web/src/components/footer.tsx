export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-xs uppercase tracking-wide text-mute md:flex-row md:items-center md:justify-between">
        <span>TechPapy — échange intergénérationnel</span>
        <span>&copy; {new Date().getFullYear()} TechPapy</span>
      </div>
    </footer>
  );
}
