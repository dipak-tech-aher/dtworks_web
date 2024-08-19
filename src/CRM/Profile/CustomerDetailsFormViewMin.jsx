import React, { useContext, useEffect, useState } from 'react';
import { metaConfig, moduleConfig } from '../../AppConstants';
import ProfilePicture from '../../assets/images/profile.png';
import CalendarComponent from '../../common/CalendarComponent';
import { get } from "../../common/util/restUtil";
import { properties } from '../../properties';
import CustomerHistory from './CustomerHistory';
import EditCustomerModal from './EditCustomerModal';
import AddEditProfile from '../../Profile/AddEditProfile';
import { CloseButton, Form, Modal } from 'react-bootstrap';
import { RegularModalCustomStyles, getConfig } from '../../common/util/util';
import { AppContext } from "../../AppContext";

const CustomerDetailsFormViewMin = ((props) => {
    const { customerData, interactionCount, hideAccSerInt, source, modulePermission, customizedLable, userPermission, profileUuid, refreshPage } = props?.data
    const { setCustomerDetails, handlePrintClick, pageRefresh, setRefreshPage } = props?.handler
    const [isEditCustomerDetailsOpen, setIsEditCustomerDetailsOpen] = useState(false);
    const [isCustomerDetailsHistoryOpen, setIsCustomerDetailsHistoryOpen] = useState(false);
    const [show, setShow] = useState(false);
    const [events, setEvents] = useState([]);
    const [contactPrefs, setContactPrefs] = useState([]);
    const [consumerFromIsEnabled,setConsumerFromIsEnabled] = useState("")
    const { auth, appsConfig, systemConfig } = useContext(AppContext);
    const dtWorksProductType = appsConfig?.businessSetup?.[0];
    const [departmentEnable, setDepartmentEnable] = useState(false);
    useEffect(() => {
        get(properties.MASTER_API + "/lookup?searchParam=code_type&valueParam=CONTACT_PREFERENCE").then((resp) => {
            if (resp.data) {
                setContactPrefs(resp.data["CONTACT_PREFERENCE"]);
            } else {
                // toast.error("Error while fetching address details");
            }
        }).catch((error) => {
            console.error(error);
        });
        const getMetaConfig = async () => {
            try {
                const response = await getConfig(systemConfig,metaConfig?.PROFILE_DEPARTMENT_ATTRIBUTE_ENABLED);
                setDepartmentEnable(response?.configValue);
            } catch (e) {
                console.log('error', e)
            }
        }
        getMetaConfig();
    }, []);

    useEffect(() => {
        const fetchConfigData = async () => {
            try {
                const consumer_from_config = await getConfig(systemConfig,metaConfig.CONSUMER_FROM_ATTRIBUTE_ENABLED);
                setConsumerFromIsEnabled(consumer_from_config?.configValue);
            } catch (error) {
                console.error('Error fetching system config:', error);
            }
        };
        fetchConfigData();
    }, [])

    useEffect(() => {
        if (profileUuid) {
            get(`${properties.PROFILE_API}/get-events?profileUuid=${profileUuid}&for=calendar`)
                .then((resp) => {
                    if (resp.data && resp.data.length > 0) {
                        setEvents([...resp.data]);
                    } else {
                        setEvents([]);
                    }
                }).catch(error => console.log(error))
        }
    }, [customerData, profileUuid])

    const handleOnCustomerEdit = () => {
        setIsEditCustomerDetailsOpen(true);
    }

    const handleOnCustomerHistory = () => {
        setIsCustomerDetailsHistoryOpen(true);
    }

    const getContactDesc = (code) => {
        return contactPrefs.find(x => x.code == code)?.description ?? '';
    }

    return (
        <>
            <div className="profile-info-rht">
                <div className="cust-profile-top skel-view-customer-profile-top">
                    <div className="profile-top-head">
                        <div className='skel-cust-profile-image'>
                            <img src={customerData?.profilePhoto || ProfilePicture} alt="" className="img-fluid profile-img" />
                        </div>
                        <div className='skel-cust-pr-name'>
                            <span className="profile-name">{customerData?.firstName ?? ''}  {customerData?.lastName ?? ''}</span>
                            <span>{consumerFromIsEnabled == "Y" && (customerData?.consumerFrom?.description)}</span>
                            <p>{customizedLable} Number: {customerData?.profileNo}</p>
                        </div>
                    </div>
                    <div className="customer-buttons-top">
                        {<span className="icons-md-icon" onClick={() => setShow(true)}><i className="fa fa-calendar"></i></span>}
                        {/* {!['CUSTOMER'].includes(source) && <button className="styl-btn-history" data-target="#customerhistoryModal" data-toggle="modal" onClick={handleOnCustomerHistory}>History</button>} */}
                        {<button className="styl-edti-btn" data-target="#editbusinessModal" data-toggle="modal" onClick={handleOnCustomerEdit}>Edit</button>}
                        {['CUSTOMER'].includes(source) && <button className="styl-edti-btn" onClick={handlePrintClick}><i className="fas fa-print mr-1"></i> Print</button>}
                    </div>
                </div>
                <div className="cust-profile-bottom">
                    <div className="profile-qcnt" style={{ wordBreak: 'normal' }}>
                        <a mailto="">{customerData?.profileContact && customerData?.profileContact[0]?.emailId || 'NA'}</a>
                        <p>{customerData?.profileContact && (customerData?.profileContact[0]?.mobilePrefix + ' ' + customerData?.profileContact[0]?.mobileNo) || 'NA'}</p>
                        {/* <div className="">
                            <span>DOB: {(customerData?.birthDate) || 'NA'}</span>&nbsp;&nbsp;&nbsp;
                            <span>ID Value: {(customerData?.idValue) || 'NA'}</span>
                        </div> */}
                        <p><strong>Contact Preferences: </strong>{customerData?.contactPreferences && Array.isArray(customerData?.contactPreferences) ? customerData?.contactPreferences?.map(x => getContactDesc(x))?.join(", ") : '-'}</p>
                        {departmentEnable === 'Y' && <p><strong>Department: </strong>{customerData?.department?.description?.unitDesc ?? '-'}</p>}
                        <div className="bussiness-info">
                            <span className="bussiness-type">{(customerData?.customerCatDesc?.description) || 'NA'}</span>
                            <span className="profile-status">{(customerData?.statusDesc?.description) || (customerData?.status?.description) || 'NA'}</span>
                        </div>
                    </div>
                    {!hideAccSerInt && (
                        <React.Fragment>
                            <div className="cust-open-tickets">
                                {modulePermission?.includes(moduleConfig?.interaction) && <span>Open Interactions(s) - {interactionCount || 0}</span>}
                            </div>
                        </React.Fragment>
                    )}
                </div>
            </div>

            {

                <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isEditCustomerDetailsOpen} onHide={() => setIsEditCustomerDetailsOpen(false)} dialogClassName="cust-lg-modal">
                    <Modal.Header>
                        <Modal.Title><h5 className="modal-title">Edit Profile</h5></Modal.Title>
                        <CloseButton onClick={() => setIsEditCustomerDetailsOpen(false)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>

                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <AddEditProfile
                            data={{
                                consumerDetails: customerData,
                                type: 'EDIT',
                                refreshPage
                            }}
                            handlers={{
                                setConsumerDetails: setCustomerDetails,
                                setIsModalOpen: setIsEditCustomerDetailsOpen,
                                pageRefresh,
                                setRefreshPage
                            }}

                        />
                    </Modal.Body>
                </Modal>

            }
            {
                isCustomerDetailsHistoryOpen &&
                <CustomerHistory
                    data={{
                        isOpen: isCustomerDetailsHistoryOpen,
                        customerData: props?.data?.customerData
                    }}
                    handler={{
                        setIsOpen: setIsCustomerDetailsHistoryOpen
                    }}
                />
            }

            <CalendarComponent
                data={{
                    show,
                    events
                }}
                handlers={{
                    setShow
                }}
            />

        </>
    )
})
export default CustomerDetailsFormViewMin;