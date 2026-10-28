/**
 * Policy and FAQ copy.
 *
 * IMPORTANT: These are starting templates, not legal advice. Every value in [square brackets]
 * must be confirmed by DARA (and ideally reviewed by a legal advisor) before launch.
 * Contact details are pulled from the site config and are not hard-coded here.
 */

export interface PolicySection {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export interface Policy {
  title: string
  intro: string
  sections: PolicySection[]
}

export const POLICIES: Record<'shipping' | 'returns' | 'privacy' | 'terms', Policy> = {
  shipping: {
    title: 'Shipping Policy',
    intro: 'We want your DARA jewellery to reach you safely and on time. This policy explains how we process and deliver orders.',
    sections: [
      {
        heading: 'Order processing',
        paragraphs: ['Orders are processed within [X] business days after the order is confirmed. Orders placed on Sundays or public holidays are processed on the next business day.'],
      },
      {
        heading: 'Shipping methods and charges',
        paragraphs: ['Available shipping methods, estimated delivery times and charges are shown at checkout before you pay. Free standard shipping may apply above a minimum order value, as shown in your bag.'],
      },
      {
        heading: 'Delivery areas',
        paragraphs: ['We currently deliver within India. [Confirm serviceable areas and any regions with longer delivery times.]'],
      },
      {
        heading: 'Tracking your order',
        paragraphs: ['Once your order ships, you can follow its progress from My Orders in your account. Courier and tracking details are added when available.'],
      },
      {
        heading: 'Delays',
        paragraphs: ['Delivery estimates are not guaranteed and may be affected by courier delays, weather or other events outside our control. We will keep you informed if your order is delayed.'],
      },
    ],
  },
  returns: {
    title: 'Return & Refund Policy',
    intro: 'If something isn’t right with your order, we’re here to help.',
    sections: [
      {
        heading: 'Eligibility',
        bullets: [
          'Return requests must be raised within [X] days of delivery.',
          'Items must be unused, in their original condition and packaging, with all tags attached.',
          '[List any non-returnable items, e.g. earrings for hygiene reasons, customised or sale items.]',
        ],
      },
      {
        heading: 'Damaged or incorrect items',
        paragraphs: ['If you receive a damaged, defective or incorrect item, please contact us within [X] hours of delivery with your order number and photos of the item and packaging.'],
      },
      {
        heading: 'How to request a return',
        paragraphs: ['Contact our customer support team with your order number and the reason for your return. We will share the next steps and, where applicable, pickup details.'],
      },
      {
        heading: 'Refunds',
        paragraphs: [
          'Once the returned item is received and inspected, approved refunds are issued to the original payment method within [X] business days. For Cash on Delivery orders, refunds are made [via bank transfer / store credit].',
          'Shipping charges are [refundable / non-refundable].',
        ],
      },
      {
        heading: 'Cancellations',
        paragraphs: ['Orders can be cancelled from My Orders before they are processed. Once an order has been processed or shipped, please contact customer support.'],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This policy explains what personal information DARA Fashions collects, how we use it and the choices you have.',
    sections: [
      {
        heading: 'Information we collect',
        bullets: [
          'Account details: your email address, name and (optionally) mobile number.',
          'Order details: delivery addresses, items purchased and order history.',
          'Payment information is processed by our payment partner. We do not store your card or bank details.',
          'Basic technical information needed to operate the website securely, such as session cookies.',
        ],
      },
      {
        heading: 'How we use your information',
        bullets: [
          'To create and secure your account, including email verification and password-reset codes. Passwords are stored only in hashed form.',
          'To process, deliver and support your orders.',
          'To send newsletters if you subscribe (you can unsubscribe at any time).',
          'To prevent fraud and keep the website secure.',
        ],
      },
      {
        heading: 'Cookies',
        paragraphs: ['We use a secure session cookie to keep you logged in. Your bag and wishlist may be stored in your browser before you log in.'],
      },
      {
        heading: 'Sharing',
        paragraphs: ['We share information only with service providers who help us run the store — such as payment processing, email delivery and courier partners — and only as needed to provide those services, or where required by law.'],
      },
      {
        heading: 'Your choices',
        paragraphs: ['You can update your profile and addresses from your account. To request access to or deletion of your data, please contact us. [Add data retention period and grievance officer details as required.]'],
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    intro: 'By using the DARA Fashions website and placing an order, you agree to these terms.',
    sections: [
      {
        heading: 'Products',
        paragraphs: ['We make every effort to display products accurately. Colours and finishes may vary slightly due to photography and screen settings.'],
      },
      {
        heading: 'Pricing and payment',
        paragraphs: ['All prices are in Indian Rupees (INR). Prices and availability may change without notice. An order is confirmed only after successful payment verification (or acceptance of a Cash on Delivery order, where offered).'],
      },
      {
        heading: 'Order acceptance',
        paragraphs: ['We reserve the right to cancel an order in case of stock unavailability, pricing errors or suspected fraud. Any amount paid for a cancelled order will be refunded.'],
      },
      {
        heading: 'Accounts',
        paragraphs: ['You are responsible for keeping access to your email account secure, as it is used to log in to your DARA account.'],
      },
      {
        heading: 'Governing law',
        paragraphs: ['These terms are governed by the laws of India. [Add jurisdiction city and business registration details.]'],
      },
    ],
  },
}

export const FAQS: { q: string; a: string }[] = [
  { q: 'How do I create an account or log in?', a: 'Choose “Create an account”, enter your name, email and a password, then confirm your email with the 6-digit code we send you. After that, log in any time with your email and password. Forgot it? Use “Forgot password” on the login page to set a new one.' },
  { q: 'How long will delivery take?', a: 'Delivery estimates for each shipping method are shown at checkout. See our Shipping Policy for details.' },
  { q: 'How can I track my order?', a: 'Log in and open My Orders to see the latest status of your order, including courier and tracking details once it ships.' },
  { q: 'Which payment methods do you accept?', a: 'Online payments are processed securely by our payment partner. Available options are shown at checkout.' },
  { q: 'Can I cancel my order?', a: 'You can cancel an order from My Orders before it is processed. After that, please contact customer support.' },
  { q: 'What is your return policy?', a: 'Please see our Return & Refund Policy for eligibility, timelines and how to request a return.' },
  { q: 'How should I care for my jewellery?', a: 'Store pieces in a dry pouch, avoid contact with water, perfume and lotions, and wipe gently with a soft cloth after use. Product-specific care instructions are shown on each product page.' },
]
