import React, { useContext, useEffect, useState, useCallback } from 'react';
import { CloseButton, Modal } from 'react-bootstrap';
import { RegularModalCustomStyles } from '../common/util/util';
import DynamicTable from './table/DynamicTable';
import ReactSwitch from "react-switch";
import { unstable_batchedUpdates } from 'react-dom';
import { NumberFormatBase } from "react-number-format";
import { AppContext } from '../AppContext';
import { post, get } from './util/restUtil';
import { properties } from '../properties';
import AddressComponent from '../HelpdeskAndInteraction/Helpdesk/AddressComponent';
import { CustomerSearchColumns, SubscriptionSearchColumns, ProfileSearchColumns } from "../CRM/Customer/customerSearchColumns";
import Select from "react-select";
import { statusConstantCode } from '../AppConstants';
import { toast } from 'react-toastify';
import EditCustomerModal from '../CRM/Customer/EditCustomerModal';
import AddEditProfile from '../Profile/AddEditProfile';
import { getPermissions } from '../common/util/util';
// Modal.setAppElement('#root')

const SearchModal = (props) => {
    const { auth, appConfig } = useContext(AppContext)

    const { data: { appsConfig } } = props;
    // console.log('appsConfig--------->', appsConfig?.clientConfig?.interaction?.createInteraction)
    const dtWorksProductType = appsConfig?.businessSetup?.[0]
    const OTHERS_INTERACTION = "Create Interaction Others"
    // const OTHERS_INTERACTION = "Interaction For Others"
    const { openAddress, dataError, isOpen, searchInput, tableRowData, tableHeaderColumns: tableHeaderColumnsProps, tableHiddenColumns, currentPage, totalCount, perPage, isTableFirstRender, hasExternalSearch, addressList, anonymous
        , refresh, selectedConsumerNo, type, source
    } = props.data;
    const { setOpenAddress, setDataError, setIsOpen, setSearchInput, setSearchData, handleSearch, setAddressList, onSetSearchData, setPerPage, setCurrentPage, setRefresh, setSelectedConsumerNo, setAnonymous, setType
    } = props.modalStateHandlers;
    const { handleCellRender, handleCellLinkClick, handleCurrentPage, handlePageSelect, handleItemPerPage, handleFilters } = props.tableStateHandlers;
    const [suggestion, setSuggestion] = useState(false)
    const [forSelf, setForSelf] = useState(false)
    const handleOnClear = () => {
        // setIsOpen(false);
        setSearchData([]);
        setSearchInput("");
        setSuggestion(false)
        setDataError({})
    }
    const [alignment, setAlignment] = useState('Others');
    const [tableHeaderColumns, setTableHeaderColumns] = useState([])
    const [permission, setPermission] = useState({})
    const [componentPermission, setComponentPermission] = useState({})

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions(source);
                setPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };

        fetchData();
        if (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {
            if (source !== 'SEARCH_CUST') {
                setTableHeaderColumns(SubscriptionSearchColumns)

            } else {
                setTableHeaderColumns(CustomerSearchColumns)
            }
        }
        else {
            setTableHeaderColumns(ProfileSearchColumns)
        }
    }, [source]);

    useEffect(() => {
        if (searchInput !== "") {
            if (tableRowData.length === 0) {
                setSuggestion(true)
            }
            else {
                setSuggestion(false)
            }
        }
    }, [tableRowData])

    useEffect(() => {
        unstable_batchedUpdates(() => {
            setDataError({})
            setSearchData([]);
            setSuggestion(false)
        })
    }, [anonymous])

    useEffect(() => {
        if (permission && Array.isArray(permission?.components) && permission?.components?.length > 0) {
            if (permission?.accessType === 'allow') {
                let componentPermissions = {}
                permission.components.forEach(component => {
                    componentPermissions[component.componentCode] = component.accessType;
                });
                setComponentPermission(componentPermissions)
            }
        }
    }, [permission])

    const checkComponentPermission = useCallback((permission) => {
        if (componentPermission && componentPermission[permission]) {
            return componentPermission[permission] === 'allow'
        }
        return false
    }, [componentPermission])

    const hasOtherInteractionPermission = () => {
        let permissions = auth?.permissions ?? [];
        let interactionPermissions;
        for (let index = 0; index < permissions.length; index++) {
            // if (permissions[index]['Interaction']) {
            //     interactionPermissions = permissions[index]['Interaction'];
            //     break;
            // }
            if (permissions[index]?.moduleName === 'Interaction') {
                interactionPermissions = permissions[index]?.moduleScreenMap;
                break;
            }
        }
        return interactionPermissions?.find(x => x.screenName === OTHERS_INTERACTION)?.accessType === "allow";
    }

    useEffect(() => {
        if (forSelf) {
            if (dtWorksProductType === 'CUSTOMER_SERVICES') {
                post(`${properties.CUSTOMER_API}/get-customer?limit=1&page=0`, { emailId: auth?.user?.email }).then((resp) => {
                    if (resp?.data) {
                        handleCellLinkClick("", resp?.data?.rows?.[0], "");
                    }
                }).catch((error) => {
                    if (error?.message?.toLowerCase() === 'records not found') {
                        toast.info('Current User not in a customer')
                    }
                    console.error(error);
                }).finally(() => setForSelf(false));
            } else {
                post(`${properties.PROFILE_API}/search?limit=1&page=0`, { emailId: auth?.user?.email }).then((resp) => {
                    if (resp?.data) {
                        handleCellLinkClick("", resp?.data?.rows?.[0], "");
                    }
                }).catch((error) => {
                    if (error?.message?.toLowerCase() === 'records not found') {
                        toast.info('Current User not in a Profile')
                    }
                    console.error(error);
                }).finally(() => setForSelf(false));
            }

        }
    }, [forSelf])

    const handleRemoveAddress = () => {
        setAddressList([{}])
        setOpenAddress(!openAddress);
    }
    const OnEnter = (e) => {
        if (e.key === 'Enter') {
            handleSearch(e)
        }
    }
    

    return (
        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isOpen} onHide={() => { setIsOpen(false); setAnonymous(!anonymous); handleOnClear() }} dialogClassName="cust-lg-modal">
            <Modal.Header>
                <Modal.Title><h5 className="modal-title">{anonymous ? `Create ${appConfig?.clientFacingName?.customer ?? ''}` : type === 'EDIT' ? `Update ${appConfig?.clientFacingName?.customer ?? ''}` : `${appConfig?.clientFacingName?.customer ?? ''} search`}</h5></Modal.Title>
                <CloseButton onClick={() => { setIsOpen(false); setAnonymous(!anonymous); handleOnClear() }} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                </CloseButton>
            </Modal.Header>
            <Modal.Body>
                <div className="modal-content">
                    <div className="modal-body px-4">
                        <form className="needs-validation p-2 form-inline" name="event-form" id="form-event">
                            {/* <div className="mr-2">
                                    <ToggleButtonGroup
                                        color="primary"
                                        value={alignment}
                                        exclusive
                                        onChange={handleChange}
                                        aria-label="Platform">
                                        <ToggleButton value="Self">Self</ToggleButton>
                                        <ToggleButton value="Others">Others</ToggleButton>
                                    </ToggleButtonGroup>
                                </div> */}
                            {(alignment === 'Others' && type !== 'EDIT') && checkComponentPermission('UNREGISTERED') &&
                                <div className="row col-12 p-2">
                                    <div className="row col-2 mb-0 toggle-switch pl-0">
                                        <label className={`mr-1 mb-0 ${anonymous ? 'd-none' : ''}`}>Registered</label>
                                        <ReactSwitch
                                            onColor="#4C5A81"
                                            offColor="#6c757d"
                                            activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                                            height={20}
                                            width={48}
                                            className="inter-toggle skel-inter-toggle" id="anonymous" checked={anonymous}
                                            onChange={(e) => { setAnonymous(!anonymous); handleOnClear() }} />
                                        <label className={`ml-1 mb-0 ${anonymous ? '' : 'd-none'}`}> Unregistered</label>
                                    </div>
                                </div>}
                        </form>
                        {!anonymous && type !== 'EDIT' &&
                            <fieldset className="scheduler-border">
                                <div>
                                    <div className="row skel-active-new-user-field mt-2">
                                        {dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE &&
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="status" className="control-label">Subscription No.</label>
                                                    <input type="text" className="form-control" autoComplete="off"
                                                        onChange={(e) => { setSearchInput({ ...searchInput, subscriptionNumber: e.target.value }); setSuggestion(false) }} onKeyDown={OnEnter}
                                                        value={searchInput?.subscriptionNumber ?? ''}
                                                    />
                                                </div>
                                            </div>}
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="consumerNo" className="control-label">{appConfig?.clientFacingName?.customer ?? ''} No.</label>
                                                <input type="text" className="form-control" autoComplete="off" id='consumerNo' onChange={(e) => { setSearchInput({ ...searchInput, [e.target.id]: e.target.value }) }} value={searchInput?.consumerNo ?? ''} onKeyDown={OnEnter}/>
                                                <span className="errormsg">{dataError.consumerNo ? dataError.consumerNo : ""}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="consumerName" className="control-label">{appConfig?.clientFacingName?.customer ?? ''} name</label>
                                                <input type="text" className="form-control" autoComplete="off" id='consumerName' onChange={(e) => { setSearchInput({ ...searchInput, [e.target.id]: e.target.value }) }} value={searchInput?.consumerName ?? ''} onKeyDown={OnEnter}/>
                                                <span className="errormsg">{dataError.consumerName ? dataError.consumerName : ""}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="emailId" className="control-label">Email ID</label>
                                                <input type="email" className="form-control" autoComplete="off" id='emailId' onChange={(e) => { setSearchInput({ ...searchInput, [e.target.id]: e.target.value }) }} value={searchInput?.emailId ?? ''} onKeyDown={OnEnter}/>
                                                <span className="errormsg">{dataError.emailId ? dataError.emailId : ""}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="mobileNo" className="control-label">Contact No.</label>
                                                <NumberFormatBase className={`form-control ${(dataError.mobileNo ? "input-error" : "")} `}
                                                    id="mobileNo"
                                                    placeholder="Enter Contact Number"
                                                    value={searchInput?.mobileNo ?? ''}
                                                    onChange={(e) => { setSearchInput({ ...searchInput, [e.target.id]: e.target.value }) }} onKeyDown={OnEnter}/>
                                                <span className="errormsg">{dataError.mobileNo ? dataError.mobileNo : ""}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="skel-btn-center-cmmn">
                                        <button type="button" className="skel-btn-cancel" onClick={handleOnClear}>Clear</button>
                                        <button type="button" className="skel-btn-submit" onClick={handleSearch} >Search</button>
                                    </div>
                                    {!anonymous && type !== 'EDIT' ?
                                        !!tableRowData.length ?
                                            <div className="pt-2">
                                                <DynamicTable
                                                    row={tableRowData}
                                                    rowCount={totalCount}
                                                    header={tableHeaderColumns}
                                                    itemsPerPage={perPage}
                                                    // hiddenColumns={tableHiddenColumns}
                                                    backendPaging={true}
                                                    backendCurrentPage={currentPage}
                                                    isTableFirstRender={isTableFirstRender}
                                                    hasExternalSearch={hasExternalSearch}
                                                    handler={{
                                                        handleCellRender: handleCellRender,
                                                        handleLinkClick: handleCellLinkClick,
                                                        handlePageSelect,
                                                        handleItemPerPage: handleItemPerPage,
                                                        handleCurrentPage: handleCurrentPage,
                                                        handleFilters: handleFilters
                                                    }}
                                                />
                                            </div>
                                            : <span className='skel-widget-warning'>No records found</span>
                                        : <span className='skel-widget-warning'>No records found</span>
                                    }
                                </div>
                            </fieldset>}
                        {(anonymous || type === 'EDIT') ? (
                            dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE ? (
                                <EditCustomerModal
                                    data={{
                                        isEditCustomerDetailsOpen: isOpen,
                                        customerDetails: searchInput,
                                        type
                                    }}
                                    handlers={{
                                        setIsEditCustomerDetailsOpen: setIsOpen,
                                        pageRefresh: setRefresh,
                                        setCustomerDetails: setSearchInput,
                                        setConsumerNo: setSelectedConsumerNo
                                    }}
                                />
                            ) : (
                                <AddEditProfile
                                    data={{
                                        consumerDetails: searchInput,
                                        refreshPage: refresh,
                                        type
                                    }}
                                    handlers={{
                                        setConsumerDetails: setSearchInput,
                                        setIsModalOpen: setIsOpen,
                                        setRefreshPage: setRefresh,
                                        setConsumerNo: setSelectedConsumerNo
                                    }}
                                />
                            )
                        ) : null
                        }
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default SearchModal;