/* eslint-disable jsx-a11y/anchor-is-valid */
import moment from 'moment';
import React, { useEffect, useState } from "react";
import { properties } from "../../properties";
import { get, post } from "../../common/util/restUtil";
import totalCustomer from "../../assets/images/svg/t-customer.svg";
import totalInvoice from "../../assets/images/svg/t-sales.svg";
import totalOpenInvoice from "../../assets/images/svg/t-invoice.svg";
import totalAppliedReceiptsAmount from "../../assets/images/svg/t-payment.svg";
import AgeingChart from './Charts/AgeingChart';
import InvoiceOverviewChart from './Charts/InvoiceOverviewChart';
import Top5CustomersChart from './Charts/Top5CustomersChart';
import Top5CustomersAmountChart from './Charts/Top5CustomersAmountChart';
import OverdueChart from './Charts/OverdueChart';
import OpenvscloseChart from './Charts/OpenvscloseChart';
import OpenvscloseInvoiceChart from './Charts/OpenvscloseInvoiceChart';
import { convertToIntlCurrency } from '../../common/util/util';

const ARAgeingDashboard = (props) => {
    let defaultCurrency = props?.appsConfig?.clientConfig?.defaultCurrency ?? '';
    const initialValues = {
        customerId: "",
        invoiceStatus: "",
        invoiceDate: ""
    };
    const [searchInputs, setSearchInputs] = useState(initialValues)
    const [customerList, setcustomerList] = useState()
    const [widgetCounts, setWidgetCounts] = useState()
    const [overViewCounts, setOverViewCounts] = useState()
    const [isRefresh, setIsRefresh] = useState(false);
    const [chartAgeing, setChartAgeing] = useState([]);
    const [totalAgeingCount, setTotalAgeingCount] = useState(0)
    const [invoiceOverview, setInvoiceOverview] = useState([]);
    const [invoiceOSCounts, setInvoiceOSCounts] = useState(0)

    const [top5Customers, setTop5Customers] = useState(0)
    const [top5CustomersAmount, setTop5CustomersAmount] = useState(0)
    const [openCloseInvoiceData, setOpenCloseInvoiceData] = useState(0)
    const [openCloseInvoiceGraphData, setOpenCloseInvoiceGraphData] = useState(0)

    const [overdueCountData, setOverdueCountData] = useState(0)
    const [overduegraphData, setOverduegraphData] = useState(0)

    const invoiceStatus = [{ label: "Open", value: "OPEN" }, { label: "Closed", value: "CLOSED" }]
    useEffect(() => {

        get(properties.REPORTS_API + '/customers')
            .then((response) => {
                if (response.data) {
                    setcustomerList(response.data)
                }
            }).finally()
    }, [])

    useEffect(() => {

        post(properties.REPORTS_API + '/widgets', searchInputs)
            .then((response) => {
                if (response.data) {
                    setWidgetCounts(response.data)
                }
            }).finally()
    }, [isRefresh])

    useEffect(() => {

        post(properties.REPORTS_API + '/overview', searchInputs)
            .then((response) => {
                if (response.data) {
                    let sum = 0
                    for (const i of Object.values(response.data)) {
                        sum = Number(sum) + Number(i)
                    }
                    setTotalAgeingCount(sum)
                    const xAxisData = [];
                    const yAxisData = [];
                    const overViewData = response.data
                    let maxKey = "";
                    let maxValue = -1;
                    for (const key in overViewData) {
                        if (overViewData.hasOwnProperty(key)) {
                            xAxisData.push(`${key}`);
                            const value = overViewData[key];
                            yAxisData.push({
                                value: `${value ? value : 0}`,
                                itemStyle: {
                                    color: key === 'above360' ? '#7D0849' : '#ffc107',
                                }
                            });

                            if (value > maxValue) {
                                maxValue = value;
                                maxKey = key;
                            }
                        }
                    }

                    setChartAgeing([{ xAxisData, yAxisData }]);
                    setOverViewCounts(response.data)
                }
            }).finally()
    }, [isRefresh]);

    useEffect(() => {

        post(properties.REPORTS_API + '/invoice/overview', searchInputs)
            .then((response) => {
                if (response.data) {
                    setInvoiceOverview(response.data)
                    setInvoiceOSCounts({
                        totalOSAmount: response.data.invoiceDueAmount,
                        invoiceAmount: response.data.currentOSamount
                    })
                }
            }).finally()
    }, [isRefresh])

    useEffect(() => {

        post(properties.REPORTS_API + '/top5/customers', searchInputs)
            .then((response) => {
                if (response.data) {
                    const obj = []
                    if (response?.data?.length > 0) {
                        const sortedData = response?.data?.sort((a, b) => a?.oPaymentAmount - b?.oPaymentAmount);
                        console.log('-sortedDatasortedData->', sortedData)
                        for (const i of sortedData) {
                            obj.push(Object.values(i))
                        }
                    }
                    console.log('obj---------->', obj)
                    setTop5Customers(obj)
                }
            }).finally()
    }, [isRefresh]);

    useEffect(() => {

        post(properties.REPORTS_API + '/top5/customers/amount', searchInputs)
            .then((response) => {
                if (response.data) {
                    const obj = []
                    if (response?.data?.length > 0) {
                        const sortedData = response?.data?.sort((a, b) => a?.oTotalOsAmount - b?.oTotalOsAmount);
                        for (const i of sortedData) {
                            obj.push(Object.values(i))
                        }
                    }
                    setTop5CustomersAmount(obj)
                }
            }).finally()
    }, [isRefresh]);

    useEffect(() => {

        post(properties.REPORTS_API + '/open/invoice', searchInputs)
            .then((response) => {
                if (response.data) {
                    setOpenCloseInvoiceData(response.data)
                }
            }).finally()
    }, [isRefresh]);
    useEffect(() => {

        post(properties.REPORTS_API + '/open/invoice/graph', searchInputs)
            .then((response) => {
                if (response.data) {
                    setOpenCloseInvoiceGraphData(response.data)
                }
            }).finally()
    }, [isRefresh]);


    useEffect(() => {

        post(properties.REPORTS_API + '/overdue', searchInputs)
            .then((response) => {
                if (response.data) {
                    setOverdueCountData(response.data.count)
                    setOverduegraphData(response.data.graph)
                }
            }).finally()
    }, [isRefresh])


    const handleSubmit = (e) => {
        e.preventDefault();
        setIsRefresh(!isRefresh)
    }
    const handleClear = (e) => {
        //e.preventDefault();
        setIsRefresh(!isRefresh)
    }

    const handleInputChange = (e) => {
        const target = e.target;
        setSearchInputs({
            ...searchInputs,
            [target.id]: target.value
        })
    }

    return (
        <>
        <div className='cmmn-skeleton mt-2'>
            {/* <div className="row" style={{ display: "flex" }}>
                <div className='col-9'>
                    <div className="page-title-box">
                        <h4 className="page-title">AR Ageing Dashboard</h4>
                    </div>
                </div>
            </div> */}
            <div className="mt-1">
                
                    <div className="search-result-box m-t-30">
                        <form onSubmit={(e) => handleSubmit(e)}>
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="invoiceDate" className="control-label">Invoice Date</label>
                                        <input
                                            value={moment(searchInputs.invoiceDate).format('YYYY-MM-DD')}
                                            onChange={handleInputChange}
                                            type="date"
                                            className="form-control"
                                            id="invoiceDate"
                                            max={moment(new Date()).format('YYYY-MM-DD')}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="customerId" className="control-label">By Customer</label>
                                        <select id='customerId' className='form-control cursor-pointer' value={searchInputs.customerId} onChange={handleInputChange} >
                                            <option value="">Select Customer</option>
                                            {
                                                customerList?.map((e) => (
                                                    <option value={e.customerId}>{e.firstName}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="invoiceStatus" className="control-label">By Invoice Status</label>
                                        <select id='invoiceStatus' className='form-control cursor-pointer' value={searchInputs.invoiceStatus} onChange={handleInputChange} >
                                            <option value="">Select Invoice Status</option>
                                            {
                                                invoiceStatus?.map((e) => (
                                                    <option value={e.value}>{e.label}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-3 skel-btn-center-cmmn mt-28">
                                    <button type="button" className="skel-btn-cancel" onClick={() => { setSearchInputs(initialValues); handleClear() }}>Clear</button>
                                    <button type="submit" className="skel-btn-submit">Search</button>

                                </div>
                            </div>
                        </form>
                        <div className="skel-self-data">
                            <div className="skel-interaction-dashboard-rht-base">
                                <div className="skel-kpi-metrics-overview skel-ar-kpi mt-1 mb-2">
                                    <div className="row">
                                        <div className="col-md-2 col-sm-3 col-xs-12">
                                            <div className="skel-inv-base-kpi-sect skel-kpi-box sk-int-total-int sk-pur-clr">
                                                <div className="skel-ar-kpi-icons">
                                                    <img src={totalCustomer} className="img-fluid" />
                                                </div>
                                                <div>
                                                    <span>Total Customer</span>
                                                    <span className="font-bold cursor-pointer" data-target="#detailsmodal" data-toggle="modal">{widgetCounts?.oCustomerCnt || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-sm-3 col-xs-12 pr-1 pl-1">
                                            <div className="skel-inv-base-kpi-sect skel-kpi-box sk-int-total-int sk-pur-clr">
                                                <div className="skel-ar-kpi-icons">
                                                    <img src={totalInvoice} className="img-fluid" />
                                                </div>
                                                <div>
                                                    <span>Total Invoice</span>
                                                    <span className="font-bold cursor-pointer" data-target="#detailsmodal" data-toggle="modal">{widgetCounts?.oInvoiceCnt || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-sm-3 col-xs-12 pr-1 pl-1">
                                            <div className="skel-inv-base-kpi-sect skel-kpi-box sk-int-total-wip sk-pur-clr">
                                                <div className="skel-ar-kpi-icons">
                                                    <img src={totalOpenInvoice} className="img-fluid" />
                                                </div>
                                                <div>
                                                    <span>Total Open Invoice </span>
                                                    <span className="font-bold cursor-pointer" data-target="#detailsmodal" data-toggle="modal">{widgetCounts?.oOpenInvoiceCnt || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-sm-3 col-xs-12 pr-1 pl-1">
                                            <div className="skel-inv-base-kpi-sect skel-kpi-box sk-int-total-cl sk-pur-clr">
                                                <div className="skel-ar-kpi-icons">
                                                    <img src={totalOpenInvoice} className="img-fluid" />
                                                </div>
                                                <div>
                                                    <span>Total Closed Invoice</span>
                                                    <span className="font-bold cursor-pointer" data-target="#detailsmodal" data-toggle="modal">{widgetCounts?.oClosedInvoiceCnt || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-sm-3 col-xs-12 pr-1 pl-1">
                                            <div className="skel-inv-base-kpi-sect skel-kpi-box sk-int-total-cr sk-pur-clr">
                                                <div className="skel-ar-kpi-icons">
                                                    <img src={totalAppliedReceiptsAmount} className="img-fluid" />
                                                </div>
                                                <div>
                                                    <span>Total Applied Receipts</span>
                                                    <span className="font-bold cursor-pointer" data-target="#detailsmodal" data-toggle="modal">{defaultCurrency} {widgetCounts?.oAppliedAmount ? convertToIntlCurrency(widgetCounts?.oAppliedAmount) : 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-2 col-sm-3 col-xs-12">
                                            <div className="skel-inv-base-kpi-sect skel-kpi-box sk-int-total-wip sk-pur-clr">
                                                <div className="skel-ar-kpi-icons">
                                                    <img src={totalAppliedReceiptsAmount} className="img-fluid" />
                                                </div>
                                                <div>
                                                    <span>Total Unapplied Receipts</span>
                                                    <span className="font-bold cursor-pointer" data-target="#detailsmodal" data-toggle="modal">{defaultCurrency} {widgetCounts?.oUnappliedAmount ? convertToIntlCurrency(widgetCounts?.oUnappliedAmount) : 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-5">
                                        <div className="cmmn-skeleton mh-503 cmmn-skeleton-new">
                                            <div className="skel-dashboard-title-base">
                                                <span className="skel-header-title">Ageing Overview</span>
                                                <div className="skel-dashboards-icons">
                                                    {/* <a href="#"><i className="material-icons">refresh</i></a>
                                                    <a href="#"><i className="material-icons">filter_alt</i></a> */}
                                                </div>
                                            </div>
                                            <hr className="cmmn-hline" />
                                            <div className="text-center mt-2">
                                                <span className="text-center text-truncate d-block mb-0 mt-2">Total Ageing</span>
                                                <h4 className="text-dark cursor-pointer font-bold fnt-15" data-target="#detailsmodal" data-toggle="modal">{defaultCurrency} &nbsp;
                                                    {(totalAgeingCount ? convertToIntlCurrency(totalAgeingCount) : 0) || 0}</h4>
                                            </div>

                                            {/* <embed src="./assets/chart/ageing-ar.html" type="text/html" width="100%" height="335" /> */}
                                            <div className="skel-graph-sect mt-3">
                                                <AgeingChart data={{ chartData: chartAgeing ,defaultCurrency}} />
                                            </div>
                                            {/* <hr className="cmmn-hline" /> */}
                                            <div className="skel-refresh-info">
                                                {/* <span><i className="material-icons">refresh</i> Updated 5 mins ago</span> */}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-7">
                                        <div className="cmmn-skeleton mh-503 cmmn-skeleton-new">
                                            <div className="skel-dashboard-title-base">
                                                <span className="skel-header-title">Invoice Overview</span>
                                                <div className="skel-dashboards-icons">
                                                    {/* <a href="#"><i className="material-icons">refresh</i></a>
                                                    <a href="#"><i className="material-icons">filter_alt</i></a> */}
                                                </div>
                                            </div>
                                            <hr className="cmmn-hline" />
                                            <div className="skel-graph-sect mt-3 skel-graph-grid skel-inv-overview-sect mt-4 mb-0">
                                                <div className="skel-two-grid">
                                                    <div className="skel-inv-ovr-data">
                                                        <div className="skel-inv-details">
                                                            <div className="skel-inv-sect-header">
                                                                <span className="skel-sm-heading">Total Invoice</span>
                                                                <h4 className="font-bold cursor-pointer" data-target="#detailsmodal" data-toggle="modal">{invoiceOverview.totalInvoice || 0}</h4>
                                                            </div>
                                                            <div className="skel-inv-sec-cnt">
                                                                <span className="skel-sm-heading">Total Invoice Amount</span>
                                                                <h4 className="font-bold cursor-pointer txt-cl-pur" data-target="#detailsmodal" data-toggle="modal">{defaultCurrency} {invoiceOverview.invoiceAmount ? convertToIntlCurrency(invoiceOverview.invoiceAmount) : 0}</h4>
                                                            </div>
                                                            <div className="skel-inv-sec-cnt">
                                                                <span className="skel-sm-heading">Total Outstanding Amount</span>
                                                                <h4 className="font-bold cursor-pointer txt-cl-pur" data-target="#detailsmodal" data-toggle="modal">{defaultCurrency} {invoiceOverview.invoiceOSAmount ? convertToIntlCurrency(invoiceOverview.invoiceOSAmount) : 0}</h4>
                                                            </div>
                                                            <div className="skel-inv-sec-cnt">
                                                                <span className="skel-sm-heading">Total Due OS Amount</span>
                                                                <h4 className="font-bold cursor-pointer txt-cl-pur" data-target="#detailsmodal" data-toggle="modal">{defaultCurrency} {invoiceOverview.invoiceDueAmount ? convertToIntlCurrency(invoiceOverview.invoiceDueAmount) : 0}</h4>
                                                            </div>
                                                            <div className="skel-inv-sec-cnt">
                                                                <span className="skel-sm-heading">Total Current OS Amount</span>
                                                                <h4 className="font-bold cursor-pointer txt-cl-yel" data-target="#detailsmodal" data-toggle="modal">{defaultCurrency} {invoiceOverview.currentOSamount ? convertToIntlCurrency(invoiceOverview.currentOSamount) : 0}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="skel-two-grid">
                                                    <InvoiceOverviewChart data={{ chartData: invoiceOSCounts,defaultCurrency }} />
                                                </div>
                                            </div>
                                            {/* <hr className="cmmn-hline" /> */}
                                            <div className="skel-refresh-info">
                                                {/* <span><i className="material-icons">refresh</i> Updated 5 mins ago</span> */}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row mt-2">
                                    <div className="col-md-12">
                                        <div className="cmmn-skeleton mh-520 cmmn-skeleton-new">
                                            <div className="skel-dashboard-title-base">
                                                <span className="skel-header-title">Open vs Closed Invoice</span>
                                                <div className="skel-dashboards-icons">
                                                    {/* <a href="#"><i className="material-icons">refresh</i></a>
                                                    <a href="#"><i className="material-icons">filter_alt</i></a> */}
                                                </div>
                                            </div>
                                            <hr className="cmmn-hline" />
                                            <div className="row mt-2">
                                                <div className="col-6">
                                                    <div className="text-center">
                                                        <span className="text-center text-truncate d-block mb-0 mt-2">Open Invoice</span>
                                                        <h4 className="font-bold cursor-pointer fnt-15" data-target="#detailsmodal" data-toggle="modal">{openCloseInvoiceGraphData.length > 0 ? openCloseInvoiceGraphData[0].oOpenInvCnt : 0}</h4>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="text-center">
                                                        <span className="text-center text-truncate d-block mb-0 mt-2">Closed Invoice</span>
                                                        <h4 className="font-bold cursor-pointer fnt-15" data-target="#detailsmodal" data-toggle="modal">{openCloseInvoiceGraphData.length > 0 ? openCloseInvoiceGraphData[0].oClosedInvCnt : 0}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="skel-graph-sect mt-3">
                                                <OpenvscloseInvoiceChart data={{ chartData: openCloseInvoiceGraphData,defaultCurrency }} />
                                                {/* <embed src="./assets/chart/open-closed-invoice.html" type="text/html" width="100%" height="240" /> */}
                                            </div>
                                            {/* <hr className="cmmn-hline" /> */}
                                            <div className="skel-refresh-info">
                                                {/* <span><i className="material-icons">refresh</i> Updated 5 mins ago</span> */}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='row mt-2'>
                                    <div className="col-6">
                                        <div className="cmmn-skeleton mh-520 cmmn-skeleton-new">
                                            <div className="skel-dashboard-title-base">
                                                <span className="skel-header-title">Invoice Amount vs OS Amount Balance</span>
                                                <div className="skel-dashboards-icons">
                                                    {/* <a href="#"><i className="material-icons">refresh</i></a>
                                                    <a href="#"><i className="material-icons">filter_alt</i></a> */}
                                                </div>
                                            </div>
                                            <hr className="cmmn-hline" />
                                            <div className="row mt-2">
                                                <div className="col-6">
                                                    <div className="text-center">
                                                        <span className="text-center text-truncate d-block mb-0 mt-2">Invoice Amount</span>
                                                        <h4 className="font-bold cursor-pointer fnt-15" data-target="#detailsmodal" data-toggle="modal">
                                                            {defaultCurrency} {openCloseInvoiceData.length > 0 ? (openCloseInvoiceData[0].oOpenInvAmount && openCloseInvoiceData[0].oOpenInvAmount > 0 ? convertToIntlCurrency(openCloseInvoiceData[0].oOpenInvAmount) : 0) : 0}</h4>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="text-center">
                                                        <span className="text-center text-truncate d-block mb-0 mt-2">OS Amount Balance</span>
                                                        <h4 className="font-bold cursor-pointer fnt-15" data-target="#detailsmodal" data-toggle="modal">{defaultCurrency} {openCloseInvoiceData.length > 0 ? (openCloseInvoiceData[0].oClosedInvAmount && openCloseInvoiceData[0].oClosedInvAmount > 0 ? convertToIntlCurrency(openCloseInvoiceData[0].oClosedInvAmount) : 0) : 0}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="skel-graph-sect mt-3">
                                                <OpenvscloseChart data={{ chartData: openCloseInvoiceData, defaultCurrency }} />
                                                {/* <embed src="./assets/chart/open-closed-balance.html" type="text/html" width="100%" height="320" /> */}
                                            </div>
                                            {/* <hr className="cmmn-hline" /> */}
                                            <div className="skel-refresh-info">
                                                {/* <span><i className="material-icons">refresh</i> Updated 5 mins ago</span> */}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="cmmn-skeleton mh-520 cmmn-skeleton-new">
                                            <div className="skel-dashboard-title-base">
                                                <span className="skel-header-title">Total Invoice vs Total Receipt Received</span>
                                                <div className="skel-dashboards-icons">
                                                    {/* <a href="#"><i className="material-icons">refresh</i></a>
                                                    <a href="#"><i className="material-icons">filter_alt</i></a> */}
                                                </div>
                                            </div>
                                            <hr className="cmmn-hline" />
                                            <div className="row mt-2">
                                                <div className="col-6">
                                                    <div className="text-center">
                                                        <span className="text-center text-truncate d-block mb-0 mt-2">Total Invoice</span>
                                                        <h4 className="font-bold cursor-pointer fnt-15" data-target="#detailsmodal" data-toggle="modal">{defaultCurrency} {overdueCountData.oTotalInvAmount != null ? convertToIntlCurrency(overdueCountData.oTotalInvAmount) : 0}</h4>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="text-center">
                                                        <span className="text-center text-truncate d-block mb-0 mt-2">Total Receipt Received</span>
                                                        <h4 className="font-bold cursor-pointer fnt-15" data-target="#detailsmodal" data-toggle="modal">{defaultCurrency} {overdueCountData.oTotalReceiptAmount != null ? convertToIntlCurrency(overdueCountData.oTotalReceiptAmount) : 0}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="skel-graph-sect mt-3">
                                                <OverdueChart data={{
                                                    chartData: overdueCountData, defaultCurrency
                                                }} />
                                            </div>
                                            {/* <hr className="cmmn-hline" /> */}
                                            <div className="skel-refresh-info">
                                                {/* <span><i className="material-icons">refresh</i> Updated 5 mins ago</span> */}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row mt-2">
                                    <div className="col-6">
                                        <div className="cmmn-skeleton cmmn-skeleton-new">
                                            <div className="skel-dashboard-title-base">
                                                <span className="skel-header-title">Top 5 Customer Outstanding Amount</span>
                                            </div>
                                            <hr className="cmmn-hline" />
                                            <div className="skel-perf-sect">
                                                <div className="skel-perf-graph h-400">
                                                    <Top5CustomersChart data={{ chartData: top5Customers,defaultCurrency }} />
                                                </div>
                                            </div>
                                            <hr className="cmmn-hline" />
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="cmmn-skeleton cmmn-skeleton-new">
                                            <div className="skel-dashboard-title-base">
                                                <span className="skel-header-title">Top 5 Paying Customers</span>
                                                <div className="skel-dashboards-icons">
                                                </div>
                                            </div>
                                            <hr className="cmmn-hline" />
                                            <div className="skel-perf-sect">
                                                <div className="skel-perf-graph h-400 mt-0">
                                                    <Top5CustomersAmountChart data={{ chartData: top5CustomersAmount, defaultCurrency }} />
                                                </div>
                                            </div>
                                            <hr className="cmmn-hline" />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                
                </div>
            </div>
        </>
    )
}

export default ARAgeingDashboard;