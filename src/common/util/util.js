import { useLayoutEffect, useState,useEffect } from "react"
import { properties } from "../../properties";
import { get } from "./restUtil";
import { isEmpty,isEqual } from 'lodash'
export function computeDynamicBaseURL() {
    const pathname = window?.location?.pathname;

    let baseSegments = pathname.split('/').filter(segment => segment !== '');
    // console.log('baseSegments ', baseSegments)
    if (baseSegments.length > 1) {
        baseSegments = baseSegments.slice(0, 1);
    }

    let baseURL = '/' + baseSegments.join('/');
    // console.log('baseURL=>', baseURL)

    if (baseURL.endsWith('/user/login')) {
        baseURL += '/';
    }

    return baseURL;
}



export function getProp(object, keys, defaultVal) {
    keys = Array.isArray(keys) ? keys : keys.split('.')
    object = object[keys[0]]
    if (object && keys.length > 1) {
        return getProp(object, keys.slice(1), defaultVal)
    }
    return object ? object : defaultVal
}

export function customSort(collection = [], columnName, sortingOrder) {
    let sort1 = -1, sort2 = 1;
    const isAscendingSort = sortingOrder[columnName]
    if (isAscendingSort === false) {
        sort1 = 1;
        sort2 = -1;
    }
    return collection.sort(function (val1, val2) {
        let value1 = getProp(val1, columnName, '');
        let value2 = getProp(val2, columnName, '');
        // check for date data type
        if (typeof value1 !== "number") {
            value1 = value1 ? value1.toLowerCase() : value1
            value2 = value2 ? value2.toLowerCase() : value2
            if (value1 === value2) {
                return 0;
            }
        } else {
            if (value1 === value2) {
                return 0;
            }
        }
        return value1 < value2 ? sort1 : sort2;
    })
}

export const deepClone = (data) => {
    return JSON.parse(JSON.stringify(data))
}
export const constructSortingData = function (sortingOrder, column, defaultValue) {
    const response = deepClone(sortingOrder)
    for (const key in response) {
        if (response.hasOwnProperty(key)) {
            if (key === column) {
                if (response[column] === true || response[column] === false) {
                    response[column] = defaultValue || !response[column]
                } else {
                    response[column] = true
                }
            } else {
                response[key] = ""
            }
        }
    }
    return response
}

export const genderOptions = [
    {
        label: 'Male',
        value: 'M'
    }, {
        label: 'Female',
        value: 'M'
    }, {
        label: 'Other',
        value: 'other'
    }, {
        label: 'Unknown',
        value: 'unknown'
    },
]

export const getDisplayOptionForGender = (value) => {
    const displayOption = genderOptions.find((gender) => {
        return gender.value === value
    })
    return displayOption ? displayOption.label : ""
}

export const formFilterObject = (filters) => {
    return filters.map((filter) => {
        const { id, value } = filter;
        return {
            id,
            value: value[0],
            filter: value[1]
        }
    })
}

export const filterLookupBasedOnType = (lookup, mappingValue, mappingKey) => {
    return lookup.filter((data) => {
        let isTrue = false;
        if (data.mapping && data.mapping.hasOwnProperty(mappingKey) && data.mapping[mappingKey].includes(mappingValue)) {
            return isTrue = true;
        }
        return isTrue;
    })
}

export const getServiceCategoryMappingBasedOnProdType = (prodTypeLookupdate, serviceType) => {
    return prodTypeLookupdate.find((type) => type?.code === serviceType)?.mapping;
}

export const validateToDate = (fromDate, toDate) => {
    try {
        if (Date.parse(fromDate) < Date.parse(toDate))
            return false;
        return true
    } catch (e) {
        return false
    }
}

export const USNumberFormat = (price) => {
    if (price === null || price === "" || price === undefined) {
        return '$0.00';
    }
    let dollar = Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
    })
    return dollar.format(Number(price));
}


export const negativeToPostiveConversion = (data) => {
    if (!isNaN(data)) {
        return data < 0 ? Math.abs(data) : data
    }
    return data
}

