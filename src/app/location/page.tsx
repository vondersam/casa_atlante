'use client';
import React from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { Link } from 'react-router-dom';

function Location() {
  const position = { lat: 28.576755825093613, lng: -17.877278973588894 };

  return (
    <>
      <p>
        Casa Atlante's unique location in the Red Natura 2000 of Tamanca area on
        the west side of La Palma makes it perfect for those who love the
        mountain and the beach. The area is a sea of tranquility and many hiking
        trails can be accessed easily by feet from the house.
      </p>

      <p>
        The house is also conveniently located close to everything you need
        within a short trip by car. The towns of El Paso and Los LLanos de
        Aridane are both around 30-45 minutes away by car. The closest
        supermarket, in Fuencaliente, is a 15 minutes drive. There is also a
        small shop 1 minute away that has all the essentials. The nearest beach
        is el Charco Verde, which can be reached in around 17 minutes, while El
        Puerto de Tazacorte’s beach is located 25 minutes away from the house.
        And if you want some wilder beaches you can head south to Fuencaliente
        and be there in 30 minutes. There are also multiple lava fields that can
        be explored by a few minutes' drive, like the recent 2021’s Tajogaite
        volcano, located only 3 km from the house.
      </p>

      <a href="https://maps.app.goo.gl/BiCx97GW2YJdooCM9" target="_blank">
        Address
      </a>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <Map
          center={position}
          defaultZoom={12}
          gestureHandling={'greedy'}
          // disableDefaultUI={true}
          style={{ width: '400px', height: '400px' }}
        >
          <Marker position={position} />
        </Map>
      </APIProvider>
    </>
  );
}

export default React.memo(Location);
