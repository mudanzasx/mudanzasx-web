import Image from "next/image";
import { MapPin, Mail, Clock } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  YoutubeIcon,
  XIcon,
} from "./BrandIcons";

const REDES = [
  { Icon: FacebookIcon, label: "Facebook", href: "https://facebook.com/mudanzasxai" },
  { Icon: InstagramIcon, label: "Instagram", href: "https://instagram.com/mudanzasx_ai" },
  { Icon: TiktokIcon, label: "TikTok", href: "https://tiktok.com/@mudanzasx_ai" },
  { Icon: YoutubeIcon, label: "YouTube", href: "https://youtube.com/@mudanzasx_ai" },
  { Icon: XIcon, label: "X", href: "https://x.com/mudanzasx_ai" },
];

const LEGALES = [
  { label: "Aviso legal", href: "/aviso-legal" },
  { label: "Política de privacidad", href: "/privacidad" },
  { label: "Política de cookies", href: "/cookies" },
];

export default function Footer() {
  return (
    <footer className="mt-auto w-full bg-black text-white">
      <div className="mx-auto max-w-[1200px] px-6 py-14 md:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Empresa */}
          <div>
            <Image
              src="/logo-white.svg"
              alt="Mudanzas X"
              width={2453}
              height={512}
              unoptimized
              className="h-7 w-auto"
            />
            <p className="mt-5 flex items-start gap-2 text-sm leading-[1.6] text-white/70">
              <MapPin size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
              Calle Unió, 15, 08420 Canovelles, Barcelona
            </p>
            <a
              href="mailto:info@mudanzasx.com"
              className="mt-3 flex items-center gap-2 text-sm text-white/70 transition-colors duration-150 hover:text-white"
            >
              <Mail size={16} strokeWidth={1.5} className="shrink-0" />
              info@mudanzasx.com
            </a>
          </div>

          {/* Horario */}
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <Clock size={16} strokeWidth={1.5} className="shrink-0" />
              Horario comercial
            </p>
            <p className="mt-4 text-sm leading-[1.7] text-white/70">
              Lunes a viernes 9:00-21:00
              <br />
              Sábado 9:00-17:00
              <br />
              Domingo cerrado
            </p>
          </div>

          {/* Legales */}
          <div>
            <p className="text-sm font-medium">Legal</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {LEGALES.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-white/70 transition-colors duration-150 hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Redes */}
          <div>
            <p className="text-sm font-medium">Síguenos</p>
            <div className="mt-4 flex flex-wrap gap-4">
              {REDES.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 transition-colors duration-150 hover:text-white"
                >
                  <Icon size={22} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/15 pt-6">
          <p className="text-sm text-white/60">© 2026 Mudanzas X</p>
        </div>
      </div>
    </footer>
  );
}
