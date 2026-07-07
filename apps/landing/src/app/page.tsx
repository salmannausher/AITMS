import Navbar from '@/components/Navbar';
import ScrollProgress from '@/components/ScrollProgress';
import Hero from '@/components/Hero';
import LaneTicker from '@/components/LaneTicker';
import Problem from '@/components/Problem';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import FooterCTA from '@/components/FooterCTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <ScrollProgress />
      <Navbar />
      <Hero />
      <LaneTicker />
      <Problem />
      <HowItWorks />
      <Features />
      <Pricing />
      <FooterCTA />
      <Footer />
    </main>
  );
}
