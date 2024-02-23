import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Image from 'react-bootstrap/Image';
import Row from 'react-bootstrap/Row';
import getAlt from '../helpers/getAlt';

export default function Gallery() {
  const filenames = [
    '/gallery/bathroom-with-mountain-views.jpg',
    '/gallery/bathroom-with-washing-machine.jpg',
    '/gallery/bathroom.jpg',
    '/gallery/casa-atlante-front.jpg',
    '/gallery/cumbre-vieja-natural-park.jpg',
    '/gallery/front-house-terrace-table.jpg',
    '/gallery/front-house-terrace.jpg',
    '/gallery/house-front-entrance.jpg',
    '/gallery/house-main-entrance-with-sunset.jpg',
    '/gallery/house-roof-with-solar-panels.jpg',
    '/gallery/kitchen-and-living-room.jpg',
    '/gallery/lava-field.jpg',
    '/gallery/main-room-ocean-view.jpg',
    '/gallery/main-room-queen-bed.jpg',
    '/gallery/mountain-view.jpg',
    '/gallery/ocean-view-from-terrace.jpg',
    '/gallery/ocean-view-hierro.jpg',
    '/gallery/ocean-view-with-outdoor-table.jpg',
    '/gallery/open-space-kitchen.jpg',
    '/gallery/puerto-naos-view.jpg',
    '/gallery/second-room-two-beds.jpg',
    '/gallery/second-room-with-wardrobe.jpg',
    '/gallery/sunbeds-on-terrace.jpg',
    '/gallery/terrace-with-outdoor-table.jpg',
    '/gallery/view-from-kitchen.jpg',
    '/gallery/view-from-living-room.jpg'
  ];
  return (
    <>
      <p>
        Important: The current pictures do not show the shutters, mosquito nets
        and curtains which were installed after the pictures were taken. Please
        note that all rooms have shutters and curtains for privacy and light
        blocking.
      </p>
      <Row className="portfolio-item">
        {filenames.map((filename) => {
          return (
            <Col key={filename} className="item" lg={4} md={5} sm={8} xs={9}>
              <Image
                className="img-fluid"
                src={filename}
                alt={getAlt(filename)}
              />
            </Col>
          );
        })}
      </Row>
    </>
  );
}
