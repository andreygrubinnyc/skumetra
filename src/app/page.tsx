import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { HeroSection } from '@/components/landing/hero-section'
import { DetectionSection } from '@/components/landing/detection-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { ProductPreviewSection } from '@/components/landing/product-preview-section'
import { AiControlSection } from '@/components/landing/ai-control-section'
import { IdealUserSection } from '@/components/landing/ideal-user-section'
import { PilotPricingSection } from '@/components/landing/pilot-pricing-section'
import { TrustSection } from '@/components/landing/trust-section'
import { FaqSection } from '@/components/landing/faq-section'
import { FinalCtaSection } from '@/components/landing/final-cta-section'

/**
 * Landing page. Section order is deliberate:
 * hero → problem & detection → how it works → product preview → where AI fits →
 * who it is for → pilot & pricing → trust → FAQ → final CTA.
 * Grounds alternate white / #f7fafa; the final CTA and footer are the only dark surfaces.
 */
export default function LandingPage() {
  return (
    <>
      <PageViewTracker event="landing_page_viewed" />
      <SiteHeader />
      <main id="main-content">
        <HeroSection />
        <DetectionSection />
        <HowItWorksSection />
        <ProductPreviewSection />
        <AiControlSection />
        <IdealUserSection />
        <PilotPricingSection />
        <TrustSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </>
  )
}
