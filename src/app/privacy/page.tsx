import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  alternates: { canonical: '/privacy' },
}

const h2 = 'mb-3 mt-10 text-[20px] font-semibold tracking-[-0.012em]'
const p = 'mb-4 max-w-[68ch] text-[16px] leading-[1.65] text-ink-soft'
const ul = 'mb-4 ml-5 max-w-[68ch] list-disc text-[16px] leading-[1.65] text-ink-soft'

/**
 * MVP-stage Privacy Policy. Covers the disclosures required for the
 * current site and pilot-application flow only — it does not describe
 * capabilities that don't exist yet (file processing, Amazon integration).
 *
 * MISSING FOR ANDREY: no registered legal entity name or business mailing
 * address is documented anywhere in this project, so none is stated below.
 * Add both here once available, and have this page reviewed by counsel
 * before treating it as a complete, compliant policy — this was drafted
 * to be honest and accurate about current MVP behavior, not to satisfy
 * any specific privacy-law regime (GDPR/CCPA/etc.).
 */
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-[860px] px-6 py-[clamp(56px,8vw,104px)]">
        <h1 className="mb-3 text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.14] tracking-[-0.025em]">
          Privacy Policy
        </h1>
        <p className="m-0 text-[14px] text-ink-faint">Last updated: August 2026</p>

        <p className={`${p} mt-6`}>
          Skumetra is in early-access validation. This policy describes what happens today, on this website
          and in the Founding Seller Pilot application — not what a future version of Skumetra may eventually
          do. We will update this page as the product changes.
        </p>

        <h2 className={h2}>What this site does today</h2>
        <p className={p}>
          skumetra.com is a public information site and a pilot-application form. It does not process Amazon
          listing files, supplier files, or any other business data. It does not connect to your Amazon
          account, and it cannot make changes to any Amazon listing.
        </p>

        <h2 className={h2}>Information we collect</h2>
        <p className={p}>When you submit the Founding Seller Pilot application, we collect:</p>
        <ul className={ul}>
          <li>Your name and email address</li>
          <li>Your business or store name, if you provide one</li>
          <li>Your answers to the application questions (Amazon selling status, approximate listing count, supplier count, supplier-file format, primary problem, willingness to share files, and any optional comments)</li>
        </ul>
        <p className={p}>
          We do not use tracking cookies. We may add privacy-respecting product analytics (page views and
          high-level interactions such as &ldquo;pilot form started&rdquo;) in the future; if we do, it will
          never include your form answers, name, email, business name, or anything else you type into the
          application.
        </p>

        <h2 className={h2}>What we ask you not to submit</h2>
        <p className={p}>
          Please do not send us your Amazon password, or any Amazon customer&apos;s personal information, at
          any point — including in the optional comments field. Skumetra does not need either to evaluate a
          pilot application, and we do not want to receive them.
        </p>

        <h2 className={h2}>How we use your information</h2>
        <p className={p}>
          We use pilot-application data to review and evaluate applicants for the Founding Seller Pilot, and
          to contact you about your application. Submitting an application does not guarantee acceptance into
          the pilot, and does not create any charge.
        </p>

        <h2 className={h2}>Where it&apos;s stored</h2>
        <p className={p}>
          Pilot applications are stored in a Supabase-hosted PostgreSQL database, inserted only through a
          server-side process — your browser never has direct access to this database. Access to review
          applications is limited to the Skumetra founder.
        </p>

        <h2 className={h2}>How long we keep it</h2>
        <p className={p}>
          We retain pilot-application data for as long as needed to evaluate and follow up on the pilot, and
          afterward for as long as reasonably useful to Skumetra&apos;s early-stage product development. You
          can ask us to delete your application at any time — see Contact below.
        </p>

        <h2 className={h2}>Future product versions</h2>
        <p className={p}>
          A future, functional version of Skumetra is expected to process Amazon listing files and supplier
          files that you choose to upload, in order to calculate estimates such as safe selling prices and
          margin risk. Those estimates will be based on the data you supply and the rules you configure — they
          are not guarantees. This privacy policy will be updated with the relevant disclosures before that
          functionality is available to any user.
        </p>

        <h2 className={h2}>Contact</h2>
        <p className={p}>
          Questions about this policy, or a request to access or delete your data, can be sent to{' '}
          <a href="mailto:hello@skumetra.com">hello@skumetra.com</a>.
        </p>
      </main>
      <SiteFooter />
    </>
  )
}
