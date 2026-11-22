import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | THE SM STUDIOS",
  description: "Answers about ordering, shipping, digital downloads and returns at THE SM STUDIOS.",
};

const questions = [
  ["Where do I place an order?", "Our product pages link to the corresponding Etsy listing. Orders and payments are completed securely on Etsy, not on this website."],
  ["How can I check delivery times?", "Open the Etsy listing for the item you want. Processing and estimated arrival information can vary by product and destination and is shown with the listing."],
  ["Do you sell physical and digital products?", "Yes. We offer physical artwork and apparel as well as selected digital downloads. The product listing identifies the item type."],
  ["When will my digital download be available?", "Digital downloads are made available through Etsy once payment is confirmed. Check your Etsy purchases and the listing's download information."],
  ["Can I return or exchange an item?", "Eligibility depends on the individual Etsy listing. Please read its return and exchange details before ordering. If there is a problem with an order, contact us through Etsy Messages."],
  ["Can I cancel an order?", "Our published Etsy shop policy currently does not accept cancellations. Please check your order carefully before checkout and message us promptly if you have a concern."],
  ["Will I need to pay customs or import charges?", "Depending on the destination, charges may apply. Check the listing and contact us before purchase if you need clarification. Customs processing can also affect delivery timing."],
  ["How do I get help with an existing order?", "Please contact us through Etsy Messages and include the order details. This helps us locate your purchase and assist you."],
];

export default function FAQPage() {
  return (
    <article className="policy-page faq-page">
      <header className="policy-hero">
        <span className="eyebrow">A LITTLE HELP</span>
        <h1>Frequently asked <em>questions.</em></h1>
        <p>Helpful answers about finding, ordering and receiving your artwork.</p>
      </header>
      <div className="policy-body faq-list">
        {questions.map(([question, answer]) => (
          <details className="faq-item" key={question}>
            <summary>{question}<span aria-hidden="true">+</span></summary>
            <p>{answer}</p>
          </details>
        ))}
        <section className="faq-contact">
          <h2>Still have a question?</h2>
          <p>We're happy to help. Send us a message and we'll get back to you.</p>
          <Link className="btn btn-dark" href="/contact">CONTACT THE STUDIO</Link>
        </section>
      </div>
    </article>
  );
}
