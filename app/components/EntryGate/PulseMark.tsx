export default function PulseMark() {
  return (
    <span aria-hidden className="pulse-mark size-4 shrink-0 sm:size-5">
      <span className="pulse-mark-ring" />
      <span className="pulse-mark-ring" />
      <span className="pulse-mark-core" />
    </span>
  );
}
