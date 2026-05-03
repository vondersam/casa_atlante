import Image from "next/image";
import getAlt from "@/app/helpers/getAlt";

const beforeRenovationImage = "/gallery/casa-atlante-before-renovation.jpg";

export default function About() {
  return (
    <section className="section">
      <div className="content-width split-grid">
        <div>
          <div className="section-header">
            <p className="eyebrow">Sobre mí</p>
            <h1>Mi historia</h1>
          </div>
          <p>
            Me llamo Samuel. Nací en La Palma y viví allí hasta los 18 años,
            cuando me mudé al extranjero para estudiar. Ahora vivo y trabajo en
            Suecia, pero la isla sigue siendo mi hogar.
          </p>
          <p>
            En 2019 decidí terminar, junto con mi padre, antiguo carpintero, una
            casa que él había empezado años atrás y alquilarla como vivienda
            vacacional. La llamamos Casa Julio en su honor, porque hizo casi
            todo el trabajo él mismo. La casa estaba en El Paraíso, en la zona
            de Las Manchas.
          </p>
          <h2>Casa Julio</h2>
          <p>
            Un año después de terminar Casa Julio y empezar a alquilarla, el
            volcán Tajogaite entró en erupción y destruyó las casas de mi
            familia y Casa Julio.
          </p>
          <p>
            Fue, y sigue siendo, algo muy difícil de asimilar. En algún momento
            entiendes que forma parte de la naturaleza cambiante de la vida, y
            que la vida continúa. Que esto haya ocurrido no significa que un
            lugar tan especial deba quedarse atrás. Por eso, en 2023 compré esta
            antigua casa y la renové por completo con mi padre, en un proyecto
            que nos llevó siete meses. Hicimos la mayor parte del trabajo
            nosotros mismos.
          </p>
          <p>
            Casa Atlante se ha convertido en un lugar muy especial para mí. Es
            un mar de tranquilidad, un espacio para desconectar y disfrutar de
            la naturaleza impresionante de La Palma aquí y ahora, sabiendo que
            algún día cambiará, como cambia todo.
          </p>
        </div>

        <div className="image-full">
          <Image
            src={beforeRenovationImage}
            alt={getAlt(beforeRenovationImage, "es")}
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
