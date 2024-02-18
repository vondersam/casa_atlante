'use client';
import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '500px',
  height: '500px'
};

const center = { lat: 28.576755825093613, lng: -17.877278973588894 };

function Location() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  });

  const [map, setMap] = React.useState(null);

  const onLoad = React.useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);

    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      defaultCenter={center}
    >
      <Marker position={center} />
      <></>
    </GoogleMap>
  ) : (
    <>Loading map...</>
  );
}

export default React.memo(Location);

// <p>
//   Casa Atlante's unique location in the Red Natura 2000 of Tamanca area on
//   the west side of La Palma makes it perfect for those who love the
//   mountain and the beach. The area is a sea of tranquility and many hiking
//   trails can be accessed easily by feet from the house. The area is very
//   quiet and peaceful, and conveniently located close to everything you
//   need within a short trip by car. The towns of El Paso and Los LLanos de
//   Aridane are both around 30-45 minutes away by car. The closest
//   supermarket, in Fuencaliente, is a 15 minutes drive. There is also a
//   small shop 1 minute away that has all the essentials. The nearest beach
//   is el Charco Verde, which can be reached in around 17 minutes, while El
//   Puerto de Tazacorte’s beach is located 25 minutes away from the house.
//   And if you want some wilder beaches you can head south to Fuencaliente
//   and be there in 30 minutes. There are also multiple lava fields that can
//   be explored by a few minutes' drive, like the recent 2021’s Tajogaite
//   volcano, located only 3 km from the house.
// </p>
