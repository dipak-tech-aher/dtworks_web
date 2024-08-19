import React, { useEffect, useState, useRef } from 'react'
import Modal from 'react-modal'
import { unstable_batchedUpdates } from 'react-dom';
import { string, object } from "yup";
import { toast } from 'react-toastify';
import { NumberFormatBase, NumericFormat } from 'react-number-format';

import { get, post } from '../../../common/util/restUtil';
import { properties } from '../../../properties';
import { InvoicePaymentHiddenColumns, InvoiceDetailPaymentHiddenColumns } from '../../Invoice/InvoiceSearchColumns';
import { InvoiceDetailListColumns } from '../../Invoice/InvoiceTables/InvoiceDetailList'
import DynamicTable from '../../../common/table/DynamicTable';
import moment from 'moment'
import { isObjectEmpty } from '../../../common/util/validateUtil';
import { formFilterObject, RegularModalCustomStyles } from '../../../common/util/util';
import { USNumberFormat } from '../../../common/util/util';

const PayNow = (props) => {

    const setIsOpen = props.handler.setIsOpen
    const pageRefresh = props?.handler?.pageRefresh
    const isOpen = props.data.isOpen
    const accountData = props.data.accountData
    const customerData = props.data.customerData
    const invoiceCounts = props.data.invoiceCounts
    const [invoice, setInvoice] = useState([])
    const [invoiceDetail, setInvoiceDetail] = useState([])

    // console.log('accountData ', accountData)
    const initialValues = {
        billRefNo: accountData[0]?.billRefNo,
        allocationLevel: "INV",
        currency: "",
        paymentMode: "",
        totalOutstanding: Number(invoiceCounts.totoalOutstanding),
        dueOutstanding: Number(invoiceCounts.dueOutStanding),
        paymentAmount: "",
        paymentLocation: "",
        isOffline: "N",
        paymentRemark: "",
        refNo: "",
        refDate: null,
        refName: "",
    }
    const [chequeDetails, setChequeDetails] = useState({
        chequeNo: "",
        chequeDate: null,
        chequeBankName: ""
    })
    const [cardDetails, setCardDetails] = useState({
        cardNo: "",
        cardExpiryDate: null,
        cardType: ""
    })
    const [paymentData, setPaymentData] = useState(initialValues)
    const [paymentError, setPaymentError] = useState({});
    const [cardError, setCardError] = useState({});
    const [chequeError, setChequeError] = useState({});

    const [allocationLevelLookup, setAllocationLevelLookup] = useState([])
    const [currencyLookup, setCurrencyLookup] = useState([])
    const [paymentModeLookup, setPaymentModeLookup] = useState([])
    const [paymentLocationLookup, setPaymentLocationLookup] = useState([])
    const lookupData = useRef();
    const invoiceRef = useRef()
    const paymentValidationSchema = object().shape({
        allocationLevel: string().required("Allocation Level is required"),
        // currency: string().required("Currency is required"),
        // paymentMode: string().required("Payment Mode is required"),
        paymentLocation: string().required("Payment Location is required"),
        // paymentAmount: string().required("Payment Amount is required")
    });
    const cardValidationSchema = object().shape({
        cardNo: string().required("Card Number is required"),
        cardExpiryDate: string().required("Card Expiry Date is required"),
        cardType: string().required("Card Type is required")
    });
    const chequeValidationSchema = object().shape({
        chequeNo: string().required("Cheque Number is required"),
        chequeDate: string().required("Cheque Date required"),
        chequeBankName: string().required("Cheque Bank Name is required")
    });

    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(false);
    const isTableFirstRender = useRef(true);

    const validate = (section, schema, data) => {
        try {
            if (section === 'CARD') {
                setCardError({})
            }
            if (section === 'CHEQUE') {
                setChequeError({})
            }
            if (section === 'PAYMENT') {
                setPaymentError({});
            }
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                if (section === 'CHEQUE') {
                    setChequeError((prevState) => {
                        return { ...prevState, [err.params.path]: err.message };
                    });
                }
                if (section === 'CARD') {
                    setCardError((prevState) => {
                        return { ...prevState, [err.params.path]: err.message };
                    });
                }
                if (section === 'PAYMENT') {
                    setPaymentError((prevState) => {
                        return { ...prevState, [err.params.path]: err.message };
                    });
                }
            });
            return e;
        }
    };

    const handleOnSubmit = () => {
        if (validate('PAYMENT', paymentValidationSchema, paymentData)) {
            toast.error("Validation Errors Found")
            return;
        }
        if (paymentData.paymentMode === 'PM_CARD') {
            if (validate('CARD', cardValidationSchema, cardDetails)) {
                toast.error("Validation Errors Found")
                return;
            }
        }
        if (paymentData.paymentMode === 'PM_CHEQUE') {
            if (validate('CHEQUE', chequeValidationSchema, chequeDetails)) {
                toast.error("Validation Errors Found")
                return;
            }
        }
        let requestBody = {
            ...paymentData,
            invoiceId: [],
            invoiceChargeIds: {},
			...customerData
        }
        let invoiceIds = []
        let receiptDtlIds = []
        let invoiceDtlIds = []
        let recieptBalanceAmount = 0
        let invoiceAllocatedAmount = 0

        if (paymentData.allocationLevel === 'INV' || paymentData.allocationLevel === 'INVCHARGE') {
            // invoice && invoice.map((inv) => {
            //     if (inv?.allocationAmount && inv?.allocationAmount > 0) {
            //         invoiceIds.push(inv.invoiceId)
            //         invoiceAllocatedAmount = invoiceAllocatedAmount + Number(inv?.allocationAmount)
            //     }
            // })
            let found = false
            for (const inv of invoice) {
                if (inv?.allocationAmount && Number(inv?.allocationAmount) > 0) {
                    if (Number(inv?.allocationAmount) > Number(inv?.invOsAmt).toFixed(2)) {
                        toast.error('Allocation Amount Cannot be greater then Invoice Outstanding Amount')
                        found = true
                        break
                    }
                    invoiceIds.push({
                        invoiceId: inv.invoiceId,
                        allocationAmount: Number(inv?.allocationAmount)
                    })
                    //invoiceAllocatedAmount = invoiceAllocatedAmount + Number(inv?.allocationAmount)
                    invoiceAllocatedAmount = invoiceAllocatedAmount + Number(inv?.allocationAmount).toFixed(2)
                }
            }
            if (found) {
                return
            }
            requestBody.invoiceId = invoiceIds
            receiptList && receiptList.map((receipt) => {
                if (receipt.select === 'Y') {
                    receiptDtlIds.push(receipt?.receiptDtlId)
                    recieptBalanceAmount = Number(receipt.balanceAmount)
                }
            })
            requestBody.receiptDtlId = receiptDtlIds
        }
        if (paymentData.allocationLevel === 'INVCHARGE') {
            let invoiceChargeIds = {}
            invoiceIds && !!invoiceIds.length && invoiceIds.map((invoice) => {
                invoiceDetail && invoiceDetail.map((inv) => {
                    if (inv.select === 'Y' && Number(inv.invoiceId) === Number(invoice)) {
                        if (!invoiceDtlIds.includes(inv.invoiceDtlId)) {
                            invoiceDtlIds.push(inv.invoiceDtlId)
                        }
                    }
                })
                if (invoiceDtlIds.length > 0) {
                    invoiceChargeIds[invoice] = invoiceDtlIds
                }
                invoiceDtlIds = []
            })
            // requestBody.invoiceChargeIds = invoiceChargeIds
        }
        if (requestBody.paymentMode === 'PM_CARD') {
            requestBody.refNo = cardDetails.cardNo
            requestBody.refDate = cardDetails.cardExpiryDate
            requestBody.refName = cardDetails.cardType
        }
        if (requestBody.paymentMode === 'PM_CHEQUE') {
            requestBody.refNo = chequeDetails.chequeNo
            requestBody.refDate = chequeDetails.chequeDate
            requestBody.refName = chequeDetails.chequeBankName
        }
        let found = false
        if (paymentData.allocationLevel === 'INV') {
            if (invoiceIds.length === 0) {
                toast.error("Please Select the Invoice")
                found = true
                return
            }
            if (receiptDtlIds.length === 0) {
                toast.error("Please Select the Receipt")
                found = true
            }
        }
        if (paymentData.allocationLevel === 'INVCHARGE') {
            if (invoiceIds.length === 0) {
                toast.error("Please Select the Invoice")
                found = true
            }
            if (isObjectEmpty(requestBody.invoiceChargeIds)) {
                toast.error("Please Select the Invoice Charge Details")
                found = true
            }
        }
        if (found === true) {
            return
        }
        if (invoiceAllocatedAmount > recieptBalanceAmount) {
            toast.error('Allocation Amount Cannot be greater than Receipt Balance Amount')
            return
        }
        // console.log("recieptBalanceAmount : ", recieptBalanceAmount)
        // console.log("invoiceAllocatedAmount : ", invoiceAllocatedAmount)
        // console.log("Payment Data : ", requestBody)
        // toast.success('Hello')
        // return

        post(properties.BILLING_API + '/payBill', requestBody)
            .then((response) => {
                if (response.status === 200) {
                    toast.success("Receipt Applied Successfully")
                    setIsOpen(false)
                    pageRefresh()
                }
            })
            .catch((error) => {
                console.log(error)
            })
    }

    const handleOnClear = () => {
        setChequeError({})
        setCardError({})
        setPaymentData(initialValues)
        // setInvoice([])
        setInvoice(
            invoice.map((c) => {
                c.allocationAmount = ""
                return c
            })
        )
        setInvoiceDetail([])
        setReceiptList(
            receiptList.map((c) => {
                c.select = 'N'
                return c
            })
        )
    }

    const handleOnPaymentInputsChange = (e) => {
        const { target } = e;
        setPaymentData({
            ...paymentData,
            [target.id]: target.id === 'paymentAmount' ? Number(target.value) : target.value
        })
    }
    const handleOnChequeInputsChange = (e) => {
        const { target } = e;
        setChequeDetails({
            ...chequeDetails,
            [target.id]: target.id === 'chequeNo' ? Number(target.value) : target.value
        })
    }
    const handleOnCardInputsChange = (e) => {
        const { target } = e;
        setCardDetails({
            ...cardDetails,
            [target.id]: target.id === 'cardNo' ? Number(target.value) : target.value
        })
    }

    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=PAYMENT_METHOD,CURRENCY,LOCATION,ALLOCATION_LEVEL')
            .then((response) => {
                if (response.data) {
                    lookupData.current = response.data;
                    unstable_batchedUpdates(() => {
                        setPaymentModeLookup(lookupData.current['PAYMENT_METHOD'])
                        setCurrencyLookup(lookupData.current['CURRENCY'])
                        //setPaymentLocationLookup(lookupData.current['PAYMENT_LOCATION'])
                        setPaymentLocationLookup(lookupData.current['LOCATION'])
                        setAllocationLevelLookup(lookupData.current['ALLOCATION_LEVEL'])
                    });
                }
            })
            .catch(error => {
                console.error(error);
            })
            .finally()

    }, [])

    useEffect(() => {
        const requestBody = {
            // billRefNo: accountData[0].billRefNo,
            billRefNo: customerData.customerUuid,
            customerUuid: customerData.customerUuid
            // filters: formFilterObject(filters)
        }

        post(`${properties.INVOICE_API}/search?limit=${perPage}&page=${currentPage}`, requestBody)
            .then((response) => {
                if (response.status === 200) {
                    let { rows, count } = response?.data
                    rows.map((row) => {
                        row.select = 'N'
                        row.allocationAmount = null
                        return row
                    })
                    unstable_batchedUpdates(() => {
                        const filteredInvoice = rows.filter((inv) => ['CLOSED', 'INV-CLOSED'].includes(inv.invoiceStatus))
                        invoiceRef.current = filteredInvoice
                        setInvoice(filteredInvoice || []);
                        setTotalCount(count)
                    })
                }
            })
            .catch((error) => {
                toast.error("Error while getting Invoice List", error)
            })
            .finally(() => {

            })
    }, [paymentData.allocationLevel, perPage, currentPage])

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const clearPaymentData = () => {
        setChequeError({})
        setCardError({})
        setCardDetails({
            cardNo: "",
            cardExpiryDate: "",
            cardType: ""
        })
        setChequeDetails({
            chequeNo: "",
            chequeDate: "",
            chequeBankName: ""
        })
    }

    const handleInvoicePayment = (e, data) => {
        setInvoice(
            invoice.map((c) => {
                if (Number(c?.invoiceId) === Number(data?.invoiceId)) {
                    // if (e.target.checked === true) {
                    //     c.select = 'Y'
                    // }
                    // else if (e.target.checked === false) {
                    //     c.select = 'N'
                    // }
                    c.select = 'Y'
                } else {
                    c.select = 'N'
                }
                return c
            })
        )
        // if (e.target.checked === false) {
        //     setInvoiceDetail(invoiceDetail.filter((c) => Number(c?.invoiceId) !== Number(data?.invoiceId)))
        // }
        // else if (e.target.checked === true) {
        //     let list = data?.invoiceDetails
        //     list.map((c) => {
        //         c.invoiceId = data?.invoiceId
        //         c.billRefNo = data?.billRefNo
        //         c.select = 'N'
        //         return c
        //     })
        //     setInvoiceDetail([...invoiceDetail, ...list])
        // }
    }

    const handleInvoiceDetailPayment = (e, data) => {
        setInvoiceDetail(
            invoiceDetail.map((c) => {
                if (Number(c?.invoiceDtlId) === Number(data?.invoiceDtlId)) {
                    if (e.target.checked === true) {
                        c.select = 'Y'
                    }
                    else if (e.target.checked === false) {
                        c.select = 'N'
                    }
                }
                return c
            })
        )
    }

    const handleCellRenderReceipt = (cell, row) => {

        if (cell.column.Header === "Select") {
            return (
                <div className="form-check">
                    <input id={`mandatory${row.original.receiptDtlId}`} className="form-check-input position-static checkmark" type="radio" checked={cell.value === "Y" ? true : false} value={cell.value}
                        style={{ cursor: "pointer" }}
                        onChange={(e) => { handleReceipt(e, row.original) }}
                    />
                </div>
                // <div>
                //     <input type="radio" id={row.original.receiptDtlId} name="receiptDtlId" style={{ cursor: "pointer" }} className='mt-1'
                //         checked={cell.value === "Y" ? true : false}
                //         onChange={(e) => { handleReceipt(e, row.original) }}
                //     />
                // </div>
            )
        }
        else if (["Receipt Amount", "Receipt Balance Amount"].includes(cell.column.Header)) {
            return (<span>{USNumberFormat(cell.value)}</span>)
        }
        else if (['Created By'].includes(cell.column.Header)) {
            let name = (row?.original?.createdByName?.firstName || "") + " " + (row?.original?.createdByName?.lastName || "")
            return (<span>{name}</span>);
        }
        else if (['Updated By'].includes(cell.column.Header)) {
            let name = (row?.original?.updatedByName?.firstName || "") + " " + (row?.original?.updatedByName?.lastName || "")
            return (<span>{name}</span>);
        }
        else if (["Receipt Created At"].includes(cell.column.Header)) {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY hh:mm:ss A') : '-'}</span>
            )
        }
        else if (["Receipt Date"].includes(cell.column.Header)) {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY') : '-'}</span>
            )
        }
        return (<span>{cell.value}</span>);
    }

    const handleInputChange = (e, data) => {
        setInvoice(
            invoice.map((c) => {
                if (Number(c?.invoiceId) === Number(data?.invoiceId)) {
                    c.allocationAmount = e.target.value
                }
                return c
            })
        )
    }

    const handleCellRender = (cell, row) => {

        if (cell.column.Header === "Select") {
            return (
                <>
                    {
                        row.original?.invoiceDtlId ?
                            <div className="form-check">
                                <input id={`mandatory${row.original.invoiceDtlId}`} className="form-check-input position-static checkmark" type="checkbox" checked={cell.value === "Y" ? true : false} value={cell.value}
                                    onChange={(e) => { handleInvoiceDetailPayment(e, row.original) }}
                                />
                            </div>
                            :
                            <div className="form-check">
                                <input id={`mandatory${row.original.invoiceId}`} className="form-check-input position-static checkmark" type="checkbox" checked={cell.value === "Y" ? true : false} value={cell.value}
                                    onChange={(e) => { handleInvoicePayment(e, row.original) }}
                                />
                            </div>
                    }
                </>

            )
        }
        else if (cell.column.Header === "Service ID") {
            let no = row?.original?.invoiceDetails && row?.original?.invoiceDetails[0]?.monthlyContractDet && row?.original?.invoiceDetails[0]?.monthlyContractDet?.soNumber
            return (
                <span>{no}</span>
            )
        }
        else if (["Allocation Amount"].includes(cell.column.Header)) {
            return (
                <>
                    <div onClick={(e) => { handleInvoicePayment(e, row.original) }} style={row?.original?.select === "Y" ? { position: "absolute", width: "150px", height: "0px", zIndex: '9999', display: 'block', cursor: "pointer" } : { position: "absolute", width: "150px", height: "38px", zIndex: '9999', display: 'block', cursor: "pointer" }} >
                    </div>
                    <input type="number" id="allocationAmount" className="form-control" style={{ width: "150px", cursor: "pointer" }} value={cell.value ? row.original.allocationAmount : ""}
                        disabled={row?.original?.select === "Y" ? false : true}
                        min={1} step="0.01"
                        onChange={(e) => { handleInputChange(e, row.original) }}
                    />
                </>
            )
        }
        else if (cell.column.Header === "Invoice Start Date" || cell.column.Header === "Invoice End Date" || cell.column.Header === "Invoice Date" || cell.column.Header === "Due Date" || cell.column.Header === "Contract Start Date" || cell.column.Header === "Contract End Date") {
            return (
                <span>{cell.value && cell.value !== null ? moment(cell.value).format('DD MMM YYYY') : '-'}</span>
            )
        }
        else if (cell.column.Header === "Customer Number") {
            return (
                <span>{row?.original?.customer[0]?.crmCustomerNo}</span>
            )
        }
        else if (cell.column.Header === "Customer Name") {
            let name = row?.original?.customer[0]?.firstName + " " + row?.original?.customer[0]?.lastName
            return (
                <span>{name}</span>
            )
        }
        else if (cell.column.Header === "Invoice O/S Amount" || cell.column.Header === "Invoice Amount") {
            return (
                <span>{cell.value && cell.value !== null ? USNumberFormat(cell.value) : USNumberFormat(0)}</span>
            )
        }
        else {
            return (
                <span>{cell.value}</span>
            )
        }
    }

    const handlePageSelectReceipt = (pageNo) => {
        setCurrentPageReceipt(pageNo)
    }

    const [receiptList, setReceiptList] = useState([])

    const [totalCountReceipt, setTotalCountReceipt] = useState(0);
    const [perPageReceipt, setPerPageReceipt] = useState(10);
    const [currentPageReceipt, setCurrentPageReceipt] = useState(0);
    const [filtersReceipt, setFiltersReceipt] = useState([]);
    const [exportBtnReceipt, setExportBtnReceipt] = useState(false);

    useEffect(() => {
        const requestBody = {
            customerId: accountData[0]?.customerData?.customerId ? accountData[0]?.customerData?.customerId : customerData?.customerId,
            receiptStatus: ['RS_PARTIALLY_APPLIED', 'RS_UNAPPLIED'],
            filters: formFilterObject(filtersReceipt)
        }
        post(`${properties.RECEIPT_API}/dtl/search?limit=${perPageReceipt}&page=${currentPageReceipt}`, requestBody)
            .then((response) => {
                if (response.status === 200) {
                    let { rows, count } = response?.data
                    rows.map((row) => {
                        row.select = 'N'
                        return row
                    })
                    unstable_batchedUpdates(() => {
                        setReceiptList(rows);
                        setTotalCountReceipt(count)
                    })
                }
            })
            .catch((error) => {
                toast.error("Error while getting Receipt List", error)
            })
            .finally(() => {
            })
    }, [paymentData.allocationLevel, perPageReceipt, currentPageReceipt])

    const handleReceipt = (e, data) => {
        setReceiptList(
            receiptList.map((c) => {
                if (Number(c?.receiptDtlId) === Number(data?.receiptDtlId)) {
                    // if (e.target.checked === true) {
                    //     c.select = 'Y'
                    // }
                    // else if (e.target.checked === false) {
                    //     c.select = 'N'
                    // }
                    c.select = 'Y'
                }
                else {
                    c.select = 'N'
                }
                return c
            })
        )
    }

    const filterInvoices = (data, criteria) => {
        return data.filter(invoice => {
            return criteria.every(criterion => {
                if (criterion.filter === "contains") {
                    if (criterion?.id && invoice[criterion.id]) {
                        return String(invoice[criterion.id]).includes(criterion.value)
                    }
                }
                return false
            })
        })
    }
    const [searchParams, setSearchParam] = useState([])
    useEffect(() => {
        if (Array.isArray(filters) && filters.length > 0) {
            const filtered = filterInvoices(invoice, formFilterObject(filters))
            const combimed = [...searchParams, ...filters] || []
            const uniqueCombined = Array?.from(new Set(combimed?.map(item => JSON.stringify(item))))
                ?.map(item => JSON.parse(item));

            unstable_batchedUpdates(() => {
                setInvoice(filtered)
                setSearchParam(uniqueCombined)
                setCurrentPage(0);
                setTotalCount(filtered?.length || 0)
                // isTableFirstRender.current = true
            })
        }
    }, [filters])

    const getUniqueRecords = (rows, uniqueKey) => [...new Map(rows.map(item => [item[uniqueKey], item])).values()];
    let elements = []
    const getSelectedFilters = () => {
        const formatedFilter = formFilterObject(searchParams) || []
        elements = formatedFilter?.map((filter) => {
            return (
                <li key={filter.id} style={{ fontSize: '15px' }}>
                    {filter.id}: {filter.value}
                    <span className="dash-filter-badge ml-1" />
                </li>
            )
        })
        if (Array.isArray(elements) && elements?.length > 0) {
            elements.push(
                <li style={{ fontSize: '15px' }} onClick={() => {
                    unstable_batchedUpdates(() => {
                        setInvoice((prevState) => {
                            const combined = [...invoiceRef?.current || [], ...prevState];
                            let records = getUniqueRecords(combined, 'invoiceId')
                            return records
                        });
                        setTotalCount(invoiceRef.current.length || 0)
                        setFilters([])
                        setSearchParam([])
                        elements = []
                        isTableFirstRender.current = false
                    })
                }
                }> Clear all
                    < span className="dash-filter-badge ml-1" > X
                    </span >
                </li >
            )
        }
        return elements
    }
