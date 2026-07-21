import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";
import ConfigurarCookiesButton from "@/components/cookies/ConfigurarCookiesButton";
import { EMPRESA } from "@/lib/config";

export const metadata: Metadata = {
  title: "Política de cookies",
  alternates: { canonical: "/cookies" },
  description:
    "Qué cookies usa Mudanzas X (técnicas, analíticas y de marketing), para qué sirven y cómo aceptarlas, rechazarlas o configurarlas.",
};

// Registro de voz (M19): página INFORMATIVA de cara al usuario (no contractual),
// en tono cercano de marca —"tú" para el usuario, "nosotros" para la empresa—.
// Las páginas contractuales (aviso-legal, condiciones, cancelación) van en
// impersonal; privacidad y cookies no.
export default function Cookies() {
  return (
    <LegalShell titulo="Política de cookies">
      <h2>1. ¿Qué es una cookie?</h2>
      <p>
        Una cookie es un pequeño archivo de texto que un sitio web guarda en tu
        dispositivo (ordenador, tablet o móvil) cuando lo visitas. Las cookies
        permiten que el sitio funcione correctamente, recuerde tus preferencias y,
        cuando lo autorizas, obtenga información estadística sobre su uso o te
        muestre publicidad. Junto con las cookies utilizamos tecnologías similares
        de almacenamiento en el navegador (como <em>localStorage</em>) con las mismas
        finalidades.
      </p>

      <h2>2. ¿Quién utiliza las cookies?</h2>
      <p>
        El responsable del uso de las cookies de este sitio web es {EMPRESA.titular}
        , con NIF {EMPRESA.nif} y correo de contacto{" "}
        <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a>. Algunas cookies son
        gestionadas por terceros (Google y Meta), tal como se indica más abajo.
      </p>

      <h2>3. Tipos de cookies que utilizamos</h2>
      <p>
        Conforme a la guía de la Agencia Española de Protección de Datos (AEPD),
        clasificamos las cookies en las siguientes categorías:
      </p>
      <ul>
        <li>
          <strong>Técnicas o necesarias:</strong> imprescindibles para el
          funcionamiento del sitio y la seguridad. Entre ellas se incluye el
          almacenamiento de tu propia elección sobre cookies, de modo que podamos
          recordarla. Están siempre activas y no requieren tu consentimiento.
        </li>
        <li>
          <strong>Analíticas:</strong> nos permiten conocer de forma agregada cómo
          se utiliza la web (páginas visitadas, tiempo de permanencia, etc.) para
          mejorarla. Utilizamos Google Analytics 4. Solo se activan si las aceptas.
        </li>
        <li>
          <strong>De marketing o publicidad:</strong> se usan para medir la eficacia
          de nuestras campañas y mostrarte publicidad relevante dentro y fuera del
          sitio. Utilizamos Google Ads y Meta Pixel. Solo se activan si las aceptas.
        </li>
      </ul>

      <div className="legal-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Titular</th>
              <th>Finalidad</th>
              <th>Consentimiento</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Técnicas / necesarias</td>
              <td>Mudanzas X</td>
              <td>
                Funcionamiento del sitio, seguridad y recuerdo de tus preferencias
                de cookies.
              </td>
              <td>No requiere (exentas)</td>
            </tr>
            <tr>
              <td>Analíticas</td>
              <td>Google (Google Analytics 4)</td>
              <td>Medición estadística y agregada del uso del sitio.</td>
              <td>Requiere tu consentimiento</td>
            </tr>
            <tr>
              <td>Marketing</td>
              <td>Google (Google Ads) y Meta (Meta Pixel)</td>
              <td>Medición de campañas y publicidad personalizada.</td>
              <td>Requiere tu consentimiento</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>4. Consentimiento: cómo aceptar, rechazar o configurar</h2>
      <p>
        Cuando accedes por primera vez al sitio, te mostramos un banner con
        información sobre las cookies y tres opciones: <strong>«Aceptar todas»</strong>
        , <strong>«Rechazar todas»</strong> y <strong>«Configurar»</strong>. Las
        cookies analíticas y de marketing (Google Analytics, Google Ads y Meta Pixel){" "}
        <strong>no se cargan</strong> hasta que das tu consentimiento para cada
        categoría; por tanto, el rechazo es tan sencillo como la aceptación.
      </p>
      <p>
        Desde la opción «Configurar» puedes activar o desactivar por separado las
        categorías analíticas y de marketing (las necesarias permanecen siempre
        activas). Tu elección se guarda en tu navegador y la recordamos en tus
        próximas visitas.
      </p>
      <p>
        Puedes cambiar tu decisión en cualquier momento desde el enlace «Configurar
        cookies» disponible en el pie de página, o aquí mismo:
      </p>
      <p>
        <ConfigurarCookiesButton className="font-medium text-black underline underline-offset-2" />
      </p>

      <h2>5. Cómo desactivar las cookies en tu navegador</h2>
      <p>
        Además de nuestro panel de configuración, puedes permitir, bloquear o
        eliminar las cookies instaladas mediante las opciones de tu navegador. Ten en
        cuenta que desactivar ciertas cookies puede afectar al funcionamiento del
        sitio. Consulta la ayuda de tu navegador:
      </p>
      <ul>
        <li>
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Chrome
          </a>
        </li>
        <li>
          <a
            href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a
            href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
            target="_blank"
            rel="noopener noreferrer"
          >
            Apple Safari
          </a>
        </li>
        <li>
          <a
            href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
            target="_blank"
            rel="noopener noreferrer"
          >
            Microsoft Edge
          </a>
        </li>
      </ul>

      <h2>6. Transferencias internacionales</h2>
      <p>
        Las cookies de Google y Meta pueden implicar el tratamiento de datos fuera
        del Espacio Económico Europeo. Dichas transferencias se realizan con las
        garantías adecuadas previstas en el RGPD. Puedes ampliar esta información en
        nuestra <Link href="/privacidad">Política de privacidad</Link>.
      </p>

      <h2>7. Cambios en la política de cookies</h2>
      <p>
        Podemos actualizar esta política de cookies cuando cambien las cookies que
        utilizamos o por motivos legales. La fecha de la última actualización figura
        al inicio de esta página.
      </p>
    </LegalShell>
  );
}
