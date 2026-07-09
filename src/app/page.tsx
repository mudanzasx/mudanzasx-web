import Topbar from "@/components/Topbar";
import Header from "@/components/Header";
import SectionNav from "@/components/SectionNav";
import Hero from "@/components/Hero";
import Manifiesto from "@/components/Manifiesto";
import HowItWorks from "@/components/HowItWorks";
import Servicios from "@/components/Servicios";
import Faq from "@/components/Faq";
import QuoteForm from "@/components/QuoteForm";
import Footer from "@/components/Footer";
import { QuoteProvider } from "@/components/QuoteContext";
import { EMPRESA, TELEFONO } from "@/lib/config";
import { PREGUNTAS } from "@/lib/faq";

// Datos estructurados (JSON-LD) de la empresa para buscadores. Solo datos
// reales; sin valoraciones ni precios inventados. La imagen es la del camión.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MovingCompany",
  name: "Mudanzas X",
  description:
    "Mudanzas desde Barcelona a toda la península: presupuesto con datos reales, cobertura nacional y servicio con seguro.",
  url: "https://www.mudanzasx.com",
  telephone: TELEFONO,
  email: EMPRESA.email,
  image: "https://www.mudanzasx.com/embalaje-cuidado-mueble.jpg",
  priceRange: "€€",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Calle Unió, 15",
    postalCode: "08420",
    addressLocality: "Canovelles",
    addressRegion: "Barcelona",
    addressCountry: "ES",
  },
  areaServed: [
    { "@type": "City", name: "Barcelona" },
    { "@type": "Country", name: "España" },
  ],
  // Perfiles sociales reales (coinciden con los del footer).
  sameAs: [
    "https://facebook.com/mudanzasxai",
    "https://instagram.com/mudanzasx_ai",
    "https://tiktok.com/@mudanzasx_ai",
    "https://youtube.com/@mudanzasx_ai",
    "https://x.com/mudanzasx_ai",
  ],
  // Horario de atención comercial (el mismo del footer).
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "17:00",
    },
  ],
};

// FAQPage generado a partir de las MISMAS preguntas visibles en la web (Faq.tsx),
// para que el rich result coincida exactamente con el contenido.
const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PREGUNTAS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      {/* Topbar + Header + barra de secciones pegados arriba: acompañan al
          usuario en todo el scroll (reclamo del descuento, CTA "Llamar" y
          scrollspy de secciones). Sticky conserva el hueco en el flujo, así que
          el contenido no queda tapado ni salta el layout. El id permite a
          SectionNav medir la altura real del bloque y calcular sus offsets. */}
      <div id="mx-fixed-top" className="sticky top-0 z-50">
        <Topbar />
        <Header />
        <SectionNav />
      </div>
      <QuoteProvider>
        <main className="flex-1">
          <Hero />
          <Manifiesto />
          <HowItWorks />
          <Servicios />
          <Faq />
          <QuoteForm />
        </main>
      </QuoteProvider>
      <Footer />
    </>
  );
}
