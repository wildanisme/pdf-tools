import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Privacy PDF Tools handles your data. Your files are processed entirely in your browser — nothing is ever uploaded.",
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
  openGraph: {
    title: `Privacy Policy | ${SITE_NAME}`,
    description: "Learn how Privacy PDF Tools handles your data. Your files are processed entirely in your browser — nothing is ever uploaded.",
    url: `${SITE_URL}/privacy-policy`,
    siteName: SITE_NAME,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="px-4 py-5 sm:px-6 lg:px-9 lg:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <Shield size={24} />
          </div>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">Privacy Policy</h1>
        </div>

        <div className="prose prose-slate max-w-none space-y-6 text-base leading-relaxed text-slate-700">
          <p className="font-medium text-slate-600">
            <strong>Effective Date:</strong> July 26, 2026
          </p>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">1. Your Files Stay on Your Device</h2>
            <p>
              The core principle of Privacy PDF Tools is simple: <strong>your files are never uploaded to any server</strong>.
              All PDF processing — merging, compressing, signing, converting, and every other operation — happens
              entirely inside your browser using client-side JavaScript. At no point are your documents transmitted,
              stored, or accessible by us or any third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">2. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Analytics:</strong> We use Google Analytics 4 to understand how visitors use the site — pages
                visited, time spent, browser type, and approximate location (country/city level). No personally
                identifiable information (PII) is collected through analytics.
              </li>
              <li>
                <strong>Local Storage:</strong> If you use the Local History feature, processed file metadata and
                thumbnails are stored in your browser&apos;s IndexedDB. This data never leaves your device, can be
                cleared from browser settings at any time, and is not accessible by us.
              </li>
              <li>
                <strong>Logs:</strong> Standard server logs (request path, timestamp, IP address) may be recorded
                by the hosting provider for operational purposes. These logs are not used for tracking.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">3. Cookies</h2>
            <p>
              Google Analytics sets cookies to distinguish users and measure site usage. These are first-party
              analytics cookies and do not track you across other websites. You can disable cookies in your
              browser settings, though some functionality may be affected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">4. Third-Party Services</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Google Analytics:</strong> Used for site usage measurement. Google&apos;s privacy policy
                applies to their data processing. You can opt out via Google&apos;s
                opt-out browser add-on at{" "}
                <a href="https://tools.google.com/dlpage/gaoptout" className="text-emerald-600 underline">
                  tools.google.com/dlpage/gaoptout
                </a>.
              </li>
              <li>
                <strong>Hosting:</strong> The site is hosted on a cloud infrastructure provider. Server access logs
                may be retained by the provider for performance and security purposes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">5. Changes to This Policy</h2>
            <p>
              We may update this policy periodically. The &quot;Effective Date&quot; at the top indicates when the
              latest changes took effect. Continued use of the site after changes constitutes acceptance of the
              updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">6. Contact</h2>
            <p>
              For questions about this privacy policy, reach out via{" "}
              <a href="https://wildanisme.com" className="text-emerald-600 underline">
                wildanisme.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
