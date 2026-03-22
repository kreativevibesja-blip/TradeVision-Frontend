import type { Metadata } from 'next';
import { LegalDocument } from '@/components/LegalDocument';

export const metadata: Metadata = {
  title: 'Terms of Service | TradeVision AI',
  description: 'Read the terms governing access to and use of TradeVision AI services.',
};

export default function TermsOfServicePage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Terms of Service"
      intro="These Terms of Service govern your access to and use of TradeVision AI, including the website, dashboard, subscriptions, support channels, and AI-generated chart analysis features. By using the service, you agree to these terms."
      effectiveDate="March 22, 2026"
      sections={[
        {
          title: 'Eligibility and Accounts',
          content: (
            <>
              <p>You are responsible for ensuring that your use of TradeVision AI is lawful in your jurisdiction. You must provide accurate account information and keep your login credentials secure. You are responsible for activity that occurs through your account unless caused directly by our own breach of security obligations.</p>
              <p>We may suspend, restrict, or terminate access where we reasonably believe an account is being used fraudulently, abusively, unlawfully, or in violation of these terms.</p>
            </>
          ),
        },
        {
          title: 'Service Scope',
          content: (
            <>
              <p>TradeVision AI provides AI-assisted chart interpretation tools and related subscription features. The platform is intended to support research and workflow efficiency. It does not guarantee outcomes, profitability, market accuracy, uninterrupted availability, or suitability for any specific trading decision or business use case.</p>
              <p>We may change, improve, limit, or discontinue any feature, model, integration, usage threshold, or pricing element where reasonably necessary for security, legal compliance, performance, or operational reasons.</p>
            </>
          ),
        },
        {
          title: 'Subscriptions, Billing, and Usage Limits',
          content: (
            <>
              <p>Paid plans renew or remain active in accordance with the billing flow presented at checkout, subject to plan availability, pricing, and successful payment authorization. You authorize TradeVision AI and its payment providers to process charges associated with your selected plan.</p>
              <p>Plans may include analysis caps, fair-use thresholds, or feature gating. Usage limits form part of the service terms and may be enforced automatically. Abuse, automated misuse, reselling, or attempts to circumvent limits may result in suspension or termination.</p>
            </>
          ),
        },
        {
          title: 'Acceptable Use',
          content: (
            <>
              <p>You may not use the platform to violate laws, infringe intellectual property rights, interfere with system integrity, reverse engineer restricted service components, bypass account or payment controls, scrape protected data, or upload malicious or harmful content.</p>
              <p>You remain responsible for the legality and appropriateness of any content you upload, including chart images, messages, and support submissions.</p>
            </>
          ),
        },
        {
          title: 'Disclaimers and Liability',
          content: (
            <>
              <p>The service is provided on an as-available and as-is basis to the fullest extent permitted by law. TradeVision AI disclaims warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted or error-free operation unless such disclaimers are prohibited by applicable law.</p>
              <p>To the maximum extent permitted by law, TradeVision AI will not be liable for indirect, incidental, consequential, special, exemplary, or lost-profit damages arising from or related to the use of the service. Total liability for claims relating to the service will be limited to the amount paid by you for the applicable service period giving rise to the claim.</p>
            </>
          ),
        },
      ]}
    />
  );
}