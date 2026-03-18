import Header from "@/components/Header";
import ConsorcioHero from "@/components/consorcio/ConsorcioHero";
import ConsorcioProblem from "@/components/consorcio/ConsorcioProblem";
import ConsorcioSolution from "@/components/consorcio/ConsorcioSolution";
import ConsorcioTypes from "@/components/consorcio/ConsorcioTypes";
import ConsorcioAuthority from "@/components/consorcio/ConsorcioAuthority";
import ConsorcioPartners from "@/components/consorcio/ConsorcioPartners";
import ConsorcioBlogPreview from "@/components/consorcio/ConsorcioBlogPreview";
import ConsorcioSocialProof from "@/components/consorcio/ConsorcioSocialProof";
import ConsorcioCTA from "@/components/consorcio/ConsorcioCTA";
import ConsorcioFooter from "@/components/consorcio/ConsorcioFooter";
import { SEO } from "@/components/SEO";

const Index = () => {
  return (
    <>
      <SEO
        title="Consórcio Platinum | Planejamento Inteligente para Conquistar seu Patrimônio"
        description="Consórcio automóvel, imobiliário, empresarial e para investimento. Assessoria completa com estratégia de lance e acompanhamento até contemplação. Planejamento patrimonial sem juros."
        keywords="consórcio automóvel, consórcio imobiliário, consórcio sem juros, planejamento com consórcio, consórcio empresarial, consórcio para investimento"
      />
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 md:pt-20">
          <ConsorcioHero />
          <ConsorcioProblem />
          <ConsorcioSolution />
          <ConsorcioTypes />
          <ConsorcioAuthority />
          <ConsorcioPartners />
          <ConsorcioBlogPreview />
          <ConsorcioSocialProof />
          <ConsorcioCTA />
          <ConsorcioFooter />
        </div>
      </div>
    </>
  );
};

export default Index;