console.log('accountData ', accountData)
    return (
        <Modal isOpen={isOpen} contentLabel="Worflow History Modal" style={RegularModalCustomStyles}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Pay Now</h5>
                        <button type="button" className="close" onClick={() => { setIsOpen(false) }}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </div>
                    <div className="p-2">
                        <fieldset className="scheduler-border">
                            <div className="row">
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="billRefNo" className="col-form-label">Billable Referance Number</label>
                                        <input type="text" className="form-control" id="billRefNo" value={accountData[0]?.billRefNo || accountData[0]?.customerNo} disabled />
                                    </div>
                                </div>
                                {/* <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="allocationLevel" className="col-form-label">Allocation Level<span>*</span></label>
                                        <select id="allocationLevel" className={`form-control ${paymentError.allocationLevel ? "error-border" : ""}`}
                                            value={paymentData.allocationLevel}
                                            onChange={(e) => {
                                                handleOnPaymentInputsChange(e)
                                                setPaymentError({ ...paymentError, allocationLevel: "" })
                                            }}
                                        >
                                            <option key="1" value="">Please Select Allocation Level</option>
                                            {
                                                allocationLevelLookup && allocationLevelLookup.map((e) => (
                                                    <option key={e.code} value={e.code}>{e.description}</option>
                                                ))
                                            }
                                            <option value="AUTOALLOC">Auto Allocation</option>
                                            <option value="INV">Invoice</option>
                                        </select>
                                        <span className="errormsg">{paymentError.allocationLevel ? paymentError.allocationLevel : ""}</span>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="currency" className="col-form-label">Currency<span className="ast">*</span></label>
                                        <select id="currency" className={`form-control ${paymentError.currency ? "error-border" : ""}`}
                                            value={paymentData.currency}
                                            onChange={(e) => {
                                                handleOnPaymentInputsChange(e)
                                                setPaymentError({ ...paymentError, currency: "" })
                                            }}
                                        >
                                            <option key="1" value="">Please Select Currency</option>
                                            {
                                                currencyLookup && currencyLookup.map((e) => (
                                                    <option key={e.code} value={e.code}>{e.description}</option>
                                                ))
                                            }
                                        </select>
                                        <span className="errormsg">{paymentError.currency ? paymentError.currency : ""}</span>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="paymentMode" className="col-form-label">Payment Mode<span className="ast">*</span></label>
                                        <select id="paymentMode" className={`form-control ${paymentError.paymentMode ? "error-border" : ""}`}
                                            value={paymentData.paymentMode}
                                            onChange={(e) => {
                                                handleOnPaymentInputsChange(e)
                                                clearPaymentData()
                                                setPaymentError({ ...paymentError, paymentMode: "" })
                                            }}
                                        >
                                            <option key="1" value="">Please Select Payment Mode</option>
                                            {
                                                paymentModeLookup && paymentModeLookup.map((e) => (
                                                    <option key={e.code} value={e.code}>{e.description}</option>
                                                ))
                                            }
                                        </select>
                                        <span className="errormsg">{paymentError.paymentMode ? paymentError.paymentMode : ""}</span>
                                    </div>
                                </div> */}
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="totalOutstanding" className="col-form-label">Total Outstanding</label>
                                        <input type="text" className="form-control" id="totalOutstanding" value={Number(paymentData.totalOutstanding).toFixed(2)} disabled />
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="dueOutstanding" className="col-form-label">Due Outstanding</label>
                                        <input type="text" className="form-control" id="dueOutstanding" value={Number(paymentData.dueOutstanding).toFixed(2)} disabled />
                                    </div>
                                </div>
                                {/* <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="paymentAmount" className="col-form-label">Payment Amount<span className="ast">*</span></label>
                                        <NumericFormat type="text" className="form-control" id="paymentAmount" value={Number(paymentData.paymentAmount)}
                                            decimalScale={2}
                                            onChange={(e) => {
                                                handleOnPaymentInputsChange(e)
                                                setPaymentError({ ...paymentError, paymentAmount: "" })
                                            }}
                                        />
                                        <span className="errormsg">{paymentError.paymentAmount ? paymentError.paymentAmount : ""}</span>
                                    </div>
                                </div> */}
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="contactType" className="col-form-label">Payment Location<span className="ast">*</span></label>
                                        <select id="paymentLocation" className={`form-control ${paymentError.paymentLocation ? "error-border" : ""}`}
                                            value={paymentData.paymentLocation}
                                            onChange={(e) => {
                                                handleOnPaymentInputsChange(e)
                                                setPaymentError({ ...paymentError, paymentLocation: "" })
                                            }}
                                        >
                                            <option key="1" value="">Please Select Payment Location</option>
                                            {
                                                paymentLocationLookup && paymentLocationLookup.map((e) => (
                                                    <option key={e.code} value={e.code}>{e.description}</option>
                                                ))
                                            }
                                        </select>
                                        <span className="errormsg">{paymentError.paymentLocation ? paymentError.paymentLocation : ""}</span>
                                    </div>
                                </div>
                                <div className="col-3 d-none">
                                    <div className="form-group">
                                        <label htmlFor="contactType" className="col-form-label"></label>
                                        <div className="custom-control custom-checkbox label-txt">
                                            <input type="checkbox" className="custom-control-input" id="isOffline" checked={paymentData.isOffline === "Y" ? true : false}
                                                onChange={(e) => {
                                                    if (e.target.checked === true) {
                                                        setPaymentData({ ...paymentData, isOffline: 'Y' })
                                                    }
                                                    else if (e.target.checked === false) {
                                                        setPaymentData({ ...paymentData, isOffline: 'N' })
                                                    }
                                                }}
                                            />
                                            <label className="custom-control-label" htmlFor="isOffline">Offline payment</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {
                                paymentData?.paymentMode !== "" && paymentData?.paymentMode === "PM_CHEQUE" &&
                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="chequeNo" className="col-form-label">Cheque Number<span className="ast">*</span></label>
                                            <NumberFormatBase className="form-control" id="chequeNo" placeholder="Please Enter Cheque Number" value={chequeDetails.chequeNo}
                                                onChange={(e) => {
                                                    handleOnChequeInputsChange(e)
                                                    setChequeError({ ...chequeError, chequeNo: "" })
                                                }}
                                            />
                                            <span className="errormsg">{chequeError.chequeNo ? chequeError.chequeNo : ""}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="chequeDate" className="col-form-label">Cheque Date<span className="ast">*</span></label>
                                            <input type="date" className="form-control" id="chequeDate" placeholder="" value={chequeDetails.chequeDate}
                                                onChange={(e) => {
                                                    handleOnChequeInputsChange(e)
                                                    setChequeError({ ...chequeError, chequeDate: "" })
                                                }}
                                            />
                                            <span className="errormsg">{chequeError.chequeDate ? chequeError.chequeDate : ""}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="chequeBankName" className="col-form-label">Cheque Bank Name<span className="ast">*</span></label>
                                            <input type="text" className="form-control" id="chequeBankName" placeholder="Please Enter Cheque Bank Name" value={chequeDetails.chequeBankName}
                                                onChange={(e) => {
                                                    handleOnChequeInputsChange(e)
                                                    setChequeError({ ...chequeError, chequeBankName: "" })
                                                }}
                                            />
                                            <span className="errormsg">{chequeError.chequeBankName ? chequeError.chequeBankName : ""}</span>
                                        </div>
                                    </div>
                                </div>
                            }
                            {
                                paymentData?.paymentMode !== "" && paymentData?.paymentMode === "PM_CARD" &&
                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="cardNo" className="col-form-label">Card Number<span className="ast">*</span></label>
                                            <NumberFormatBase className="form-control" id="cardNo" placeholder="Please Enter Card Number" value={cardDetails.cardNo}
                                                onChange={(e) => {
                                                    handleOnCardInputsChange(e)
                                                    setCardError({ ...cardError, cardNo: "" })
                                                }}
                                            />
                                            <span className="errormsg">{cardError.cardNo ? cardError.cardNo : ""}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="cardExpiryDate" className="col-form-label">Card Expiry Date<span className="ast">*</span></label>
                                            <input type="date" className="form-control" id="cardExpiryDate" placeholder="" value={cardDetails.cardExpiryDate}
                                                onChange={(e) => {
                                                    handleOnCardInputsChange(e)
                                                    setCardError({ ...cardError, cardExpiryDate: "" })
                                                }}
                                            />
                                            <span className="errormsg">{cardError.cardExpiryDate ? cardError.cardExpiryDate : ""}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="cardType" className="col-form-label">Card Type<span className="ast">*</span></label>
                                            <select type="text" className="form-control" id="cardType" placeholder="" value={cardDetails.cardType}
                                                onChange={(e) => {
                                                    handleOnCardInputsChange(e)
                                                    setCardError({ ...cardError, cardType: "" })
                                                }}
                                            >
                                                <option value="">Select Card Type</option>
                                                <option value="MASTER">Master</option>
                                                <option value="VISA">Visa</option>
                                            </select>
                                            <span className="errormsg">{cardError.cardType ? cardError.cardType : ""}</span>
                                        </div>
                                    </div>
                                </div>
                            }
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="paymentRemark" className="col-form-label">Remarks</label>
                                        <textarea id="paymentRemark" className="form-control" value={paymentData.paymentRemark}
                                            onChange={(e) => { handleOnPaymentInputsChange(e) }}
                                        >
                                        </textarea>
                                    </div>
                                </div>
                            </div>
                            {/* <div className="flex-row pre-bill-sec">
                                <div className="col-12 p-1">
                                    <div id="customer-buttons" className="d-flex justify-content-center">

                                        <button type="button" className="skel-btn-cancel" onClick={handleOnClear}>Clear</button>
                                        <button type="button" className="skel-btn-submit" onClick={handleOnSubmit}>Submit</button>
                                    </div>
                                </div>
                            </div> */}
                        </fieldset>
                    </div>
                    <div className="adjusment modal-body">
                        {
                            paymentData.allocationLevel !== '' && paymentData.allocationLevel !== 'AUTOALLOC' &&
                            <>
                                <div className="row">
                                    <section className="triangle col-12 pb-2">
                                        <div className="row col-12">
                                            <div className="col-12">
                                                <h4 id="" className="pl-3">Receipt</h4>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                                <div className="col-md-12 card-box m-0 ">
                                    {
                                        // receiptList && !!receiptList.length ?
                                        <div className="card">
                                            <DynamicTable
                                                listKey={"Receipt Detail List"}
                                                row={receiptList}
                                                rowCount={totalCountReceipt}
                                                header={ReceiptDetailColumns}
                                                itemsPerPage={perPageReceipt}
                                                backendPaging={true}
                                                backendCurrentPage={currentPageReceipt}
                                                isTableFirstRender={isTableFirstRender}
                                                exportBtn={exportBtnReceipt}
                                                handler={{
                                                    handleCellRender: handleCellRenderReceipt,
                                                    handlePageSelect: handlePageSelectReceipt,
                                                    handleItemPerPage: setPerPageReceipt,
                                                    handleCurrentPage: setCurrentPageReceipt,
                                                    handleFilters: setFiltersReceipt,
                                                    handleExportButton: setExportBtnReceipt
                                                }}
                                            />
                                        </div>
                                        // :
                                        // <span className="msg-txt">No Receipt Available</span>
                                    }
                                </div>
                            </>
                        }
                    </div>
                    <div className="adjusment modal-body">
                        {
                            paymentData.allocationLevel !== '' && paymentData.allocationLevel !== 'AUTOALLOC' &&
                            <>
                                <div className="row">
                                    <section className="triangle col-12 pb-2">
                                        <div className="row col-12">
                                            <div className="col-12">
                                                <h4 id="" className="pl-3">Invioce</h4>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="col-md-12 card-box m-0 ">
                                    <div className="skle-swtab-sect mt-0 mb-0">
                                        <ul className="skel-top-inter mt-1 mb-0">
                                            {getSelectedFilters()}
                                        </ul>
                                    </div>
                                    {
                                        invoice && !!invoice.length ?
                                            <div className="card">
                                                <DynamicTable
                                                    listKey={"Invoice List"}
                                                    row={invoice}
                                                    rowCount={totalCount}
                                                    header={InvoiceSearchColumns}
                                                    itemsPerPage={perPage}
                                                    backendPaging={true}
                                                    backendCurrentPage={currentPage}
                                                    hiddenColumns={InvoicePaymentHiddenColumns}
                                                    isTableFirstRender={isTableFirstRender}
                                                    exportBtn={exportBtn}
                                                    handler={{
                                                        handleCellRender: handleCellRender,
                                                        handlePageSelect: handlePageSelect,
                                                        handleItemPerPage: setPerPage,
                                                        handleCurrentPage: setCurrentPage,
                                                        handleFilters: setFilters,
                                                        handleExportButton: setExportBtn
                                                    }}
                                                />
                                            </div>
                                            :
                                            <span className="msg-txt">No Invoice Available</span>
                                    }
                                </div>
                            </>
                        }
                    </div>
                    <div className="adjusment modal-body">
                        {
                            paymentData.allocationLevel === 'INVCHARGE' &&
                            <>
                                <div className="row">
                                    <section className="triangle col-12 pb-2">
                                        <div className="row col-12">
                                            <div className="col-12">
                                                <h4 id="" className="pl-3">Invoice Details</h4>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                                <div className="col-md-12 card-box m-0 ">
                                    {
                                        invoiceDetail && !!invoiceDetail.length &&
                                        <div className="card">
                                            <DynamicTable
                                                listKey={"Invoice Detail List"}
                                                row={invoiceDetail}
                                                header={InvoiceDetailListColumns}
                                                itemsPerPage={10}
                                                hiddenColumns={InvoiceDetailPaymentHiddenColumns}
                                                exportBtn={exportBtn}
                                                handler={{
                                                    handleCellRender: handleCellRender,
                                                    handleExportButton: setExportBtn
                                                }}
                                            />
                                        </div>
                                    }
                                </div>
                            </>
                        }
                    </div>
                    <div className="flex-row pre-bill-sec">
                        <div className="col-12 p-1">
                            <div id="customer-buttons" className="d-flex justify-content-center">
                                
                                <button type="button" className="skel-btn-cancel" onClick={handleOnClear}>Clear</button>
                                <button type="button" className="skel-btn-submit" onClick={handleOnSubmit}>Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default PayNow

const ReceiptDetailColumns = [
    {
        Header: "Select",
        accessor: "select",
        disableFilters: true
    },
    {
        Header: "Receipt Number",
        accessor: "receiptId",
        disableFilters: true
    },
    {
        Header: "Receipt Reference Number",
        accessor: "receiptNumber",
        disableFilters: true
    },
    {
        Header: "Customer Name",
        accessor: "customer.firstName",
        disableFilters: true
    },
    {
        Header: "Receipt Amount",
        accessor: "amount",
        disableFilters: true
    },
    {
        Header: "Receipt Balance Amount",
        accessor: "balanceAmount",
        disableFilters: true
    },
    {
        Header: "Bank Name",
        accessor: "bankName",
        disableFilters: true
    },
    {
        Header: "Status",
        accessor: "statusDesc.description",
        id: "receiptStatus",
        disableFilters: true
    },
    {
        Header: "Payment Mode",
        accessor: "paymentModeDesc.description",
        disableFilters: true
    },
    {
        Header: "Currency",
        accessor: "currencyDesc.description",
        disableFilters: true
    },
    {
        Header: "Remarks",
        accessor: "remarks",
        disableFilters: true
    },
    {
        Header: "Receipt Date",
        accessor: "receiptCreatedAt",
        disableFilters: true
    },
    {
        Header: "Receipt Created At",
        accessor: "createdAt",
        disableFilters: true
    }
]

const InvoiceSearchColumns = [
    {
        Header: "Invoice No",
        accessor: "invoiceId",
        disableFilters: false,
        id: 'invoiceId'
    },
    {
        Header: "Allocation Amount",
        accessor: "allocationAmount",
        disableFilters: true
    },
    // {
    //     Header: "Sales Order Number",
    //     accessor: "soNumber",
    //     disableFilters: false,
    //     id: 'soNumber'
    // },
    // {
    //     Header: "Customer Number",
    //     accessor: "customerNo",
    //     disableFilters: false,
    //     id: 'customerNumber'
    // },
    {
        Header: "Customer Name",
        accessor: "customerName",
        disableFilters: false,
        id: 'customerName'
    },
    {
        Header: "Biilable Reference Number",
        accessor: "billRefNo",
        disableFilters: false,
        id: "billRefNo"
    },
    {
        Header: "Invoice Date",
        accessor: "invDate",
        disableFilters: true
    },
    {
        Header: "Due Date",
        accessor: "dueDate",
        disableFilters: true
    },
    {
        Header: "Invoice Amount",
        accessor: "invAmt",
        disableFilters: true
    },
    {
        Header: "Invoice O/S Amount",
        accessor: "invOsAmt",
        disableFilters: true
    }
]