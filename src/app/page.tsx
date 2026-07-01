import Topbar from "@/components/Topbar";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Faq from "@/components/Faq";
import QuoteForm from "@/components/QuoteForm";
import Footer from "@/components/Footer";
import { QuoteProvider } from "@/components/QuoteContext";

export default function Home() {
  return (
    <>
      <Topbar />
      <Header />
      <QuoteProvider>
        <main className="flex-1">
          <Hero />
          <HowItWorks />
          <Faq />
          <QuoteForm />
        </main>
      </QuoteProvider>
      <Footer />
    </>
  );
}