export const validateNumber = (object) => {
    const pattern = new RegExp("^[0-9]");
    let key = String.fromCharCode(!object.charCode ? object.which : object.charCode);
    let temp = pattern.test(key)
    if (temp === false) {
        object.preventDefault();
        return false;
    }
}

export const validateEmail = (object) => {
    const pattern = new RegExp("^[a-zA-Z0-9@._-]{1,100}$");
    let key = String.fromCharCode(!object.charCode ? object.which : object.charCode);
    let temp = pattern.test(key)
    if (temp === false) {
        object.preventDefault();
        return false;
    }
}

export const validate = (schema, data, setError) => {
    try {
        setError({});
        schema.validateSync(data, { abortEarly: false });
    } catch (e) {
        e.inner.forEach((err) => {
            setError((prevState) => {
                return { ...prevState, [err.params.path]: err.message };
            });
        });
        return e;
    }
};

export const RegularModalCustomStyles = {
    content: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
        maxHeight: '90%',
        // height: 'auto'  /**Srini commented this as the height of pop up should not be changed. Please discuss before touching */
    }
}

export const handleOnDownload = (entityId, entityType, id) => {

    get(`${properties.ATTACHMENT_API}/${id}?entity-id=${entityId}&entity-type=${entityType}`)
        .then((resp) => {
            if (resp.data) {
                var a = document.createElement("a");
                a.href = resp.data.content;
                a.download = resp.data.fileName;
                a.click();
            }
        })
        .catch((error) => {
            console.error("error", error)
        })
        .finally(() => {

        })
}

