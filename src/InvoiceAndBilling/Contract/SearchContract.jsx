import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import moment from 'moment'
import { NumberFormatBase } from 'react-number-format';
import { toast } from 'react-toastify';
import { properties } from '../../properties';
import { post } from '../../common/util/restUtil';
import { useHistory } from '../../common/util/history';
import { ContractSerachCols } from './contractSerachCols';
import DynamicTable from '../../common/table/DynamicTable';

import ViewContract from './viewContract';
import { unstable_batchedUpdates } from 'react-dom';
import EditContract from './EditContract';
import { formFilterObject, USNumberFormat } from '../../common/util/util';
import { AppContext } from '../../AppContext';


const SearchContract = (props) => {
    const [contractForm, setContractForm] = useState({
        // soNumber: null,
        contractNo: props?.data?.data?.contractNo ?? null,
        contractId: props?.data?.data?.contractId ?? null,
        customerNumber: null,
        customerName: null,
        startDate: props?.data?.data?.startDate || null,
        endDate: props?.data?.data?.endDate || null,
        billRefNo: props?.data?.data?.billRefNo || null,
        soId: props?.data?.data?.soId || null,
        customerUuid: props?.data?.data?.customerUuid,
        accountUuid: props?.data?.data?.accountUuid || null,
        serviceUuid: props?.data?.data?.serviceUuid || null
    })
    const history = useHistory()

    const [userPermission, setUserPermission] = useState({ searchContract: false, viewContractList: false, editContract: false })
    const accountContractType = props?.data?.contractType || props?.location?.data?.sourceName || props?.location?.state?.sourceName || null
    const [contractType, setContractType] = useState(accountContractType || '')
    const { auth } = useContext(AppContext)
    const isScroll = props?.data?.isScroll ?? true
    useEffect(() => {
        if (props?.location?.data?.sourceName !== undefined) {
            localStorage.setItem('sourceName', props?.location?.data?.sourceName || null)
        }
        let type = localStorage.getItem('sourceName')
        if (accountContractType === null) {
            setContractType(type)
        }
        else {
            setContractType(accountContractType)
        }

    }, [props])

    useEffect(() => {

        // let rolePermission = []

        // auth && auth.permissions && auth.permissions.filter(function (e) {
        //     let property = Object.keys(e)
        //     if (property[0] === "Contract") {
        //         let value = Object.values(e)
        //         rolePermission = Object.values(value[0])
        //     }
        // })

        // let search, viewList, edit;
        // rolePermission.map((screen) => {
        //     if (screen.screenName === "Search Contract") {
        //         search = screen.accessType
        //     }
        //     else if (screen.screenName === "View Contract List") {
        //         viewList = screen.accessType
        //     }
        //     else if (screen.screenName === "Edit Contract") {
        //         edit = screen.accessType
        //     }

        // })
        // setUserPermission({ searchContract: search, viewContractList: viewList, editContract: edit })

        let rolePermission = []
        auth && auth.permissions && auth.permissions.filter(function (e) {
            if (e?.moduleName === "Financial") {
                rolePermission = e.moduleScreenMap
            }
        })
        let search, viewList, edit;
        rolePermission.map((screen) => {
            if (screen.screenName === "Search Contract") {
                search = screen.accessType
            }
            else if (screen.screenName === "View Contract List") {
                viewList = screen.accessType
            }
            else if (screen.screenName === "Edit Contract") {
                edit = screen.accessType
            }
        })
        setUserPermission({ searchContract: search, viewContractList: viewList, editContract: edit })
    }, [auth])

    const hideForm = props?.data?.hideForm || false
    const fromLocation = props?.data?.from || null
    const refresh = props?.data?.refresh || false
    const pageRefresh = props?.handler?.pageRefresh
    const leftNavCounts = props?.data?.leftNavCounts || {}
    const setLeftNavCounts = props?.handler?.setLeftNavCounts

    const [exportBtn, setExportBtn] = useState(true)
    const [contractData, setContractData] = useState([])
    const [displayForm, setDisplayForm] = useState(true);
    const [isNormalSearch, setIsNormalSearch] = useState(true)
    const [contractSearchHiddenColumns, setContractSearchHiddenColumns] = useState(['edit'])
    const [isContractViewOpen, setIsContractViewOpen] = useState({ openModal: false });
    const [data, setData] = useState({})
    const [viewContractTotalRowCount, setViewContractTotalRowCount] = useState(0);
    const [viewContractPerPage, setViewContractPerPage] = useState(10);
    const [viewContractCurrentPage, setViewContractCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const isFirstRender = useRef(true);
    const [listSearch, setListSearch] = useState([]);
    const [isViewEditContractOpen, setIsViewEditContractOpen] = useState(false);

    useEffect(() => {
        console.log(isFirstRender.current, hideForm)
        if (!isFirstRender.current && hideForm === false) {
            console.log("12121")
            ContractDetails();
        }
        else {
            isFirstRender.current = false
        }
    }, [viewContractPerPage, viewContractCurrentPage, refresh])

    const getAccountContractDetails = useCallback(() => {
        if (hideForm !== '' && hideForm !== null && hideForm !== undefined && contractType) {
            if (hideForm === true) {
                setIsNormalSearch(false)
                if (fromLocation === 's360') {
                    setExportBtn(true)
                }
                else {
                    setExportBtn(false)
                }
                // console.log('accountContractType ------------->', accountContractType)
                if (accountContractType === "billed" || accountContractType === 'monthlyBilled') {
                    if (fromLocation === 'AccountView') {
                        setContractSearchHiddenColumns(['isAdvanceAllowed', 'advAllocationPercent', 'monthlyContractId', 'billPeriod', 'contractRefId', 'chargeName', 'totalCharge', 'itemName', 'serviceNumber', 'select'])
                    }
                    else if (fromLocation === 's360' || fromLocation === 'Customer360') {
                        setContractSearchHiddenColumns(['isAdvanceAllowed', 'advAllocationPercent', 'monthlyContractId', 'billPeriod', 'contractRefId', 'chargeName', 'totalCharge', 'itemName', 'serviceNumber', 'select', 'edit'])
                    }
                    if (fromLocation === 's360') {
                        getSalesOrderBilledContractDetails()
                    }
                    else {
                        if (accountContractType === 'monthlyBilled') {
                            getMonthlyBilledContractDetails()
                        } else {
                            getBilledContractDetails()
                        }
                    }
                }
                else if (accountContractType === "unbilled") {
                    if (fromLocation === 'AccountView') {
                        setContractSearchHiddenColumns(['startDate', 'endDate', 'nextBillPeriod', 'lastBillPeriod', 'status', 'contractRefId', 'chargeName', 'totalCharge', 'itemName', 'serviceNumber', 'select', 'billPeriod'])
                    }
                    else if (fromLocation === 's360' || fromLocation === 'Customer360') {
                        setContractSearchHiddenColumns(['startDate', 'endDate', 'nextBillPeriod', 'lastBillPeriod', 'status', 'contractRefId', 'chargeName', 'totalCharge', 'itemName', 'serviceNumber', 'select', 'edit', 'billPeriod'])
                    }
                    if (fromLocation === 's360') {
                        getSalesOrderUnbilledContractDetails()
                    }
                    else {
                        getUnbilledContractDetails()
                    }
                }
                else if (accountContractType === "history") {
                    setContractSearchHiddenColumns(['monthlyContractId', 'nextBillPeriod', 'lastBillPeriod', 'status', 'contractRefId', 'totalCharge', 'itemName', 'billPeriod', 'serviceNumber', 'select', 'edit'])
                    if (fromLocation === 's360') {
                        getSalesOrderContractHistoryDetails()
                    }
                    else {
                        getContractHistoryDetails()
                    }
                }
            }
            else {
                setIsNormalSearch(true)
            }
        }
    }, [viewContractCurrentPage, accountContractType])

    useEffect(() => {
        console.log({ hideForm })
        if (hideForm === true) {
            getAccountContractDetails()
        }
    }, [accountContractType, viewContractPerPage, viewContractCurrentPage, refresh])


    const handleViewContractPageSelect = (pageNo) => {
        console.log('pageno=======================', pageNo)
        //isFirstRender.current = false
        setViewContractCurrentPage(pageNo)
    }


    const getSalesOrderBilledContractDetails = (fromCallback = false) => {
        let requestBody = {
            ...contractForm,
            filters: formFilterObject(filters)
        }
        setListSearch(requestBody);

        post(`${properties.CONTRACT_API}/sales-order/search?limit=${viewContractPerPage}&page=${fromCallback ? 0 : Number(viewContractCurrentPage)}`, requestBody)
            .then((resp) => {
                if (resp?.data) {
                    const { rows, count } = resp.data;
                    if (hideForm === true) {
                        if (filters.length) {
                            if (count > 0) {
                                unstable_batchedUpdates(() => {
                                    setViewContractTotalRowCount(count);
                                    setContractData(rows);
                                })
                                if (fromLocation && fromLocation !== null && fromLocation === 's360') {
                                    setLeftNavCounts({
                                        ...leftNavCounts,
                                        contract: count || 0
                                    })
                                }
                            }
                            else {
                                toast.error('Record Not Found')
                            }
                        }
                        else {
                            if (fromLocation && fromLocation !== null && fromLocation === 's360') {
                                unstable_batchedUpdates(() => {
                                    setViewContractTotalRowCount(count);
                                    setContractData(rows);
                                })
                                setLeftNavCounts({
                                    ...leftNavCounts,
                                    contract: count || 0
                                })
                            }
                        }
                    }
                }
            })
            .catch(error => console.log(error))
            .finally(() => {

                //isFirstRender.current = true
                isTableFirstRender.current = false;
            })
    }

    const getSalesOrderUnbilledContractDetails = (fromCallback = false) => {
        let requestBody = {
            ...contractForm,
            filters: formFilterObject(filters)
        }
        setListSearch(requestBody);

        post(`${properties.CONTRACT_API}/sales-order/monthly/search?limit=${viewContractPerPage}&page=${fromCallback ? 0 : Number(viewContractCurrentPage)}`, requestBody).then((resp) => {
            if (resp?.data) {
                const { rows, count } = resp.data;
                if (hideForm === true) {
                    if (filters.length) {
                        if (count > 0) {
                            unstable_batchedUpdates(() => {
                                setViewContractTotalRowCount(count);
                                setContractData(rows);
                            })
                            if (fromLocation && fromLocation !== null && fromLocation === 's360') {
                                setLeftNavCounts({
                                    ...leftNavCounts,
                                    unbilledContract: count || 0
                                })
                            }
                        }
                        else {
                            toast.error('Record Not Found')
                        }
                    }
                    else {
                        if (fromLocation && fromLocation !== null && fromLocation === 's360') {
                            unstable_batchedUpdates(() => {
                                setViewContractTotalRowCount(count);
                                setContractData(rows);
                            })
                            setLeftNavCounts({
                                ...leftNavCounts,
                                unbilledContract: count || 0
                            })
                        }
                    }
                }
            }
        }).catch(error => console.log(error))
            .finally(() => {

                //isFirstRender.current = true
                isTableFirstRender.current = false;
            })
    }

    const getSalesOrderContractHistoryDetails = (fromCallback = false) => {
        let requestBody = {
            ...contractForm,
            filters: formFilterObject(filters)
        }
        setListSearch(requestBody);

        post(`${properties.CONTRACT_API}/sales-order/monthly/search?limit=${viewContractPerPage}&page=${fromCallback ? 0 : Number(viewContractCurrentPage)}&type=BILLED`, requestBody).then((resp) => {
            if (resp?.data) {
                const { rows, count } = resp?.data
                if (hideForm === true) {
                    if (filters.length) {
                        if (count > 0) {
                            unstable_batchedUpdates(() => {
                                setViewContractTotalRowCount(count);
                                setContractData(rows);
                            })
                            if (fromLocation && fromLocation !== null && fromLocation === 's360') {
                                setLeftNavCounts({
                                    ...leftNavCounts,
                                    contractHistory: count || 0
                                })
                            }
                        }
                        else {
                            toast.error('Record Not Found')
                        }
                    }
                    else {
                        if (fromLocation && fromLocation !== null && fromLocation === 's360') {
                            unstable_batchedUpdates(() => {
                                setViewContractTotalRowCount(count);
                                setContractData(rows);
                            })
                            setLeftNavCounts({
                                ...leftNavCounts,
                                contractHistory: count || 0
                            })
                        }
                    }
                }
            }
        }).catch(error => console.log(error))
            .finally(() => {

                //isFirstRender.current = true
                isTableFirstRender.current = false;
            })
    }

    const getBilledContractDetails = (fromCallback = false) => {
        let requestBody = {
            ...contractForm
        }
        setListSearch(requestBody);

        post(`${properties.CONTRACT_API}/search?limit=${viewContractPerPage}&page=${fromCallback ? 0 : Number(viewContractCurrentPage)}`, requestBody).then((resp) => {
            if (Number(resp?.data?.count) > 0) {
                const { rows, count } = resp.data;
                // console.log(resp.data)
                unstable_batchedUpdates(() => {
                    setViewContractTotalRowCount(count);
                    setContractData(rows);
                })
            }
            else {
                setContractData([])
                if (hideForm === false) {
                    toast.error('Record Not Found')
                    setContractData([])
                    setFilters([])
                }
                if (hideForm === true) {
                    if (filters.length) {
                        toast.error('Record Not Found')
                    }
                }
            }
        }).catch(error => console.log(error))
            .finally(() => {

                //isFirstRender.current = true
                isTableFirstRender.current = false;
            })
    }

    const getUnbilledContractDetails = (fromCallback = false) => {
        let requestBody = {
            ...contractForm
        }
        setListSearch(requestBody);
        post(`${properties.CONTRACT_API}/unbilled?limit=${viewContractPerPage}&page=${fromCallback ? 0 : Number(viewContractCurrentPage)}`, requestBody).then((resp) => {
            if (Number(resp?.data?.count) > 0) {
                const { rows, count } = resp.data;

                unstable_batchedUpdates(() => {
                    setViewContractTotalRowCount(count);
                    setContractData(rows);
                })
            }
            else {
                setContractData([])
                if (hideForm === false) {
                    toast.error('Record Not Found')
                    setContractData([])
                    setFilters([])
                }
                if (hideForm === true) {
                    if (filters.length) {
                        toast.error('Record Not Found')
                    }
                }
            }
        }).catch(error => console.log(error))
            .finally(() => {

                //isFirstRender.current = true
                isTableFirstRender.current = false;
            })
    }

    const getContractHistoryDetails = () => {
        let requestBody = {
            ...contractForm
        }
        setListSearch(requestBody);
        post(`${properties.CONTRACT_API}/history?limit=${viewContractPerPage}&page=${Number(viewContractCurrentPage)}`, requestBody).then((resp) => {

            if (Number(resp?.data?.count) > 0) {
                const { rows, count } = resp.data;
                unstable_batchedUpdates(() => {
                    setViewContractTotalRowCount(count);
                    setContractData(rows);
                })
            }
            else {
                setContractData([])
                if (hideForm === false) {
                    toast.error('Record Not Found')
                    setContractData([])
                    setFilters([])
                }
                if (hideForm === true) {
                    if (filters.length) {
                        toast.error('Record Not Found')
                    }
                }
            }
        }).catch(error => console.log(error))
            .finally(() => {

                //isFirstRender.current = true
                isTableFirstRender.current = false;
            })
    }

    const getMonthlyBilledContractDetails = (fromCallback = false) => {
        let requestBody = {
            ...contractForm
        }
        setListSearch(requestBody);

        post(`${properties.CONTRACT_API}/billed?limit=${viewContractPerPage}&page=${fromCallback ? 0 : Number(viewContractCurrentPage)}`, requestBody).then((resp) => {
            if (Number(resp?.data?.count) > 0) {
                const { rows, count } = resp.data;
                // console.log(resp.data)
                unstable_batchedUpdates(() => {
                    setViewContractTotalRowCount(count);
                    setContractData(rows);
                })
            }
            else {
                setContractData([])
                if (hideForm === false) {
                    toast.error('Record Not Found')
                    setContractData([])
                    setFilters([])
                }
                if (hideForm === true) {
                    if (filters.length) {
                        toast.error('Record Not Found')
                    }
                }
            }
        }).catch(error => console.log(error))
            .finally(() => {

                //isFirstRender.current = true
                isTableFirstRender.current = false;
            })
    }

    const ContractDetails = (fromCallback = false) => {
        console.log({ fromCallback, contractType }, props)
        if (contractType !== null && contractType !== undefined) {
            if (contractType === "billed") {
                setContractSearchHiddenColumns(['isAdvanceAllowed', 'advAllocationPercent', 'monthlyContractId', 'billPeriod', 'edit', 'contractRefId', 'chargeName', 'totalCharge', 'itemName', 'serviceNumber', 'select'])
                getBilledContractDetails(fromCallback)
            }
            else if (contractType === "unbilled") {
                setContractSearchHiddenColumns(['startDate', 'endDate', 'nextBillPeriod', 'lastBillPeriod', 'edit', 'status', 'contractRefId', 'chargeName', 'totalCharge', 'itemName', 'serviceNumber', 'select', 'billPeriod'])
                getUnbilledContractDetails(fromCallback)
            }
        } else if (props?.location?.pathname === '/search-contract' && props?.screenName === "Contract Management") {
            setContractSearchHiddenColumns(['select', 'monthlyContractId', 'isAdvanceAllowed', 'advAllocationPercent', 'updatedBy', 'edit'])
            setExportBtn(false)
            getBilledContractDetails(fromCallback)
        }
    }

    const handleClear = () => {
        setContractData([])
        setContractForm({
            // contractNo: null,
            // customerNumber: null,
            // customerName: null,
            // startDate: null,
            // endDate: null,
            // serviceNo: null,
            // billRefNo: null,
            // soNumber: ""
        })
        setFilters([])
    }

    const handleViewContract = (data) => {
        setData(data)
        setIsContractViewOpen({ openModal: true })
    }

    const handleEditContract = (data) => {
        setData(data)
        setIsViewEditContractOpen(true)
    }


    const handleSubmit = (e) => {
        if (e) {
            e.preventDefault();
            //isFirstRender.current = false
            isTableFirstRender.current = true;
            unstable_batchedUpdates(() => {
                setFilters([])
                setViewContractPerPage(10);
                setViewContractCurrentPage((viewContractCurrentPage) => {
                    if (viewContractCurrentPage === 0) {
                        return '0'
                    }
                    return 0
                });
            })
        }
        else {
            ContractDetails(true);
        }
    }

    const handleCellRender = (cell, row) => {

        if (cell.column.Header === "Contract No") {
            const data = { ...row.original }
            let value = cell.value
            if (row.original.contractDet) {
                data.contractNo = row.original.contractDet.contractNo
                value = row.original.contractDet.contractNo
            }
            return (
                <>
                    {
                        // hideForm === false ?
                        <span
                            className={`text-secondary cursor-pointer`}
                            // className={`${(contractType === 'billed' || accountContractType === "billed") && 'text-secondary cursor-pointer'}`}
                            // onClick={() => {
                            //     history(`/${contractType === 'billed' ? 'contract-search-view' : 'unbilled-contract-search-view'}`, {
                            //         state: {
                            //             data: {
                            //                 contractData: row.original
                            //             }
                            //         }
                            //     })
                            // }}

                            onClick={() => {
                                localStorage.setItem('viewContractData', JSON.stringify(data))
                                window.open(`${properties.REACT_APP_BASE}/contract360`, "_blank")
                                // history(`/contract360`, {
                                //     state: {data: row.original} 
                                // })
                            }}
                        >
                            {value}
                        </span>
                        // :
                        // isContractViewOpen?.openModal === false ?
                        //     <span className={`${(contractType === 'billed' || (accountContractType === "billed" || accountContractType === "history")) && 'text-secondary cursor-pointer'}`} onClick={() => handleViewContract(row.original)}>
                        //         {cell.value}
                        //     </span>
                        //     :
                        // <span>{cell.value}</span>
                    }
                </>
            )
        }
        else if (cell.column.id === "monthlyContractId") {
            return (
                <>
                    {
                        hideForm === false ?
                            <span className="text-secondary cursor-pointer"
                                onClick={() => {
                                    history(`/${contractType === 'billed' ? 'contract-search-view' : 'unbilled-contract-search-view'}`, {
                                        state: {
                                            data: {
                                                contractData: row.original
                                            }
                                        }
                                    })
                                }}
                            >
                                {cell.value}
                            </span>
                            :
                            isContractViewOpen?.openModal === false ?
                                <span className="text-secondary cursor-pointer" onClick={() => handleViewContract(row.original)}>
                                    {cell.value}
                                </span>
                                :
                                <span>{cell.value}</span>
                    }
                </>
            )
        }
        else if (cell.column.Header === "Edit") {
            return (
                <button disabled={userPermission?.editContract !== "write"} className="btn waves-effect waves-light btn-primary btn-sm"
                    onClick={() => handleEditContract(row.original)}
                >
                    Edit
                </button>
            )
        }
        else if (cell.column.Header === "Status") {
            return (
                <span>{row?.original?.statusDesc?.description}</span>
            )
        }
        else if (cell.column.Header === "Service ID") {
            if (contractType === 'billed' || accountContractType === 'billed') {
                return (
                    <span>{row?.original?.contractDetail && row?.original?.contractDetail[0]?.soNumber}</span>
                )
            } else if (contractType === 'unbilled' || accountContractType === 'unbilled') {
                return (
                    <span>{row?.original?.monthlyContractDtl && row?.original?.monthlyContractDtl[0]?.soNumber}</span>
                )
            } else if (contractType === 'history' || accountContractType === 'history') {
                return (
                    <span>{row?.original?.monthlyContractDtl && row?.original?.monthlyContractDtl[0]?.soNumber}</span>
                )
            } else {
                <span>-</span>
            }
        }
        else if (["Actual Contract Start Date", "Actual Contract End Date", "Contract End Date", "Contract Start Date", "Last Bill Period", "Next Bill Period"].includes(cell.column.Header)) {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY') : '-'}</span>
            )
        }
        else if (["Bill Period"].includes(cell.column.Header)) {
            let date = row?.original?.lastBillPeriod
            return (
                <span>{date ? moment(date).format('DD MMM YYYY') : '-'}</span>
            )
        }
        // else if (cell.column.Header === "Contract Start Date") {
        //     let data = row?.original?.startDate
        //     return (
        //         <span>{data ? moment(data).format('DD MMM YYYY') : '-'}</span>
        //     )
        // }
        else if (["RC", "OTC", "Usage", "Credit Adjustment", "Debit Adjustment", "Total Charge"].includes(cell.column.Header)) {
            return (
                <span>{USNumberFormat(cell.value)}</span>
            )
        }
        else if (cell.column.Header === "Customer Name") {
            let name = row?.original?.customer?.firstName + " " + row?.original?.customer?.lastName
            return (
                <span>{name}</span>
            )
        }
        else if (cell.column.Header === "Customer Number") {
            let cNo = row?.original?.customer?.customerNo
            return (
                <span>{cNo}</span>
            )
        }
        else if (cell.column.Header === "Service Number") {
            let sNo = row?.original?.identificationNo
            return (
                <span>{sNo}</span>
            )
        }
        else if (['Updated At Date and Time', 'Created At Date and Time'].includes(cell.column.Header)) {
            return (<span>{cell.value ? moment(cell.value).format('DD MMM YYYY hh:mm:ss A') : '-'}</span>)
        }
        else if (cell.column.Header === "Created By") {
            return (<span>{row?.original?.createdByName?.firstName + " " + row?.original?.createdByName?.lastName}</span>)
        }
        else if (cell.column.Header === "Updated By") {
            return (<span>{(row?.original?.updatedByName?.firstName || "") + " " + (row?.original?.updatedByName?.lastName || "")}</span>)
        }
        else {
            return (
                <span>{cell.value}</span>
            )
        }
    }

    return (
        <div>

            <div className="cmmn-skeleton mt-2">
                {/* {
                    isNormalSearch &&
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box">
                                <h4 className="page-title">{contractType !== null && contractType && contractType === 'unbilled' && 'Unbilled'} Contract Search</h4>
                            </div>
                        </div>
                    </div>
                } */}
                <div className="">
                    <div className="col-lg-12">
                        <div className="search-result-box m-t-30">
                            {
                                isNormalSearch &&
                                <>
                                    <div className="d-flex justify-content-end">

                                        <div id="showHideText" style={{ float: "right" }}>

                                            <div className={`text-primary cursor-pointer ${((userPermission.searchContract && userPermission.searchContract === 'deny') ? "d-none" : "")}`} style={{ color: "blue" }} onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</div>
                                        </div>

                                    </div>
                                    {
                                        displayForm && userPermission?.searchContract && userPermission?.searchContract !== 'deny' &&
                                        <div id="searchBlock" className="modal-body p-2 d-block" >
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="contractNo" className="control-label">Contract Number</label>
                                                        <input type="text" className="form-control" id="contractNo" placeholder="Enter Contract Number"
                                                            value={contractForm?.contractNo || ''}
                                                            onChange={(e) => {
                                                                setContractForm({ ...contractForm, contractNo: e.target.value })
                                                            }
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                {/* <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="soNumber" className="control-label">Service ID</label>
                                                        <input className="form-control" id="soNumber" placeholder="Enter Service ID"
                                                            value={contractForm.soNumber}
                                                            onChange={(e) => {
                                                                setContractForm({ ...contractForm, soNumber: e.target.value })
                                                            }
                                                            }
                                                        />
                                                    </div>
                                                </div> */}
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="customerNumber" className="control-label">Customer Number</label>
                                                        <input type="text" className="form-control" id="customerNumber" placeholder="Enter Customer Number"
                                                            value={contractForm?.customerNumber || ''}
                                                            onChange={(e) => {
                                                                setContractForm({ ...contractForm, customerNumber: e.target.value })
                                                            }
                                                            } />
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="customerName" className="control-label">Customer Name</label>
                                                        <input type="text" className="form-control" id="customerName2" placeholder="Enter Customer Name"
                                                            value={contractForm?.customerName || ''}
                                                            onChange={(e) => {
                                                                setContractForm({ ...contractForm, customerName: e.target.value })
                                                            }
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="startDate" className="control-label">Contract Start Date</label>
                                                        <input type="date" className="form-control" id="startDate" placeholder="Enter Start Date"
                                                            value={contractForm?.startDate || ''}
                                                            onChange={(e) => {
                                                                setContractForm({ ...contractForm, startDate: e.target.value })
                                                            }
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="endDate" className="control-label">Contract End Date</label>
                                                        <input type="date" className="form-control" id="field-2" placeholder="Enter End Date"
                                                            value={contractForm?.endDate || ''}
                                                            onChange={(e) => {
                                                                setContractForm({ ...contractForm, endDate: e.target.value })
                                                            }
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="billRefNo" className="control-label">Billable Reference Number</label>
                                                        <input type="text" className="form-control" id="billRefNo"
                                                            placeholder="Enter Billable Reference Number"
                                                            value={contractForm?.billRefNo || ''}
                                                            onChange={(e) => {
                                                                setContractForm({ ...contractForm, billRefNo: e.target.value })
                                                            }
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <div className="pt-1 pb-1">
                                                        <div className="skel-btn-center-cmmn">
                                                            <button type="button" className="skel-btn-cancel" onClick={handleClear}>Clear</button>
                                                            <button type="button" className="skel-btn-submit" onClick={handleSubmit}><i className="fa fa-search mr-1"></i> Search</button>&nbsp;

                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </>
                            }
                            {
                                contractData.length > 0 && userPermission.viewContractList !== 'deny' ?
                                    <div className="">
                                        <DynamicTable
                                            //listKey={"Contract List"}
                                            isScroll={isScroll}
                                            listKey={`${(contractType === 'billed' || accountContractType === "billed") ? `${fromLocation !== null && fromLocation === 's360' ? 'Sales Order ' : ''}Contract List` : (contractType === 'unbilled' || accountContractType === "unbilled") ? `${fromLocation !== null && fromLocation === 's360' ? 'Sales Order ' : ''}Unbilled Contract List` : `${fromLocation !== null && fromLocation === 's360' ? 'Sales Order ' : ''}Billed Contract List`}`}
                                            listSearch={listSearch}
                                            exportBtn={exportBtn}
                                            row={contractData}
                                            filterRequired={fromLocation === 's360' || fromLocation === 'Customer360' ? false : true}
                                            rowCount={viewContractTotalRowCount}
                                            itemsPerPage={viewContractPerPage}
                                            header={ContractSerachCols}
                                            hiddenColumns={contractSearchHiddenColumns}
                                            backendPaging={true}
                                            backendCurrentPage={viewContractCurrentPage}
                                            isTableFirstRender={isTableFirstRender}
                                            hasExternalSearch={hasExternalSearch}
                                            handler={{
                                                handleCellRender: handleCellRender,
                                                handlePageSelect: handleViewContractPageSelect,
                                                handleItemPerPage: setViewContractPerPage,
                                                handleCurrentPage: setViewContractCurrentPage,
                                                handleFilters: setFilters,
                                                handleExportButton: setExportBtn
                                            }}
                                        />
                                    </div>
                                    :
                                    hideForm === true &&
                                    <span className="msg-txt">No Contracts Available</span>
                            }
                            {
                                isContractViewOpen?.openModal &&
                                <ViewContract
                                    data={{
                                        isOpen: isContractViewOpen,
                                        contract: data,
                                        type: accountContractType,
                                        contractSearchHiddenColumns: contractSearchHiddenColumns
                                    }}
                                    handler={{
                                        setIsOpen: setIsContractViewOpen,
                                        handleCellRender: handleCellRender,
                                        setContractSearchHiddenColumns: setContractSearchHiddenColumns,
                                        pageRefresh
                                    }}
                                />
                            }
                            {
                                isViewEditContractOpen &&
                                <EditContract
                                    data={{
                                        isOpen: isViewEditContractOpen,
                                        contract: data,
                                        type: accountContractType,
                                        contractSearchHiddenColumns: contractSearchHiddenColumns
                                    }}
                                    handler={{
                                        setIsOpen: setIsViewEditContractOpen,
                                        setContractSearchHiddenColumns: setContractSearchHiddenColumns,
                                        pageRefresh
                                    }}
                                />
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchContract;