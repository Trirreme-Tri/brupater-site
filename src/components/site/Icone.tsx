import { ICONES } from "@/lib/icones";

/* ícone SVG (os desenhos são fixos, escritos em src/lib/icones.ts) */
export function Icone({ id }: { id: string }) {
  const ic = ICONES[id] || ICONES.link;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ic.svg }}
    />
  );
}
