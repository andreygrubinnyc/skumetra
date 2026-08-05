import { Check } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'

/** Success state. Never implies acceptance into the pilot, and never implies a charge. */
export function PilotSuccessState() {
  return (
    <div
      role="status"
      className="mx-auto my-[clamp(20px,5vw,64px)] max-w-[620px] rounded-frame border border-accent-border-strong bg-canvas p-[clamp(28px,4vw,44px)] text-center"
    >
      <div className="mx-auto mb-[22px] flex h-13 w-13 items-center justify-center rounded-full bg-accent-tint">
        <Check size={26} className="text-accent" aria-hidden />
      </div>
      <h2 className="mb-3.5 text-[clamp(24px,3vw,30px)] font-semibold leading-[1.2] tracking-[-0.022em]">
        Thanks for applying
      </h2>
      <p className="mb-2.5 text-[16px] leading-[1.65] text-ink-soft">
        We&apos;ll review your information and contact qualified pilot participants.
      </p>
      <p className="mb-7 text-[14px] leading-[1.6] text-ink-faint">
        Applying does not create a charge or guarantee acceptance into the pilot.
      </p>
      <ButtonLink href="/">Back to skumetra.com</ButtonLink>
    </div>
  )
}
