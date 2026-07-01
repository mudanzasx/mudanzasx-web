import { IconMap, IconClock, IconShield, IconShieldCheck } from "./SystemIcons";

const DATOS = [
  { Icon: IconMap, texto: "Cobertura nacional desde Barcelona" },
  { Icon: IconClock, texto: "Operativa 24/7 · 365 días" },
  { Icon: IconShield, texto: "Seguro de responsabilidad civil" },
  { Icon: IconShieldCheck, texto: "Mercancías aseguradas" },
];

export default function TrustBand() {
  return (
    <section className="w-full bg-gris">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-5 px-6 py-6 md:grid-cols-4 md:gap-x-8">
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
