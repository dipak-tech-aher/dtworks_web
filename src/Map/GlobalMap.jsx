import { useEffect, useRef, useState } from 'react';
import { post, get } from "../common/util/restUtil";
import { properties } from '../properties';

// Import - Import for Map
import Map from 'ol/Map.js';

// Import - Import for View
import View from 'ol/View.js';

// Import - Import for Layers and Layers Source
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';

// Import - Import for Controls
import ScaleLineControl from 'ol/control/ScaleLine';
import FullScreenControl from 'ol/control/FullScreen';
import { Zoom, Attribution, Rotate, MousePosition, ZoomSlider } from 'ol/control';

// Import - Import for function that creates cordinates
import { createStringXY } from 'ol/coordinate';
import OpenLayersMap from './components/OpenLayersMap';

const GlobalMap = (props) => {

    // Const declaration - controls
    const rotateControl = new Rotate();
    const zoomSliderControl = new ZoomSlider();
    const scaleLineControl = new ScaleLineControl();
    const fullScreenControl = new FullScreenControl();
    const attrControl = new Attribution()
    const zoomControl = new Zoom({})
    const mousePositionControl = new MousePosition({
        coordinateFormat: createStringXY(4),
        projection: 'EPSG:4326',
        className: 'custom-mouse-position',
    });

    // State inizialization - State for Map ref and Map
    const mapTargetElement = useRef(null)
    const [map, setMap] = useState()
    const [markers, setMarkers] = useState(
        [
            {
                latitude: 13.082680,
                longitude: 80.270721,
                radius: 10,
                maxRadius: 100,
                name: 'Marker 1',
                animationDuration: 5000 // 5 seconds
            },
            {
                latitude: 4.535277,
                longitude: 114.727669,
                radius: 20,
                maxRadius: 100,
                name: 'Marker 1',
                animationDuration: 6000 // 5 seconds
            },
            {
                latitude: 18.520430,
                longitude: 73.856743,
                radius: 30,
                maxRadius: 100,
                name: 'Marker 1',
                animationDuration: 7000 // 5 seconds
            },
            {
                latitude: -25.274399,
                longitude: 133.775131,
                radius: 40,
                maxRadius: 150,
                name: 'Marker 1',
                animationDuration: 8000 // 7 seconds
            },
            {
                latitude: -14.235004,
                longitude: -51.925282,
                radius: 50,
                maxRadius: 120,
                name: 'Marker 1',
                animationDuration: 8000 // 6 seconds
            },
            {
                latitude: 9.1756554,
                longitude: 77.8739121,
                radius: 60,
                maxRadius: 120,
                name: 'Marker 1',
                animationDuration: 10000 // 6 seconds
            }
        ]
    )

    useEffect(() => {
        const map = new Map({
            layers: [
                new TileLayer({ source: new OSM() }),
            ],
            controls: [fullScreenControl, scaleLineControl, zoomControl, attrControl, mousePositionControl, rotateControl, zoomSliderControl],
            view: new View({
                center: [0, 0],
                zoom: 0,
                minZoom: 0,
                maxZoom: 28,
            }),
        })
        map.setTarget(mapTargetElement.current || "")
        setMap(map)
        return () => map.setTarget("")
    }, [])

    // Function delcaration - Declaring functions for editing the View
    const lessZoom = (map) => {
        const view = map.getView();
        const currentZoom = view.getZoom()
        const newZoom = currentZoom - 0.5;
        view.setZoom(newZoom);
    }

    const zoom = (map) => {
        console.log("zoom")
        const view = map.getView()
        const currentZoom = view.getZoom()
        const newZoom = currentZoom + 1;
        view.setZoom(newZoom)
    }

    const increaseResolution = (map) => {
        const view = map.getView();
        const currentResolution = view.getResolution();
        const newResolution = currentResolution / 2;
        view.setResolution(newResolution);
    };

    const decreaseResolution = (map) => {
        const view = map.getView();
        const currentResolution = view.getResolution();
        const newResolution = currentResolution * 2;
        view.setResolution(newResolution);
    };

    const rotateLeft = (map) => {
        const view = map.getView();
        const currentRotation = view.getRotation();
        const newRotation = currentRotation - Math.PI / 6;
        view.setRotation(newRotation);
    };

    const rotateRight = (map) => {
        const view = map.getView();
        const currentRotation = view.getRotation();
        const newRotation = currentRotation + Math.PI / 6;
        view.setRotation(newRotation);
    };

    const originalCenter = (map) => {
        const view = map.getView();
        const currentCenter = view.getCenter();
        const newCenter = [0, 0];
        view.setCenter(newCenter);
    };

    const changeCenter = (map) => {
        const view = map.getView();
        const currentCenter = view.getCenter();
        const newCenter = [-10725196.690349146, 5635012.033203788];
        view.setCenter(newCenter);
    };

    useEffect(() => {
        post(properties.LEAD_API + "/country-wise-stakeholders-missions").then((response) => {
            if (response?.status == 200) {
                function calculateDynamicRadius(index) {
                    // Add your dynamic calculation logic here based on the value of 'index'
                    if (index < 5) {
                        return index * 5;  // Example: Multiply index by 10 if index is less than 5
                    } else {
                        return index * 2;   // Example: Multiply index by 5 for other cases
                    }
                }

                const { data } = response;
                const addressData = data?.map((ele, index) => {
                    return {
                        latitude: ele?.lat,
                        longitude: ele?.lon,
                        radius: calculateDynamicRadius(index),
                        maxRadius: index * 10,
                        name: `Marker ${index}`,
                        animationDuration: index * 1000, // 5 seconds,,
                        metaData: ele
                    }
                })
                setMarkers(addressData)
            }
        }).catch((error) => console.log(error));
    }, [])

    return (
        <div className="App">
            <OpenLayersMap circles={markers} />
        </div>
    )
}
export default GlobalMap; 