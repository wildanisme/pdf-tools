import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Privacy PDF Tools, a free client-side PDF suite.",
  alternates: { canonical: `${SITE_URL}/terms-of-service` },
  openGraph: {
    title: `Terms of Service | ${SITE_NAME}`,
    description: "Terms and conditions for using Privacy PDF Tools, a free client-side PDF suite.",
    url: `${SITE_URL}/terms-of-service`,
    siteName: SITE_NAME,
  },
};

export default function TermsOfServicePage() {
  return (
    <main className="px-4 py-5 sm:px-6 lg:px-9 lg:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <ScrollText size={24} />
          </div>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">Terms of Service</h1>
        </div>

        <div className="prose prose-slate max-w-none space-y-6 text-base leading-relaxed text-slate-700">
          <p className="font-medium text-slate-600">
            <strong>Effective Date:</strong> July 26, 2026
          </p>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Privacy PDF Tools (&quot;the Service&quot;), you agree to be bound by these
              Terms of Service. If you do not agree, please discontinue use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">2. Description of Service</h2>
            <p>
              Privacy PDF Tools is a free, client-side PDF toolkit. All file processing occurs locally in your
              browser. The Service does not store, access, or transmit your documents or their contents to any
              server. We provide the tools &quot;as is&quot; and &quot;as available&quot; without warranties of
              any kind.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">3. User Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for the files you upload for local processing.</li>
              <li>Do not use the Service to process or handle illegal content.</li>
              <li>Do not attempt to disrupt, overload, or abuse the Service.</li>
              <li>
                While processing happens locally, you are responsible for the output files produced by the
                tools.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">4. Intellectual Property</h2>
            <p>
              The code, design, and content of the Service are the property of the Service owner. You may not
              reproduce, distribute, or create derivative works without permission. Your use of the tools does
              not grant you any ownership rights in the Service itself.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">5. Limitation of Liability</h2>
            <p>
              The Service is provided at no cost and without warranty. To the fullest extent permitted by law, the
              Service owner(s) shall not be liable for any damages arising from the use or inability to use the
              Service, including but not limited to data loss, file corruption, or business interruption —
              even if processing happens locally.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">6. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes take effect upon posting. Continued
              use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-slate-950">7. Contact</h2>
            <p>
              For questions about these terms, reach out via{" "}
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
