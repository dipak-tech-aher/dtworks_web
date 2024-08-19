import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { useNavigate } from "react-router-dom";
import { AppContext } from '../AppContext';
import { get, post } from '../common/util/restUtil';
import { properties } from '../properties';
import CreateFollowupRequest from './CreateFollowupRequest';
import { toast } from 'react-toastify';
import CreateComplaintOrServiceRequest from './CreateComplaintOrServiceRequest';

const AmeyoHelpdeskCreation = (props) => {
    const { auth } = useContext(AppContext);
    const history = useNavigate();
    const { parentUnitId } = auth

    const [phoneNo, setPhoneNo] = useState();
    const [ivrNo, setivrNo] = useState();
    useEffect(() => {
        const qryString = new URLSearchParams(props.location.search);
        let phoneNo = qryString.get("phoneNo");
        let ivrNo = qryString.get("ivrNo");

        phoneNo = phoneNo?.substring(phoneNo?.length, (phoneNo?.length - 10))

        setPhoneNo(removeLeadingZeros(phoneNo));
        setivrNo(ivrNo);
    }, []);

    const [ticketType, setTicketType] = useState('REQCOMP');
    const accessToken = localStorage.getItem("accessToken")
    const [searchInput, setSearchInput] = useState()

    const [priorityLookup, setPriorityLookup] = useState([]);
    const [customerTypeLookup, setCustomerTypeLookup] = useState([]);
    const lookupData = useRef({})
    const [mode, setMode] = useState({
        mode: "view",
        isExistingCitizen: "N"
    })

    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [customerAddress, setCustomerAddress] = useState({
        flatHouseUnitNo: '',
        block: '',
        building: '',
        street: '',
        road: '',
        district: '',
        state: '',
        village: '',
        cityTown: '',
        country: 'Brunei Darussalam"',
        postCode: ''
    })
    const [masterTicketLookup, setMasterTicketLookup] = useState([])
    const [activeTab, setActiveTab] = useState(0)

    useEffect(() => {
        if (!accessToken && accessToken === '') {
            history(`/`);
        }
    }, [accessToken])

    const [customerData, setCustomerData] = useState({
        customerType: 'RESIDENTIAL',
        contactNo: setPhoneNo,
        emailcheck: 'N'
    })

    const [customerDetails, setCustomerDetails] = useState({})

    function removeLeadingZeros(num) {
        // traverse the entire string
        for (var i = 0; i < num?.length; i++) {

            // check for the first non-zero character
            if (num.charAt(i) != '0') {
                // return the remaining string
                let res = num.substr(i);
                return res;
            }
        }

        // If the entire string is traversed
        // that means it didn't have a single
        // non-zero character, hence return "0"
        return "";
    }

    const handleTicketTypeChange = (e) => {
        const { target } = e;
        let value = null;
        if (target.id === 'radio1') {
            value = 'REQCOMP'
        }
        else if (target.id === 'radio3') {
            value = 'FOLLOWUP'
        }
        else {
            value = 'REQINQ'
        }
        setTicketType(value);

    }

    const getCustomerDataForComplaint = useCallback((phoneNo) => {
        let requestParam = {
            checkIsPrimary: false,
            ...searchInput,
            mobileNo: searchInput?.mobileNo ? searchInput?.mobileNo : phoneNo,
            status: ['AC', 'CS_ACTIVE', 'CS_PEND', 'CS_PROSPECT']
        }

        post(`${properties.CUSTOMER_API}/get-customer?limit=${perPage}&page=${currentPage}`, requestParam)
            .then((resp) => {
                if (resp.data) {
                    if (resp.status === 200) {
                        const { rows, count } = resp.data;
                        if (count > 0) {
                            unstable_batchedUpdates(() => {
                                // setAnonymous(false)
                                console.log('Calling')
                                setTotalCount(count)
                                setCustomerDetails(rows?.[0]);
                            })
                        }

                    } else {
                        unstable_batchedUpdates(() => {
                            setCustomerDetails([])
                            // setAnonymous(true)
                        })
                        toast.error("No Customer details found");
                    }
                } else {
                    unstable_batchedUpdates(() => {
                        setCustomerDetails([])
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
        if (phoneNo && phoneNo.trim() !== "") {
            const delayDebounceFn = setTimeout(() => {
                unstable_batchedUpdates(() => {
                    getCustomerDataForComplaint(phoneNo)
                    get(properties.MASTER_API + "/lookup?searchParam=code_type&valueParam=CUSTOMER_TYPE,FOLLOWUP_PRIORITY").then((resp) => {
                        if (resp.data) {
                            lookupData.current = resp.data;
                            setCustomerTypeLookup(resp.data.FOLLOWUP_PRIORITY || []);
                            setPriorityLookup(resp.data.FOLLOWUP_PRIORITY || []);
                        }
                    }).catch(error => console.log(error)).finally();
                })
            }, 1500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [phoneNo])


    const handleOnTabChange = (index) => {
        setActiveTab(index);
    }

    return (
        <div className="title-box col-12 p-0">
            <div className="row mt-1" style={{ width: '100%' }}>
                <ul className="nav nav-tabs">
                    <li className="nav-item">
                        <button data-target="#helpdesk" role="tab" data-toggle="tab" aria-expanded="true"
                            className={`nav-link ${activeTab === 0 ? 'active' : ''} `} onClick={() => handleOnTabChange(0)}>
                            Create Helpdesk
                        </button>
                    </li>
                </ul>
                {activeTab === 0 && (
                    <div className="row" style={{ display: 'block', width: '100%' }}>
                        <div className="pt-2 pr-2">
                            <fieldset className="scheduler-border">
                                <div className="form-row">
                                    <div className="col-12 pl-2 bg-light border">
                                        <h5 className="text-primary">Choose your action</h5>
                                    </div>
                                </div>
                                <div className="d-flex flex-row pt-2">
                                    <div className="col-md-2 pl-0">
                                        <div className="form-group">
                                            <div className="radio radio-primary mb-2">
                                                <input type="radio" id="radio1" className="form-check-input" name="optCustomerType"
                                                    checked={ticketType === 'REQCOMP'} onChange={handleTicketTypeChange} />
                                                <label htmlFor="radio1">Helpdesk</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-2 pl-0">
                                        <div className="form-group">
                                            <div className="radio radio-primary mb-2">
                                                <input type="radio" id="radio3" className="form-check-input" name="optCustomerType"
                                                    checked={ticketType === 'FOLLOWUP'} onChange={handleTicketTypeChange} />
                                                <label htmlFor="radio3">Follow Up</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                            <form className="" >
                                <div className="form-row align-items-center">
                                    <div className="col-auto">
                                        <div className='row'>
                                            <div className='input-group'>
                                                <label htmlFor="inputState" className="col-form-label px-2">Caller Number</label>
                                                <input
                                                    type="text"
                                                    style={{ width: "270px" }}
                                                    className="form-control"
                                                    autoFocus
                                                    // onChange={(e) => { setSearchInput(e.target.value); }}
                                                    value={phoneNo}
                                                    required
                                                    placeholder="Contact Number"
                                                    maxLength={15}
                                                    onChange={(e) => {
                                                        setPhoneNo(removeLeadingZeros(e.target.value))
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div className="row">
                                {ticketType === 'REQCOMP' ? (
                                    <CreateComplaintOrServiceRequest
                                        data={{
                                            lookupData,
                                            mode,
                                            customerData: customerDetails,
                                            phoneNo,
                                            ivrNo,
                                            type: 'Complaint',
                                            customerAddress,
                                            masterTicketLookup
                                        }}
                                        handler={{
                                            setMode,
                                            setCustomerAddress,
                                            getCustomerDetails: getCustomerDataForComplaint,
                                            setCustomerData: setCustomerDetails
                                        }}
                                    />
                                ) : ticketType === 'FOLLOWUP' ? (
                                    <CreateFollowupRequest
                                        data={{
                                            lookupData,
                                            mode,
                                            customerData: customerDetails,
                                            type: 'Complaint',
                                            customerAddress

                                        }}
                                        lookupData={{
                                            priorityLookup,
                                        }}
                                        handler={{
                                            setMode,
                                            setCustomerAddress,
                                            getCustomerDetails: getCustomerDataForComplaint,
                                            setCustomerData
                                        }}
                                        location={{
                                            state: {
                                                phone: phoneNo,
                                                type: 'Complaint'
                                            }
                                        }}
                                    />
                                ) : (
                                    <></>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AmeyoHelpdeskCreation;