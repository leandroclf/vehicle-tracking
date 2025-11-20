import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import AnalyticsSection from '@/components/landing/AnalyticsSection';
import DevicesMockup from '@/components/landing/DevicesMockup';
import CtaSection from '@/components/landing/CtaSection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500/30">
      <Hero />
      <Features />
      <HowItWorks />
      <AnalyticsSection />
      <DevicesMockup />
      <CtaSection />
      <Footer />
    </main>
  );
}

