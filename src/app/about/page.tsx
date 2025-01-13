import Image from "next/image";

export default function About() {
  return (
    <>
      <p>
        My name is Samuel and I was born on La Palma and lived there until I was
        18 years old, when I moved to study abroad. I currently live and work in
        Sweden. In 2021, a year after I finished Casa Julio and started renting
        it in El Paraíso, the Tajogaite volcano erupted and destroyed my
        family’s houses and Casa Julio. In 2023 I bought this old house and
        renovated it completely together with my dad during 7 months. Casa
        Atlante has become a very special place for me. It is a sea of
        tranquility, a place to disconnect and enjoy La Palma’s breathtaking
        nature.
      </p>
      <Image
        src="/gallery/casa-atlante-before-renovation.jpg"
        alt="Casa Atlante before renovation"
        sizes="100vw"
        style={{
          width: "60vw",
          height: "auto",
        }}
        width={400}
        height={300}
      />
    </>
  );
}
