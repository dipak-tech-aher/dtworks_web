
/* eslint-disable array-callback-return */
import React, { useContext, useState } from "react";
import CustomerDetailsFormViewMin from "./CustomerDetailsFormViewMin";
import vIcon from "../../assets/images/v-img.png";
import ChannelActivityChart from "./ChannelActivityChart";
import ChannelPerformanceChart from "./ChannelPerformanceChart";
import CustomerJourney from "./CustomerJourney";
import NegativeScatterChart from "./NegativeScatterChart";
import SentimentChart from "./SentimentChart";
import SentimentGauge from "./SentimentScoreGauge"
import { isEmpty } from "lodash"

const CustomerViewPrint = React.forwardRef((props, ref) => {
    const { customerDetails,
        interactionList,
        helpdeskList,
        helpdeskListData,
        sentimentChartData,
        channelActivity,
        interactionData,
        customerEmotions,
        modulePermission,
        moduleConfig
    } = props?.data
    const { setCustomerDetails } = props?.handler
    const [refreshPage, setRefreshPage] = useState(true);
    const [sentimentScore, setSentimentScore] = useState(0);
    const [setIssetimentPopupOpen] = useState(false)
    const [setSentimentFilter] = useState({})

    const capitalizeFirstLetter = (string) => {
        return string?.charAt(0)?.toUpperCase() + string?.slice(1);
    };

    const pageRefresh = () => {
        setRefreshPage(!refreshPage);
    }

    const checkPermission = (key) => {
        let response = false
        if (key && !isEmpty(key)) {
          response = modulePermission?.[key] === 'allow'
        }
        return response
      }

    return (
        <div >
            <div className="addresshadow show mb-4 skel-customer-print-preview-pg" id="previewform" tabIndex="-1" role="dialog"
                style={{ paddingRight: "5px", paddingLeft: "5px" }} aria-modal="true">
                <div className="modal-content">
                    <div className='cnt-wrapper' ref={ref}>
                        <div className="card-skeleton">
                            <div className="cmmn-skeleton mt-2">
                                <div className="lft-skel">
                                    <span className="skel-profile-heading" style={{ width: '10%' }}>
                                        Overall Insights
                                    </span>
                                    <div className="" style={{ display: 'grid', justifyContent: 'space-between', gridTemplateColumns: '100% 100% 100% 100%' }}>
                                        {checkPermission('Interaction') && <div className="skel-tot">
                                            Total Interaction Count
                                            <span>
                                                <span style={{ color: '#000' }}
                                                    data-toggle="modal"
                                                    data-target="#skel-view-modal-interactions"
                                                >
                                                    {interactionList?.count || 0}
                                                </span>
                                            </span>
                                        </div>}
                                        {checkPermission('Helpdesk') &&
                                            <div className="skel-tot">
                                                Total Helpdesk Count
                                                <span>
                                                    <span style={{ color: '#000' }}
                                                        data-toggle="modal"
                                                        data-target="#skel-view-modal-interactions"
                                                    >
                                                        {helpdeskList?.count || 0}
                                                    </span>
                                                </span>
                                            </div>
                                        }
                                        <div className="skel-tot">
                                            Overall Experience
                                            <span>
                                                {Number(sentimentScore)?.toFixed(0) >= 4 ? '😃' : Number(sentimentScore)?.toFixed(0) < 4 && Number(sentimentScore)?.toFixed(0) >= 3 ? '😐' : Number(sentimentScore)?.toFixed(0) < 3 && Number(sentimentScore)?.toFixed(0) >= 2 ? '😟' : Number(sentimentScore)?.toFixed(0) < 2 && Number(sentimentScore)?.toFixed(0) >= 1 ? '😡' : Number(sentimentScore)?.toFixed(0) < 1 && Number(sentimentScore)?.toFixed(0) >= 0 ? '😡' : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="">
                                <div className="mt-2">
                                    <div className="form-row">
                                        <div className="col-lg-6 col-md-12 col-xs-12">
                                            <div className="skel-view-base-card skel-cust-ht-sect">
                                                <div className="skel-profile-base">
                                                    <div className="skel-profile-info">
                                                        <CustomerDetailsFormViewMin
                                                            data={{
                                                                customerData: customerDetails,
                                                                interactionCount: interactionList?.count,
                                                                hideAccSerInt: true,
                                                                source: "CUSTOMER",
                                                            }}
                                                            handler={{ setCustomerDetails, pageRefresh }}
                                                        />
                                                    </div>
                                                </div>
                                                <hr className="cmmn-hline mt-2" />
                                                <img
                                                    src={vIcon}
                                                    alt=""
                                                    className="img-fluid skel-place-img"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-md-12 col-xs-12">
                                            <div className="skel-view-base-card skel-cust-ht-sect">
                                                <span className="skel-profile-heading">
                                                    {props?.appsConfig?.clientFacingName?.customer ?? 'Customer'} Sentiments
                                                </span>
                                                <SentimentChart data={{ chartData: sentimentChartData }} handlers={{ setIssetimentPopupOpen, setSentimentFilter }} />
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-md-12 col-xs-12">
                                            <div className="skel-view-base-card skel-cust-ht-sect">
                                                <span className="skel-profile-heading">
                                                    Avg Sentiment Score
                                                </span>
                                                <SentimentGauge
                                                    data={{ chartData: sentimentChartData }}
                                                    handler={{
                                                        setSentimentScore
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-md-12 col-xs-12">
                                            <div className="skel-view-base-card skel-cust-ht-sect">
                                                <span className="skel-profile-heading">
                                                    Top 10 Interactions with Negative Sentiments (Red- Most Negative)
                                                </span>
                                                <NegativeScatterChart data={{ chartData: sentimentChartData }} />
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-md-12 col-xs-12">
                                            <div className="skel-view-base-card skel-cust-ht-sect">
                                                <span className="skel-profile-heading">
                                                    Channel Activity by Percentage (%)
                                                </span>
                                                <ChannelActivityChart data={{ chartData: channelActivity }} />
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-md-12 col-xs-12">
                                            <div className="skel-view-base-card skel-cust-ht-sect">
                                                <span className="skel-profile-heading">
                                                    Channel Performance
                                                </span>
                                                <ChannelPerformanceChart data={{ chartData: channelActivity }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="col-lg-12 col-md-12 col-xs-12">
                                            <div className="skel-view-base-card">
                                                <div className="skel-inter-statement">
                                                    <span className="skel-profile-heading">
                                                        Helpdesk Details({helpdeskListData?.count || 0}){" "}
                                                    </span>
                                                    <div className="skel-cust-view-det">
                                                        {helpdeskListData &&
                                                            helpdeskListData.map((val, idx) => (
                                                                <>
                                                                    <div
                                                                        key={idx}
                                                                        className="skel-inter-hist"
                                                                    >
                                                                        <div className="skel-serv-sect-lft">
                                                                            <span
                                                                                className="skel-lbl-flds"
                                                                                data-toggle="modal"
                                                                                data-target="#skel-view-modal-accountdetails"
                                                                            >
                                                                                ID: {val.helpdeskNo}
                                                                            </span>
                                                                            <span className="mt-1">{val.problemCause}</span>
                                                                            <span className="skel-cr-date">
                                                                                Created On: {val.createdAt}
                                                                            </span>
                                                                            <span className="skel-h-status mt-1">
                                                                                {val.severity?.description}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-12 col-md-12 col-xs-12">
                                            <div className="skel-view-base-card">
                                                <div className="skel-inter-statement">
                                                    <span className="skel-profile-heading">
                                                        Interaction Details({interactionList?.count || 0}){" "}
                                                    </span>
                                                    <div className="skel-cust-view-det">
                                                        {interactionData &&
                                                            interactionData.map((val, idx) => (
                                                                <>
                                                                    <div
                                                                        key={idx}
                                                                        className="skel-inter-hist"
                                                                    >
                                                                        <div className="skel-serv-sect-lft">
                                                                            <span
                                                                                className="skel-lbl-flds"
                                                                                data-toggle="modal"
                                                                                data-target="#skel-view-modal-accountdetails"
                                                                            >
                                                                                ID: {val.intxnNo}
                                                                            </span>
                                                                            <span className="mt-1">{val.problemCause}</span>
                                                                            <span className="skel-cr-date">
                                                                                Created On: {val.createdAt}
                                                                            </span>
                                                                            <span className="skel-h-status mt-1">
                                                                                {val.intxnPriority?.description}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                    </div>
                                    <div className="form-row">
                                        <div className="col-lg-12 col-md-12 col-xs-12">
                                            <div className="skel-view-base-card">
                                                <span className="skel-profile-heading">Profile Journey</span>
                                                <div className="skel-cust-view-det skel-emoj-data mt-3">
                                                    <CustomerJourney
                                                        data={{ customerEmotions, height: "400%" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
})

const interactionListColumns = [
    {
        Header: "Interaction ID",
        accessor: "intxnId",
        disableFilters: true,
    },
    {
        Header: "Interaction Category",
        accessor: "intxnCategory.description",
        disableFilters: true,
    },
    {
        Header: "Interaction Type",
        accessor: "intxnType.description",
        disableFilters: true,
    },
    {
        Header: "Service Category",
        accessor: "serviceCategory.description",
        disableFilters: true,
    },
    {
        Header: "Service Type",
        accessor: "serviceType.description",
        disableFilters: true,
    },
    {
        Header: "Status",
        accessor: "intxnStatus.description",
        disableFilters: true,
    },
];

const orderListColumns = [
    {
        Header: "Order No",
        accessor: "orderNo",
        disableFilters: true,
    },
    {
        Header: "Order Category",
        accessor: "orderCategory.description",
        disableFilters: true,
    },
    {
        Header: "Order Type",
        accessor: "orderType.description",
        disableFilters: true,
    },
    // {
    //   Header: "Service Category",
    //   accessor: "serviceCategory.description",
    //   disableFilters: true,
    // },
    // {
    //   Header: "Service Type",
    //   accessor: "serviceType.description",
    //   disableFilters: true,
    // },
    {
        Header: "Status",
        accessor: "orderStatus.description",
        disableFilters: true,
    },
];

const CustomerDetailsColumns = [
    {
        Header: "Customer ID Type",
        accessor: "idType",
        disableFilters: true,
        id: "idType"
    },
    {
        Header: "ID Number",
        accessor: "idValue",
        disableFilters: true,
        id: "idValue"
    },
    {
        Header: "Email",
        accessor: "email",
        disableFilters: true,
        id: "email"
    },
    // {
    //     Header: "Contact Type",
    //     accessor: "contactType",
    //     disableFilters: true,
    //     id: "contactType",
    // },
    {
        Header: "Contact Number",
        accessor: "contactNo",
        disableFilters: true,
        id: "contactNo"
    },
    {
        Header: "Modified Date Time",
        accessor: "updatedAt",
        disableFilters: true,
        id: "updatedAt"
    },
    {
        Header: "Modified By",
        accessor: "modifiedBy",
        disableFilters: true,
        id: "modifiedBy"
    }
]

const CustomerAddressColumns = [
    {
        Header: "Address 1",
        accessor: "address1",
        disableFilters: true,
        id: "address1"
    },
    {
        Header: "Address 2",
        accessor: "address2",
        disableFilters: true,
        id: "address2"
    },
    {
        Header: "Address 3",
        accessor: "address3",
        disableFilters: true,
        id: "address3"
    },
    {
        Header: "City/Town",
        accessor: "city",
        disableFilters: true,
        id: "city"
    },
    {
        Header: "District/Province",
        accessor: "district",
        disableFilters: true,
        id: "district"
    },
    {
        Header: "State/Region",
        accessor: "state",
        disableFilters: true,
        id: "state"
    },
    {
        Header: "Post Code",
        accessor: "postcode",
        disableFilters: true,
        id: "postcode"
    },
    {
        Header: "Country",
        accessor: "country",
        disableFilters: true,
        id: "country"
    },
    {
        Header: "Modified Date Time",
        accessor: "updatedAt",
        disableFilters: true,
        id: "updatedBy"
    },
    {
        Header: "Modified By",
        accessor: "modifiedBy",
        disableFilters: true,
        id: "modifiedBy"
    }
]

export default CustomerViewPrint