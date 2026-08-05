'use client'

import { Section, Eyebrow, SectionTitle } from '@/components/ui/section'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import { AppFrame } from '@/components/product/app-frame'
import { ActionCenter } from '@/components/product/action-center'
import { ProductMatching } from '@/components/product/product-matching'
import { ProtectionRules } from '@/components/product/protection-rules'

const tabs: TabItem[] = [
  { id: 'actions', label: 'Action Center', panel: <ActionCenter /> },
  { id: 'match', label: 'Product Matching', panel: <ProductMatching /> },
  { id: 'rules', label: 'Protection Rules', panel: <ProtectionRules /> },
]

export function ProductPreviewSection() {
  return (
    <Section ground="tint" aria-labelledby="preview-heading">
      <Eyebrow>Inside Skumetra</Eyebrow>
      <SectionTitle id="preview-heading" className="mb-9 max-w-[24ch]">
        Three connected views of the same supplier data
      </SectionTitle>

      <Tabs
        items={tabs}
        label="Product previews"
        listClassName="mb-5"
        renderPanel={(active, panel) => (
          <AppFrame title={active.label} meta="Sample data">
            {panel}
          </AppFrame>
        )}
      />
    </Section>
  )
}
