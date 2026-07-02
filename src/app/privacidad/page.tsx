import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";
import { EMPRESA, TELEFONO, TELEFONO_TEXTO } from "@/lib/config";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo trata Mudanzas X tus datos personales: responsable, finalidades, base jurídica, conservación, encargados, derechos y reclamación ante la AEPD.",
};

export default function Privacidad() {
  return (
    <LegalShell titulo="Política de privacidad">
      <p>
        En Mudanzas X nos tomamos en serio la protección de tus datos personales.
        Esta política explica, conforme al Reglamento (UE) 2016/679 (RGPD) y a la
        Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y
        garantía de los derechos digitales (LOPDGDD), qué datos tratamos, con qué
        finalidad, con qué legitimación y qué derechos te asisten.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>
          <strong>Responsable:</strong> {EMPRESA.titular} ({EMPRESA.formaJuridica})
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
      </ul>

      <h2>2. Datos que tratamos y finalidades</h2>
      <p>
        Tratamos los datos que nos facilitas a través del formulario de presupuesto
        y durante la gestión de tu mudanza, en particular:
      </p>
      <ul>
        <li>
          <strong>Datos identificativos y de contacto:</strong> nombre, teléfono y
          correo electrónico.
        </li>
        <li>
          <strong>Datos de la mudanza:</strong> dirección de origen y de destino, y
          los detalles que nos proporciones sobre el servicio (volumen, tipo de
          vivienda, fechas, elementos a transportar, etc.).
        </li>
      </ul>
      <p>Utilizamos estos datos para las siguientes finalidades:</p>
      <ul>
        <li>Atender tu solicitud de presupuesto y ponernos en contacto contigo.</li>
        <li>
          En su caso, gestionar la contratación y la prestación del servicio de
          mudanza, así como su facturación y cobro.
        </li>
        <li>
          Mantener contigo las comunicaciones necesarias relacionadas con el
          servicio solicitado.
        </li>
      </ul>
      <p>
        Si has consentido el uso de cookies analíticas o de marketing, también
        trataremos datos de navegación con fines de medición y publicidad, según se
        detalla en nuestra <Link href="/cookies">Política de cookies</Link>.
      </p>

      <h2>3. Base jurídica del tratamiento</h2>
      <ul>
        <li>
          <strong>
            Ejecución de un contrato o aplicación de medidas precontractuales
          </strong>{" "}
          (art. 6.1.b RGPD): para atender tu solicitud de presupuesto y, en su caso,
          gestionar y prestar el servicio de mudanza que contrates.
        </li>
        <li>
          <strong>Consentimiento del interesado</strong> (art. 6.1.a RGPD): que nos
          otorgas al enviar el formulario de contacto/presupuesto y al aceptar las
          cookies analíticas o de marketing. Puedes retirar tu consentimiento en
          cualquier momento, sin que ello afecte a la licitud del tratamiento previo
          a su retirada.
        </li>
        <li>
          <strong>Cumplimiento de obligaciones legales</strong> (art. 6.1.c RGPD):
          para atender obligaciones fiscales y contables derivadas de la contratación
          del servicio.
        </li>
      </ul>

      <h2>4. Plazo de conservación</h2>
      <p>
        Conservaremos tus datos mientras dure la relación con nosotros y, una vez
        finalizada, durante los plazos legalmente exigibles para atender posibles
        responsabilidades (por ejemplo, las obligaciones fiscales y contables, que
        con carácter general se extienden hasta seis años). Si tu solicitud de
        presupuesto no se materializa en una contratación, conservaremos los datos
        durante el tiempo necesario para gestionar tu solicitud y, después, los
        suprimiremos o anonimizaremos.
      </p>

      <h2>5. Destinatarios y encargados del tratamiento</h2>
      <p>
        No cedemos tus datos a terceros salvo obligación legal. Para prestar el
        servicio nos apoyamos en proveedores tecnológicos que actúan como encargados
        del tratamiento y que únicamente tratan los datos siguiendo nuestras
        instrucciones y con las debidas garantías:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> (Supabase, Inc.): alojamiento de la base de
          datos donde se almacenan las solicitudes y la gestión de las mudanzas.
        </li>
        <li>
          <strong>Stripe</strong> (Stripe Payments Europe, Ltd. / Stripe, Inc.):
          procesamiento de los pagos. Mudanzas X <strong>no almacena</strong> los
          datos de las tarjetas de pago; estos son tratados directamente por Stripe
          como responsable/encargado del pago conforme a sus propias políticas.
        </li>
        <li>
          <strong>Google</strong> (Google Ireland Ltd. / Google LLC): servicios de
          medición (Google Analytics 4) y publicidad (Google Ads), únicamente si has
          consentido las cookies correspondientes.
        </li>
        <li>
          <strong>Meta</strong> (Meta Platforms Ireland Ltd.): medición y publicidad
          a través de Meta Pixel, únicamente si has consentido las cookies de
          marketing.
        </li>
      </ul>

      <h2>6. Transferencias internacionales</h2>
      <p>
        Algunos de los proveedores anteriores (como Stripe, Google o Meta) pueden
        tratar datos en países situados fuera del Espacio Económico Europeo. En esos
        casos, dichas transferencias se realizan con las garantías adecuadas
        previstas en el RGPD, principalmente mediante las Cláusulas Contractuales
        Tipo aprobadas por la Comisión Europea o mecanismos equivalentes (como el
        Marco de Privacidad de Datos UE-EE. UU. cuando resulte aplicable), que puedes
        solicitar escribiéndonos a{" "}
        <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a>.
      </p>

      <h2>7. Tus derechos</h2>
      <p>
        Puedes ejercer en cualquier momento los siguientes derechos escribiéndonos a{" "}
        <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a>, indicando el derecho
        que deseas ejercer y adjuntando, cuando proceda, copia de un documento que
        acredite tu identidad:
      </p>
      <ul>
        <li>
          <strong>Acceso:</strong> conocer qué datos tuyos tratamos.
        </li>
        <li>
          <strong>Rectificación:</strong> corregir datos inexactos o incompletos.
        </li>
        <li>
          <strong>Supresión:</strong> solicitar que eliminemos tus datos cuando ya no
          sean necesarios.
        </li>
        <li>
          <strong>Oposición:</strong> oponerte a determinados tratamientos.
        </li>
        <li>
          <strong>Limitación:</strong> solicitar que limitemos el tratamiento en los
          casos previstos por la ley.
        </li>
        <li>
          <strong>Portabilidad:</strong> recibir tus datos en un formato estructurado
          o solicitar su transmisión a otro responsable.
        </li>
      </ul>
      <p>
        Asimismo, cuando el tratamiento se base en tu consentimiento, tienes derecho
        a retirarlo en cualquier momento.
      </p>

      <h2>8. Reclamación ante la autoridad de control</h2>
      <p>
        Si consideras que el tratamiento de tus datos no se ajusta a la normativa, o
        si entiendes que no has obtenido satisfacción en el ejercicio de tus
        derechos, puedes presentar una reclamación ante la Agencia Española de
        Protección de Datos (AEPD),{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
          www.aepd.es
        </a>
        , C/ Jorge Juan, 6, 28001 Madrid.
      </p>

      <h2>9. Seguridad de los datos</h2>
      <p>
        Aplicamos medidas técnicas y organizativas apropiadas para garantizar un
        nivel de seguridad adecuado al riesgo, con el fin de proteger tus datos
        frente a su destrucción, pérdida, alteración o acceso no autorizado.
      </p>

      <h2>10. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política de privacidad para adaptarla a novedades
        legislativas o a cambios en nuestros servicios. Te recomendamos revisarla
        periódicamente; la fecha de la última actualización figura al inicio de esta
        página.
      </p>
    </LegalShell>
  );
}
