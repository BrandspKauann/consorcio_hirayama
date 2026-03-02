import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import OperatorsSection from "@/components/OperatorsSection";
import SalaryFitsSection from "@/components/SalaryFitsSection";
import SolidesSection from "@/components/SolidesSection";
import PartnershipSection from "@/components/PartnershipSection";
import YouTubeVideosSection from "@/components/YouTubeVideosSection";
import BlogSection from "@/components/BlogSection";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

const Index = () => {
  return (
    <>
      <SEO />
      <div className="min-h-screen bg-background">
        <Header />
      <div className="pt-16 md:pt-20">
        <Hero />
        <AboutSection />
        <OperatorsSection />
        <SalaryFitsSection />
        <SolidesSection />
        <PartnershipSection />
        <YouTubeVideosSection
          videoUrls={[
            "https://www.youtube.com/watch?v=mPk4CvtToz8",
          ]}
          title="Vídeos em Destaque"
          description="Confira nossos conteúdos em vídeo sobre benefícios corporativos e gestão de RH"
        />
        <BlogSection />
        <Footer />
      </div>
    </div>
    </>
  );
};

export default Index;
