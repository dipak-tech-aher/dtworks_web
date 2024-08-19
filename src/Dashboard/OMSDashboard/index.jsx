import React, { Suspense, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { OMSDashboardContext, AppContext } from "../../AppContext";
import { properties } from '../../properties';
import { get } from '../../common/util/restUtil';
import SuspenseFallbackLoader from '../../common/components/SuspenseFallbackLoader';
import FilterBtn from "../../assets/images/filter-btn.svg";
import moment from 'moment';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from "react-toastify";
import TotalStats from './Components/TotalStats';
import SignupsVsSignouts from './Components/SignupsVsSignouts';
import TotalCustomers from './Components/TotalCustomers';
import OrderOverview from './Components/OrderOverview';
import OverallAgeing from './Components/OverallAgeing';
import SlaAgeing from './Components/SlaAgeing';
import OrderFulfillmentTime from './Components/OrderFulfillmentTime';
import OrderDeliveryTime from './Components/OrderDeliveryTime';
import OnTimeDeliveryRate from './Components/OnTimeDeliveryRate';
import OrderAccuracyRate from './Components/OrderAccuracyRate';
import ServiceActivationSuccessRate from './Components/ServiceActivationSuccessRate';
import PurchasingFrequencyOfCustomers from './Components/PurchasingFrequencyOfCustomers';
import AverageHandlingTime from './Components/AverageHandlingTime';
import AverageOrderValue from './Components/AverageOrderValue';
import ChurnRate from './Components/ChurnRate';
import OrderByRevenue from './Components/OrderByRevenue';
import CustomersByOrderValueVsOrderCount from './Components/CustomersByOrderValueVsOrderCount';
import ProductsByOrderValueVsOrderCount from './Components/ProductsByOrderValueVsOrderCount';
import Filter from './Components/filter';
import { useHistory } from '../../common/util/history';
import { useReactToPrint } from 'react-to-print';
import { pageStyle } from "../../common/util/util";
import ExportOmsDashboard from './Components/PDF';

const OMSDashboard = () => {
    let { appConfig, systemConfig } = useContext(AppContext);
    const [isPageRefresh, setIsPageRefresh] = useState(false);
    const [masterLookupData, setMasterLookupData] = useState({});
    const [showFilter, setShowFilter] = useState(false);
    const startDate = moment().subtract(5, 'months').startOf('month').format('YYYY-MM-DD');
    const endDate = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
    // const endDate = moment().clone().endOf('month').format('YYYY-MM-DD');
    const [searchParams, setSearchParams] = useState({
        fromDate: startDate,
        toDate: endDate
    });
    const dateRange = useRef()
    const history = useHistory()
    const [pdf, setPdf] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [pageRefreshTime, setPageRefreshTime] = useState(30);
    const [defaultCurrency, setDefaultCurrency] = useState('');

    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=ORDER_CATEGORY,ORDER_TYPE,ORDER_STATUS,DEPARTMENT,CURRENCY')
            .then((response) => {
                const { data } = response;
                setMasterLookupData({ ...data });
                // setDefaultCurrency(response?.data?.CURRENCY?.filter((val) => val?.code === "CUR-INR"))

                const defCurrency = systemConfig?.filter((val, i) => val?.configKey === "CURRENCY")
                const currency = response?.data?.CURRENCY?.filter((val, i) => val?.value === defCurrency[0]?.configValue)
                setDefaultCurrency(currency)
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    const componentRef = useRef()
    const pdfRef = useRef()
    const handlePrintStart = () => {
        setPdf(true)
        setTimeout(() => {
            handlePrint()
        }, 1000);
    };
    const handlePrint = useReactToPrint({
        content: () => componentRef?.current,
        onAfterPrint: () => {
            document.title = 'dtWorks';
            setPdf(false)
        },
        pageStyle: pageStyle
    })

    const setExportData = useCallback((name, value) => {
        pdfRef.current = { [name]: value, ...pdfRef.current }
    }, [pdfRef.current])

    const handleOpenRightModal = (payload) => {
        history(`/view-customer`, {
            state: {
                data: payload
            }
        })
    }

    const contextProvider = {
        data: {
            searchParams,
            isPageRefresh,
            exportData: pdfRef?.current,
            defaultCurrency
        },
        handlers: { setExportData, handleOpenRightModal },
        Loader: SuspenseFallbackLoader,
    }

    useEffect(() => {
        unstable_batchedUpdates(() => {
            // console.log('typeof(pageRefreshTime)---->', pageRefreshTime)
            if (pageRefreshTime && typeof (pageRefreshTime) === 'number') {
                const intervalId = setInterval(() => {
                    if (isChecked) {
                        setIsPageRefresh(!isPageRefresh)
                        const currentTime = moment().format('DD-MM-YYYY HH:mm:ss')
                    }
                }, Number(pageRefreshTime) * 60 * 1000);

                return () => clearInterval(intervalId);
            }
        })
    }, [isChecked]);

    const handleAutoRefresh = (event) => {
        if (!pageRefreshTime) {
            toast.error("Refresh Time Is Require!");
            return;
        }
        setIsChecked(event.target.checked);
    }

    const handleSetRefreshTime = (e) => {
        unstable_batchedUpdates(() => {
            setIsChecked(false);
            setPageRefreshTime(parseInt(e.target.value));
        });
    };

    const clearFilter = (param, value) => {
        // if (['status', 'type', 'category'].includes(param)) {
        //     searchParams[param] = searchParams[param].filter(x => x.value != value);
        // } else {
        //     searchParams[param] = null;
        // }

        searchParams[param] = null;

        setSearchParams({
            ...searchParams
        })
    }

    const getSelectedFilters = () => {
        let status, type, category;

        if (searchParams?.fromDate || searchParams?.toDate) {
            let fromDate = searchParams?.fromDate;
            let toDate = searchParams?.toDate ? searchParams?.toDate : fromDate;
            dateRange.current = fromDate + " - " + toDate;
        }
        if (searchParams?.type) type = searchParams?.type;
        if (searchParams?.category) category = searchParams?.category;
        if (searchParams?.status) status = searchParams?.status;

        return (
            <React.Fragment>
                {dateRange && (
                    <li style={{ fontSize: '15px' }}>
                        Date Range:
                        <span className="dash-filter-badge ml-1">{dateRange.current}
                        </span>
                    </li>
                )}
                {type && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Type:
                        <span className={`dash-filter-badge ml-2`}>{type.label}
                            <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('type', type.value)}><i className="fas fa-times"></i></span>
                        </span>
                    </li>
                )}
                {status && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Status:
                        <span className={`dash-filter-badge ml-2`}>{status.label}
                            <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('status', status.value)}><i className="fas fa-times"></i></span>
                        </span>
                    </li>
                )}
                {category && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Category:
                        <span className={`dash-filter-badge ml-2`}>{category.label}
                            <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('category', category.value)}><i className="fas fa-times"></i></span>
                        </span>
                    </li>
                )}
            </React.Fragment>
        )
    }

    return (
        <OMSDashboardContext.Provider value={contextProvider}>
            <div className="content visible-print-export">
                <div className="container-fluid pr-1">
                    <div className="cnt-wrapper">
                        <div className="card-skeleton">
                            <div className="customer-skel mt-0">
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="tab-content">
                                            <div className="tab-pane fade show active">
                                                <div id="wrapper">
                                                    <div className="cnt-wrapper">
                                                        {/* New skeleton base */}
                                                        <div className="card-skeleton">
                                                            <div className="skle-swtab-sect">
                                                                <div className="d-flex">
                                                                    <div className="skle-swtab-sect tabbable mt-0 mb-0">
                                                                        <ul className="skel-top-inter mt-1 mb-0">
                                                                            {getSelectedFilters()}
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                                <form
                                                                    className="form-inline"
                                                                    style={{ justifyContent: "flex-end" }}
                                                                >
                                                                    <>
                                                                        <span className="ml-1">Auto Refresh</span>
                                                                        <div className="switchToggle ml-1">
                                                                            <input id="switch1"
                                                                                type="checkbox"
                                                                                checked={isChecked}
                                                                                onChange={handleAutoRefresh}
                                                                            />
                                                                            <label htmlFor="switch1">Toggle</label>
                                                                        </div>
                                                                        <select
                                                                            className="custom-select custom-select-sm ml-1"
                                                                            value={pageRefreshTime}
                                                                            onChange={handleSetRefreshTime}
                                                                        >
                                                                            <option value="Set">Set</option>
                                                                            <option value={Number(1)}>1 Min</option>
                                                                            <option value={Number(5)}>5 Min</option>
                                                                            <option value={Number(15)}>15 Min</option>
                                                                            <option value={Number(30)}>30 Min</option>
                                                                        </select>
                                                                    </>
                                                                    <button type="button" className="skel-btn-export" onClick={() => handlePrintStart()}>
                                                                        Export PDF&nbsp;
                                                                        <i className="fa fa-file-pdf" aria-hidden="true" />
                                                                    </button>
                                                                    <div className="db-list mb-0 pl-1">
                                                                        <a className="skel-fr-sel-cust" onClick={() => setShowFilter(!showFilter)}>
                                                                            <div className="list-dashboard db-list-active skel-self">
                                                                                <span className="db-title">
                                                                                    Filter&nbsp;
                                                                                    <img
                                                                                        src={FilterBtn}
                                                                                        className="img-fluid pl-1"
                                                                                    />
                                                                                </span>
                                                                            </div>
                                                                        </a>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                            <Filter
                                                                data={{ showFilter, searchParams, isParentRefresh: isPageRefresh, masterLookupData, startDate, endDate }}
                                                                handler={{ setShowFilter, setSearchParams }}
                                                            />
                                                            <div className="skel-informative-data mt-2 mb-2">
                                                                <div className="row mx-lg-n1">
                                                                    <div className="col-md-3 mb-2 px-lg-1 service-360-tiles skel-oms-tiles">
                                                                        <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                            <TotalStats apiCall={true} />
                                                                        </Suspense>
                                                                    </div>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <OrderOverview apiCall={true} />
                                                                    </Suspense>
                                                                </div>
                                                                <div className="row mx-lg-n1">
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <SignupsVsSignouts apiCall={true} />
                                                                    </Suspense>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <TotalCustomers apiCall={true} />
                                                                    </Suspense>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <OverallAgeing apiCall={true} />
                                                                    </Suspense>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <SlaAgeing apiCall={true} />
                                                                    </Suspense>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <OrderFulfillmentTime apiCall={true} />
                                                                    </Suspense>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <AverageHandlingTime apiCall={true} />
                                                                    </Suspense>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <OrderDeliveryTime apiCall={true} />
                                                                    </Suspense>
                                                                    {/* <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <OnTimeDeliveryRate apiCall={true} />
                                                                    </Suspense>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <OrderAccuracyRate apiCall={true} />
                                                                    </Suspense>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <ServiceActivationSuccessRate apiCall={true} />
                                                                    </Suspense> */}
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <PurchasingFrequencyOfCustomers apiCall={true} />
                                                                    </Suspense>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <AverageOrderValue apiCall={true} />
                                                                    </Suspense>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <ChurnRate apiCall={true} />
                                                                    </Suspense>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <CustomersByOrderValueVsOrderCount apiCall={true} />
                                                                    </Suspense>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <ProductsByOrderValueVsOrderCount apiCall={true} />
                                                                    </Suspense>
                                                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                        <OrderByRevenue apiCall={true} />
                                                                    </Suspense>
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
                    </div>
                </div>
            </div>
            <ExportOmsDashboard ref={componentRef} pdf={pdf} data={pdfRef?.current} />

        </OMSDashboardContext.Provider>
    )
}

export default OMSDashboard;
