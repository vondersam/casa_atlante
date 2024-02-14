'use client';
import Slider from 'react-slick';
import Image from 'next/image';

function Arrow(props: any) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: 'block' }}
      onClick={onClick}
    />
  );
}

export default function Home() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    fade: true,
    nextArrow: <Arrow />,
    prevArrow: <Arrow />
  };
  const filenames = [
    'sunset-on-ocean.jpg',
    'house-front-entrance.jpg',
    'main-bedroom-with-ocean-views.jpg',
    'living-room-with-sofa.jpg',
    'front-terrace-with-ocean-views.jpg',
    'open-space-kitchen.jpg',
    'house-roof-with-solar-panels.jpg',
    'sunset-on-ocean-view.jpg'
  ];
  const images = filenames.map((filename) => (
    <div key={filename}>
      <Image
        src={'/carousel/' + filename}
        alt="Picture of the author"
        sizes="100vw"
        style={{
          width: '90vw',
          height: 'auto'
        }}
        width={400}
        height={300}
      />
    </div>
  ));
  return (
    <div className="slider slider-container">
      <Slider {...settings}>{images}</Slider>
    </div>
  );
}
