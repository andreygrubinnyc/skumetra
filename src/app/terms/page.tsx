import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export const metadata: Metadata = {
  title: 'Terms of Service',
  alternates: { canonical: '/terms' },
}

const h2 = 'mb-3 mt-10 text-[20px] font-semibold tracking-[-0.012em]'
const p = 'mb-4 max-w-[68ch] text-[16px] leading-[1.65] text-ink-soft'
const ul = 'mb-4 ml-5 max-w-[68ch] list-disc text-[16px] leading-[1.65] text-ink-soft'

/**
 * MVP-stage Terms of Service. Covers the current site and pilot-application
 * flow only.
 *
 * MISSING FOR ANDREY: no registered legal entity name, business mailing
 * address, or governing-law jurisdiction is documented anywhere in this
 * project, so none is stated below. Add these once available, and have
 * this page reviewed by counsel before treating it as complete.
 */
export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-[860px] px-6 py-[clamp(56px,8vw,104px)]">
        <h1 className="mb-3 text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.14] tracking-[-0.025em]">
          Terms of Service
        </h1>
        <p className="m-0 text-[14px] text-ink-faint">Last updated: August 2026</p>

        <p className={`${p} mt-6`}>
          By using skumetra.com or submitting a Founding Seller Pilot application, you agree to the following.
          Skumetra is in early-access validation — these terms describe the product as it exists today, not
          any future version.
        </p>

        <h2 className={h2}>What Skumetra is right now</h2>
        <p className={p}>
          The current public site is informational, plus a pilot-application form. It does not process Amazon
          listing files or supplier files, does not connect to any Amazon account, and cannot make changes to
          any Amazon listing. Skumetra does not request or need your Amazon password.
        </p>

        <h2 className={h2}>Pilot participation</h2>
        <p className={p}>
          Submitting a Founding Seller Pilot application does not guarantee acceptance into the pilot and does
          not create any charge. We review applications and contact qualified sellers before the pilot starts.
          The pilot itself, when it begins, will have its own scope and terms, communicated directly to
          accepted participants.
        </p>

        <h2 className={h2}>What you agree not to submit</h2>
        <p className={p}>
          Do not submit your Amazon password, or any Amazon customer&apos;s personal information, through this
          site at any point, including in the optional comments field.
        </p>

        <h2 className={h2}>No guarantees</h2>
        <p className={p}>Skumetra does not guarantee:</p>
        <ul className={ul}>
          <li>Any level of profit, sales, or business outcome</li>
          <li>Compliance with Amazon&apos;s marketplace policies or any other marketplace&apos;s policies</li>
          <li>Uninterrupted availability of any supplier, product, or third-party service</li>
          <li>That the pilot or any future product will meet your specific business needs</li>
        </ul>
        <p className={p}>
          When a future, functional version of Skumetra produces financial outputs — such as safe-price or
          margin estimates — those outputs will be estimates calculated from the data you supply and the rules
          you configure. They are not guarantees, financial advice, or a substitute for your own judgment.
        </p>

        <h2 className={h2}>Changes</h2>
        <p className={p}>
          We may update these terms as the product changes, particularly as real product functionality is
          added in later releases. Material changes will be reflected on this page with an updated date.
        </p>

        <h2 className={h2}>Contact</h2>
        <p className={p}>
          Questions about these terms can be sent to <a href="mailto:hello@skumetra.com">hello@skumetra.com</a>.
        </p>
      </main>
      <SiteFooter />
    </>
  )
}
