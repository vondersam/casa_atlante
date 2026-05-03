import Image from "next/image";

export default function About() {
  return (
    <section className="section">
      <div className="content-width split-grid">
        <div>
          <div className="section-header">
            <p className="eyebrow">About</p>
            <h1>My story</h1>
          </div>
          <p>
            My name is Samuel. I was born on La Palma and lived there until I
            turned 18 and moved abroad to study. I now live and work in Sweden,
            but the island remains home.
          </p>
          <p>
            In 2019 I decided to finish, together with my dad, a former
            carpenter, a house he had started years earlier and rent it as a
            holiday home. We called it Casa Julio in his honor because he did
            almost all of the work himself. The house was in El Paraíso, part of
            the Las Manchas area.
          </p>
          <h2>Casa Julio</h2>
          <p>
            A year after I finished Casa Julio and started renting it, the
            Tajogaite volcano erupted and destroyed my family's houses and Casa
            Julio.
          </p>
          <p>
            This was, and still is, very hard to take in. At some point you
            realize it is part of the changing nature of life, and life goes on.
            Just because this happened does not mean such a special place should
            be left behind. So in 2023 I bought this old house and renovated it
            completely with my dad, a project that took us seven months. We did
            most of the work ourselves.
          </p>
          <p>
            Casa Atlante has become a very special place for me. It is a sea of
            tranquility, a place to disconnect and enjoy La Palma's breathtaking
            nature right now in this time and space, knowing that someday it
            will change as everything does.
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
