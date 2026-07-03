import Topbar from "@/components/Topbar";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBand from "@/components/TrustBand";
import HowItWorks from "@/components/HowItWorks";
import Servicios from "@/components/Servicios";
import Faq from "@/components/Faq";
import QuoteForm from "@/components/QuoteForm";
import Footer from "@/components/Footer";
import { QuoteProvider } from "@/components/QuoteContext";
import { EMPRESA, TELEFONO } from "@/lib/config";

// Datos estructurados (JSON-LD) de la empresa para buscadores. Solo datos
// reales; sin valoraciones ni precios inventados. La imagen es la del camión.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MovingCompany",
  name: "Mudanzas X",
  description:
    "Mudanzas desde Barcelona a toda la península ibérica: presupuesto con datos reales, cobertura nacional y servicio con seguro.",
  url: "https://www.mudanzasx.com",
  telephone: TELEFONO,
  email: EMPRESA.email,
  image: "https://www.mudanzasx.com/camion-barcelona-mirador.jpg",
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
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Topbar />
      <Header />
      <QuoteProvider>
        <main className="flex-1">
          <Hero />
          <TrustBand />
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
