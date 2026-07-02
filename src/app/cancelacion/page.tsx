import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";
import { EMPRESA, TELEFONO, TELEFONO_TEXTO } from "@/lib/config";

export const metadata: Metadata = {
  title: "Condiciones de cancelación y cambios",
  description:
    "Condiciones de cancelación de la mudanza, cambio de fecha, plazos de reembolso y derecho de desistimiento en Mudanzas X.",
};

export default function Cancelacion() {
  return (
    <LegalShell titulo="Condiciones de cancelación y cambios">
      <p>
        Estas condiciones desarrollan lo previsto en las{" "}
        <Link href="/condiciones">Condiciones del servicio</Link> en relación con
        la cancelación de la mudanza y el cambio de fecha. La antelación se calcula
        siempre en días naturales respecto a la fecha reservada para la mudanza.
      </p>

      <h2>1. Cancelación por el cliente</h2>
      <ul>
        <li>
          Si el cliente cancela con <strong>7 o más días naturales</strong> de
          antelación respecto a la fecha de la mudanza, se le reembolsa
          íntegramente el importe abonado, incluida la reserva del 50 %.
        </li>
        <li>
          Si el cliente cancela con <strong>menos de 7 días naturales</strong> de
          antelación, no se reembolsa la reserva del 50 % abonada, en concepto de
          compensación por la reserva del vehículo y del equipo y por la pérdida de
          disponibilidad de esa fecha. El importe restante que no se hubiera
          abonado no se cobrará.
        </li>
      </ul>

      <h2>2. Cambio de fecha (reprogramación)</h2>
      <ul>
        <li>
          El cliente puede cambiar la fecha de la mudanza sin coste adicional si lo
          solicita con <strong>7 o más días naturales</strong> de antelación,
          sujeto a la disponibilidad de una nueva fecha.
        </li>
        <li>
          Con <strong>menos de 7 días naturales</strong> de antelación, el cambio
          de fecha queda sujeto a la disponibilidad de Mudanzas X y podría no ser
          posible. En tal caso, si el cambio no puede atenderse, se aplicarían las
          condiciones de cancelación indicadas en el apartado anterior.
        </li>
      </ul>

      <h2>3. Cómo cancelar o cambiar la fecha</h2>
      <p>
        Para cancelar la mudanza o solicitar un cambio de fecha, el cliente debe
        comunicarlo a través de los canales de contacto de Mudanzas X, por correo
        electrónico a{" "}
        <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a> o por teléfono en el{" "}
        <a href={`tel:${TELEFONO}`}>{TELEFONO_TEXTO}</a>, indicando sus datos y la
        fecha reservada. La antelación se calcula desde el momento de recepción de
        dicha comunicación.
      </p>

      <h2>4. Cancelación por Mudanzas X</h2>
      <p>
        En el caso excepcional de que Mudanzas X no pudiera prestar el servicio en
        la fecha acordada por causas de fuerza mayor, avería u otras circunstancias
        ajenas a su voluntad, ofrecerá al cliente una nueva fecha o, si el cliente
        lo prefiere, el reembolso íntegro de las cantidades abonadas, sin
        penalización alguna para el cliente.
      </p>

      <h2>5. Plazos de reembolso</h2>
      <p>
        Los reembolsos que procedan se realizan por el mismo medio de pago empleado
        por el cliente (a través de Stripe), en un plazo razonable desde la
        confirmación de la cancelación. El tiempo hasta que el importe queda
        disponible en la cuenta del cliente puede variar en función de su entidad
        bancaria.
      </p>

      <h2>6. Derecho de desistimiento</h2>
      <p>
        Conforme a la normativa de protección de los consumidores y usuarios, en la
        contratación de servicios a distancia puede reconocerse un derecho de
        desistimiento, así como determinadas excepciones al mismo. En particular,
        cuando el servicio se presta en una fecha concreta y determinada, o cuando
        su ejecución ha comenzado con el consentimiento del cliente, dicho derecho
        puede verse limitado o no resultar de aplicación. Esta mención tiene
        carácter informativo; para cualquier consulta sobre su alcance en un caso
        concreto, el cliente puede dirigirse a Mudanzas X a través de los datos de
        contacto indicados.
      </p>
    </LegalShell>
  );
}
