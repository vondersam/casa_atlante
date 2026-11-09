import { rentalTerms } from "@/lib/booking/terms";
import type { Locale } from "@/lib/booking/policy";
export default function RentalTerms({ locale }: { locale: Locale }) {
  const [title, ...paragraphs] = rentalTerms(locale);
  return (
    <section className="section">
      <article className="content-width legal-page">
        <h1>{title}</h1>
        {paragraphs.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
      </article>
    </section>
  );
}
