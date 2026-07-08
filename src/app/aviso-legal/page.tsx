import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";
import { EMPRESA, TELEFONO, TELEFONO_TEXTO } from "@/lib/config";

export const metadata: Metadata = {
  title: "Aviso legal",
  alternates: { canonical: "/aviso-legal" },
  description:
    "Datos identificativos del titular, condiciones de uso, propiedad intelectual y legislación aplicable del sitio web de Mudanzas X.",
};

export default function AvisoLegal() {
  return (
    <LegalShell titulo="Aviso legal">
      <h2>1. Datos identificativos del titular</h2>
      <p>
        En cumplimiento del deber de información recogido en el artículo 10 de la
        Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información
        y de Comercio Electrónico (LSSI-CE), se ponen a disposición del usuario los
        siguientes datos del titular de este sitio web:
      </p>
      <ul>
        <li>
          <strong>Titular:</strong> {EMPRESA.titular} ({EMPRESA.formaJuridica})
        </li>
        <li>
          <strong>NIF:</strong> {EMPRESA.nif}
        </li>
        <li>
          <strong>Domicilio:</strong> {EMPRESA.domicilio}
        </li>
        <li>
          <strong>Correo electrónico:</strong>{" "}
          <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a>
        </li>
        <li>
          <strong>Teléfono:</strong>{" "}
          <a href={`tel:${TELEFONO}`}>{TELEFONO_TEXTO}</a>
        </li>
        <li>
          <strong>Sitio web:</strong> {EMPRESA.web}
        </li>
        <li>
          <strong>Actividad:</strong> {EMPRESA.actividad} (epígrafe IAE{" "}
          {EMPRESA.iae})
        </li>
      </ul>

      <h2>2. Objeto</h2>
      <p>
        El presente aviso legal regula el acceso, la navegación y el uso del sitio
        web {EMPRESA.web} (en adelante, «el sitio web»), cuya titularidad
        corresponde a {EMPRESA.titular}. A través del sitio web se ofrece
        información sobre los servicios de mudanzas prestados por el titular y se
        permite a los usuarios solicitar presupuestos y, en su caso, contratar y
        gestionar dichos servicios.
      </p>
      <p>
        La utilización del sitio web atribuye la condición de usuario e implica la
        aceptación plena de todas las cláusulas incluidas en este aviso legal. Si
        el usuario no está de acuerdo con su contenido, deberá abstenerse de
        utilizar el sitio web.
      </p>

      <h2>3. Condiciones de uso</h2>
      <p>
        El usuario se compromete a hacer un uso adecuado y lícito del sitio web y
        de sus contenidos, de conformidad con la legislación aplicable, el presente
        aviso legal, la moral y las buenas costumbres. En particular, el usuario se
        compromete a:
      </p>
      <ul>
        <li>
          No utilizar el sitio web con fines o efectos ilícitos, lesivos de los
          derechos e intereses de terceros, o que puedan dañar, inutilizar o
          sobrecargar el sitio web o impedir su normal utilización.
        </li>
        <li>
          Facilitar información veraz en los formularios del sitio web y mantenerla
          actualizada, siendo responsable de la información que proporcione.
        </li>
        <li>
          No introducir ni difundir programas, virus o cualquier elemento físico o
          lógico que pueda causar daños en los sistemas del titular o de terceros.
        </li>
      </ul>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>
        Todos los contenidos del sitio web, entendiendo por estos, a título
        enunciativo, los textos, fotografías, gráficos, imágenes, iconos,
        tecnología, software, logotipos, marcas, nombres comerciales, diseño y
        código fuente, así como su estructura, selección y ordenación, son
        titularidad del titular del sitio web o de terceros que han autorizado su
        uso, y están protegidos por la normativa sobre propiedad intelectual e
        industrial.
      </p>
      <p>
        Queda prohibida la reproducción, distribución, comunicación pública,
        transformación o cualquier otra forma de explotación, total o parcial, de
        los contenidos del sitio web sin la autorización expresa y por escrito del
        titular.
      </p>

      <h2>5. Responsabilidad</h2>
      <p>
        El titular no garantiza la disponibilidad y continuidad permanente del
        sitio web, ni la ausencia de errores en sus contenidos, si bien empleará
        los medios razonables para evitarlos, subsanarlos o actualizarlos. El
        titular no será responsable de los daños y perjuicios de cualquier
        naturaleza que pudieran derivarse de la falta de disponibilidad del sitio
        web o de la presencia de virus u otros elementos lesivos, quedando exonerado
        de responsabilidad en los términos permitidos por la legislación vigente.
      </p>

      <h2>6. Enlaces a terceros</h2>
      <p>
        El sitio web puede contener enlaces a otros sitios web de terceros. El
        titular no asume ninguna responsabilidad sobre los contenidos, políticas o
        servicios de dichos sitios, cuya gestión corresponde a sus respectivos
        responsables.
      </p>

      <h2>7. Protección de datos</h2>
      <p>
        El tratamiento de los datos personales que el usuario facilite a través del
        sitio web se rige por lo dispuesto en nuestra{" "}
        <Link href="/privacidad">Política de privacidad</Link> y en nuestra{" "}
        <Link href="/cookies">Política de cookies</Link>.
      </p>

      <h2>8. Legislación aplicable y jurisdicción</h2>
      <p>
        El presente aviso legal se rige por la legislación española. Para la
        resolución de cualquier controversia que pudiera derivarse del acceso o uso
        del sitio web, las partes se someten a los juzgados y tribunales que
        resulten competentes conforme a la normativa aplicable, sin perjuicio de la
        aplicación de la normativa de protección de los consumidores y usuarios
        cuando esta resulte de aplicación.
      </p>
    </LegalShell>
  );
}
