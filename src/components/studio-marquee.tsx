const phrases = [
  "ART WITH MEANING",
  "CULTURE IN EVERY DETAIL",
  "DESIGN THAT CONNECTS",
  "MADE TO MAKE YOU THINK",
];

export function StudioMarquee() {
  return (
    <section className="studio-marquee" aria-label="Studio principles">
      <div className="studio-marquee-track">
        {[0, 1].map((copy) => (
          <div
            className="studio-marquee-group"
            key={copy}
            aria-hidden={copy === 1 ? true : undefined}
          >
            {phrases.map((phrase, index) => (
              <span className="studio-marquee-item" key={phrase}>
                {phrase}
                <i aria-hidden="true">✳</i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
