import React, { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { CloseButton, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { statusConstantCode } from '../../../../AppConstants';
import AddressDetailsFormViewMin from '../../../../CRM/Address/AddressDetailsFormViewMin';
import EditCustomerModal from '../../../../CRM/Customer/EditCustomerModal';
import AddEditProfile from '../../../../Profile/AddEditProfile';
import profileLogo from "../../../../assets/images/profile.png";
import { useHistory } from '../../../../common/util/history';
import { post } from '../../../../common/util/restUtil';
import { properties } from '../../../../properties';
import History from './History';
import { metaConfig } from '../../../../AppConstants'
import { getConfig } from '../../../../common/util/util';
import { AppContext } from '../../../../AppContext';

export default function LeftSidePanel(props) {
    const { systemConfig } = useContext(AppContext)
    const history = useHistory()
    const appsConfig = props.appsConfig
    let { consumerNo, consumerDetails, dtWorksProductType, refresh, type, interactionCount, helpdeskCount, rowData } = props?.data
    let { setConsumerDetails, setRefresh, setInteractionCount, setHelpdeskCount } = props?.handler
    const consumerContact = dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE ? consumerDetails?.customerContact?.[0] : consumerDetails?.profileContact?.[0];
    const consumerAddress = dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE ? consumerDetails?.customerAddress?.[0] : consumerDetails?.profileAddress?.[0];
    const [isEditCustomerDetailsOpen, setIsEditCustomerDetailsOpen] = useState(false);
    const [consumerFromIsEnabled,setConsumerFromIsEnabled] = useState("")
    const [consumerData, setConsumerData] = useState(consumerDetails)
    const consumerNoRef = useRef()

    const getConsumerDetails = useCallback(() => {
        // console.log('refreshing again......')
        if (consumerNoRef.current) {
            let requestBody = {}
            let reqURL = ''
            if (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {
                reqURL = `${properties.CUSTOMER_API}/get-customer?limit=${1}&page=${0}`
                requestBody = {
                    customerNo: consumerNoRef.current,
                    serviceNo: rowData?.serviceNo
                }
            } else {
                reqURL = `${properties.PROFILE_API}/search`
                requestBody = {
                    profileNo: consumerNoRef.current,
                }
            }
            post(reqURL, requestBody).then((resp) => {
                if (resp?.status === 200) {
                    unstable_batchedUpdates(() => {
                        setConsumerDetails({
                            ...resp?.data?.rows?.[0],
                            consumerName: (resp?.data?.rows?.[0]?.firstName || '' + resp?.data?.rows?.[0]?.lastName || ''),
                        })
                    })
                    if (resp?.data?.count === 0) {
                        toast.error(resp?.message)
                    }
                }
            }).catch((error) => {
                console.error(error)
            })
        }
    }, [dtWorksProductType, setConsumerDetails, refresh])

    useEffect(() => {
        consumerNoRef.current = consumerNo

        if (consumerNo) {
            getConsumerDetails()
        }
    }, [consumerNo, getConsumerDetails, refresh])

    useEffect(() => {
        const fetchConfigData = async () => {
            try {
                const consumer_from_config = await getConfig(systemConfig,metaConfig.CONSUMER_FROM_ATTRIBUTE_ENABLED);
                setConsumerFromIsEnabled(consumer_from_config.configValue);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };

        fetchConfigData();
    }, [])

    useEffect(() => {
        consumerNoRef.current = consumerData.profileNo
        if (consumerData.profileNo) {
            getConsumerDetails()
        }
    }, [consumerData.profileNo, getConsumerDetails, refresh])

    const redirectToRespectivePages = () => {
        const data = {
            data: consumerDetails
        }

        localStorage.setItem('viewConsumer', JSON.stringify(data));

        if (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {
            localStorage.setItem("customerUuid", consumerDetails.customerUuid)
            localStorage.setItem("customerIds", consumerDetails.customerId)
            localStorage.setItem("customerNo", consumerDetails.customerNo)

            window.open(`${properties.REACT_APP_BASE}/view-customer`, "_blank")
            // history(`/view-customer`, { data })
        } else {
            localStorage.setItem("profileUuid", consumerDetails.profileUuid)
            localStorage.setItem("profileIds", consumerDetails.profileId)
            localStorage.setItem("profileNo", consumerDetails.profileNo)

            window.open(`${properties.REACT_APP_BASE}/view-profile`, "_blank")
            // history(`/view-profile`, { data })
        }

    }

    return (
        <div className="cmmn-skeleton mt-1 skel-br-bt-r0">
            <div className="card-styl-profile">

                <div className="user-profile__wrapper pt-1">
                    <div className="user-profile__avatar">
                        <img
                            src={consumerDetails?.customerPhoto || profileLogo}
                            alt=""
                        // loading="lazy"
                        />
                    </div>
                    <div className="user-profile__details mt-1 mb-1">
                        <span className="user-profile__name">
                            {consumerDetails?.consumerName ?? ''}
                        </span>
                        <span>
                            { (consumerFromIsEnabled == "Y") ? consumerDetails?.consumerFrom?.description ?? '' : ""}
                        </span>
                        <span className="user-profile__location">
                            {appsConfig?.clientFacingName?.customer ?? ''} Number: <span className="text-primary cursor-pointer" onClick={(redirectToRespectivePages)}>{consumerNoRef.current ? consumerNoRef.current : consumerNo}</span>
                        </span>
                        <span className="user-profile__location">
                            <a className="text-primary cursor-pointer"
                                href={`mailto:${consumerContact?.emailId
                                    }`}
                            >
                                {consumerContact?.emailId ||
                                    "NA"}
                            </a>
                        </span>
                        <span className="user-profile__location">
                            {consumerContact?.mobileNo ||
                                "NA"}
                        </span>
                        {
                            <div className='mt-1'>
                                <button className="styl-edti-btn" onClick={() => { setIsEditCustomerDetailsOpen(true) }}>{type === 'EDIT' ? `Edit ${appsConfig?.clientFacingName?.customer ?? ''}` : `Create ${appsConfig?.clientFacingName?.customer ?? ''}`}</button>
                            </div>
                        }
                    </div>
                    <hr className="cmmn-hline mt-2" />
                    <History data={{ consumerNo: consumerNoRef.current ? consumerNoRef.current : consumerNo, page: 'Interaction', interactionCount, refresh }} handler={{ setInteractionCount }} />
                    <History data={{ consumerNo: consumerNoRef.current ? consumerNoRef.current : consumerNo, page: 'Helpdesk', helpdeskCount, refresh }} handler={{ setHelpdeskCount }} />
                    <hr className="cmmn-hline mt-1" />

                    {
                        consumerDetails?.profileAddress?.length > 0 ?
                            <AddressDetailsFormViewMin data={{ addressDetails: consumerAddress }} />
                            : <></>
                    }
                    <span className='font-weight-bold text-16 mt-1'>Contact Preferences</span>
                    <span className='mb-2'>{(consumerDetails?.contactPreferencesDesc && consumerDetails?.contactPreferencesDesc?.length) ? consumerDetails?.contactPreferencesDesc?.filter(val => val !== null).map((e) => { return " " + e.description; }) : ""}</span>
                    {
                        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isEditCustomerDetailsOpen} onHide={() => { setIsEditCustomerDetailsOpen(false); }} dialogClassName="cust-lg-modal">
                            <Modal.Header>
                                <Modal.Title><h5 className="modal-title">{type === 'CREATE' ? `Create ${appsConfig?.clientFacingName?.customer ?? ''}` : type === 'EDIT' ? `Update ${appsConfig?.clientFacingName?.customer ?? ''}` : `${appsConfig?.clientFacingName?.customer ?? ''} search`}</h5></Modal.Title>
                                <CloseButton onClick={() => { setIsEditCustomerDetailsOpen(false); }} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                                </CloseButton>
                            </Modal.Header>
                            <Modal.Body>
                                {isEditCustomerDetailsOpen && dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE ?
                                    <EditCustomerModal
                                        data={{
                                            isEditCustomerDetailsOpen,
                                            customerDetails: consumerDetails,
                                            type
                                            //isOpen: true
                                        }}
                                        handlers={{
                                            setIsEditCustomerDetailsOpen,
                                            pageRefresh: setRefresh,
                                            setCustomerDetails: setConsumerDetails
                                        }}
                                    />
                                    :
                                    <AddEditProfile data={{
                                        consumerDetails,
                                        refreshPage: refresh,
                                        type
                                    }}
                                        handlers={{
                                            setConsumerDetails: setConsumerData,
                                            setIsModalOpen: setIsEditCustomerDetailsOpen,
                                            setRefreshPage: setRefresh
                                        }} />
                                }
                            </Modal.Body>
                        </Modal>
                    }
                </div>
            </div>
        </div>
    )
}
