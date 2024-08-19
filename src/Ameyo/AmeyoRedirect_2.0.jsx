import React, { useState } from 'react';

import { useContext } from 'react';
import Modal from 'react-modal';
import { NumberFormatBase } from "react-number-format";
import { useNavigate } from "react-router-dom";
import ReactSwitch from "react-switch";
import { AppContext } from '../AppContext';
import DynamicTable from '../common/table/DynamicTable';
import { RegularModalCustomStyles } from '../common/util/util';
// import { ComplaintCustomerSearchHiddenColumns, CustomerSearchColumns } from '../CRM/Customer/customerSearchColumns';
import { useCallback, useEffect, useRef } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';
import { object, string } from 'yup';
import { post } from '../common/util/restUtil';
import { properties } from '../properties';

const AmeyoRedirectNew = (props) => {
    const OTHERS_INTERACTION = "Interaction For Others"

    const history = useNavigate();
    const qryString = new URLSearchParams(props.location.search);
    let phone = qryString.get("phone");
    if (phone?.length > 10) {
        phone = phone.substring(phone.length, (phone.length - 10))
    }
    const [anonymous, setAnonymous] = useState(false)
    const [isOpen, setIsOpen] = useState(true)
    // const [searchData, setSearchData] = useState()
    const [searchInput, setSearchInput] = useState()
    const [suggestion, setSuggestion] = useState(false)
    const [dataError, setDataError] = useState({})
    const { appsConfig } = props;
    const { auth } = useContext(AppContext)
    const [forSelf, setForSelf] = useState(false)
    const [complaintSearchData, setComplaintSearchData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);

    const isFirstRender = useRef(true);
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);


    const getCustomerDataForComplaint = useCallback((phoneNo) => {
        let requestParam = {
            checkIsPrimary: false,
            ...searchInput,
            mobileNo: searchInput?.mobileNo ? searchInput?.mobileNo : phoneNo,
            status: ['AC', 'CS_ACTIVE', 'CS_PEND', 'CS_PROSPECT']
        }
        // if(phone){
        //     requestParam = {
        //         checkIsPrimary: false,
        //         mobileNo: phoneNo,
        //         status: ['AC', 'CS_ACTIVE', 'CS_PEND', 'CS_PROSPECT']
        //     }
        // } else {
        //     requestParam = {
        //         checkIsPrimary: false,
        //         ...searchInput,
        //         status: ['AC', 'CS_ACTIVE', 'CS_PEND', 'CS_PROSPECT']
        //     }
        // }

        post(`${properties.CUSTOMER_API}/get-customer?limit=${perPage}&page=${currentPage}`, requestParam)
            .then((resp) => {
                if (resp.data) {
                    if (resp.status === 200) {
                        const { rows, count } = resp.data;
                        unstable_batchedUpdates(() => {
                            // setAnonymous(false)
                            setTotalCount(count)
                            setComplaintSearchData(rows);
                        })
                    } else {
                        unstable_batchedUpdates(() => {
                            setComplaintSearchData([])
                            // setAnonymous(true)
                        })
                        toast.error("No Customer details found");
                    }
                } else {
                    unstable_batchedUpdates(() => {
                        setComplaintSearchData([])
                        // setAnonymous(true)
                    })
                    toast.error("No Customer details found");
                }
            }).catch((error) => {
                // setAnonymous(true)
                toast.error("No Customer details found");
                console.error(error);
            }).finally();
    }, [searchInput])

    useEffect(() => {
        isTableFirstRender.current = true;
        setSearchInput({ ...searchInput, mobileNo: phone })
        unstable_batchedUpdates(() => {
            setFilters([])
            setCurrentPage((currentPage) => {
                if (currentPage === 0) {
                    return '0'
                }
                return 0
            });
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phone])


    const handleOnModelClose = () => {
        setIsOpen(false);
        setSearchInput("");
        setSuggestion(false)
        setDataError({})
    }

    const hasOtherInteractionPermission = () => {
        let permissions = auth?.permissions ?? [];
        let interactionPermissions;
        for (let index = 0; index < permissions.length; index++) {
            if (permissions[index]['Interaction']) {
                interactionPermissions = permissions[index]['Interaction'];
                break;
            }
        }
        return interactionPermissions?.find(x => x.screenName === OTHERS_INTERACTION)?.accessType === "allow";
    }

    const handleSearch = (e) => {
        if (!searchInput.customerName && !searchInput.mobileNo && !searchInput.customerNo && !searchInput.emailId) {
            toast.error("Validation errors found. Please provide any one field");
            return false
        }
        e.preventDefault();
        isTableFirstRender.current = true;
        unstable_batchedUpdates(() => {
            setFilters([])
            setCurrentPage((currentPage) => {
                if (currentPage === 0) {
                    return '0'
                }
                return 0
            });
        })
    }

    useEffect(() => {
        if (!isFirstRender.current) {
            getCustomerDataForComplaint()
        }
        else {
            isFirstRender.current = false;
        }
    }, [perPage, currentPage])

    const validationSchema = object().shape({
        customerName: string().required("Name is required"),
        mobileNo: string().required("Contact is required"),
        emailId: string().required("Email Id is required").email("Please Enter Valid Email ID")
    })

    const validate = (schema, data) => {
        try {
            setDataError({})
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                setDataError((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    }

    const handleSubmit = () => {
        let error = validate(validationSchema, searchInput);
        if (error) {
            toast.error("Validation errors found. Please check all fields");
            return false
        }
        searchInput.anonymous = true
        setIsOpen(false);
        setComplaintSearchData([]);
        setSearchInput("")
        setTimeout(() => {
            history(`/create-interaction`, { state: {complaintSearchInput: searchInput} })
        }, 500);
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "customerNo") {
            return (<span className="text-secondary cursor-pointer" onClick={(e) => handleCellLinkClick(e, row.original, isOpen)}>{cell.value}</span>)
        } else {
            return (<span>{cell.value}</span>)
        }

    }

    const handleCellLinkClick = (e, rowData, popUpstatus) => {
        const data = {
            ...rowData
        }
        // console.log("came here to close setIsComplaintModalOpen", data);
        setIsOpen(false);
        setComplaintSearchData([]);
        // setComplaintSearchInput("");
        setTimeout(() => {
            history(`/create-interaction`, { state: {data} })
        }, 500);
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    return (
        <Modal isOpen={isOpen} contentLabel="Search Modal" style={RegularModalCustomStyles}>
            <div className="">
                <div className="modal-content">
                    <div className="modal-header px-4 border-bottom-0">
                        <h4 className="modal-title">Create Interaction</h4>
                        {/* <button type="button" className="close" onClick={handleOnModelClose}>
                            <span aria-hidden="true">&times;</span>
                        </button> */}
                    </div>
                    <div className="modal-body px-4">
                        <form className="needs-validation p-2" name="event-form" id="form-event">
                            <div className="">
                                {appsConfig?.clientConfig?.interaction?.for_register_unregister && (
                                    <div className="row mb-0 toggle-switch pl-0">
                                        <label className={`mr-1 mb-0 ${anonymous ? 'd-none' : ''}`}>Registered</label>
                                        <ReactSwitch
                                            onColor="#4C5A81"
                                            offColor="#6c757d"
                                            activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                                            height={20}
                                            width={48}
                                            className="inter-toggle skel-inter-toggle" id="anonymous" checked={anonymous}
                                            onChange={(e) => { setAnonymous(!anonymous) }}
                                        />
                                        <label className={`mr-1 mb-0 ${anonymous ? '' : 'd-none'}`}>Unregistered</label>
                                    </div>
                                )}

                                {appsConfig?.clientConfig?.interaction?.for_other_option && hasOtherInteractionPermission() && (
                                    <div className="row mb-0 toggle-switch pl-2">
                                        <label className={`mr-1 mb-0 ${forSelf ? 'd-none' : ''}`}>Others</label>
                                        <ReactSwitch
                                            onColor="#4C5A81"
                                            offColor="#6c757d"
                                            activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                                            height={20}
                                            width={48}
                                            className="inter-toggle skel-inter-toggle" id="forSelf" checked={forSelf}
                                            onChange={(e) => { setForSelf(!forSelf) }}
                                        />
                                        <label className={`mr-1 mb-0 pl-1 ${forSelf ? '' : 'd-none'}`}>Self</label>
                                    </div>
                                )}

                                {anonymous &&
                                    <span className='skel-heading mt-3'>Kindly provide few of your details</span>
                                }
                                <div className="row skel-active-new-user-field mt-2">

                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="customerName" className="control-label">{appsConfig?.clientFacingName?.customer ?? "Customer"} Name<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                            <input type="text" className="form-control" autoComplete="off"
                                                onChange={(e) => { setSearchInput({ ...searchInput, customerName: e.target.value }); setSuggestion(false) }}
                                                value={searchInput?.customerName}
                                            />
                                            <span className="errormsg">{dataError.customerName ? dataError.customerName : ""}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="cntnumber" className="control-label">Contact No.<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                            <NumberFormatBase className="form-control" autoComplete="off" placeholder="1234567"
                                                onChange={(e) => { setSearchInput({ ...searchInput, mobileNo: e.target.value }); setSuggestion(false) }}
                                                value={searchInput?.mobileNo}
                                            />
                                            <span className="errormsg">{dataError.mobileNo ? dataError.mobileNo : ""}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="emailId" className="control-label">Email ID<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                            <input type="email" className="form-control" placeholder="abc@mail.com" autoComplete="off"
                                                onChange={(e) => { setSearchInput({ ...searchInput, emailId: e.target.value }); setSuggestion(false) }}
                                                value={searchInput?.emailId}
                                            />
                                            <span className="errormsg">{dataError.emailId ? dataError.emailId : ""}</span>

                                        </div>
                                    </div>
                                    {
                                        !anonymous ?
                                            <>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="customerName" className="control-label">{appsConfig?.clientFacingName?.customer ?? "Customer"} No.<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                                        <input type="text" className="form-control" autoComplete="off"
                                                            onChange={(e) => { setSearchInput({ ...searchInput, customerNo: e.target.value }); setSuggestion(false) }}
                                                            value={searchInput?.customerNo}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <button type="button" className="skel-btn-submit" onClick={handleSearch}>
                                                            Search
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                            :
                                            <>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <button type="button" onClick={handleSubmit} className="skel-btn-submit">
                                                            Submit
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                    }

                                </div>

                                {!anonymous ?
                                    !!complaintSearchData.length ?
                                        <div className="">
                                            <DynamicTable
                                                row={complaintSearchData}
                                                rowCount={totalCount}
                                                header={CustomerSearchColumns}
                                                itemsPerPage={perPage}
                                                backendPaging={true}
                                                hiddenColumns={['customerUuid']}
                                                backendCurrentPage={currentPage}
                                                isTableFirstRender={isTableFirstRender}
                                                hasExternalSearch={hasExternalSearch}
                                                handler={{
                                                    handleCellRender: handleCellRender,
                                                    handleLinkClick: handleCellLinkClick,
                                                    handlePageSelect,
                                                    handleItemPerPage: setPerPage,
                                                    handleCurrentPage: setCurrentPage,
                                                    handleFilters: setFilters
                                                }}
                                            />
                                        </div>
                                        :
                                        suggestion === true
                                            ?
                                            <p className='skel-widget-warning'>No Records Found!!!</p>
                                            :
                                            <></>
                                    : <></>
                                }
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default AmeyoRedirectNew;

export const CustomerSearchColumns = [
    {
        Header: "Customer ID",
        accessor: "customerUuid",
        id: 'customerUuid'
    },
    {
        Header: "Customer Number",
        accessor: "customerNo",
        id: 'customerNo'
    },
    {
        Header: "Customer Name",
        accessor: "firstName",
        disableFilters: false,
        id: 'firstName'
    },
    {
        Header: "Mobile Number",
        accessor: "customerContact[0].mobileNo",
        id: 'mobileNo',
        disableFilters: false,
    },
    {
        Header: "Email",
        accessor: "customerContact[0].emailId",
        disableFilters: true,
    },
    {
        Header: "Customer Status",
        accessor: "statusDesc.description",
        disableFilters: true,
        id: 'customerServiceStatus'
    }
    // {
    //     Header: "Status Code",
    //     accessor: "status",
    //     disableFilters: true,
    //     id: 'status'
    // }
]