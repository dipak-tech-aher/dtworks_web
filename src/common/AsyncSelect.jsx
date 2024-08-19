import { properties } from "../properties";
import { slowPost } from "./util/restUtil";
import AsyncSelect from 'react-select/async'

const CustomAsyncSelect = ({ selectPlaceholder = 'type to search', url, id, isDisabled = false, menuPortalTarget, options = [{}], formatOptionLabel, isMulti = false, value = null, handleOnChange }) => {

    const loadOptions = (inputValue, filters) => {
        return new Promise((resolve, reject) => {
            // using setTimeout to emulate a call to server
            setTimeout(() => {
                getOptions(inputValue)
                    .then((response) => {
                        resolve(response); // Resolve with the response obtained from getOptions
                    })
                    .catch((error) => {
                        reject(error); // Reject with the error if getOptions fails
                    });
            }, 2000);
        });
    }

    const getOptions = (inputValue) => {
        if (inputValue) {
            return new Promise((resolve, reject) => {
                slowPost(url, {
                    filters: [{ id: "firstName", value: inputValue, filter: "contains" }]
                })
                    .then((resp) => {
                        if (resp.status === 200) {
                            const response = resp.data.rows ?? []
                            const formattedResponse = response.map(item => ({ label: item.firstName, value: item.userId, extraInfo: item.mappingPayload }))
                            resolve(formattedResponse); // Resolve with the formatted response
                        } else {
                            reject(new Error('Request failed')); // Reject if the response status is not 200
                        }
                    })
                    .catch((error) => {
                        console.error(error);
                        reject(error); // Reject with the error caught during the slowPost
                    });
            });
        } else {
            return Promise.resolve([]); // Resolve with an empty array if inputValue is falsy
        }
    }

    return (
        <AsyncSelect key={id}
            id={id}
            isClearable
            placeholder={selectPlaceholder}
            isDisabled={isDisabled}
            menuPortalTarget={menuPortalTarget}
            styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
            options={options}
            formatOptionLabel={formatOptionLabel}
            isMulti={isMulti}
            value={value}
            onChange={(val) => handleOnChange({ target: { id: id, value: val, selected: val } })}
            defaultOptions
            cacheOptions
            loadOptions={loadOptions}
        />
    )
}

export default CustomAsyncSelect;