export const dynamic = 'force-static'

export default function PrivacyPage() {
  return (
    <div className="app-container px-6 py-8">
      <h1 className="font-serif text-2xl text-navy-500 mb-2">Privacy Policy</h1>
      <p className="text-xs text-smoke-500 mb-8">Last updated: {new Date().toLocaleDateString('en-GB')}</p>

      <div className="space-y-5 text-sm text-navy-500 leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-2">1. Who we are</h2>
          <p>
            Occasions is a private event memory platform operated in the Kingdom of Saudi Arabia. This Privacy Policy
            explains how we collect, use, store, and protect your personal data, in compliance with the Saudi Personal
            Data Protection Law (PDPL).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">2. What we collect</h2>
          <p className="mb-2">When you use Occasions, we collect:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account information (name, email, profile image)</li>
            <li>Event details you create (event name, date, location)</li>
            <li>Photos and videos you or your guests upload</li>
            <li>Device and usage information (for security and improvements)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">3. How we use your data</h2>
          <p className="mb-2">We use your data only to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide the service you signed up for</li>
            <li>Store and display your event media privately to you</li>
            <li>Generate AI-powered highlight videos from your media</li>
            <li>Keep your account secure</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">4. Who can see your photos</h2>
          <p>
            Only you (the event host) can see all photos and videos in your event. Guests who upload through your
            album link can only see their own uploads, never anyone else's. Event managers who created an event for
            you cannot see any photos or videos — ever. Our privacy controls are enforced at the database level, not
            just by the app.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">5. We do not sell your data</h2>
          <p>
            We never sell, rent, or share your personal data with advertisers or third parties for marketing purposes.
            Your photos stay yours.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">6. Data storage</h2>
          <p>
            Your data is stored securely using industry-standard encryption. We use Supabase (a secure cloud database
            provider) for storage. Media files are encrypted in transit (HTTPS) and at rest.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">7. Your rights under Saudi PDPL</h2>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and all associated data at any time</li>
            <li>Withdraw consent for specific data processing</li>
            <li>File a complaint with the Saudi Data & AI Authority (SDAIA)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">8. Data retention</h2>
          <p>
            We keep your event data as long as your account is active. When you delete your account, all events,
            photos, and videos are permanently deleted within 30 days. Guests who uploaded media to your event will
            also lose access to their uploads.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">9. AI processing</h2>
          <p>
            We use AI (Anthropic's Claude) to automatically tag and organize your photos and generate captions. Media
            is only sent to the AI for tagging purposes — the AI provider does not retain your images or use them to
            train models.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">10. Children</h2>
          <p>
            Occasions is not intended for children under 16. We do not knowingly collect data from anyone under 16.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">11. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we will notify you by
            email.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">12. Contact us</h2>
          <p>
            Questions about privacy? Email us at <a href="mailto:privacy@occasions.app" className="text-brand-500 underline">privacy@occasions.app</a>
          </p>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-smoke-100 text-center">
        <a href="/dashboard" className="text-sm text-brand-500 font-medium">Back to app</a>
      </div>
    </div>
  )
}