export const handleOnAttchmentDownload = (id) => {

    get(`${properties.COMMON_API}/download-files/${id}`)
        .then((resp) => {
            if (resp.data) {
                try {
                    var a = document.createElement("a");

                    // Assuming resp?.data?.url is a Base64-encoded string
                    var base64Data = resp?.data?.url;

                    // Convert the Base64 string to a Blob
                    var byteCharacters = atob(base64Data);
                    var byteNumbers = new Array(byteCharacters.length);
                    for (var i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    var byteArray = new Uint8Array(byteNumbers);
                    var blob = new Blob([byteArray], { type: 'application/octet-stream' });

                    // Create a data URL from the Blob
                    var blobUrl = URL.createObjectURL(blob);

                    // Set the href and download attributes
                    a.href = blobUrl;
                    a.download = resp?.data?.fileName;

                    // Trigger a click on the anchor to initiate the download
                    a.click();

                    // Release the object URL after the download starts
                    URL.revokeObjectURL(blobUrl);
                } catch (error) {
                    var a = document.createElement("a");
                    a.href = resp?.data?.url;
                    a.download = resp?.data?.fileName;
                    a.click();
                }
            }
        })
        .catch((error) => {
            console.error("error", error)
        })
        .finally(() => {

        })
}

export const getReleventHelpdeskDetailedData = (source, data) => {
    if (['LIVECHAT', 'WHATSAPP'].includes(source)) {
        let chatData = data?.chat[0]
        if (chatData) {
            chatData.message = chatData?.message || []
            chatData.messageColorAlign = chatData?.messageColorAlign || []

            return { ...data, ...data?.chat[0] }
        } else {
            return data
        }

    }
    else {
        return data
    }
}

export const removeDuplicates = (arr) => {
    return arr.filter((item,
        index) => arr.indexOf(item) === index);
}
export const removeDuplicatesFromArrayObject = (arr, uniqueElement) => {
    let newArray = []
    let uniqueObject = {};
    for (const i in arr) {
        // Extract the statement
        const item = arr[i][uniqueElement];
        // Use the statement as the index    
        if (item) {
            uniqueObject[item] = arr[i];
        }

    }

    // Loop to push unique object into array
    for (const i in uniqueObject) {
        newArray.push(uniqueObject[i]);
    }

    return newArray
}

export const removeEmptyKey = (payload) => {
    let response = {}
    if (!isEmpty(payload)) {
        response = Object.entries(payload).reduce((a, [k, v]) => (v ? (a[k] = v, a) : a), {})
    }
    return response
}

export const makeFirstLetterLowerOrUppercase = (inputString, type) => {
    if (type === "lowerCase") {
        return inputString.charAt(0).toLowerCase() + inputString.slice(1);
    } else if (type === "upperCase") {
        return inputString.charAt(0).toUpperCase() + inputString.slice(1);
    }
};

export const numberFormatter = (num, digits) => {
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "G" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var item = lookup.slice().reverse().find(function (item) {
        return num >= item.value;
    });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}

export const groupBy = (items, key) => items.reduce(
    (result, item) => ({
        ...result,
        [item[key]]: [
            ...(result[item[key]] || []),
            item,
        ],
    }),
    {},
);

export const pageStyle = `
    @print {
        @page :footer {
            display: none
        }

        @page :header {
            display: none
        }
    }
    @media all {
        .page-break {
        display: none;
        }
    }      
    @media print {
        .page-break {
        margin-top: 1rem;
        display: block;
        page-break-before: auto;
        }
    }

    @page {
        size: auto;
        margin: 12mm;
    }

`;



export function convertToIntlCurrency(labelValue) {
    console.log('labelValue------------>', labelValue)
    const suffixes = ["", "K", "M", "B", "T"];
    const magnitude = Math.floor(Math.log10(Math.abs(Number(labelValue))) / 3);
    const formattedValue = (Math.abs(Number(labelValue)) / Math.pow(10, magnitude * 3)).toFixed(2);
    console.log("formattedValue + suffixes[magnitude]-------->", formattedValue + suffixes[magnitude])
    return formattedValue + suffixes[magnitude];
}

export async function getPermissions(screenCode) {
    if (screenCode) {
        try {
            const resp = await get(properties.ROLE_API + "/permission/" + screenCode);
            return resp.data;
        } catch (error) {
            console.log(error);
            return null; // or handle the error in another way
        }
    }
}

export async function getConfig(systemConfig,configName) {
    if (configName && systemConfig) {
        try {
            let config =  systemConfig.find(val=>{
                if(val.configKey == configName){
                    return val
                }
            })
            return config;
        } catch (error) {
            console.log(error);
            return null; // or handle the error in another way
        }
    }
}

export const containSpecialCharacter = (string) => {
    var format = /[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>/?]+/;
    return format?.test(string);
}

export const generateRandomString = (length) => {
    const characters = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

export function useSizeComponents(ref) {
    const [size, setSize] = useState([0, 0])

    useLayoutEffect(() => {
        function updateSize() {
            let newSize = [window.innerWidth, window.innerHeight]
            if (ref?.current) {
                newSize = [ref.current.offsetWidth, ref.current.offsetHeight]
            }
            setSize(newSize)
        }
        window.addEventListener('resize', updateSize)
        updateSize()
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    return size
}

export const getRandomId = () => Math.floor(100000 + Math.random() * 900000)

//1 day 3 hours 55 mins 55 secs
export const convertSecondsToDays = (seconds) => {
    if(!seconds) return 0;
    const days = Math.floor(seconds / (24 * 3600));
    seconds %= (24 * 3600);

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    // Constructing the formatted string
    let result = '';
    if (days > 0) {
        result += `${days} day${days > 1 ? 's' : ''} `;
    }
    if (hours > 0) {
        result += `${hours} hour${hours > 1 ? 's' : ''} `;
    }
    if (minutes > 0) {
        result += `${minutes} min${minutes > 1 ? 's' : ''} `;
    }
    if (seconds > 0 || result === '') { // Include seconds even if zero if the result is empty
        result += `${seconds} sec${seconds !== 1 ? 's' : ''}`;
    }

    return result.trim();
}
export const useDeepCompareEffect = (callback, dependencies) => {
    const [lastDependencies, setLastDependencies] = useState([]);

    useEffect(() => {
        if (!isEqual(lastDependencies, dependencies)) {
            callback();
            setLastDependencies(dependencies);
        }
    }, [dependencies, lastDependencies, callback]);
}
