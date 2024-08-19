import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import "leaflet/dist/leaflet.css";
import { customIcon } from "./constants";
import { toast } from 'react-toastify'

const LeafletControlGeocoder = (props) => {
	// const { fetchCountryList } = props?.handler;
	// const { addressData } = props?.data;
	const [currentLocationData, setCurrentLocationData] = useState({})
	const [latitude, setLatitude] = useState(0)
	const [longitude, setLongitude] = useState(0)
	// const lat = useRef(null)
	// const long = useRef(null)

	const markerRef = useRef(null);

	const [markerPosition, setMarkerPosition] = useState([latitude, longitude]);

	// useEffect(() => {
	// 	const map = markerRef.current?.leafletElement?._map;
	// 	if (addressData && addressData.latitude && addressData.longitude && addressData.latitude !== '' && addressData.longitude !== '') {
	// 		setLatitude(addressData.latitude)
	// 		setLongitude(addressData.longitude)
	// 		setMarkerPosition([addressData.latitude, addressData.longitude])

	// 	} else {
	// 		const success = (position) => {
	// 			const lat = position.coords.latitude;
	// 			const long = position.coords.longitude;
	// 			setLatitude(lat)
	// 			setLongitude(long)
	// 			setMarkerPosition([lat, long])
	// 			const geolocationUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`
	// 			fetch(geolocationUrl)
	// 				.then((res) => res.json()).catch((error) => console.error(error))
	// 				.then((data) => { setCurrentLocationData(data) }).catch((error) => console.error(error))
	// 		}
	// 		const error = () => {
	// 			toast.error('Unable to fetch location')
	// 		}
	// 		navigator.geolocation.getCurrentPosition(success, error)
	// 	}

	// 	if (map && latitude && longitude) {
	// 		map.setView([latitude, longitude], 13);
	// 	}
	// }, [props]);

	const handleMarkerDragEnd = (e) => {
		const { lat, lng } = e.target.getLatLng();
		const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

		fetch(url)
			.then((response) => response.json())
			.then((result) => {
				const addressDetails = result?.address;

				const data = {
					latitude: lat,
					longitude: lng,
					address1: (addressDetails?.building || "") + ", " + (addressDetails?.neighbourhood || "") || "NA",
					address2: (addressDetails?.road || "") + "," + (addressDetails?.county || "") || "NA",
					address3: addressDetails?.suburb || "NA",
					country: addressDetails?.country,
					countryShortCode: addressDetails?.country_code,
					postcode: addressDetails?.postcode,
				};
				// fetchCountryList(addressDetails?.country, data);
			}).catch((error) => console.error(error));
	};

	const SearchControl = () => {
		const map = useMap();

		useEffect(() => {
			const provider = new OpenStreetMapProvider();
			const searchControl = new GeoSearchControl({
				provider,
				style: "bar",
				showMarker: false,
				autoComplete: true,
				autoClose: true,
				retainZoomLevel: true,
				animateZoom: true,
				searchLabel: "Enter address",
				placeholder: "Search here...",
			});

			map.addControl(searchControl);

			map.on("geosearch/showlocation", handleSearchResults);

			return () => {
				map.removeControl(searchControl);
				map.off("geosearch/showlocation", handleSearchResults);
			};
		}, [map]);

		const handleSearchResults = (event) => {
			const { location } = event;

			const { lat, lon } = location.raw;
			const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

			fetch(url)
				.then((response) => response.json())
				.then((result) => {
					const addressDetails = result?.address;

					const data = {
						latitude: lat,
						longitude: lon,
						address1: (addressDetails?.building || "") + ", " + (addressDetails?.neighbourhood || "") || "NA",
						address2: (addressDetails?.road || "") + "," + (addressDetails?.county || "") || "NA",
						address3: addressDetails?.suburb || "NA",
						country: addressDetails?.country,
						countryShortCode: addressDetails?.country_code,
						postcode: addressDetails?.postcode,
					};
					// fetchCountryList(addressDetails?.country, data);
				}).catch((error) => console.error(error));

			setMarkerPosition([lat, lon]);
		};

		return null;
	};

	return (
		<div id="map" style={{ width: "100%" }}>
			{
				// center={markerPosition}
				<MapContainer center={[51.505, -0.09]}  zoom={15} style={{ height: "100vh" }}>
					<TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
					<Marker
						position={markerPosition}
						ref={markerRef}
						icon={customIcon}
						draggable={false}
						eventHandlers={{ dragend: handleMarkerDragEnd }}
					/>
					{/* <SearchControl /> */}
				</MapContainer>
			}

		</div >
	);
};

export default LeafletControlGeocoder;
