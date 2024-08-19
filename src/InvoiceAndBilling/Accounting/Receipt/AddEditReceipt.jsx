import React, { useEffect, useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom';
import { Element, Link } from 'react-scroll'
import { toast } from 'react-toastify';
import { string, object } from "yup";
import { hideSpinner, showSpinner } from '../../../common/spinner';
import DynamicTable from '../../../common/table/DynamicTable';
import { properties } from '../../../properties';
import { get, post, put } from '../../../common/util/restUtil';
import { validateNumber } from '../../../common/util/validateUtil';
import AddEditReceiptLineItem from './AddEditReceiptLineItem';
import moment from 'moment';
import { USNumberFormat } from '../../../common/util/util';
import { useHistory } from '../../../common/util/history';
import NumberFormat from 'react-number-format'
import ReceiptCancel from './ReceiptCancel';
import ReceiptReversal from './ReceiptReversal';

const AddEditReceipt = (props) => {

    const data = props.location.state.data
    const history = useHistory()
    const [receiptData, setReceiptData] = useState({
        receiptNumber: "",
        amount: "",
        balanceAmount: "",
        bankName: "",
        remarks: "",
        receiptCreatedAt: "",
        receiptStatus: "",
        paymentMode: "",
        currency: "",
    })
    const [receiptList, setReceiptList] = useState([])
    const [error, setError] = useState({})
    const [receiptStatusList, setReceiptStatusList] = useState([])
    const [receiptLineItemStatusList, setReceiptLineItemStatusList] = useState([])
    const [currencyLookup, setCurrencyLookup] = useState([])
    const [paymentModeLookup, setPaymentModeLookup] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [modalMode, setModalMode] = useState('add')
    const [receiptEditData, setReceiptEditData] = useState({})
    const [isTotalIdentified, setIsTotalIdentified] = useState(false)
    const [refresh, setRefresh] = useState(false)
    const [cancelIsOpen, setCancelIsOpen] = useState(false)
    const [reverseIsOpen, setReversalIsOpen] = useState(false)
    const [receiptBankLookup, setReceiptBankLookup] = useState([])

    const validationSchema = object().shape({
        receiptNumber: string().required("Please Provide Receipt Number"),
        amount: string().required("Please Provide Amount"),
        balanceAmount: string().required("Please Provide Balance Amount"),
        receiptStatus: string().required("Please Provide Receipt Status"),
        bankName: string().required("Please Provide Bank Name"),
        //remarks: string().required("Please Provide Remarks"),
        receiptCreatedAt: !isOpen ? string().required("Please Provide Receipt Date") : string().nullable(true),
        paymentMode: string().required("Please Provide Payment Mode"),
        currency: string().required("Please Provide Currency"),
        customerId: isOpen ? string().required("Please Provide Customer Number") : string().nullable(true)
    });

    useEffect(() => {

        showSpinner();
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=RECEIPT_STATUS,PAYMENT_METHOD,CURRENCY,RECEIPT_BANK')
            .then((resp) => {
                if (resp.data) {
                    setReceiptBankLookup(resp.data['RECEIPT_BANK'])
                    setReceiptLineItemStatusList(resp.data["RECEIPT_STATUS"].filter((x) => ['RS_APPLIED', 'RS_UNAPPLIED', 'RS_PARTIALLY_APPLIED'].includes(x.code)))
                    setPaymentModeLookup(resp.data['PAYMENT_METHOD'])
                    setCurrencyLookup(resp.data['CURRENCY'])
                    if (data.mode === 'edit') {
                        showSpinner()
                        get(properties.RECEIPT_API + '/' + data?.editData?.receiptId)
                            .then((response) => {
                                const receiptDetailTotalAmount = response?.data?.receiptDtl.reduce((partialSum, a) => Number(partialSum) + Number(a.amount), 0)
                                if (receiptDetailTotalAmount === Number(response?.data?.amount)) {
                                    setIsTotalIdentified(true)
                                }
                                unstable_batchedUpdates(() => {
                                    setReceiptData({ ...response?.data, receiptStatus: response?.data?.status, originalReceiptStatus: response?.data?.status, receiptCreatedAt: moment(response?.data?.receiptCreatedAt).format('YYYY-MM-DD') })
                                    setReceiptList(response?.data?.receiptDtl ? response?.data?.receiptDtl.map((x) => { return { ...x, receiptStatus: x.status } }) : [])
                                    const statusList = resp.data["RECEIPT_STATUS"]
                                    statusList.push({ code: 'RS_CANCELLED', description: 'Cancelled' })
                                    setReceiptStatusList(statusList.filter((x) => !['RS_APPLIED', 'RS_UNAPPLIED', 'RS_PARTIALLY_APPLIED', ((data.mode === 'add' || response?.data?.status === 'RS_UNIDENTIFIED') ? 'RS_REVERSED' : ''), ((data.mode === 'add' || response?.data?.status === 'RS_UNIDENTIFIED') ? 'RS_CANCELLED' : '')].includes(x.code)))
                                })
                            })
                            .catch(error => {
                                console.error(error);
                            })
                            .finally(hideSpinner)
                    } else {
                        const statusList = resp.data["RECEIPT_STATUS"]
                        statusList.push({ code: 'RS_CANCELLED', description: 'Cancelled' })
                        setReceiptStatusList(statusList.filter((x) => !['RS_APPLIED', 'RS_UNAPPLIED', 'RS_PARTIALLY_APPLIED', ((data.mode === 'add' || data?.editData?.status === 'RS_UNIDENTIFIED') ? 'RS_REVERSED' : ''), ((data.mode === 'add' || data?.editData?.status === 'RS_UNIDENTIFIED') ? 'RS_CANCELLED' : '')].includes(x.code)))
                    }
                }
            })
            .catch(error => {
                console.error(error);
            })
            .finally(hideSpinner)
    }, [refresh])

    const validate = () => {
        try {
            validationSchema.validateSync(receiptData, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                setError((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    };

    const handleInputChange = (e) => {
        const target = e.target;
        unstable_batchedUpdates(() => {
            if (target.id === "amount") {
                const value = String(target.value)
                setReceiptData({
                    ...receiptData,
                    [target.id]: (value.indexOf(".") >= 0) ? (value.substr(0, value.indexOf(".")) + value.substr(value.indexOf("."), 3)) : value,
                    balanceAmount: target.value
                })
            } else {
                setReceiptData({
                    ...receiptData,
                    [target.id]: target.value
                })
            }
            if (target.id === "amount") {
                setError({
                    ...error,
                    [target.id]: "",
                    balanceAmount: ""
                })
            } else {
                setError({
                    ...error,
                    [target.id]: ""
                })
            }
            if (target.id === "receiptStatus") {
                setReceiptList([])
            }
        })
    }

    const handleSubmit = () => {
        const error = validate(validationSchema, receiptData);
        if (error) {
            toast.error('Validation Error Found, Please check highlighted fields')
            return;
        }
        if (receiptData.receiptStatus === 'RS_IDENTIFIED' && receiptList.length === 0) {
            toast.error('Please Provide Receipt Details')
            return;
        }
        const receiptDetailTotalAmount = receiptList.reduce((partialSum, a) => Number(partialSum) + Number(a.amount), 0)
        if (Number(receiptDetailTotalAmount) > Number(receiptData.amount)) {
            toast.error('Receipt Details Amount Cannot be Greater than Receipt Amount')
            return;
        }
        receiptData.amount = Number(receiptData.amount)
        if (data.mode === 'add') {
            showSpinner();
            const requestBody = {
                ...receiptData,
                status: receiptData.receiptStatus,
                receiptList
            }
            post(properties.RECEIPT_API, requestBody)
                .then((response) => {
                    if (response.data) {
                        toast.success('Receipt Added Successfully')
                        history(`/search-receipt`)
                    }
                })
                .catch(error => {
                    console.error(error);
                })
                .finally(hideSpinner)
        } else {
            showSpinner();
            const requestBody = {
                ...receiptData,
                status: receiptData.receiptStatus,
                receiptList
            }
            put(properties.RECEIPT_API + '/' + receiptData?.receiptId, requestBody)
                .then((response) => {
                    if (response.data) {
                        toast.success('Receipt Updated Successfully')
                        history(`/search-receipt`)
                    }
                })
                .catch(error => {
                    console.error(error);
                })
                .finally(hideSpinner)
        }

    }

    const handleCellRender = (cell, row) => {

        if (["Receipt Amount", "Receipt Balance Amount"].includes(cell.column.Header)) {
            return (<span>{USNumberFormat(cell.value)}</span>)
        }
        else if (['Edit'].includes(cell.column.Header)) {
            return (
                <button type="button" className={`btn btn-labeled btn-primary btn-sm ${row?.original?.receiptDtlId ? 'd-none' : ''}`} onClick={() => { handleEditReceiptLineItem(row?.original) }}>Edit</button>
            )
        }
        else if (['Reversal'].includes(cell.column.Header)) {
            return (
                <button type="button" className={`btn btn-labeled btn-primary btn-sm ${(!row?.original?.receiptDtlId || ['RS_REVERSED', 'RS_CANCELLED'].includes(row.original.receiptStatus)) ? 'd-none' : ''}`} onClick={() => { handleReverseReceiptLineItem(row?.original) }}>Reverse</button>
            )
        }
        else if (['Reversed By'].includes(cell.column.Header)) {
            let name = (row?.original?.reversedByName?.firstName || "") + " " + (row?.original?.reversedByName?.lastName || "")
            return (<span>{name}</span>);
        }
        else if (["Reversal On"].includes(cell.column.Header)) {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY hh:mm:ss A') : '-'}</span>
            )
        }
        else {
            return (
                <span>{cell.value}</span>
            )
        }
    }

    const handleAddReceiptLineItem = () => {
        setModalMode('add')
        const error = validate(validationSchema, receiptData);
        if (error) {
            toast.error('Validation Error Found, Please check highlighted fields')
            return;
        }
        setIsOpen(true)
    }

    const handleEditReceiptLineItem = (data) => {
        setModalMode('edit')
        setReceiptEditData(data)
        const error = validate(validationSchema, receiptData);
        if (error) {
            toast.error('Validation Error Found, Please check highlighted fields')
            return;
        }
        setIsOpen(true)
    }

    const handleReverseReceiptLineItem = (data) => {
        setReceiptEditData(data)
        setReversalIsOpen(true)
    }

    const softRefresh = () => {
        setRefresh(!refresh)
    }
    const handleCancel = () => {

        history(`/search-receipt`)

    }
    const handleReceiptCancel = () => {
        setCancelIsOpen(true)
        // Swal.fire({
        //     title: `Receipt Cancellation`,
        //     text: "The Receipt will be Cancelled and cannot be used for Payment" ,
        //     icon: 'warning',
        //     showCancelButton: true,
        //     confirmButtonColor: '#3085d6',
        //     cancelButtonColor: '#d33',
        //     confirmButtonText: 'Yes, Submit it!'
        // }).then((result) => {
        //     if (result.isConfirmed) {
        //         toast.success('Receipt Cancellation Successful')
        //     }
        // })
    }

    return (
        <>
            {/* <div className="row inv">
                <div className="col-11">
                    <div className="page-title-box">
                        <h4 className="page-title">Receipt</h4>
                    </div>
                </div>
                <div className="col-1 mt-1">
                    <button className="btn btn-labeled btn-primary btn-sm mt-1" onClick={() => { history(`/search-receipt`) }}>Back</button>
                </div>
            </div> */}
            <div className="cmmn-skeleton mt-2">
                <div className="col-lg-12 p-0">
                    <div className="card-box p-0">
                        <div className="row">
                            {/* <div className="col-2 pt-2 sticky" style={{ background: "#FFF" }}>
                                <ul id="scroll-list" className="list-group">
                                    <li>
                                        <Link activeClass="active" className="list-group-item list-group-item-action" to="salesOrder" spy={true} offset={-120} smooth={true} duration={100} >Receipt</Link>
                                    </li>
                                    {
                                        receiptData.receiptStatus === 'RS_IDENTIFIED' &&
                                        <li>
                                            <Link activeClass="active" className="list-group-item list-group-item-action" to="salesOrderDetail" spy={true} offset={-120} smooth={true} duration={100} >Receipt Details</Link>
                                        </li>
                                    }
                                </ul>
                            </div> */}
                            <div className="col-md-12 p-10">
                                <div className="scrollspy-div ac-screen">
                                    <Element name="salesOrder">
                                        <div className="row">
                                            <section className="row triangle col-12">
                                                <div className="row col-12">
                                                    <div className="col-10">
                                                        <h4 id="list-item-3 pl-3">Receipt</h4>
                                                    </div>
                                                    <div className="col-2 pb-1">
                                                        <span className="float-right">
                                                            {
                                                                data.mode === 'edit' && receiptData.originalReceiptStatus !== 'RS_CANCELLED' &&
                                                                <button type="button" className="btn btn-primary waves-effect waves-light btn-sm mt-1 float-right" onClick={handleReceiptCancel}>Receipt Cancel
                                                                </button>
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                        <div className="col-md-12 card-box m-0 ">
                                            <div className="row pt-1">
                                                {data.mode === 'edit' && <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="receiptId" className="col-form-label">Receipt Number<span>*</span></label>
                                                        <input type="text" id="receiptId" className={`form-control mr-2 ${error.receiptId ? "input-error" : ""}`} placeholder="Please Enter Receipt Number" value={receiptData.receiptId}
                                                            disabled={true}

                                                        />

                                                    </div>
                                                </div>}
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="receiptNumber" className="col-form-label">Receipt Reference Number<span>*</span></label>
                                                        <input type="text" id="receiptNumber" className={`form-control mr-2 ${error.receiptNumber ? "input-error" : ""}`} placeholder="Please Enter Receipt Number" value={receiptData.receiptNumber}
                                                            disabled={data.mode === 'edit'}
                                                            onChange={handleInputChange}
                                                        />
                                                        {error.receiptNumber ? <span className="errormsg">{error.receiptNumber}</span> : ""}
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="amount" className="col-form-label">Receipt Amount<span>*</span></label>
                                                        <input type="number" id="amount" className={`form-control mr-2 ${error.amount ? "input-error" : ""}`} placeholder="Please Enter Amount" value={receiptData.amount}
                                                            disabled={data.mode === 'edit'}
                                                            onChange={handleInputChange}
                                                        // onKeyPress={(e) => { validateNumber(e) }}
                                                        />
                                                        {error.amount ? <span className="errormsg">{error.amount}</span> : ""}
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="balanceAmount" className="col-form-label">Unidentified Receipt Amount<span>*</span></label>
                                                        <input type="text" id="balanceAmount" className={`form-control mr-2 ${error.balanceAmount ? "input-error" : ""}`} placeholder="Please Enter Balance Amount" value={Number(receiptData.balanceAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                            disabled={true}
                                                            onChange={handleInputChange}
                                                        />
                                                        {error.balanceAmount ? <span className="errormsg">{error.balanceAmount}</span> : ""}
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="currency" className="col-form-label">Currency<span>*</span></label>
                                                        <select value={receiptData.currency} id="currency" className={`form-control mr-2 ${error.currency ? "input-error" : ""}`}
                                                            onChange={handleInputChange}
                                                            disabled={data.mode === 'edit'}
                                                        >
                                                            <option value="">Select Currency</option>
                                                            {
                                                                currencyLookup && currencyLookup.map((c, index) => {
                                                                    return (<option key={index} value={c.code}>{c.description}</option>)
                                                                })
                                                            }
                                                        </select>
                                                        {error.currency ? <span className="errormsg">{error.currency}</span> : ""}
                                                    </div>
                                                </div>

                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="paymentMode" className="col-form-label">Payment Mode<span>*</span></label>
                                                        <select value={receiptData.paymentMode} id="paymentMode" className={`form-control mr-2 ${error.paymentMode ? "input-error" : ""}`}
                                                            onChange={handleInputChange}
                                                            disabled={data.mode === 'edit'}
                                                        >
                                                            <option value="">Select Payment Mode</option>
                                                            {
                                                                paymentModeLookup && paymentModeLookup.map((c, index) => {
                                                                    return (<option key={index} value={c.code}>{c.description}</option>)
                                                                })
                                                            }
                                                        </select>
                                                        {error.paymentMode ? <span className="errormsg">{error.paymentMode}</span> : ""}
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="receiptCreatedAt" className="col-form-label">Receipt Date<span>*</span></label>
                                                        <input type="date" id="receiptCreatedAt" className={`form-control mr-2 ${error.receiptCreatedAt ? "input-error" : ""}`} value={receiptData.receiptCreatedAt}
                                                            max={moment(new Date()).format('YYYY-MM-DD')}
                                                            disabled={data.mode === 'edit'}
                                                            onChange={handleInputChange}
                                                        />
                                                        {error.receiptCreatedAt ? <span className="errormsg">{error.receiptCreatedAt}</span> : ""}
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="receiptStatus" className="col-form-label">Receipt Status<span>*</span></label>
                                                        <select value={receiptData.receiptStatus} id="receiptStatus" className={`form-control mr-2 ${error.receiptStatus ? "input-error" : ""}`}
                                                            onChange={handleInputChange}
                                                            disabled={data.mode === 'edit' && ['RS_IDENTIFIED', 'RS_CANCELLED'].includes(receiptData?.originalReceiptStatus)}
                                                        >
                                                            <option value="">Select Receipt Status</option>
                                                            {
                                                                receiptStatusList && receiptStatusList.map((c, index) => {
                                                                    return (<option key={index} value={c.code}>{c.description}</option>)
                                                                })
                                                            }
                                                        </select>
                                                        {error.receiptStatus ? <span className="errormsg">{error.receiptStatus}</span> : ""}
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="bankName" className="col-form-label">Bank<span>*</span></label>
                                                        <select value={receiptData.bankName} id="bankName" className={`form-control mr-2 ${error.bankName ? "input-error" : ""}`}
                                                            onChange={handleInputChange}
                                                            disabled={data.mode === 'edit'}
                                                        >
                                                            <option value="">Select Bank Name</option>
                                                            {
                                                                receiptBankLookup && receiptBankLookup.map((c, index) => {
                                                                    return (<option key={index} value={c.code}>{c.description}</option>)
                                                                })
                                                            }
                                                        </select>
                                                        {error.bankName ? <span className="errormsg">{error.bankName}</span> : ""}
                                                    </div>
                                                </div>

                                                <div className="col-md-12">
                                                    <div className="form-group">
                                                        <label htmlFor="remarks" className="col-form-label">Remarks<span></span></label>
                                                        <textarea id="remarks" className={`form-control mr-2 ${error.remarks ? "input-error" : ""}`} placeholder="Please Enter Remarks" value={receiptData.remarks}
                                                            disabled={data.mode === 'edit'}
                                                            onChange={handleInputChange}
                                                        />
                                                        {error.remarks ? <span className="errormsg">{error.remarks}</span> : ""}
                                                    </div>
                                                </div>
                                                {
                                                    data.mode === 'edit' && receiptData?.originalReceiptStatus === 'RS_CANCELLED' &&
                                                    <>
                                                        <div className="col-md-3">
                                                            <div className="form-group">
                                                                <label htmlFor="cancelledBy" className="col-form-label">Cancelled By<span>*</span></label>
                                                                <input type="text" id="cancelledBy" className={`form-control mr-2 ${error.cancelledBy ? "input-error" : ""}`} placeholder="Please Enter Cancelled By" value={((receiptData?.cancelledByName?.firstName || "") + " " + (receiptData?.cancelledByName?.lastName || ""))}
                                                                    disabled={true}
                                                                    onChange={handleInputChange}
                                                                />
                                                                {error.cancelledBy ? <span className="errormsg">{error.cancelledBy}</span> : ""}
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="form-group">
                                                                <label htmlFor="cancelledAt" className="col-form-label">Cancelled On<span>*</span></label>
                                                                <input type="date" id="cancelledAt" className={`form-control mr-2 ${error.cancelledAt ? "input-error" : ""}`} value={moment(receiptData.cancelledAt).format('YYYY-MM-DD')}
                                                                    disabled={true}
                                                                    onChange={handleInputChange}
                                                                />
                                                                {error.cancelledAt ? <span className="errormsg">{error.cancelledAt}</span> : ""}
                                                            </div>
                                                        </div>
                                                        <div className="col-md-12">
                                                            <div className="form-group">
                                                                <label htmlFor="cancelledReason" className="col-form-label">Cancellation Reason<span>*</span></label>
                                                                <textarea id="cancelledReason" className={`form-control mr-2 ${error.cancelledReason ? "input-error" : ""}`} placeholder="Please Enter Reason" value={receiptData.cancelledReason}
                                                                    disabled={true}
                                                                />
                                                                {error.cancelledReason ? <span className="errormsg">{error.cancelledReason}</span> : ""}
                                                            </div>
                                                        </div>
                                                    </>
                                                }

                                            </div>

                                        </div>
                                    </Element>
                                    {
                                        (receiptData.receiptStatus === 'RS_IDENTIFIED' || (receiptData.receiptStatus === 'RS_CANCELLED' && receiptList.length > 0)) &&
                                        <Element name="salesOrderDetail">
                                            <div className="row">
                                                <section className="row triangle col-12">
                                                    <div className="row col-12">
                                                        <div className="col-10">
                                                            <h4 id="list-item-3 pl-3">Receipt Details</h4>
                                                        </div>
                                                        <div className="col-2 pb-1">
                                                            <span className="float-right">
                                                                {
                                                                    receiptData.receiptStatus === 'RS_IDENTIFIED' &&
                                                                    <button type="button" disabled={isTotalIdentified} className="btn btn-primary waves-effect waves-light btn-sm mt-1 float-right" onClick={handleAddReceiptLineItem}>Add
                                                                    </button>
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </section>
                                            </div>
                                            <div className="col-md-12 card-box m-0 ">
                                                {
                                                    receiptList && !!receiptList.length &&
                                                    <div className="card">
                                                        <DynamicTable
                                                            listKey={"Receipt Line Item List"}
                                                            row={receiptList}
                                                            header={ReceiptIineItemListColumns}
                                                            hiddenColumns={data.mode === 'edit' ? (receiptData?.originalReceiptStatus === 'RS_UNIDENTIFIED' ? ['reversal', 'reversedAt', 'reversedBy', 'reversedReason'] : []) : ['reversal', 'reversedAt', 'reversedBy', 'reversedReason']}
                                                            itemsPerPage={10}
                                                            backendPaging={false}
                                                            handler={{
                                                                handleCellRender: handleCellRender,
                                                                handleFilters: ()=>{}
                                                            }}
                                                        />
                                                    </div>
                                                }
                                            </div>
                                            {
                                                isOpen &&
                                                <AddEditReceiptLineItem
                                                    data={{
                                                        isOpen,
                                                        receiptData,
                                                        validationSchema,
                                                        receiptLineItemStatusList,
                                                        modalMode,
                                                        receiptList,
                                                        receiptEditData
                                                    }}
                                                    handler={{
                                                        setIsOpen,
                                                        setReceiptList,
                                                        setReceiptData
                                                    }}
                                                />
                                            }
                                        </Element>
                                    }
                                    {
                                        cancelIsOpen &&
                                        <ReceiptCancel
                                            data={{
                                                isOpen: cancelIsOpen,
                                                receiptData
                                            }}
                                            handler={{
                                                setIsOpen: setCancelIsOpen,
                                                softRefresh
                                            }}
                                        />
                                    }
                                    {
                                        reverseIsOpen &&
                                        <ReceiptReversal
                                            data={{
                                                isOpen: reverseIsOpen,
                                                receiptData: receiptEditData
                                            }}
                                            handler={{
                                                setIsOpen: setReversalIsOpen,
                                                softRefresh
                                            }}
                                        />
                                    }
                                    <div className={`row justify-content-center mt-2 pb-2`}>
                                        <button className="skel-btn-cancel" onClick={handleCancel}>Cancel</button>
                                        <button onClick={handleSubmit} className="skel-btn-submit" disabled={isTotalIdentified || receiptData.originalReceiptStatus === 'CANCELLED'}>Submit</button>
                                        
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

export default AddEditReceipt


const ReceiptIineItemListColumns = [
    {
        Header: "Edit",
        accessor: "edit",
        disableFilters: true
    },
    {
        Header: "Reversal",
        accessor: "reversal",
        disableFilters: true
    },
    {
        Header: "Receipt Number",
        accessor: "receiptNumber",
        disableFilters: true
    },
    {
        Header: "Customer Number",
        accessor: "customer.customerNo",
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
        Header: "Status",
        accessor: "statusDesc.description",
        disableFilters: true
    },
    {
        Header: "Remarks",
        accessor: "remarks",
        disableFilters: true
    },
    
    {
        Header: "Reversed By",
        accessor: "reversedBy",
        disableFilters: true
    },
    {
        Header: "Reversal On",
        accessor: "reversedAt",
        disableFilters: true
    },
    {
        Header: "Reversal Reason",
        accessor: "reversedReason",
        disableFilters: true
    }
]