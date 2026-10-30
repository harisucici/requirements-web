import type { LegalPage } from '../../../types/api'

const PAGES: Record<string, LegalPage> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    updated_at: '2026-01-15T00:00:00.000Z',
    sections: [
      { heading: '1. Information We Collect', body: 'We collect information you provide directly, including your email address, request descriptions, and any files you upload as attachments. When you submit a request, we automatically create or update your account record using the email you provide.\n\nWe also collect usage data such as page views, browser type, and interaction patterns to improve our service. Payment information is handled exclusively by our third-party payment processor (Stripe); we never store card numbers, CVV codes, or expiration dates on our servers.' },
      { heading: '2. How We Use Your Information', body: 'Your information is used to:\n• Process and fulfill your tool requests\n• Communicate with you about request status, pricing, and delivery\n• Send transactional emails (confirmations, status updates, delivery notifications)\n• Improve our service quality and response times\n• Detect and prevent duplicate or abusive submissions\n\nWe do not sell, rent, or share your personal data with third parties for marketing purposes.' },
      { heading: '3. Token-Based Tracking', body: 'Each request is assigned a unique, high-entropy tracking token that allows you to view your request status without creating an account. This token is a 64-character random string that cannot be guessed or enumerated.\n\nTracking tokens remain active until 30 days after your request reaches a terminal state (completed, rejected, or canceled). After expiration, the token is revoked and the tracking link will no longer work.' },
      { heading: '4. Data Retention', body: '• Request data: retained long-term in anonymized form for service improvement\n• Email records: retained for 2 years for support and compliance\n• Attachments: automatically deleted 30 days after your request reaches a terminal state\n• Payment records: retained for 7 years as required by tax regulations\n• Audit logs: retained indefinitely for security and compliance' },
      { heading: '5. Your Rights Under GDPR', body: 'You have the right to:\n• Access: Request a copy of all personal data we hold about you\n• Rectification: Correct inaccurate personal data\n• Erasure: Request deletion of your personal data (executed within 30 days)\n• Portability: Export your data in a machine-readable format (JSON/CSV)\n• Restriction: Request limited processing of your data\n• Objection: Object to processing based on legitimate interests\n\nTo exercise these rights, use the "Export my data" and "Delete my data" options in your account settings, or contact us at privacy@requestroom.com.' },
      { heading: '6. Cookies and Tracking Technologies', body: 'We use essential cookies for session management and security. With your consent, we may also use analytics cookies to understand usage patterns and marketing cookies for targeted communications. You can manage your cookie preferences at any time through the cookie consent banner or your account settings. Preferences are stored for 1 year.' },
      { heading: '7. Security Measures', body: 'We implement industry-standard security measures including HTTPS encryption, secure cookie attributes (HttpOnly, SameSite), input validation, and rate limiting. All data transfers are encrypted in transit. Our systems undergo regular security reviews.' },
      { heading: '8. Contact Us', body: 'For privacy-related inquiries:\n• Email: privacy@requestroom.com\n• Response time: within 24 business hours\n• Data Protection Officer: dpo@requestroom.com' },
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    updated_at: '2026-01-15T00:00:00.000Z',
    sections: [
      { heading: '1. Service Description', body: 'request/room is a service that converts written tool descriptions into functional front-end web tools. We specialize in small, focused utilities such as data converters, calculators, text processors, and creative tools. Our service is limited to front-end (client-side) tools; we do not build backend systems, databases, mobile apps, or tools requiring server-side infrastructure.' },
      { heading: '2. Request Submission and Acceptance', body: 'When you submit a request, you provide a description of the tool you need along with your contact email. Our team reviews every request and may accept, reject, or ask for clarification. Acceptance is at our sole discretion based on feasibility, scope, and alignment with our service capabilities.\n\nA submitted request does not constitute a binding agreement. A binding agreement is formed only when we accept your request and you complete payment.' },
      { heading: '3. Pricing and Payment', body: 'Prices are quoted after review based on estimated development time and complexity. All prices are fixed and quoted in USD. Payment is processed through our secure third-party payment processor (Stripe). We do not store any payment card information.\n\nPayment must be completed within 7 days of approval. Unpaid requests are automatically canceled after this period. Prices are inclusive of the specified scope; changes to scope after acceptance may require additional payment.' },
      { heading: '4. Delivery and Revisions', body: 'We aim to deliver tools within the estimated timeframe quoted at approval. Delivery times are estimates, not guarantees, though we commit to communicating any delays promptly.\n\nEach request includes free revisions based on the price tier:\n• Under $20: 1 free revision\n• $20-$50: 2 free revisions\n• Over $50: 3 free revisions\n\nRevisions are limited to adjustments within the original request scope. Major changes or scope increases are treated as new requests. Additional revisions beyond the free allocation are charged at $5 each.' },
      { heading: '5. Cancellation and Refunds', body: 'You may cancel your request at any time before development begins. Refund eligibility depends on the request status:\n• Before payment: No refund (no payment made)\n• After payment, before development: Full refund minus processing fee (2.9% + $0.30)\n• During development: Partial refund based on work completed, subject to review\n• After delivery: Refund request subject to review under our quality guarantee\n\nRefund processing takes 3-5 business days after approval.' },
      { heading: '6. Intellectual Property', body: 'Upon delivery and full payment, you receive a perpetual, non-exclusive license to use the delivered tool for its intended purpose. We retain ownership of the source code and the right to reuse general techniques, patterns, and components in other projects. Any open-source components included in your tool remain under their original licenses.' },
      { heading: '7. Limitation of Liability', body: 'Our tools are provided as-is for general productivity use. We do not guarantee that tools will be error-free or suitable for mission-critical applications. Our total liability is limited to the amount you paid for the specific request in question. We are not liable for indirect, incidental, or consequential damages.' },
      { heading: '8. Modifications to These Terms', body: 'We may update these terms from time to time. Material changes will be communicated via email or a prominent notice on our website. Continued use of the service after changes constitutes acceptance of the updated terms.' },
    ],
  },
  cookies: {
    slug: 'cookies',
    title: 'Cookie Policy',
    updated_at: '2026-01-15T00:00:00.000Z',
    sections: [
      { heading: '1. What Are Cookies', body: 'Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, maintain sessions, and understand how the site is used. We use cookies and similar technologies (local storage, session storage) to provide and improve our service.' },
      { heading: '2. Essential Cookies (Always Active)', body: 'These cookies are necessary for the service to function and cannot be disabled:\n\n• rm_session: Maintains your team workspace login session (8-hour expiry)\n• rm_user_session: Maintains your user account session (30-day expiry)\n• rm_cookie_consent_v1: Stores your cookie category preferences (1-year expiry)\n• rm_draft_v1: Saves your in-progress request form as a draft (local storage)\n\nThese cookies do not track you across websites and contain no marketing identifiers.' },
      { heading: '3. Analytics Cookies (Optional)', body: 'With your consent, we use analytics cookies to understand how visitors interact with our service:\n\n• Page views and navigation patterns\n• Form completion rates and drop-off points\n• Performance metrics (page load times, error rates)\n\nThis data helps us improve the service. Analytics cookies are set only after you opt in through the cookie consent banner. You can withdraw consent at any time.' },
      { heading: '4. Marketing Cookies (Optional)', body: 'With your consent, marketing cookies enable:\n\n• Personalized follow-up emails based on your request history\n• Referral and loyalty discount programs\n• Relevant product recommendations\n\nMarketing emails always include an unsubscribe link. Marketing cookies are set only after explicit opt-in and expire after 1 year.' },
      { heading: '5. Managing Your Preferences', body: 'You can manage your cookie preferences at any time:\n\n• Cookie consent banner: Click "Manage preferences" to update your choices\n• Browser settings: Most browsers allow you to block or delete cookies\n• Account settings: Sign in to update your communication preferences\n\nNote: Blocking essential cookies may prevent you from using certain features of the service.' },
      { heading: '6. Third-Party Cookies', body: 'Our payment processor (Stripe) sets its own cookies during the checkout process for fraud prevention and payment security. These cookies are governed by Stripe\'s privacy policy and are essential for processing payments. We do not control these cookies and they are not used for marketing purposes.' },
    ],
  },
}

export default defineEventHandler(async (event) => {
  await applyLatency()
  checkFault(event)
  const page = getRouterParam(event, 'page') ?? ''
  const data = PAGES[page]
  if (!data) throw createError({ statusCode: 404, statusMessage: 'NOT_FOUND', data: errorBody('NOT_FOUND', `Legal page "${page}" not found.`) })
  return envelope(data)
})
