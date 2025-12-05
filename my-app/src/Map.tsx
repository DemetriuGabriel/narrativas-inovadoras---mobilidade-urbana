import ReactMapboxGl, { Layer, Feature } from 'react-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FC } from 'react';

interface MapProps {
  style: string;
  containerStyle: React.CSSProperties;
  children?: React.ReactNode;
}

const Map = ReactMapboxGl({
  accessToken: 'pk.eyJ1IjoiZmFicmljOCIsImEiOiJjaWc5aTV1ZzUwMDJwdzJrb2w0dXRmc2d0In0.p6GGlfyV-WksaDV_KdN27A'
});

const MapComponent: FC<MapProps> = ({ style, containerStyle, children }) => (
  <Map style={style} containerStyle={containerStyle}>
    {children}
  </Map>
);

export default MapComponent;