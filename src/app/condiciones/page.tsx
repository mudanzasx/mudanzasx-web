import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";
import { EMPRESA } from "@/lib/config";

export const metadata: Metadata = {
  title: "Condiciones del servicio · Mudanzas X",
  description:
    "Condiciones generales de contratación del servicio de mudanzas de Mudanzas X: presupuesto, reserva y pago, obligaciones de las partes, seguros y responsabilidad.",
};

export default function Condiciones() {
  return (
    <LegalShell titulo="Condiciones del servicio">
      <h2>1. Objeto</h2>
      <p>
        Las presentes condiciones generales de contratación (en adelante, «las
        condiciones») regulan la contratación del servicio de mudanzas ofrecido
        por {EMPRESA.titular}, con NIF {EMPRESA.nif} y domicilio en{" "}
        {EMPRESA.domicilio} (en adelante, «Mudanzas X»), a través del sitio web{" "}
        {EMPRESA.web}. La solicitud y aceptación de un presupuesto implica la
        aceptación plena de estas condiciones.
      </p>

      <h2>2. Descripción del servicio</h2>
      <p>
        Mudanzas X presta servicios de mudanzas desde Barcelona a cualquier punto
        de la península ibérica y viceversa. En función de lo acordado en cada
        presupuesto, el servicio puede incluir el embalaje de los enseres, la
        carga, el transporte, la descarga, el montaje y desmontaje de mobiliario y
        la gestión de permisos de estacionamiento u ocupación de vía pública.
      </p>

      <h2>3. Presupuesto y precios</h2>
      <p>
        El presupuesto obtenido a través de la web tiene carácter orientativo y se
        calcula a partir de los datos facilitados por el cliente. El precio se
        confirma una vez validados los datos reales de la mudanza (volumen,
        distancia, condiciones de acceso y servicios contratados). Todos los
        precios se expresan con el IVA incluido. El presupuesto aceptado por el
        cliente constituye la base del contrato entre las partes.
      </p>

      <h2>4. Reserva y pago</h2>
      <p>
        Para reservar la fecha de la mudanza, el cliente abona por adelantado el
        50 % del precio confirmado. Alternativamente, el cliente puede optar por
        pagar por adelantado el 100 % del precio, en cuyo caso se aplica un 5 % de
        descuento sobre el importe total. El importe restante, cuando lo hubiera,
        se abona el día de la mudanza.
      </p>
      <p>
        Los pagos se procesan de forma segura a través de la plataforma Stripe.
        Mudanzas X no almacena los datos completos de la tarjeta del cliente.
      </p>

      <h2>5. Obligaciones del cliente</h2>
      <p>El cliente se compromete a:</p>
      <ul>
        <li>
          Facilitar información veraz y completa sobre el inventario de enseres y
          sobre las condiciones de acceso a los inmuebles de origen y destino
          (planta, existencia y dimensiones de ascensor, distancia de portal a
          vehículo y disponibilidad de aparcamiento).
        </li>
        <li>
          Tener los enseres preparados según lo acordado en el presupuesto (por
          ejemplo, embalados por su cuenta cuando así se haya convenido).
        </li>
        <li>
          Garantizar el acceso a los inmuebles de origen y destino en la fecha y
          hora previstas.
        </li>
        <li>
          Declarar de forma expresa los objetos de especial valor, fragilidad o
          naturaleza singular, a fin de que puedan tratarse con las medidas
          adecuadas.
        </li>
      </ul>

      <h2>6. Obligaciones de Mudanzas X</h2>
      <p>Mudanzas X se compromete a:</p>
      <ul>
        <li>
          Prestar el servicio con diligencia profesional en la fecha acordada,
          aportando el personal cualificado y el vehículo adecuados al volumen y
          las características de la mudanza.
        </li>
        <li>
          Manipular y transportar los enseres con el cuidado debido, adoptando las
          medidas razonables para su protección.
        </li>
        <li>
          Contar con los seguros de responsabilidad civil y de las mercancías
          transportadas y manipuladas, en los términos indicados en el apartado
          siguiente.
        </li>
      </ul>

      <h2>7. Seguros y responsabilidad</h2>
      <p>
        Mudanzas X dispone de un seguro de responsabilidad civil y de un seguro
        que cubre las mercancías transportadas y manipuladas durante la prestación
        del servicio. Como es habitual en este tipo de coberturas, pueden existir
        límites cuantitativos y determinadas exclusiones, entre otras, los daños
        en objetos de especial valor que no hayan sido declarados previamente por
        el cliente o los daños derivados de embalajes realizados por el propio
        cliente. El detalle de límites, franquicias y exclusiones aplicables se
        facilita en el momento de formalizar el servicio.
      </p>

      <h2>8. Cancelaciones y cambios</h2>
      <p>
        Las condiciones aplicables a la cancelación de la mudanza y al cambio de
        fecha se detallan en la página de{" "}
        <Link href="/cancelacion">Condiciones de cancelación y cambios</Link>, que
        forma parte de estas condiciones.
      </p>

      <h2>9. Legislación aplicable</h2>
      <p>
        Estas condiciones se rigen por la legislación española, incluida, cuando
        resulte de aplicación, la normativa de protección de los consumidores y
        usuarios. Para cualquier controversia, las partes se someten a los
        juzgados y tribunales que resulten competentes conforme a la normativa
        vigente.
      </p>
    </LegalShell>
  );
}
