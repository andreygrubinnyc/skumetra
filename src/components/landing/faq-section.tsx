import { Section, Eyebrow, SectionTitle } from '@/components/ui/section'
import { Accordion, type AccordionItem } from '@/components/ui/accordion'
import { faqs } from '@/data/faq-data'

const items: AccordionItem[] = faqs.map((f, i) => ({
  id: `faq-${i}`,
  header: f.q,
  content: <p className="m-0">{f.a}</p>,
}))

export function FaqSection() {
  return (
    <Section id="faq" aria-labelledby="faq-heading">
      <Eyebrow>FAQ</Eyebrow>
      <SectionTitle id="faq-heading" className="mb-10 max-w-[22ch]">
        Questions sellers ask first
      </SectionTitle>
      <Accordion items={items} className="max-w-[860px]" />
    </Section>
  )
}
