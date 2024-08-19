import React, { useState, useEffect } from "react";
import { get, post } from "../../common/util/restUtil";
import { properties } from "../../properties";
import ReactSelect from 'react-select';
import { toast } from "react-toastify";
const countryFlags = require("../../assets/files/country_flags.json");

const AddressComponent = ({ index, countryLookup, addressList, setAddressList, formErrors, deleteAddressRow, isRead = false, isEdit }) => {
	const addressData = addressList[index];
	const [addressElements, setAddressElements] = useState([]);
	const [postCode, setPostCode] = useState(addressData?.postcode);
	const [postCodeError, setPostCodeError] = useState("");

	const [districtLookup, setDistrictLookup] = useState([]);
	const [stateLookup, setStateLookup] = useState([]);
	const [cityLookup, setCityLookup] = useState([]);

	const handleInputChange = (field, value, e) => {
		if (field === 'isPrimary') {
			if (!e?.target?.checked) {
				const updatedAddressList = addressList.map((ele) => {
					return { ...ele, isPrimary: false };
				});
				setAddressList(updatedAddressList);
				const isPrimaryAlreadyExists = updatedAddressList?.find(obj => obj?.isPrimary);
				if (isPrimaryAlreadyExists?.isPrimary) {
					toast.error("Only one primary address is allowed");
					e.target.checked = false;
					return;
				} else {
					addressList[index][field] = value;
					setAddressList([...deleteEmptyProperties(field, addressList)]);
				}
			} else {
				const isPrimaryAlreadyExists = addressList.find(obj => obj?.isPrimary);
				if (isPrimaryAlreadyExists?.isPrimary) {
					toast.error("Only one primary address is allowed");
					e.target.checked = false;
					return;
				} else {
					addressList[index][field] = value;
					setAddressList([...deleteEmptyProperties(field, addressList)]);
				}
			}
		}
		else {
			addressList[index][field] = value;
			setAddressList([...deleteEmptyProperties(field, addressList)]);
		}
	}

	function deleteEmptyProperties(prop, obj) {
		if (obj[0].hasOwnProperty(prop) && obj[0][prop] === '') {
			delete obj[0][prop];
		}
		return obj
	}

	const handleOnChange = (e) => {
		const { id, value } = e.target;
		let district = [],
			state = [],
			city = [];
		if (id === "country") {
			addressElements?.map((a) => {
				if (a?.country === value) {
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

				if (addressData.district != "") {
					setDistrictLookup(district);
				}
				if (addressData.city != "") {
					setCityLookup(city);
				}
			});
			setStateLookup(state);
		} else if (id === "postcode") {
			addressElements?.map((a) => {
				if (a?.postCode === value) {
					if (!state.includes(a?.state)) {
						state.push(a?.state);
					}
				}
			});
			setStateLookup(state);
		} else if (id === "state") {
			addressElements?.map((a) => {
				if (a?.state === value) {
					if (!district.includes(a.district)) {
						district.push(a.district);
					}
					if (!city.includes(a?.city)) {
						city.push(a?.city);
					}
				}
			});
			setDistrictLookup(district);
		} else if (id === "district") {
			addressElements?.map((a) => {
				if (a?.district === value) {
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

	useEffect(() => {
		let city = [], district = [], state = [], url;
		if (addressData?.country) {
			url = `${properties.ADDRESS_LOOKUP_API}?country=${addressData?.country}`
		} else if (addressData?.state) {
			url = `${properties.ADDRESS_LOOKUP_API}?state=${addressData?.state}`
		} else if (addressData?.city) {
			url = `${properties.ADDRESS_LOOKUP_API}?city=${addressData?.city}`
		}
		if (url) {
			get(url).then((resp) => {
				if (resp && resp.data) {
					setAddressElements(resp.data);
					if (addressData) {
						for (let e of resp.data) {
							if (!district.includes(e.district)) {
								district.push(e.district);
							}
							if (!state.includes(e.state)) {
								state.push(e.state);
							}
							if (!city.includes(e.city)) {
								city.push(e.city);
							}
						}
						setDistrictLookup(district);
						setStateLookup(state);
						setCityLookup(city);
						if (addressData?.city) {
							addressList[index]['district'] = resp.data?.[0].district;
						}
					}
				}
			}).catch((error) => {
				console.error(error);
			});
		}
	}, [addressData?.country, addressData?.state]);

	useEffect(() => {
		setPostCodeError("");
		if (postCode) {
			const delayDebounceFn = setTimeout(() => {
				get(`${properties.ADDRESS_LOOKUP_API}?postCode=${postCode}`)
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

								setCityLookup(city);
								setStateLookup(state);
								setDistrictLookup(district);
								addressList[index]['country'] = addData.country;
								addressList[index]['state'] = addData.state;
								addressList[index]['district'] = addData.district;
								addressList[index]['city'] = addData.city;

								setAddressList([...addressList]);
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
	}, [postCode]);

	return (
		<tr key={index}>
			<td>
				<input
					disabled={isEdit || isRead}
					type="checkbox"
					value={!!addressData?.isPrimary}
					checked={!!addressData?.isPrimary}
					className={`form-control`}
					id="isPrimary"
					required
					onChange={(e) => {
						handleInputChange(e.target.id, e.target.checked, e);
					}}
				/>
				{(formErrors[`addressList[${index}].isPrimary`] || formErrors['addressList']) && (
					<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`addressList[${index}].isPrimary`] ?? formErrors['addressList'] ?? ''}</span>
				)}
			</td>
			<td>
				<input
					disabled={isEdit || isRead}
					type="text"
					value={addressData?.address1 ?? ''}
					className={`form-control`}
					maxLength={100}
					id="address1"
					placeholder="Flat/House/Unit No"
					required
					onChange={(e) => {
						handleInputChange(e.target.id, e.target.value, e);
					}}
				/>
				{formErrors[`addressList[${index}].address1`] && (
					<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`addressList[${index}].address1`]}</span>
				)}
			</td>
			<td>
				<input
					disabled={isEdit || isRead}
					type="text"
					className={`form-control`}
					value={addressData?.address2 ?? ''}
					maxLength={100}
					id="address2"
					required
					placeholder="Street/Road/Junction"
					onChange={(e) => {
						handleInputChange(e.target.id, e.target.value, e);
					}}
				/>
				{formErrors[`addressList[${index}].address2`] && (
					<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`addressList[${index}].address2`]}</span>
				)}
			</td>
			<td>
				<input
					disabled={isEdit || isRead}
					type="text"
					value={addressData?.address3 ?? ''}
					className="form-control"
					id="address3"
					maxLength={100}
					required
					placeholder="Area/Location"
					onChange={(e) => {
						handleInputChange(e.target.id, e.target.value, e);
					}}
				/>
				{formErrors[`addressList[${index}].address3`] && (
					<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`addressList[${index}].address3`]}</span>
				)}
			</td>
			<td>
				<input
					disabled={isEdit || isRead}
					type="text"
					// defaultValue={addressData?.postcode ?? ''}
					value={addressData?.postcode ?? ''}
					className={`form-control`}
					id="postcode"
					placeholder="type to search..."
					maxLength="10"
					onChange={(e) => {
						handleInputChange(e.target.id, e.target.value, e);
						setPostCode(e.target.value);
					}}
				/>
				{formErrors[`addressList[${index}].postcode`] && (
					<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`addressList[${index}].postcode`]}</span>
				)}
			</td>
			<td>
				<ReactSelect
					isDisabled={isEdit || isRead}
					id='country'
					placeholder="Select Country"
					menuPortalTarget={document.body}
					styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
					options={countryLookup.map(e => ({ value: e.code, label: e.description }))}
					formatOptionLabel={country => {
						let countryImage = countryFlags.find(e => e.name == country.label)?.image;
						return (
							<div className="country-option">
								<img src={countryImage} height={25} width={40} />
								<span>{country.label}</span>
							</div>
						)
					}}
					onChange={(selected) => {
						handleInputChange('country', selected.value, null);
						handleClear();
						handleOnChange({
							target: { id: 'country', value: selected.value }
						});
					}}
					value={countryLookup.map(e => ({ value: e.code, label: e.description }))?.find(x => addressData.country == x.value) ?? null}
				/>
				{formErrors[`addressList[${index}].country`] && (
					<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`addressList[${index}].country`]}</span>
				)}
			</td>
			<td>
				<select id="state" className={`form-control`} disabled={isEdit || isRead} onChange={(e) => {
					handleInputChange(e.target.id, e.target.value, e);
					handleOnChange(e);
				}}>
					<option value="">Select State</option>
					{stateLookup && stateLookup.map((e) => (
						<option key={e} selected={addressData.state == e} value={e}>
							{e}
						</option>
					))}
				</select>
				{
					formErrors[`addressList[${index}].state`] && (
						<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`addressList[${index}].state`]}</span>
					)
				}
			</td >
			<td>
				<select id="city" className={`form-control`} disabled={isEdit || isRead} onChange={(e) => {
					handleInputChange(e.target.id, e.target.value, e);
				}}>
					<option value="">Select...</option>
					{cityLookup && cityLookup.map((e) => (
						<option key={e} selected={addressData.city == e} value={e}>
							{e}
						</option>
					))}
				</select>
				{
					formErrors[`addressList[${index}].city`] && (
						<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`addressList[${index}].city`]}</span>
					)
				}
			</td >
			<td align="center" hidden={isRead}>
				<button disabled={isEdit} onClick={(e) => deleteAddressRow(e, index)} className="btn btn-danger btn-sm">
					Delete
				</button>
			</td>
		</tr >
	);
};

export default AddressComponent;
