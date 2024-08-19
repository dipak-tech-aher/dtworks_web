import React, { useState, useEffect } from 'react';
import ReactSelect from 'react-select';
import { get } from "../../common/util/restUtil";
import { properties } from "../../properties";
const countryFlags = require("../../assets/files/country_flags.json");

export default function SelectCountry({ value, onChange,error=false, ...props }) {
    const [countryLookup, setCountryLookup] = useState()
   
    useEffect(() => {
        get(properties.BUSINESS_ENTITY_API + '?searchParam=code_type&valueParam=COUNTRY')
            .then((resp) => {
                if (resp.data) {
                    setCountryLookup(resp.data.COUNTRY)
                }
            })

    }, [])

    return (
        <>
            <ReactSelect
                className={error ? 'error-border' : ''}
                // value={value}
                value={countryLookup?.map(e => ({ value: e.code, label: e.description, mapping: e.mapping }))?.find(x => value == x.mapping.countryCode) ?? null}

                onChange={(e) => {
                    onChange(e)
                }
                }
                // options={phoneNoPrefix}
                options={countryLookup?.map(e => ({ value: e.code, label: e.description, mapping: e.mapping }))}

                formatOptionLabel={country => {
                    let countryImage = countryFlags.find(e => e.name === country.label)?.image;
                    return (
                        <div className="country-option">
                            <img src={countryImage} height={25} width={40} alt="" />
                            <span>{country.label}</span>
                        </div>
                    )
                }}
                {...props}
            />
            {error&& <span className="errormsg">prefix is requried</span>}
        </>
       
    )
}