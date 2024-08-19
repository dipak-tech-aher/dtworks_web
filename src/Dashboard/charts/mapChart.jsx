import React, { useEffect } from 'react';
import L from 'leaflet';

const MapChart = (props) => {
    const { axisData, seriesData } = props?.data;
    // console.log('map data ', axisData);
    // console.log('seriesData data ', seriesData);
    const getSeriesDataValue = (name) => {
        const dataItem = seriesData.find(item => item.name === name);
        return dataItem ? dataItem.value : null;
    };
    useEffect(() => {
        const map = L.map('map').setView([4.5353, 114.7277], 9); // Coordinates of Brunei

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // axisData.forEach(location => {
        //     const [lat, lng] = location.coordinates;
        //     if (lat && lng) {
        //         const markerIcon = L.divIcon({
        //             html: `<div>${location.name}<br>${getSeriesDataValue(location.name) || 0}</div>`,
        //             className: 'custom-marker',
        //             iconSize: [100, 40] // Adjust size as needed
        //         });
        //         L.marker([parseFloat(lat), parseFloat(lng)], { icon: markerIcon }).addTo(map);
        //     }
        // });

        axisData.forEach(location => {
            const [lat, lng] = location.coordinates;
            if (lat && lng) {
                const marker = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(map);
                marker.bindPopup(`<b>${location.name}</b><br>${getSeriesDataValue(location.name) || 0}`);
            }
        });

        return () => map.remove();
    }, [axisData, seriesData]);

    return <div id="map" style={{ width: '100%', height: '400px' }} />;
};

export default MapChart;
