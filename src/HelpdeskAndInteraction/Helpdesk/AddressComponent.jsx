/* eslint-disable array-callback-return */
import { isObject } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from "react";
import Select from "react-select";
import { get } from "../../common/util/restUtil";
import { properties } from "../../properties";
import { unstable_batchedUpdates } from 'react-dom';
// const countryFlags = require("../../assets/files/country_flags.json");
import detectLocation from '../../assets/images/location-detect.svg';
import AddressMap from '../../CRM/Address/AddressMap'
import { CloseButton, Form, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { hideSpinner, showSpinner } from '../../common/spinner';

const AddressComponent = ({
	index,
	addressList,
	setAddressList,
	error,
	setError,
	readOnly = false
}) => {

	// console.log('addressList ', addressList)

	const address = addressList[index]
	const [addressElements, setAddressElements] = useState([]);
	const [postCode, setPostCode] = useState(address?.postcode);
	const [postCodeError, setPostCodeError] = useState("");
	const [addressError, setAddressError] = useState({});
	// const [postCodeSearch, setPostCodeSearch] = useState(false)
	const [isMapOpen, setIsMapOpen] = useState(false)
	const [addressLookUpRef, setAddressLookUpRef] = useState(null)
	const [addressData, setAddressData] = useState(address)
	const [districtLookup, setDistrictLookup] = useState([]);
	const [stateLookup, setStateLookup] = useState([]);
	const [cityLookup, setCityLookup] = useState([]);
	const addressRef = useRef()
	const [latitude, setLatitude] = useState()
	const [longitude, setLongitude] = useState()
	const [addressString, setAddressString] = useState('')
	const [countryLookup, setCountryLookup] = useState([]);
	const [countries, setCountries] = useState([]);
	const [addressTypeLookup, setAddressTypeLookup] = useState([])

	useEffect(() => {
		get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=COUNTRY,ADDRESS_TYPE')
			.then((response) => {
				const { data } = response;
				unstable_batchedUpdates(() => {
					setCountries(data['COUNTRY'])
					setAddressTypeLookup(data['ADDRESS_TYPE']);
				})

				const prefix1 = data?.COUNTRY.map((e) => {
					return {
						code: e.description,
						description: "(" + e.mapping.countryCode + ") " + e.description,
					}
				})
				setCountryLookup(prefix1);
			})
			.catch(error => {
				console.error(error);
			})
			.finally()
	}, [])

	useEffect(() => {
		setAddressData(address)
	}, [address])

	const fetchCountryList = (input, data = undefined, pageIndex = undefined) => {

		get(properties.ADDRESS_LOOKUP_API + '?country=' + input)
			.then((resp) => {
				if (resp && resp.data) {
					setAddressLookUpRef(resp.data)
					if (data) {
						const addressData = resp.data.find((x) => x.postCode === data?.postcode)
						setAddressData({
							...addressData,
							latitude: data?.latitude,
							longitude: data?.longitude,
							address1: data?.address1 || "",
							address2: data?.address2 || "",
							address3: data?.address3 || "",
							postcode: addressData?.postCode || "",
							state: addressData?.state || "",
							district: addressData?.district || "",
							city: addressData?.city || "",
							country: addressData?.country || '',
							countryCode: data?.countryCode || ''
						})
					}
				}
			}).catch((error) => {
				console.log(error)
			})
			.finally()
	}

	const handleInputChange = (field, value) => {
		let key
		if (addressList[index][field]) {
			key = addressList[index][field]
		} else {
			key = field
		}
		key = isObject(value) ? value.value : value;
		addressList[index][field] = key;
		setAddressList([...addressList]);
	}

	const handleOnChange = (e) => {
		const target = e.target;
		let district = [],
			state = [],
			city = [];
		if (target.id === "country") {

			addressElements &&
				addressElements !== null &&
				addressElements !== undefined &&
				addressElements.map((a) => {
					if (a?.country === target.value) {
						if (!district.includes(a?.district)) {
							district.push(a?.district);
						}
						if (!state.includes(a.state)) {
							state.push(a.state);
						}
						if (!city.includes(a.city)) {
							city.push(a.city);
						}
					}

					if (addressData?.district !== "") {
						setDistrictLookup(district);
					}
					if (addressData?.city !== "") {
						setCityLookup(city);
					}
				});
			if (addressElements?.length) setStateLookup([...state]);
		}
		if (target.id === "postcode") {
			addressElements &&
				addressElements !== null &&
				addressElements !== undefined &&
				addressElements.map((a) => {
					if (a?.postCode === target.value) {
						if (!state.includes(a?.state)) {
							state.push(a?.state);
						}
					}
				});
			setStateLookup(state);
		}
		if (target.id === "state") {
			addressElements?.map((a) => {

				if (a?.state === target.value) {
					if (!district.includes(a.district)) {
						district.push(a.district);
					}
					if (!city.includes(a?.city)) {
						city.push(a?.city);
					}
				}
			});
			setDistrictLookup(district);

		}
		if (target.id === "district") {
			addressElements?.map((a) => {
				if (a?.district === target.value) {
					if (!city.includes(a?.city)) {
						city.push(a?.city);
					}
				}
			});
			setCityLookup(city);
		}
	};

	const handleClear = () => {
		setDistrictLookup([]);
		setStateLookup([]);
		setCityLookup([]);
		setPostCode("");
	};

	const loadMap = () => {
		showSpinner()

		const success = (position) => {
			const latitude = position.coords.latitude;
			const longitude = position.coords.longitude;
			setLatitude(latitude)
			setLongitude(longitude)
			const geolocationUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
			fetch(geolocationUrl)
				.then((res) => {
					setIsMapOpen(true);
					res.json()
				}).catch((error) => {
					console.log(error)
				}).finally(hideSpinner)
		}
		const error = () => {
			toast.error('Unable to fetch location')
			hideSpinner()
		}
		navigator.geolocation.getCurrentPosition(success, error)

	}

	const getAddressByCountry = useCallback(() => {
		let city = [], district = [], state = [];
		if (!addressData?.country) return;

		get(properties.ADDRESS_LOOKUP_API + "?country=" + addressData?.country)
			.then((resp) => {
				if (resp && resp?.data) {
					if (addressData) {
						for (let e of resp.data) {
							if (e?.country === addressData?.country) {
								if (!state.includes(e.state)) {
									state.push(e.state);
								}

								if (!district.includes(e.district)) {
									district.push(e.district);
								}

								if (!city.includes(e.city)) {
									city.push(e.city);
								}
							}
						}
						state = state?.sort()
						unstable_batchedUpdates(() => {
							addressRef.current = resp?.data || []
							setAddressElements(resp.data);
							setDistrictLookup(district);
							setStateLookup(state);
							setCityLookup(city);
						})
					}
				}
			}).catch((error) => {
				console.error(error);
			});
	}, [addressData])


	useEffect(() => {
		if (readOnly) {
			setAddressData(address)
		} else {
			setAddressData(null)
		}
	}, [readOnly])

	const getAddressByState = useCallback(() => {
		let city = []
		if (!addressData?.state || !addressData?.country) return;
		if (!addressRef?.current) return
		for (let e of addressRef?.current) {
			if (e?.state === addressData?.state && e?.country === addressData?.country) {
				if (!city?.includes(e.city)) {
					city.push(e.city);
				}
			}
		}

		city = city?.sort() || []
		unstable_batchedUpdates(() => {
			setCityLookup(city);
		})
	}, [addressData?.country, addressData?.state])

	useEffect(() => {
		if (addressData?.country) {
			getAddressByCountry()
		}
	}, [addressData?.country, getAddressByCountry])

	useEffect(() => {
		if (addressData?.state) {
			getAddressByState()
		}
	}, [addressData?.state, getAddressByState])

	useEffect(() => {
		// setPostCodeSearch(true)
		setPostCodeError("");

		if (postCode && postCode.trim() !== "") {
			const delayDebounceFn = setTimeout(() => {
				get(properties.ADDRESS_LOOKUP_API + "?postCode=" + postCode)
					.then((resp) => {
						if (resp && resp.data) {
							if (resp.data.length > 0) {
								let addData = resp.data[0];
								const state = [], district = [], city = [];
								resp.data.map((m) => {
									if (!state.includes(m.state)) {
										state.push(m.state);
									}
									if (!district.includes(m?.district)) {
										district.push(m?.district);
									}
									if (!city.includes(m?.city)) {
										city.push(m?.city);
									}
								});
								addressRef.current = resp?.data || []
								setCityLookup(city);
								setStateLookup(state);
								setDistrictLookup(district);

								addressList[index]['country'] = addData.country;
								addressList[index]['postcode'] = postCode;
								addressList[index]['state'] = addData.state;
								addressList[index]['district'] = addData.district;
								addressList[index]['city'] = addData.city;
								setAddressData({...address, ...addressData, ...addData });
								setAddressList([...addressList]);
								setError({ ...{} });
							} else {
								setPostCodeError("Postcode details not available");
							}
						}
					})
					.catch((error) => {
						console.error(error);
					});
			}, 2000);

			return () => clearTimeout(delayDebounceFn);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [postCode]);

	useEffect(() => {
		if (addressData) {
			delete addressData?.postCode;
			setAddressList([addressData])
		}
	}, [addressData])

	return (
		<div className="">
			<div className='col-md-12 mt-2 mb-0'>
				{!readOnly && (
					<React.Fragment>
						<a className='txt-underline' onClick={() => !readOnly && loadMap()}>
							<img src={detectLocation} className="img-fluid pr-1" alt="" />Choose Location
						</a>
						<Modal size="lg" id="map" aria-labelledby="contained-modal-title-vcenter" centered show={isMapOpen} onHide={() => setIsMapOpen(false)} dialogClassName="cust-lg-modal">
							<Modal.Header>
								<Modal.Title><h5 className="modal-title">Choose Location</h5></Modal.Title>
								<CloseButton onClick={() => setIsMapOpen(false)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>

								</CloseButton>
							</Modal.Header>
							<Modal.Body>
								<AddressMap data={{
									addressData: addressData,
									latitude,
									longitude,
									countries
								}}
									lookups={{
										addressElements: addressLookUpRef
									}}
									error={addressError}
									setError={setAddressError}
									handler={{
										setAddressData: setAddressData,
										setAddressLookUpRef,
										setAddressString,
										fetchCountryList
									}} />
							</Modal.Body>
						</Modal>
					</React.Fragment>
				)}
			</div>
			<div className="row mt-3">
				<div className="col-md-6">
					<div className="form-group">
						<label htmlFor="addressType" className="control-label">Address Type &nbsp;<span>*</span></label>
						<select
							id="addressType"
							defaultValue={addressData?.addressType}
							disabled={readOnly}
							className={`form-control ${error.addressType ? "input-error" : ""}`}
							onChange={(e) => {
								handleInputChange(e.target.id, e.target.value);
								setError({ ...error, addressType: "" })
								handleOnChange(e)
							}}>
							<option value="">Select Address Type</option>
							{addressTypeLookup && addressTypeLookup.map((e) => (
								<option key={e.code} value={e?.code}>
									{e?.description}
								</option>
							))}
						</select>
						<span className="errormsg">
							{error.addressType ? error.addressType : ""}
						</span>
					</div>
				</div>
				<div className="col-md-6">
					<div className="form-group">
						<label htmlFor="address1" className="control-label">Address Line 1&nbsp;<span>*</span></label>
						<input
							type="text"
							defaultValue={addressData?.address1 && addressData?.address1?.replace(/^,/, '') || ''}
							disabled={readOnly}
							className={`form-control ${error?.address1 ? "input-error" : ""}`}
							id="address1"
							placeholder="Flat/House/Unit No"
							maxLength="100"
							onChange={(e) => {
								setError({ ...error, address1: "" });
								handleInputChange(e.target.id, e.target.value);
							}} />
						<span className="errormsg">
							{error.address1 ? error.address1 : ""}
						</span>
					</div>
				</div>
				<div className="col-md-6">
					<div className="form-group">
						<label htmlFor="address2" className="control-label">Address Line 2&nbsp;<span>*</span></label>
						<input
							type="text"
							className={`form-control ${error?.address2 ? "input-error" : ""}`}
							defaultValue={addressData?.address2 && addressData?.address2?.replace(/^,/, '') || ''}
							disabled={readOnly}
							id="address2"
							placeholder="Street/Road/Junction"
							maxLength="100"
							onChange={(e) => {
								handleInputChange(e.target.id, e.target.value);
								setError({ ...error, address2: "" });
							}} />
						<span className="errormsg">
							{error.address2 ? error.address2 : ""}
						</span>
					</div>
				</div>
				<div className="col-md-6">
					<div className="form-group">
						<label htmlFor="simpang" className="control-label">Address Line 3</label>
						<input
							type="text"
							defaultValue={addressData?.address3 && addressData?.address3?.replace(/^,/, '') || ''}
							disabled={readOnly}
							className="form-control"
							id="address3"
							placeholder="Area/Location"
							maxLength="100"
							onChange={(e) => {
								handleInputChange(e.target.id, e.target.value);
							}} />
					</div>
				</div>
				<div className="col-md-6">
					<div className="form-group">
						<label htmlFor="postcode" className="control-label">Post code/Zip Code&nbsp;<span>*</span></label>
						<input
							type="text"
							defaultValue={addressData?.postcode}
							disabled={readOnly}
							className={`form-control ${error?.postcode ? "input-error" : ""}`}
							id="postcode"
							placeholder="Type to search..."
							maxLength="10"
							onChange={(e) => {
								handleInputChange(e.target.id, e.target.value);
								setPostCode(e.target.value);
								setError({ ...error, postcode: "" });
							}} />
						<span className="errormsg">
							{error.postcode ? error.postcode : ""}
						</span>
					</div>
				</div>
				<div className="col-md-6">
					<div className="form-group">
						<label htmlFor="country" className="control-label">Country&nbsp;<span>*</span></label>
						<Select
							id='country'
							isDisabled={true}
							value={countryLookup.map(e => ({ value: e.code, label: e.description }))?.find(x => addressData?.country === x.value) ?? []}
							options={countryLookup.map(e => ({ value: e.code, label: e.description })) ?? []}
							menuPortalTarget={document.modal}
							styles={{
								container: base => ({ ...base, border: error?.country ? '1px solid red' : '1px solid #ccc' }),
								menuPortal: base => ({ ...base, zIndex: 9999 })
							}}
							getOptionLabel={option => `${option.label}`}
							isMulti={false}
							onChange={(selected) => {
								handleInputChange('country', selected);
								setError({ ...error, country: "" });
								handleClear();
								handleOnChange({
									target: { id: 'country', value: selected?.value }
								});
							}}
						/>
						<span className="errormsg">
							{error.country ? error.country : ""}
						</span>
					</div>
				</div>
				<div className="col-md-6">
					<div className="form-group">
						<label htmlFor="state" className="control-label">State&nbsp;<span>*</span></label>
						<select
							id="state"
							className={`form-control ${error.state ? "input-error" : ""}`}
							disabled={readOnly}
							onChange={(e) => {
								handleInputChange(e.target.id, e.target.value);
								setError({ ...error, state: "" })
								handleOnChange(e)
							}}>
							<option value="">Select State</option>
							{stateLookup && stateLookup?.map((e) => (
								<option key={e} selected={addressData?.state === e} value={e}>
									{e}
								</option>
							))}
						</select>
						<span className="errormsg">
							{error.state ? error.state : ""}
						</span>
					</div>
				</div>
				<div className="col-md-6">
					<div className="form-group">
						<label htmlFor="district" className="control-label">District&nbsp;<span>*</span></label>
						<select
							id="district"
							className={`form-control ${error.district ? "input-error" : ""}`}
							disabled={readOnly}
							onChange={(e) => {
								setError({ ...error, district: "" });
								handleInputChange(e.target.id, e.target.value);
							}}
						>
							<option value="">Select...</option>
							{districtLookup && districtLookup.map((e) => (
								<option key={e} selected={addressData?.district === e} value={e}>
									{e}
								</option>
							))}
						</select>
						<span className="errormsg">
							{error.district ? error.district : ""}
						</span>
					</div>
				</div>
				<div className="col-md-6">
					<div className="form-group">
						<label htmlFor="city" className="control-label">City&nbsp;<span>*</span></label>
						<select
							id="city"
							className={`form-control ${error.city ? "input-error" : ""}`}
							disabled={readOnly}
							onChange={(e) => {
								setError({ ...error, city: "" });
								handleInputChange(e.target.id, e.target.value);
							}}
						>
							<option value="">Select...</option>
							{cityLookup && cityLookup.map((e) => (
								<option key={e} selected={addressData?.city === e} value={e}>
									{e}
								</option>
							))}
						</select>
						<span className="errormsg">
							{error.city ? error.city : ""}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AddressComponent;
