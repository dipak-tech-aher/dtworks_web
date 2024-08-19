import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { useFloating } from '@floating-ui/react';
import { createPopper } from '@popperjs/core'; // Still needed for Floating UI

function OpenLayersMap({ circles }) {
    const mapRef = useRef(null);
    const popupRef = useRef(null);
    const sidePopupRef = useRef(null);



    const [selectedCircle, setSelectedCircle] = useState(null);
    const { x, y, ref, floating, open, show, hide, placement } = useFloating({
        // Configure Floating UI options as needed:
        placement: 'top-start', // Adjust placement as desired
        modifiers: [
            {
                name: 'offset',
                options: {
                    offset: [0, 8], // Adjust offset as needed
                },
            },
        ],
    });

    const container = document.getElementById('popup');
    const content = document.getElementById('popup-content');
    const closer = document.getElementById('popup-closer');


    const overlay = new Overlay({
        element: popupRef,
        autoPan: {
            animation: {
                duration: 250,
            },
        },
    });

    useEffect(() => {
        if (!mapRef.current) return;

        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
            ],
            overlays: [overlay],
            view: new View({
                center: [0, 0],
                zoom: 2,
            }),
        });

        const vectorSource = new VectorSource();
        const vectorLayer = new VectorLayer({
            source: vectorSource,
        });

        map.addLayer(vectorLayer);

        circles.forEach((circle) => {
            const circleFeature = new Feature({
                geometry: new Point(fromLonLat([circle.longitude, circle.latitude])),
                name: 'My Polygon',
                // details: circle.details, // Add details property for side pop-up
            });

            const style = new Style({
                image: new CircleStyle({
                    radius: circle.radius,
                    fill: new Fill({ color: 'rgba(255, 0, 0, 0.5)' }),
                    stroke: new Stroke({ color: 'red', width: 1 }),
                }),
            });

            circleFeature.setStyle(style);
            circleFeature.addEventListener.on('singleclick', () => {
                setSelectedCircle(circle);
                open(); // Open side pop-up using Floating UI
            });
            vectorSource.addFeature(circleFeature);


        });

        map.on('postcompose', function (e) {
            document.querySelector('canvas').style.filter = "invert(90%)";
        });

        return () => map.dispose();
    }, [circles]);


    useEffect(() => {
        if (!selectedCircle) return;

        sidePopupRef.current.innerHTML = `
      <h4><span class="math-inline">{selectedCircle.name}</h4>
<p></span>{selectedCircle.details}</p>
    `;

        sidePopupRef.current.style.top = `${y}px`;
        sidePopupRef.current.style.left = `${x}px`;

        // Apply custom CSS classes:
        // sidePopupRef.current.classList.add('side-popup', 'active'); // Define styles in your CSS

    }, [selectedCircle, x, y]);

    // const handleSidePopupClose = () => {
    //     setSelectedCircle(null);
    //     sidePopupRef.current.classList.remove('active'); // Remove custom CSS class
    //     sidePopupRef.current.style.display = 'none';
    //     hide(); // Hide side pop-up using Floating UI
    // };

    return (
        <>
            <div ref={mapRef} className="map" />
            <div id="popup" class="ol-popup">
                <a href="#" id="popup-closer" class="ol-popup-closer"></a>
                <div id="popup-content"></div>
            </div>
        </>
    )
}

export default OpenLayersMap;