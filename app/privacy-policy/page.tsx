import type { Metadata } from 'next';
import { LegalDocument } from '@/components/LegalDocument';

export const metadata: Metadata = {
  title: 'Privacy Policy | TradeVision AI',
  description: 'Read how TradeVision AI collects, uses, stores, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This Privacy Policy explains how TradeVision AI collects, uses, discloses, and protects personal information when you access our website, create an account, purchase a subscription, or use our AI-powered chart analysis services."
      effectiveDate="March 22, 2026"
      sections={[
        {
          title: 'Information We Collect',
          content: (
            <>
              <p>We may collect account details such as your name, email address, billing information, and subscription status. We also collect service usage data, including uploaded chart images, analysis requests, support messages, device information, IP address, and log data necessary to operate and secure the platform.</p>
              <p>Payment transactions are processed through third-party payment providers. TradeVision AI does not intentionally store full card credentials on its own servers unless explicitly provided by an authorized payment processor as part of a billing record.</p>
            </>
          ),
        },
        {
          title: 'How We Use Information',
          content: (
            <>
              <p>We use information to deliver chart analysis, manage subscriptions, process payments, provide customer support, improve service quality, detect fraud or abuse, enforce account and usage limits, and communicate service-related notices.</p>
              <p>We may also use aggregated and non-identifiable information for analytics, operational reporting, capacity planning, and product improvement.</p>
            </>
          ),
        },
        {
          title: 'Data Sharing and Service Providers',
          content: (
            <>
              <p>We may share information with infrastructure, analytics, payment, authentication, storage, email, and AI service providers strictly as needed to deliver the service. These providers are expected to handle data under contractual, technical, or operational safeguards appropriate to their role.</p>
              <p>We may disclose information where required by law, regulation, court order, government request, or to protect the rights, safety, or integrity of TradeVision AI, its users, or the public.</p>
            </>
          ),
        },
        {
          title: 'Retention and Security',
          content: (
            <>
              <p>We retain personal information only for as long as reasonably necessary to provide services, maintain required records, resolve disputes, enforce agreements, and satisfy legal or compliance obligations. Retention periods may differ depending on the type of information and the purpose for which it was collected.</p>
              <p>We use reasonable administrative, technical, and organizational safeguards to protect data. However, no online platform or transmission method can be guaranteed to be completely secure, and users should take appropriate precautions with their credentials and uploaded content.</p>
            </>
          ),
        },
        {
          title: 'Your Rights and Contact',
          content: (
            <>
              <p>Depending on your location, you may have rights to access, correct, update, delete, or restrict certain uses of your personal information. You may also have the right to object to some processing activities or request a copy of the data associated with your account.</p>
              <p>To make a privacy-related request or ask questions about this Privacy Policy, contact TradeVision AI support through the support channels made available inside the platform.</p>
            </>
          ),
        },
      ]}
    />
  );
}