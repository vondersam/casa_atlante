type AltLocale = 'en' | 'es';

const spanishAltText: Record<string, string> = {
  'bathroom-with-mountain-views': 'Baño con vistas a la montaña',
  'bathroom-with-washing-machine': 'Baño con lavadora',
  bathroom: 'Baño',
  'casa-atlante-front': 'Fachada de Casa Atlante',
  'cumbre-vieja-natural-park': 'Parque Natural de Cumbre Vieja',
  'front-house-terrace-table': 'Mesa en la terraza principal',
  'front-house-terrace': 'Terraza principal de la casa',
  'house-front-entrance': 'Entrada principal de la casa',
  'house-main-entrance-with-sunset': 'Entrada principal de la casa al atardecer',
  'house-roof-with-solar-panels': 'Tejado de la casa con paneles solares',
  'kitchen-and-living-room': 'Cocina y salón',
  'lava-field': 'Campo de lava',
  'main-room-ocean-view': 'Dormitorio principal con vistas al océano',
  'main-room-queen-bed': 'Cama queen en el dormitorio principal',
  'mountain-view': 'Vista de la montaña',
  'ocean-view-from-terrace': 'Vista del océano desde la terraza',
  'ocean-view-hierro': 'Vista del océano hacia El Hierro',
  'ocean-view-with-outdoor-table': 'Mesa exterior con vistas al océano',
  'open-space-kitchen': 'Cocina abierta',
  'puerto-naos-view': 'Vista de Puerto Naos',
  'second-room-two-beds': 'Segundo dormitorio con dos camas',
  'second-room-with-wardrobe': 'Segundo dormitorio con armario',
  'sunbeds-on-terrace': 'Tumbonas en la terraza',
  'terrace-with-outdoor-table': 'Terraza con mesa exterior',
  'view-from-kitchen': 'Vista desde la cocina',
  'view-from-living-room': 'Vista desde el salón',
  'living-room-sun': 'Salón con luz natural',
  'bathroom-with-shower': 'Baño con ducha',
  'living-room': 'Salón',
  'sunset-from-second-terrace': 'Atardecer desde la segunda terraza',
  'afternoon-terrace': 'Terraza por la tarde',
  'aenium-bejeque': 'Bejeque en la finca',
  'casa-atlante-name': 'Nombre de Casa Atlante en la entrada',
  'gr-130-jedey': 'Sendero GR 130 en Jedey',
  'ruta-de-los-volcanes': 'Ruta de los Volcanes',
  stargazing: 'Cielo nocturno para observar estrellas'
};

function formatSlug(slug: string) {
  const description = slug.replaceAll('-', ' ');
  return description.charAt(0).toUpperCase() + description.slice(1);
}

export default function getAlt(filename: string, locale: AltLocale = 'en') {
  const match = filename.match(/\/([a-zA-Z0-9-]*)\.(?:jpe?g|png|webp)$/i);
  const slug = match?.[1];

  if (!slug) return '';
  if (locale === 'es') return spanishAltText[slug] ?? formatSlug(slug);

  return formatSlug(slug);
}
