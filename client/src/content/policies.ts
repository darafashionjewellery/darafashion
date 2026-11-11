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
        paragraphs: ['Orders are packed and dispatched within 1–2 business days after the order is confirmed. Orders placed on Sundays or public holidays are processed on the next business day.'],
      },
      {
        heading: 'Delivery time',
        paragraphs: ['Once dispatched, orders are usually delivered within 3–7 business days, depending on your location. Remote areas may take a little longer.'],
      },
      {
        heading: 'Shipping charges',
        paragraphs: ['Shipping charges are shown at checkout before you pay. Standard shipping is free on orders above the minimum order value shown in your bag.'],
      },
      {
        heading: 'Delivery areas',
        paragraphs: ['We currently deliver to serviceable PIN codes across India. We do not ship internationally at this time.'],
      },
      {
        heading: 'Tracking your order',
        paragraphs: ['Once your order ships, you can follow its progress from My Orders in your account. Courier and tracking details are added when available.'],
      },
      {
        heading: 'Delays and failed delivery',
        paragraphs: [
          'Delivery estimates are not guaranteed and may be affected by courier delays, weather or other events outside our control. We will keep you informed if your order is delayed.',
          'Please make sure your address and phone number are correct. If a parcel is returned to us because the address was incorrect or the delivery was refused, re-shipping charges may apply.',
        ],
      },
    ],
  },
  returns: {
    title: 'Return & Refund Policy',
    intro: 'Every DARA piece is checked before it is packed. Because fashion jewellery is worn close to the skin.',
    sections: [
      {
        heading: 'No returns for change of mind',
        paragraphs: ['We do not accept returns or exchanges for reasons such as change of mind, size or colour preference, or if the item has been used or worn.'],
      },
      {
        heading: 'Damaged, defective or wrong items',
        bullets: [
          'Contact us within 8 hours of delivery with your order number.',
          'Share clear photos of the item and packaging, and an unboxing video recorded from opening the sealed parcel. Requests without an unboxing video may not be accepted.',
          'The item must be unused and sent back in its original packaging with all tags.',
        ],
      },
      {
        heading: 'Replacement or refund',
        paragraphs: [
          'Once we verify the issue, we will send a replacement of the same item. If a replacement is not available, we will refund the amount paid for the item.',
          'Refunds for online payments are made to the original payment method within 5–7 business days after approval. For Cash on Delivery orders, refunds are made to your UPI ID or bank account.',
          'For damaged or wrong items, we bear the return shipping cost.',
        ],
      },
      {
        heading: 'Cancellations',
        paragraphs: [
          'Once an order is successfully placed, we are unable to accept cancellation requests. We kindly request customers to review their order details, selected products, and delivery address carefully before confirming their purchase.'
        ],
      },
      {
        heading: 'Contact',
        paragraphs: ['For any return, refund or cancellation request, contact us on WhatsApp at +91 89034 77444 or email dara.fashionjewellery@gmail.com with your order number.'],
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
          'Payment information is processed securely by our payment partner, Razorpay. We do not store your card, UPI or bank details.',
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
        paragraphs: ['We use a secure session cookie to keep you logged in. Your bag and wishlist may be stored in your browser before you log in. We do not use advertising cookies.'],
      },
      {
        heading: 'Sharing',
        paragraphs: ['We never sell your personal information. We share it only with service providers who help us run the store — payment processing (Razorpay), email delivery and courier partners — and only as needed to provide those services, or where required by law.'],
      },
      {
        heading: 'Data retention',
        paragraphs: ['We keep your account and order information while your account is active and for as long as required for accounting, tax and legal purposes.'],
      },
      {
        heading: 'Your choices',
        paragraphs: ['You can update your profile and addresses from your account. To request a copy or deletion of your data, or for any privacy concern, email dara.fashionjewellery@gmail.com and we will respond within 30 days.'],
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    intro: 'By using the DARA Fashions website and placing an order, you agree to these terms.',
    sections: [
      {
        heading: 'Products',
        paragraphs: ['DARA sells fashion (imitation) jewellery and accessories unless a product page states otherwise. We make every effort to display products accurately; colours and finishes may vary slightly due to photography and screen settings.'],
      },
      {
        heading: 'Pricing and payment',
        paragraphs: [
          'All prices are in Indian Rupees (INR). Shipping charges, if any, are shown at checkout. Prices and availability may change without notice.',
          'Online payments are processed securely by Razorpay. An order is confirmed only after the payment is verified (or a Cash on Delivery order is accepted, where offered).',
        ],
      },
      {
        heading: 'Order acceptance and cancellation',
        paragraphs: ['We may cancel an order in case of stock unavailability, pricing errors or suspected fraud. Any amount paid for an order we cancel is refunded in full to the original payment method within 5–7 business days.'],
      },
      {
        heading: 'Shipping, returns and refunds',
        paragraphs: ['Delivery, returns and refunds are governed by our Shipping Policy and Return & Refund Policy, which form part of these terms.'],
      },
      {
        heading: 'Accounts',
        paragraphs: ['You are responsible for keeping your password and email account secure and for all activity under your DARA account.'],
      },
      {
        heading: 'Intellectual property',
        paragraphs: ['All content on this website, including the DARA name, logo, photographs and text, belongs to DARA Fashions and may not be copied without permission.'],
      },
      {
        heading: 'Governing law',
        paragraphs: ['These terms are governed by the laws of India. Any dispute is subject to the jurisdiction of the courts where DARA Fashions’ business address, shown on our Contact page, is located.'],
      },
    ],
  },
}

export const FAQS: { q: string; a: string }[] = [
  { q: 'How do I create an account or log in?', a: 'Choose “Create an account”, enter your name, email and a password, then confirm your email with the 6-digit code we send you. After that, log in any time with your email and password. Forgot it? Use “Forgot password” on the login page to set a new one.' },
  { q: 'How long will delivery take?', a: 'Orders are dispatched within 1–2 business days and usually delivered within 3–7 business days. See our Shipping Policy for details.' },
  { q: 'How can I track my order?', a: 'Log in and open My Orders to see the latest status of your order, including courier and tracking details once it ships.' },
  { q: 'Which payment methods do you accept?', a: 'Online payments are processed securely by our payment partner. Available options are shown at checkout.' },
  { q: 'Can I cancel my order?', a: 'You can cancel an order from My Orders before it is processed. After that, please contact customer support.' },
  { q: 'What is your return policy?', a: 'We do not accept returns for change of mind. If your item arrives damaged, defective or wrong, contact us within 8 hours of delivery with an unboxing video and we will replace or refund it. See our Return & Refund Policy for details.' },
  { q: 'How should I care for my jewellery?', a: 'Store pieces in a dry pouch, avoid contact with water, perfume and lotions, and wipe gently with a soft cloth after use. Product-specific care instructions are shown on each product page.' },
]
