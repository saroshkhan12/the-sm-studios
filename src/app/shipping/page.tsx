import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & Delivery | THE SM STUDIOS",
  description: "Shipping and delivery information for THE SM STUDIOS orders.",
};

export default function ShippingPage() {
  return (
    <article className="policy-page">
      <header className="policy-hero">
        <span className="eyebrow">CUSTOMER INFORMATION</span>
        <h1>Shipping <em>&amp; delivery.</em></h1>
        <p>Clear delivery information, from checkout to your doorstep.</p>
      </header>
      <div className="policy-body">
        <section><h2>Physical artwork &amp; apparel</h2>
          <p>Shipping availability, processing information and estimated arrival dates can vary by item and destination. Please check the delivery estimate and item details on the relevant Etsy listing before placing your order.</p>
          <p>Our physical products are fulfilled with the help of a production partner. Once your order is placed, Etsy provides the order details and any available delivery updates.</p>
        </section>
        <section><h2>Digital downloads</h2>
          <p>Digital items are delivered through Etsy. Your download becomes available once payment is confirmed. No physical package will be shipped for a digital item.</p>
        </section>
        <section><h2>Customs &amp; import charges</h2>
          <p>Depending on your delivery country, customs duties, import taxes or other charges may apply. For orders outside the United States, please check the Etsy listing and contact us before purchase if you need clarification about possible charges.</p>
          <p>Customs processing may also affect delivery timing and is outside the studio's direct control.</p>
        </section>
        <section><h2>Need help with delivery?</h2>
          <p>For an existing Etsy order, please use Etsy Messages so we can locate the order and help you. You can also <Link href="/contact">contact the studio</Link>.</p>
        </section>
        <p className="policy-note">The delivery estimate and terms shown on the individual Etsy listing at the time of purchase apply to that order. Where applicable, consumer rights under local law continue to apply.</p>
        <p className="policy-source">Our current shipping information follows the published <a href="https://www.etsy.com/shop/TheSMStudios" target="_blank" rel="noopener noreferrer">TheSMStudios Etsy shop policies</a>.</p>
      </div>
    </article>
  );
}
