import Image from "next/image";

export default function About() {
  return (
    <section className="section">
      <div className="content-width split-grid">
        <div>
          <div className="section-header">
            <p className="eyebrow">About</p>
            <h1>A home built with family</h1>
          </div>
          <p>
            My name is Samuel. I was born in La Palma and lived here until I was
            18, when I moved abroad. I now live and work in Sweden, but the
            island remains home.
          </p>
          <p>
            In 2021, a year after finishing Casa Julio in El Paraíso, the
            Tajogaite volcano erupted and destroyed my family's houses and Casa
            Julio. In 2023 I bought this old house and renovated it completely
            together with my dad over seven months. Casa Atlante is a sea of
            tranquility for us, a place to disconnect and enjoy La Palma’s
            breathtaking nature.
          </p>
        </div>

        <div className="image-full">
          <Image
            src="/gallery/casa-atlante-before-renovation.jpg"
            alt="Casa Atlante before renovation"
            width={1200}
            height={900}
            sizes="(max-width: 900px) 100vw, 50vw"
            priority
          />
        </div>
      </div>
    </section>
  );
}
