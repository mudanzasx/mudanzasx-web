import Image from "next/image";
import { TELEFONO, TELEFONO_TEXTO } from "@/lib/config";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  YoutubeIcon,
  XIcon,
} from "./BrandIcons";
import ConfigurarCookiesButton from "./cookies/ConfigurarCookiesButton";

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
  { label: "Condiciones del servicio", href: "/condiciones" },
  { label: "Condiciones de cancelación", href: "/cancelacion" },
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
            <p className="mt-5 text-small leading-[1.6] text-white/70">
              Calle Unió, 15, 08420 Canovelles, Barcelona
            </p>
            <a
              href="mailto:info@mudanzasx.com"
              className="mt-3 block w-fit text-small text-white/70 transition-colors duration-150 hover:text-white"
            >
              info@mudanzasx.com
            </a>
            <a
              href={`tel:${TELEFONO}`}
              className="mt-3 block w-fit text-small text-white/70 transition-colors duration-150 hover:text-white"
            >
              {TELEFONO_TEXTO}
            </a>
          </div>

          {/* Horario */}
          <div>
            <p className="text-small font-medium">Horario comercial</p>
            <p className="mt-4 text-small leading-[1.7] text-white/70">
              Lunes a viernes 9:00-21:00
              <br />
              Sábado 9:00-17:00
              <br />
              Domingo cerrado
            </p>
          </div>

          {/* Legales */}
          <div>
            <p className="text-small font-medium">Legal</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {LEGALES.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-small text-white/70 transition-colors duration-150 hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <ConfigurarCookiesButton className="text-left text-small text-white/70 transition-colors duration-150 hover:text-white" />
              </li>
            </ul>
          </div>

          {/* Redes */}
          <div>
            <p className="text-small font-medium">Síguenos</p>
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
          <p className="text-small text-white/60">© 2026 Mudanzas X</p>
        </div>
      </div>
    </footer>
  );
}
