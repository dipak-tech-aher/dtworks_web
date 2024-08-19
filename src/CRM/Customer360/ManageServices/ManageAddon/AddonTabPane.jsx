import React, { useEffect, useRef, useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import { toast } from 'react-toastify';
import moment from 'moment'
// import { get, put, post} from '../../../util/restUtil';
// import { hideSpinner, showSpinner } from "../../../common/spinner";
// import { properties } from "../../../properties";
// import { negativeToPostiveConversion, USNumberFormat } from '../../../util/util';
import { get, put, post } from '../../../../common/util/restUtil';
import { properties } from "../../../../properties";
import { negativeToPostiveConversion, USNumberFormat } from '../../../../common/util/util';

const AddonTabPane = (props) => {

    const { manageServiceRef, selectedAccount, serviceBadge } = props?.data
    const { setIsManageServicesOpen, pageRefresh } = props.handlers;
    const type = manageServiceRef.current?.source ? manageServiceRef.current?.source : ''
    const addAddonRef = useRef(null)
    const [showHideAddonCard, setShowHideAddonCard] = useState(false)
    const [showHideActiveAddonCardCheckbox, setShowHideActiveAddonCardCheckbox] = useState(false)
    const [activeAddonList, setActiveAddonList] = useState([])
    const [availableAddonList, setAvailableAddonList] = useState([])
    const [searchInput, setSearchInput] = useState("")
    const [filteredAddonList, setFilteredAddonList] = useState([])
    console.log('manageServiceRef?.current?.srvcCatDesc.description?.toUpperCase()------------>', manageServiceRef?.current
    )
    useEffect(() => {
        let requestBody = manageServiceRef?.current?.serviceObject?.mappingPayload?.addonId || []
        if (!!requestBody.length && manageServiceRef?.current?.srvcCatDesc.description?.toUpperCase() === "FIXED") {
            post(properties.ADDON_API + "/list", requestBody)
                .then((response) => {
                    if (response.data.length > 0) {
                        setActiveAddonList(response?.data.map((addon) => { addon.isSelected = false; return addon }))
                    }
                })
                .finally()
        }
        else if (manageServiceRef?.current?.srvcCatDesc.description?.toUpperCase() === "PREPAID" || manageServiceRef?.current?.srvcCatDesc.description?.toUpperCase() === "POSTPAID") {

            get(properties.ADDON_API + "/get-purchased-addon/" + manageServiceRef?.current?.customerDetails?.customerRefNo)
                .then((resp) => {
                    if (resp.data) {
                        let data = resp.data.service.filter((e) => { if (e.status === 'active') { return true } else { return false } })
                        data = data.map((addon) => { addon.isSelected = false; return addon })
                        // const data = resp.data.service.map((addon) => { addon.isSelected = false; return addon })
                        setActiveAddonList(data)
                    }
                }).finally()
        }
    }, [])

    const handleInputChange = (e) => {
        if (e.target.value === '') {
            setSearchInput(e.target.value)
            setFilteredAddonList(availableAddonList)
            return
        }
        unstable_batchedUpdates(() => {
            setSearchInput(e.target.value)
            const filteredList = availableAddonList.filter((value) => {
                if (value?.productName) {
                    return value?.productName?.toString().toLowerCase().indexOf(e.target.value.toLowerCase()) >= 0;
                }
                return value?.productName?.toString().toLowerCase().indexOf(e.target.value.toLowerCase()) >= 0;
            })
            setFilteredAddonList(filteredList)
        })
    }

    const handleAddAddon = () => {
        unstable_batchedUpdates(() => {
            const condition = !showHideAddonCard
            setShowHideAddonCard(!showHideAddonCard)
            setShowHideActiveAddonCardCheckbox(false)
            if (condition) {
                get(`${properties.ADDON_API}/service?type=${manageServiceRef?.current?.srvcCatDesc?.code}`)
                    .then((response) => {
                        if (response.data.length > 0) {
                            setAvailableAddonList(response?.data.map((addon) => { addon.isSelected = false; return addon; }))
                            setFilteredAddonList(response?.data.map((addon) => { addon.isSelected = false; return addon; }))
                        }
                    })
                    .finally(() => {
                        if (addAddonRef !== null || addAddonRef !== undefined) {
                            addAddonRef.current.scrollIntoView({ top: addAddonRef.current.offsetTop, behavior: 'smooth', block: "start" })
                        }
                    })
            }
        })
    }

    const handleDeactivateAddon = () => {
        if (!!activeAddonList.length) {
            unstable_batchedUpdates(() => {
                setShowHideAddonCard(false)
                setShowHideActiveAddonCardCheckbox(!showHideActiveAddonCardCheckbox)
            })
        }
        else {
            toast.error("No Addons Available to De-Activate")
        }
    }

    const handleActiveIsSelected = (index) => {
        setActiveAddonList((previousState) => {
            previousState[index]['isSelected'] = (previousState[index]['isSelected'] === true) ? false : true;
            return [...previousState];
        });
    }

    const handleAvailableIsSelected = (index) => {
        setFilteredAddonList((previousState) => {
            previousState[index]['isSelected'] = (previousState[index]['isSelected'] === true) ? false : true;
            return [...previousState];
        });
    }

    const handleSubmitActivateDeActivate = (operationType) => {
        let addonList = []
        if (operationType === 'ACTIVATE') {
            if (manageServiceRef?.current?.srvcCatDesc.description?.toUpperCase() === "FIXED") {
                filteredAddonList.map((addon) => { if (addon?.isSelected === true) addonList.push(addon?.addonId); })
            }
            else if (manageServiceRef?.current?.srvcCatDesc.description?.toUpperCase() === "PREPAID" || manageServiceRef?.current?.srvcCatDesc.description?.toUpperCase() === "POSTPAID") {
                filteredAddonList.map((addon) => { if (addon?.isSelected === true) { addonList.push(addon); } })
            }
        }
        if (operationType === 'DEACTIVATE') {
            activeAddonList.map((addon) => { if (addon?.isSelected === true) addonList.push(addon?.addonId); })
        }
        if (addonList.length === 0) {
            toast.error("Please Select Addon to Activate")
            return false
        }

        if (addonList.length > 1) {
            toast.error("Please Select Only one Addon to Activate")
            return false
        }

        let requestBody = {}
        if (manageServiceRef?.current?.srvcCatDesc.description?.toUpperCase() === "FIXED") {
            requestBody = {
                customerId: selectedAccount?.customerId,
                accountId: selectedAccount?.accountId,
                serviceId: manageServiceRef.current?.serviceObject?.connectionId,
                addonId: addonList,
                status: operationType
            }
                ;
            put(`${properties.CONNECTION_ADDON_API}?type=${type.toUpperCase()}`, requestBody)
                .then((response) => {
                    if (response.status === 200) {
                        if (operationType === 'ACTIVATE') {
                            toast.success("Successfully Activated the Addon");
                        }
                        if (operationType === 'DEACTIVATE') {
                            toast.success("Successfully De-Activated the Addon");
                        }
                        setIsManageServicesOpen(false)
                        pageRefresh()
                    }

                })
                .catch((error) => {
                    toast.error(error);
                })
                .finally()
        }
        else if (manageServiceRef?.current?.srvcCatDesc.description?.toUpperCase() === "PREPAID" || manageServiceRef?.current?.srvcCatDesc.description?.toUpperCase() === "POSTPAID") {
            requestBody = {
                serviceNo: manageServiceRef?.current?.customerDetails?.customerRefNo,
                name: addonList[0]?.NAME,
                price: negativeToPostiveConversion(addonList[0]?.AMOUNT)
            }
            console.log('request', requestBody)
                ;
            post(`${properties.ADDON_API}/buyAddon`, requestBody)
                .then((response) => {
                    if (response.status === 200) {
                        if (operationType === 'ACTIVATE') {
                            toast.success("Successfully Activated the Addon");
                        }
                        setIsManageServicesOpen(false)
                        pageRefresh()
                    }

                })
                .catch((error) => {
                    toast.error(error);
                })
                .finally()
        }
    }

    return (
        <div id="booster-details71">
            {
                ['WONC', 'WONC-ACCSER', 'WONC-SER', 'BAR', 'UNBAR', 'UPGRADE', 'DOWNGRADE', 'TERMINATE'].includes(serviceBadge) &&
                <h5 className="errormsg ml-2">Activate / De-Activate Addon not available, another Service Request is in process</h5>
            }
            <div className="row col-12">
                <div className="col-6">
                    <h5>Active Add-ons</h5>
                </div>
                <div className="col-6 text-right">
                    {
                        !['WONC', 'WONC-ACCSER', 'WONC-SER', 'BAR', 'UNBAR', 'UPGRADE', 'DOWNGRADE', 'TERMINATE'].includes(serviceBadge) ?
                            <button className="btn btn-sm btn-primary mr-2" type="button"
                                onClick={() => { handleAddAddon() }}
                            >
                                <i className="mr-1 fas fa-shopping-cart"></i>Add New Add-on
                            </button>
                            :
                            <button className="btn btn-sm btn-primary mr-2" type="button" disabled="disabled">
                                <i className="mr-1 fas fa-shopping-cart"></i>Add New Add-on
                            </button>
                    }

                </div>
            </div>
            <div className="row">
                {
                    !!activeAddonList.length ?
                        <>
                            {
                                activeAddonList.map((addon, index) => (
                                    <div className="col-lg-4 mt-2" key={index}>
                                        <div className="card card-body border p-0 m-0">
                                            <div className="text-center">
                                                <div className="col-12 row card-header p-0">
                                                    <div className="col-10">
                                                        <h5 style={{ color: '#ffffff' }}>{addon?.addonName || addon?.productDescription}</h5>
                                                    </div>
                                                    {
                                                        showHideActiveAddonCardCheckbox &&
                                                        <div className="col-2">
                                                            <div className="custom-control custom-checkbox">
                                                                <input type="checkbox" className="custom-control-input" id={`mandatory${addon?.addonId}`}
                                                                    value={addon?.isSelected} checked={addon?.isSelected}
                                                                    onChange={(e) => { handleActiveIsSelected(index) }}
                                                                />
                                                                <label className="container2 problem custom-control-label mb-1" htmlFor={`mandatory${addon?.addonId}`}></label>
                                                            </div>
                                                        </div>
                                                    }
                                                </div>
                                                <div className="row col-12 pr-2 pl-2 mt-1">
                                                    <table className="p-2 mt-1 table table-striped border" style={{ width: "100%" }} cellpadding="2">
                                                        <thead>
                                                            <tr>
                                                                <th className="text-center" style={{ width: "60%" }}>Description</th>
                                                                <th className="text-center" style={{ width: "40%" }}>Detail</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {manageServiceRef?.current?.srvcCatDesc.description?.toUpperCase() === "FIXED" ? <> <tr>
                                                                <td>Start Date</td>
                                                                <td className="text-center">{moment(addon?.startDate).format('DD-MM-YYYY')}</td>
                                                            </tr>

                                                                <tr>
                                                                    <td>RC</td>
                                                                    <td className="text-center">{addon?.productChargesList?.[0]?.chargeDetails?.chargeCat === 'CC_RC' ? USNumberFormat(addon?.productChargesList?.[0]?.chargeAmount) : '-'}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>NRC</td>
                                                                    <td className="text-center">{addon?.productChargesList?.[0]?.chargeDetails?.chargeCat === 'CC_NRC' ? USNumberFormat(addon?.productChargesList?.[0]?.chargeAmount) : '-'}</td>
                                                                </tr>
                                                            </> :
                                                                <> <tr>
                                                                    <td>Start Date</td>
                                                                    <td className="text-center">{addon?.activationDate ? moment(addon?.activationDate).format('DD-MM-YYYY') : '-'}</td>
                                                                </tr>

                                                                    <tr>
                                                                        <td>Price</td>
                                                                        <td className="text-center">{Number(addon?.price) ? USNumberFormat(Number(addon?.price) / 1000000) : '0'}</td>
                                                                    </tr>
                                                                </>
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </>
                        :
                        <>
                            <p className="skel-widget-warning">No Active Addons Available</p>
                        </>

                }
            </div>
            {
                showHideActiveAddonCardCheckbox &&
                <div className="d-flex justify-content-center pt-2">
                    <button type="button" className="btn btn-primary" onClick={() => handleSubmitActivateDeActivate('DEACTIVATE')}>Submit</button>
                    <button type="button" className="ml-2 btn btn-secondary waves-effect waves-light" onClick={() => setIsManageServicesOpen(false)}>Close</button>
                </div>
            }
            {
                showHideAddonCard ?
                    <>
                        <div className="row" ref={addAddonRef}>
                            <div className="card mt-2 p-2 col-12">
                                <div className="row">
                                    <div className="col-6 text-left">
                                        <h5>Add New Add-on</h5>
                                    </div>
                                    <div className="col-6 text-right">
                                    </div>
                                </div>
                                {
                                    !!filteredAddonList.length || !!availableAddonList.length ?
                                        <>
                                            <div className="p-2 row col-12">
                                                <div className="input-group input-group-merge pt-1">
                                                    <input type="text" className="form-control height38" placeholder="Search" style={{ border: "1px solid #ccc" }}
                                                        value={searchInput} onChange={handleInputChange}
                                                    />
                                                    <div className="input-group-append">
                                                        <div className="input-group-text">
                                                            <i className="mdi mdi-filter-outline"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row pb-2">
                                                {
                                                    filteredAddonList.map((addon, index) => (
                                                        <div className="col-lg-4 mt-2" key={index}>
                                                            <div className="card card-body border p-0 m-0">
                                                                <div className="text-center">
                                                                    <div className="col-12 row card-header p-0">
                                                                        <div className="col-10">
                                                                            <h5 style={{ color: '#ffffff' }}>{addon?.productName}</h5>
                                                                        </div>
                                                                        <div className="col-2">
                                                                            <div className="custom-control custom-checkbox">
                                                                                <input type="checkbox" className="custom-control-input" id={`mandatory${addon?.productId}`}
                                                                                    value={addon?.isSelected} checked={addon?.isSelected}
                                                                                    onChange={(e) => { handleAvailableIsSelected(index) }}
                                                                                />
                                                                                <label className="container2 problem custom-control-label mb-1" htmlFor={`mandatory${addon?.productId}`}></label>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="row col-12 pr-2 pl-2 mt-1">
                                                                        <table className="p-2 mt-1 table table-striped border" style={{ width: "100%" }} cellpadding="2">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th className="text-center" style={{ width: "60%" }}>Description</th>
                                                                                    <th className="text-center" style={{ width: "40%" }}>Detail</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td>{addon?.productChargesList?.[0]?.chargeDetails?.chargeCatDesc?.description}</td>
                                                                                    <td className="text-center">{addon?.productChargesList?.[0]?.chargeAmount ? USNumberFormat(addon?.productChargesList?.[0]?.chargeAmount) : '-'}</td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                            <div className="d-flex justify-content-center pt-2">
                                                <button type="button" className="btn btn-primary" onClick={() => handleSubmitActivateDeActivate('ACTIVATE')}>Submit</button>
                                                <button type="button" className="ml-2 btn btn-secondary waves-effect waves-light" onClick={() => setIsManageServicesOpen(false)}>Close</button>
                                            </div>
                                        </>
                                        :
                                        <>
                                            <span className="msg-txt pl-3 p-2">No Addons Available</span>
                                        </>

                                }
                            </div>
                        </div>
                    </>
                    :
                    <>
                    </>
            }
        </div>
    )
}

export default AddonTabPane