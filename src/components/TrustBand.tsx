import { IconMap, IconClock } from "./SystemIcons";

const DATOS = [
  { Icon: IconMap, texto: "Cobertura nacional" },
  { Icon: IconClock, texto: "Operativa 365 días" },
];

export default function TrustBand() {
  return (
    <section className="w-full bg-gris">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-6 md:gap-x-16">
        {DATOS.map(({ Icon, texto }) => (
          <div key={texto} className="flex items-center gap-3">
            <Icon size={22} className="shrink-0 text-black" />
            <span className="text-[13px] font-medium leading-[1.35] tracking-tight text-black md:text-sm">
              {texto}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
