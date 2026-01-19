import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - ちょいAI / Shopify Apps",
  description:
    "Privacy Policy for ちょいAI services and Shopify applications including StoreCheck AI, HeatMap AI, ABTest AI Pro, and Bundle Inventory Sync.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm mb-8 inline-block"
        >
          &larr; Back to Home
        </Link>

        <article className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-500 mb-8">Last Updated: January 19, 2026</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                This Privacy Policy applies to all services and applications
                provided by{" "}
                <strong>
                  カタカナ事務所 (Katakana Office, hereinafter &quot;we&quot;,
                  &quot;our&quot;, or &quot;us&quot;)
                </strong>
                , including but not limited to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-1 text-gray-700">
                <li>ちょいAI (ChoiAI) web services</li>
                <li>StoreCheck AI (Shopify App)</li>
                <li>HeatMap AI (Shopify App)</li>
                <li>ABTest AI Pro (Shopify App)</li>
                <li>Bundle Inventory Sync (Shopify App)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                We are committed to protecting your privacy and ensuring
                transparency about how we collect, use, and safeguard your
                information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Information We Collect
              </h2>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
                Store Information (Shopify Apps)
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>
                  <strong>Shop Domain</strong>: Your Shopify store URL (e.g.,
                  yourstore.myshopify.com)
                </li>
                <li>
                  <strong>Store Content</strong>: Publicly visible content for
                  analysis (if applicable)
                </li>
                <li>
                  <strong>Product/Inventory Data</strong>: For inventory
                  management apps only
                </li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
                Usage Data
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Feature usage statistics</li>
                <li>Subscription plan information</li>
                <li>Error logs for debugging purposes</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
                What We Do NOT Collect
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>
                  Customer personal information (names, emails, addresses)
                </li>
                <li>Payment or financial data (credit cards, bank accounts)</li>
                <li>Order history or transaction details</li>
                <li>Customer browsing behavior or cookies from your customers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                How We Use Your Information
              </h2>
              <p className="text-gray-700 mb-3">
                We use the collected information to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Provide and improve our services</li>
                <li>Track usage against subscription plan limits</li>
                <li>Communicate important service updates</li>
                <li>Debug and fix technical issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Data Storage and Security
              </h2>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>
                  All data is stored securely using industry-standard encryption
                </li>
                <li>We use Shopify&apos;s secure OAuth authentication</li>
                <li>
                  Data is hosted on secure cloud infrastructure (Railway, Vercel,
                  Supabase)
                </li>
                <li>We do not sell or share your data with third parties</li>
                <li>
                  Access to data is restricted to authorized personnel only
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Data Retention
              </h2>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>
                  <strong>Active accounts</strong>: Data retained while
                  subscription is active
                </li>
                <li>
                  <strong>Account deletion</strong>: All data deleted within 48
                  hours of app uninstallation
                </li>
                <li>
                  <strong>GDPR compliance</strong>: Data deletion available upon
                  request
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Third-Party Services
              </h2>
              <p className="text-gray-700 mb-3">
                Our services may use the following third-party services:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>
                  <strong>Shopify</strong>: For authentication and billing
                </li>
                <li>
                  <strong>AI Analysis APIs</strong>: For generating insights (no
                  personal data shared)
                </li>
                <li>
                  <strong>Analytics</strong>: Google Analytics for service
                  improvement
                </li>
                <li>
                  <strong>Cloud Hosting</strong>: Railway, Vercel, Supabase
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Your Rights
              </h2>
              <p className="text-gray-700 mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Access your stored data</li>
                <li>Request data correction</li>
                <li>Request data deletion</li>
                <li>Export your data</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                GDPR Compliance
              </h2>
              <p className="text-gray-700 mb-3">
                For EU users, we comply with GDPR requirements:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>
                  <strong>Data Controller</strong>: カタカナ事務所 (Katakana
                  Office)
                </li>
                <li>
                  <strong>Data Processing</strong>: Service provision and
                  improvement only
                </li>
                <li>
                  <strong>Data Portability</strong>: Available upon request
                </li>
                <li>
                  <strong>Right to Erasure</strong>: Automatic upon
                  uninstallation or upon request
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Contact Us
              </h2>
              <p className="text-gray-700">
                For privacy-related questions or data requests, please contact
                us:
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Email</strong>:{" "}
                <a
                  href="mailto:support@choiai.jp"
                  className="text-blue-600 hover:underline"
                >
                  support@choiai.jp
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Changes to This Policy
              </h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the &quot;Last Updated&quot; date.
              </p>
            </section>
          </div>

          <hr className="my-8 border-gray-200" />

          <p className="text-sm text-gray-500 text-center">
            This Privacy Policy is provided by カタカナ事務所 (Katakana Office)
          </p>
        </article>
      </div>
    </main>
  );
}
