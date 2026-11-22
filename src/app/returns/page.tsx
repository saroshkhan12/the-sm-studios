import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns & Exchanges | THE SM STUDIOS",
  description: "Review return and exchange eligibility for THE SM STUDIOS orders.",
};

export default function ReturnsPage() {
  return (
    <article className="policy-page">
      <header className="policy-hero">
        <span className="eyebrow">CUSTOMER INFORMATION</span>
        <h1>Returns <em>&amp; exchanges.</em></h1>
        <p>Every item has its own return and exchange details. Please check before ordering.</p>
      </header>
      <div className="policy-body">
        <section><h2>Check the item listing</h2>
          <p>Return and exchange eligibility is shown in the individual Etsy listing. Different products may have different terms, so please review the listing's return information before purchase.</p>
          <p>We do not promise that every item can be returned or exchanged. The policy displayed on the listing at the time of purchase applies, subject to any rights that cannot be excluded under applicable law.</p>
        </section>
        <section><h2>If something is wrong with your order</h2>
          <p>If your order arrives damaged, does not match its description, or has not arrived, please contact us through Etsy Messages with your order details and relevant photos where helpful. We will review the issue and work with you on the next steps.</p>
        </section>
        <section><h2>Before sending an item back</h2>
          <p>Please contact us and agree the return arrangements before shipping anything back. Do not send an item to an address without receiving return instructions first.</p>
        </section>
        <section><h2>Etsy order support</h2>
          <p>Purchases completed on Etsy may qualify for Etsy's Purchase Protection, subject to Etsy's eligibility requirements and programme terms. This protection is administered by Etsy and is not a separate guarantee provided by this website.</p>
          <p>Read <a href="https://help.etsy.com/hc/en-us/articles/115015440807-How-to-Return-or-Exchange-an-Item-on-Etsy" target="_blank" rel="noopener noreferrer">Etsy's return and exchange guidance</a> for details.</p>
        </section>
        <p className="policy-note">Nothing in this policy limits consumer rights that apply to your purchase under relevant law.</p>
        <p className="policy-source">Based on the return information currently published by <a href="https://www.etsy.com/shop/TheSMStudios" target="_blank" rel="noopener noreferrer">TheSMStudios on Etsy</a>.</p>
      </div>
    </article>
  );
}
