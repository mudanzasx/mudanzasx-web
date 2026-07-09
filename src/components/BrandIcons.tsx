// Iconos de marca en SVG inline. lucide-react ya no incluye iconos de marca,
// así que se definen aquí con trazos coherentes con el resto de la interfaz.
import type { IconProps } from "@/components/ui/icon";

function base({ size = 20, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true,
    ...props,
  };
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.55-1.5H17V4.6c-.3-.04-1.3-.13-2.46-.13-2.44 0-4.11 1.49-4.11 4.22v2.36H7.7V14h2.73v8h3.07z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="none">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function TiktokIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M16.5 3c.3 2 1.5 3.5 3.5 3.8v2.6c-1.3.05-2.5-.3-3.6-1v5.9c0 3.2-2.4 5.7-5.6 5.7A5.3 5.3 0 0 1 5.5 14.7c0-3 2.4-5.4 5.4-5.4.35 0 .7.03 1.05.1v2.8a2.7 2.7 0 0 0-1.05-.2 2.6 2.6 0 1 0 2.6 2.6V3h3z" />
    </svg>
  );
}

export function YoutubeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.75-1.77C18.3 5 12 5 12 5s-6.3 0-7.85.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.75 1.77C5.7 19 12 19 12 19s6.3 0 7.85-.43a2.5 2.5 0 0 0 1.75-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3-5.2 3z" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M17.5 3h3l-6.55 7.48L21.75 21h-6.03l-4.72-6.17L5.6 21H2.6l7-8-6.85-10h6.18l4.27 5.64L17.5 3zm-1.06 16.2h1.67L7.64 4.7H5.85l10.59 14.5z" />
    </svg>
  );
}
