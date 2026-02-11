export default function ScoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="scout-shell">
      <div className="scout-backdrop" aria-hidden="true" />
      <div className="scout-content">{children}</div>
    </div>
  );
}
