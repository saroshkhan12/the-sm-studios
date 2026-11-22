import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellations | THE SM STUDIOS",
  description: "Cancellation information for THE SM STUDIOS Etsy orders.",
};

export default function CancellationsPage() {
  return (
    <article className="policy-page">
      <header className="policy-hero">
        <span className="eyebrow">CUSTOMER INFORMATION</span>
        <h1>Order <em>cancellations.</em></h1>
        <p>Please review your order carefully before completing checkout.</p>
      </header>
      <div className="policy-body">
        <section><h2>Our cancellation policy</h2>
          <p>Our current Etsy shop policy does not accept cancellations. Please check your selected item, format, quantity and delivery details before placing an order.</p>
        </section>
        <section><h2>Need help with an order?</h2>
          <p>If you have a question or believe there is an issue with an order, contact us through Etsy Messages as soon as possible. We will review your message, but a cancellation cannot be guaranteed.</p>
        </section>
        <p className="policy-note">Any rights or remedies that apply under mandatory local consumer law remain unaffected.</p>
      </div>
    </article>
  );
}
