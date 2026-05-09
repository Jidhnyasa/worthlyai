import Navbar from "@/components/Navbar";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "hsl(38 25% 97%)" }}>
      <Navbar />
      <div className="max-w-[680px] mx-auto px-5 sm:px-8 py-16">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Privacy Policy — Worthly AI</h1>
        <p className="text-sm text-stone-400 mb-10">Last updated: May 9, 2026</p>

        <section>
          <h2 className="text-base font-semibold text-stone-900 mt-8 mb-3">What we collect</h2>
          <p className="text-sm text-stone-600 leading-relaxed mb-3">
            When you use the Worthly AI Chrome extension or web app, we collect:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-stone-600">
            <li>The URLs of product pages you submit for analysis</li>
            <li>Your answers to optional preference questions (budget range, shopping intent, need level, and priorities)</li>
            <li>Your email address if you sign up or join the waitlist</li>
          </ul>
          <p className="text-sm text-stone-600 leading-relaxed mt-3">
            We do not collect your browsing history, financial information, passwords, or any data from pages you visit without explicitly submitting them to Worthly AI.
          </p>
        </section>

        <hr className="border-stone-200 mt-8" />

        <section>
          <h2 className="text-base font-semibold text-stone-900 mt-8 mb-3">How we use it</h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            We use product URLs to generate AI-powered purchase verdicts. We use your preference answers to personalize those verdicts. We use your email to send product updates if you opt in.
          </p>
          <p className="text-sm text-stone-600 leading-relaxed mt-3">
            We do not sell your data. We do not share your data with advertisers. We do not use your data to build advertising profiles.
          </p>
        </section>

        <hr className="border-stone-200 mt-8" />

        <section>
          <h2 className="text-base font-semibold text-stone-900 mt-8 mb-3">The Chrome extension</h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            The Worthly AI Chrome extension activates only on Amazon product pages (URLs matching amazon.com/dp/). When you click the Worthly badge, the extension sends the current product page URL to our servers to generate a verdict. The extension does not read, collect, or transmit any other page content, browsing history, or personal information.
          </p>
        </section>

        <hr className="border-stone-200 mt-8" />

        <section>
          <h2 className="text-base font-semibold text-stone-900 mt-8 mb-3">Data storage</h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Verdicts and preference answers are stored securely on our servers (Supabase, hosted on AWS). We retain this data to improve verdict quality. You can request deletion of your data by emailing us.
          </p>
        </section>

        <hr className="border-stone-200 mt-8" />

        <section>
          <h2 className="text-base font-semibold text-stone-900 mt-8 mb-3">Third-party services</h2>
          <p className="text-sm text-stone-600 leading-relaxed mb-3">
            We use the following third-party services:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-stone-600">
            <li>Google Gemini API — for AI verdict generation</li>
            <li>Supabase — for database and authentication</li>
            <li>Render — for backend hosting</li>
            <li>Vercel — for frontend hosting</li>
            <li>ScrapingBee — for product page data retrieval</li>
          </ul>
        </section>

        <hr className="border-stone-200 mt-8" />

        <section>
          <h2 className="text-base font-semibold text-stone-900 mt-8 mb-3">Contact</h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            For privacy questions or data deletion requests, email:{" "}
            <a href="mailto:mjidhnyasa@gmail.com" className="text-amber-600 hover:underline">
              mjidhnyasa@gmail.com
            </a>
          </p>
          <p className="text-sm text-stone-600 leading-relaxed mt-3">
            Worthly AI is operated by Jidhnyasa Mahajan.
          </p>
        </section>
      </div>
    </div>
  );
}
