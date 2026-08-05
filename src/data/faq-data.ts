/** Approved FAQ content. Use verbatim — see README "Copy rules" before editing. */

export interface FaqItem {
  q: string
  a: string
}

export const faqs: FaqItem[] = [
  {
    q: 'Is Skumetra an Amazon repricer?',
    a: 'No. Skumetra compares supplier cost and inventory with your Amazon listing data to identify unsafe prices, stockouts, and margin risks. It does not chase competitor prices.',
  },
  {
    q: 'Does Skumetra automatically change my Amazon listings?',
    a: 'Not in the MVP. Skumetra recommends actions; you make and confirm the changes.',
  },
  {
    q: 'Do I need to connect my Amazon account?',
    a: 'No. The initial pilot uses an Amazon Active Listings file plus supplier CSV or Excel data.',
  },
  {
    q: 'Does Skumetra need customer-order information?',
    a: 'No. The initial MVP does not process customer orders or customer personal information.',
  },
  {
    q: 'Can Skumetra find suppliers?',
    a: 'Supplier discovery is not included in the first MVP.',
  },
  {
    q: 'Which sellers are eligible for the pilot?',
    a: 'Active Amazon US sellers with live listings, at least one supplier, and usable supplier inventory or pricing data.',
  },
  {
    q: 'How many products can I monitor?',
    a: 'The Founding Seller Pilot supports up to 100 matched SKUs.',
  },
  {
    q: 'Does Skumetra use AI?',
    a: 'AI may assist with column mapping, product matching, and explanations. Financial calculations and alert rules remain deterministic.',
  },
  {
    q: 'What file formats are supported?',
    a: 'The pilot is intended to support CSV and common Excel formats.',
  },
  {
    q: 'What happens after the 30-day pilot?',
    a: 'Qualified pilot participants may be invited to continue on an early subscription plan. Final pricing will depend on pilot findings.',
  },
]
