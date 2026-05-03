type AltLocale = 'en' | 'es';

const englishAltText: Record<string, string> = {
  'aenium-bejeque': 'Bejeque on the property',
  'afternoon-terrace': 'Afternoon terrace',
  bathroom: 'Bathroom',
  'bathroom-with-mountain-views': 'Bathroom with mountain views',
  'bathroom-with-shower': 'Bathroom with shower',
  'bathroom-with-washing-machine': 'Bathroom with washing machine',
  'casa-atlante-before-renovation': 'Casa Atlante before renovation',
  'casa-atlante-front': 'Casa Atlante front',
  'casa-atlante-name': 'Casa Atlante name at the entrance',
  'cumbre-vieja-natural-park': 'Cumbre Vieja Natural Park',
  'front-house-terrace': 'Front house terrace',
  'front-house-terrace-table': 'Table on the front house terrace',
  'front-terrace-with-ocean-views': 'Front terrace with ocean views',
  'gr-130-jedey': 'GR 130 trail in Jedey',
  'house-front-entrance': 'House front entrance',
  'house-main-entrance-with-sunset': 'House main entrance at sunset',
  'house-roof-with-solar-panels': 'House roof with solar panels',
  'kitchen-and-living-room': 'Kitchen and living room',
  'lava-field': 'Lava field',
  'living-room': 'Living room',
  'living-room-sun': 'Living room with natural light',
  'living-room-with-sofa': 'Living room with sofa',
  'los-llanos-de-aridane': 'Los Llanos de Aridane',
  'main-bedroom-with-ocean-views': 'Main bedroom with ocean views',
  'main-room-ocean-view': 'Main room ocean view',
  'main-room-queen-bed': 'Queen bed in the main room',
  'mountain-view': 'Mountain view',
  'ocean-view-from-terrace': 'Ocean view from the terrace',
  'ocean-view-hierro': 'Ocean view toward El Hierro',
  'ocean-view-with-outdoor-table': 'Outdoor table with ocean view',
  'open-space-kitchen': 'Open-space kitchen',
  'puerto-naos-view': 'Puerto Naos view',
  'ruta-de-los-volcanes': 'Ruta de los Volcanes',
  'second-room-two-beds': 'Second room with two beds',
  'second-room-with-wardrobe': 'Second room with wardrobe',
  'stargazing': 'Night sky for stargazing',
  'sunbeds-on-terrace': 'Sunbeds on the terrace',
  'sunset-from-second-terrace': 'Sunset from the second terrace',
  'sunset-on-ocean': 'Sunset on the ocean',
  'sunset-on-ocean-view': 'Sunset ocean view',
  'terrace-with-outdoor-table': 'Terrace with outdoor table',
  'view-from-kitchen': 'View from the kitchen',
  'view-from-living-room': 'View from the living room'
};

const spanishAltText: Record<string, string> = {
  'afternoon-terrace': 'Terraza por la tarde',
  'aenium-bejeque': 'Bejeque en la finca',
  'bathroom-with-mountain-views': 'Baño con vistas a la montaña',
  'bathroom-with-washing-machine': 'Baño con lavadora',
  'bathroom-with-shower': 'Baño con ducha',
  bathroom: 'Baño',
  'casa-atlante-before-renovation': 'Casa Atlante antes de la renovación',
  'casa-atlante-front': 'Fachada de Casa Atlante',
  'casa-atlante-name': 'Nombre de Casa Atlante en la entrada',
  'cumbre-vieja-natural-park': 'Parque Natural de Cumbre Vieja',
  'front-terrace-with-ocean-views': 'Terraza principal con vistas al océano',
  'front-house-terrace-table': 'Mesa en la terraza principal',
  'front-house-terrace': 'Terraza principal de la casa',
  'gr-130-jedey': 'Sendero GR 130 en Jedey',
  'house-front-entrance': 'Entrada principal de la casa',
  'house-main-entrance-with-sunset': 'Entrada principal de la casa al atardecer',
  'house-roof-with-solar-panels': 'Tejado de la casa con paneles solares',
  'kitchen-and-living-room': 'Cocina y salón',
  'lava-field': 'Campo de lava',
  'living-room': 'Salón',
  'living-room-sun': 'Salón con luz natural',
  'living-room-with-sofa': 'Salón con sofá',
  'los-llanos-de-aridane': 'Los Llanos de Aridane',
  'main-bedroom-with-ocean-views': 'Dormitorio principal con vistas al océano',
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
  'sunset-on-ocean': 'Atardecer sobre el océano',
  'sunset-on-ocean-view': 'Vista del océano al atardecer',
  'terrace-with-outdoor-table': 'Terraza con mesa exterior',
  'view-from-kitchen': 'Vista desde la cocina',
  'view-from-living-room': 'Vista desde el salón',
  'sunset-from-second-terrace': 'Atardecer desde la segunda terraza',
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

  return englishAltText[slug] ?? formatSlug(slug);
}
