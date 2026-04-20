export const dynamic = 'force-static'

export default function TermsPage() {
  return (
    <div className="app-container px-6 py-8">
      <h1 className="font-serif text-2xl text-navy-500 mb-2">Terms & Conditions</h1>
      <p className="text-xs text-smoke-500 mb-8">Last updated: {new Date().toLocaleDateString('en-GB')}</p>

      <div className="space-y-5 text-sm text-navy-500 leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-2">1. Acceptance</h2>
          <p>
            By creating an account or using Occasions, you agree to these Terms & Conditions. If you don't agree,
            please don't use the service.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">2. The service</h2>
          <p>
            Occasions is a private event media collection platform. You can create events, invite guests to upload
            photos and videos, and generate AI-powered highlight videos.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">3. Account types</h2>
          <p className="mb-2">Two types of accounts:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Host:</strong> Creates an event for their own occasion (wedding, birthday, etc.)</li>
            <li><strong>Event Manager:</strong> Creates events on behalf of clients and hands them off</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">4. Pricing</h2>
          <p>
            Creating an event costs 39.99 SAR per event. Event Managers may buy credits in bulk and resell events
            to their own clients at any price they choose. Guests upload for free.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">5. Event Manager handoff</h2>
          <p>
            When an Event Manager creates an event, they receive a one-time claim link to give to their client. Once
            claimed by the client, the Manager can no longer see any photos, videos, or guest details — only the
            event name, date, and guest count for their records.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">6. Your content</h2>
          <p>
            You retain all rights to photos and videos you upload. We never claim ownership. You grant us a limited
            license to store, process, and display your content only for the purpose of providing the service.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">7. Acceptable use</h2>
          <p className="mb-2">You agree not to upload content that is:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Illegal under Saudi Arabian law</li>
            <li>Sexually explicit</li>
            <li>Violent, threatening, or harassing</li>
            <li>Infringing on someone else's copyright or privacy</li>
            <li>Malicious software or viruses</li>
          </ul>
          <p className="mt-2">
            We reserve the right to remove content and terminate accounts that violate these rules.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">8. Guest privacy</h2>
          <p>
            Each guest only sees their own uploads, never another guest's. This is enforced at the database level.
            Only the event host sees all media.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">9. Refunds</h2>
          <p>
            Event credits are non-refundable once an event has been created. If you experience a technical issue
            that prevents you from using your event, contact support within 7 days for a credit refund.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">10. Account termination</h2>
          <p>
            You may delete your account at any time from settings. Upon deletion, all your events, photos, and videos
            are permanently removed within 30 days.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">11. Liability</h2>
          <p>
            Occasions is provided "as is." We're not liable for lost photos due to device issues on your side,
            guest errors, or force majeure. Always back up important memories to your own device too.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">12. Governing law</h2>
          <p>
            These terms are governed by the laws of the Kingdom of Saudi Arabia. Any disputes will be resolved
            in Saudi courts.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">13. Changes</h2>
          <p>
            We may update these terms. We'll notify you of material changes by email.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">14. Contact</h2>
          <p>
            Questions? Email <a href="mailto:support@occasions.app" className="text-brand-500 underline">support@occasions.app</a>
          </p>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-smoke-100 text-center">
        <a href="/dashboard" className="text-sm text-brand-500 font-medium">Back to app</a>
      </div>
    </div>
  )
}
