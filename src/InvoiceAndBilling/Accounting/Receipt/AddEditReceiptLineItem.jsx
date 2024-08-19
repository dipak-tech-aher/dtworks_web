import React, { useEffect, useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import { hideSpinner, showSpinner } from '../../../common/spinner';
import { properties } from '../../../properties';
import { post } from '../../../common/util/restUtil';
import { RegularModalCustomStyles } from '../../../common/util/util';
import { validateNumber } from '../../../common/util/validateUtil';

const AddEditReceiptLineItem = (props) => {

    const { isOpen, receiptData, validationSchema, modalMode, receiptLineItemStatusList, receiptList, receiptEditData } = props?.data
    const { setIsOpen, setReceiptList, setReceiptData } = props?.handler
    const [error, setError] = useState({})
    const [receiptLineItemData, setReceiptLineItemData] = useState({
        receiptNumber: receiptData.receiptNumber,
        amount: (Number(receiptData.balanceAmount) + (modalMode === 'edit' ? Number(receiptEditData.amount) : 0)).toFixed(2),
        balanceAmount: (Number(receiptData.balanceAmount) + (modalMode === 'edit' ? Number(receiptEditData.amount) : 0)).toFixed(2),
        bankName: receiptData.bankName,
        remarks: "",
        receiptCreatedAt: receiptData.receiptCreatedAt,
        receiptStatus: "RS_UNAPPLIED",
        statusDesc: { description: 'Unapplied' },
        customerId: "",
        paymentMode: receiptData.paymentMode,
        currency: receiptData.currency,
    })
    const [customersList, setCustomerList] = useState([])
    useEffect(() => {
        if (modalMode === 'edit') {
            setReceiptLineItemData(receiptEditData)
        }
    }, [])

    useEffect(() => {
        showSpinner();
        post(properties.CUSTOMER_API + '/all-customer',)
            .then((response) => {
                if (response.data) {
                    setCustomerList(response.data)
                }
            })
            .catch(error => {
                console.error(error);
            })
            .finally(hideSpinner)
    }, [])

    const validate = () => {
        try {
            validationSchema.validateSync(receiptLineItemData, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                setError((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    };

    const handleCancel = () => {
        setIsOpen(false)
    }

    const handleInputChange = (e) => {
        const target = e.target;
        unstable_batchedUpdates(() => {
            if (target.id === "amount") {
                const value = String(target.value)
                setReceiptLineItemData({
                    ...receiptLineItemData,
                    [target.id]: (value.indexOf(".") >= 0) ? (value.substr(0, value.indexOf(".")) + value.substr(value.indexOf("."), 3)) : value,
                    balanceAmount: target.value
                })
            } else if (target.id === "customerId") {
                const data = JSON.parse(target?.options[target?.selectedIndex]?.dataset?.entity)
                setReceiptLineItemData({
                    ...receiptLineItemData,
                    [target.id]: target.value,
                    customer: { firstName: data.firstName, crmCustomerNo:data.crmCustomerNo }
                })
            } else {
                setReceiptLineItemData({
                    ...receiptLineItemData,
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

        })
    }

    const handleSubmit = () => {
        console.log('receiptLineItemData', receiptLineItemData)
        //const error = validate(validationSchema, receiptLineItemData);
        // if (error) {
        //     toast.error('Validation Error Found, Please check highlighted fields')
        //     return;
        // }
        if (!receiptLineItemData.customerId) {
            toast.error('Please Provide Customer Name')
            return;
        }
        if (Number(receiptLineItemData.amount) > Number(receiptData.amount)) {
            toast.error('Receipt Detail Amount Cannot be Greater then Receipt Amount')
            return;
        }
        // if(Number(receiptLineItemData.amount) > Number(receiptData.balanceAmount)) {
        //     toast.error('Receipt Detail Amount Cannot be Greater then Unidentified Amount')
        //     return;
        // } 
        if (Number(receiptLineItemData.amount) > (Number(receiptData.balanceAmount) + (modalMode === 'edit' ? Number(receiptEditData.amount) : 0))) {
            toast.error('Receipt Detail Amount Cannot be Greater then Unidentified Amount')
            return;
        }
        const list = []
        if (modalMode === 'add') {
            const indexId = Math.round(Math.random() * 20 - 10) + Math.round(Math.random() * 20 - 10);
            //console.log('indexId',indexId)
            setReceiptList([...receiptList, { indexId, ...receiptLineItemData, status: receiptLineItemData.receiptStatus }])
            list.push(...receiptList, { indexId, ...receiptLineItemData, status: receiptLineItemData.receiptStatus })
        } else {
            const indexId = receiptLineItemData?.receiptDtlId ? receiptLineItemData?.receiptDtlId : receiptLineItemData?.indexId
            setReceiptList(
                receiptList.map((c) => {
                    const id = c?.receiptDtlId ? c?.receiptDtlId : c?.indexId
                    if (id === indexId) {
                        c = receiptLineItemData
                    }
                    return c
                })
            )
            list.push(...receiptList.map((c) => {
                const id = c?.receiptDtlId ? c?.receiptDtlId : c?.indexId
                if (id === indexId) {
                    c = receiptLineItemData
                }
                return c
            }))
        }
        const totalLineItemAmount = list.reduce((partialSum, a) => Number(partialSum) + Number(a.amount), 0)
        //console.log('totalLineItemAmoun',totalLineItemAmount)
        setReceiptData({ ...receiptData, balanceAmount: Number(receiptData.amount) - totalLineItemAmount })
        setIsOpen(false)
    }

    return (
        <>
            <Modal style={RegularModalCustomStyles} isOpen={isOpen} onRequestClose={handleCancel} contentLabel="Receipt Details" >
                <div className="modal-content">
                    <div className="modal-header">
                        <h4 className="modal-title">{modalMode === 'add' ? 'Add' : 'Edit'} Receipt Details</h4>
                        <button type="button" className="close" onClick={handleCancel}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    
                    <div className="modal-body">
                        <div className="modal-body p-2" style={{ display: "block" }}>
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label className="control-label" htmlFor="receiptNumber">Receipt Reference Number</label>
                                        <input type="text"
                                            className={`form-control mr-2 ${error.receiptNumber ? "input-error" : ""}`}
                                            value={receiptLineItemData.receiptNumber}
                                            disabled={true}
                                        />
                                        {error.receiptNumber ? <span className="errormsg">{error.receiptNumber}</span> : ""}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="balanceAmount" className="col-form-label">Balance Unidentified Amount<span>*</span></label>
                                        {/* <input type="text" id="balanceAmount" className={`form-control mr-2 ${error.balanceAmount ? "input-error" : ""}`} placeholder="Please Enter Balance Amount" value={Number(receiptData.balanceAmount).toFixed(2)}
                                            disabled={true}
                                            onChange={handleInputChange}
                                        /> */}
                                        <input type="text" id="balanceAmount" className={`form-control mr-2 ${error.balanceAmount ? "input-error" : ""}`} placeholder="Please Enter Balance Amount" value={(Number(receiptData.balanceAmount) + (modalMode === 'edit' ? Number(receiptEditData.amount) : 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            disabled={true}
                                            onChange={handleInputChange}
                                        />
                                        {error.balanceAmount ? <span className="errormsg">{error.balanceAmount}</span> : ""}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="amount" className="col-form-label">Amount<span>*</span></label>
                                        <input type="number" id="amount" className={`form-control mr-2 ${error.amount ? "input-error" : ""}`} placeholder="Please Enter Amount" value={receiptLineItemData.amount}
                                            onChange={handleInputChange}
                                        // onKeyPress={(e) => { validateNumber(e) }}
                                        />
                                        {error.amount ? <span className="errormsg">{error.amount}</span> : ""}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="receiptStatus" className="col-form-label">Receipt Status<span>*</span></label>
                                        <select value={receiptLineItemData.receiptStatus} id="receiptStatus" className={`form-control mr-2 ${error.receiptStatus ? "input-error" : ""}`}
                                            onChange={handleInputChange}
                                            disabled={true}
                                        >
                                            <option value="">Select Receipt Status</option>
                                            {
                                                receiptLineItemStatusList && receiptLineItemStatusList.map((c, index) => {
                                                    return (<option key={index} value={c.code}>{c.description}</option>)
                                                })
                                            }
                                        </select>
                                        {error.receiptStatus ? <span className="errormsg">{error.receiptStatus}</span> : ""}
                                    </div>
                                </div>
                                {/* <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="receiptCreatedAt" className="col-form-label">Receipt Date<span>*</span></label>
                                        <input type="date" id="receiptCreatedAt" className={`form-control mr-2 ${error.receiptCreatedAt ? "input-error" : ""}`} value={receiptLineItemData.receiptCreatedAt}
                                            onChange={handleInputChange}
                                        />
                                        {error.receiptCreatedAt ? <span className="errormsg">{error.receiptCreatedAt}</span> : ""}
                                    </div>
                                </div> */}
                                <div className="col-md-5">
                                    <div className="form-group">
                                        <label htmlFor="customerId" className="col-form-label">Customer Name<span>*</span></label>
                                        <select id="customerId" className={`form-control mr-2 ${error.customerId ? "input-error" : ""}`} placeholder="Please Enter Amount" value={receiptLineItemData.customerId}
                                            onChange={handleInputChange}
                                            onKeyPress={(e) => { validateNumber(e) }}
                                        >
                                            <option value="">Select Customer</option>
                                            {
                                                customersList && customersList.map((c, index) => {
                                                    return (<option key={index} value={c.customerId} data-entity={JSON.stringify(c)}>{c.customerNo + ': ' + c.firstName}</option>)
                                                })
                                            }
                                        </select>
                                        {error.customerId ? <span className="errormsg">{error.customerId}</span> : ""}
                                    </div>
                                </div>
                                {/* <div className="col-md-9">
                                    <div className="form-group">
                                        <label htmlFor="bankName" className="col-form-label">Bank Name<span>*</span></label>
                                        <input type="text" id="bankName" className={`form-control mr-2 ${error.bankName ? "input-error" : ""}`} placeholder="Please Enter Bank Name" value={receiptLineItemData.bankName}
                                            onChange={handleInputChange}
                                        />
                                        {error.bankName ? <span className="errormsg">{error.bankName}</span> : ""}
                                    </div>
                                </div> */}
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="remarks" className="col-form-label">Remarks<span></span></label>
                                        <textarea id="remarks" className={`form-control mr-2 ${error.remarks ? "input-error" : ""}`} placeholder="Please Enter Remarks" value={receiptLineItemData.remarks}
                                            onChange={handleInputChange}
                                        />
                                        {error.remarks ? <span className="errormsg">{error.remarks}</span> : ""}
                                    </div>
                                </div>
                            </div>
                            <br />
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <button className="skel-btn-cancel" type="button" onClick={handleCancel}>Cancel</button>
                                <button className="skel-btn-submit" onClick={handleSubmit}>{modalMode === 'add' ? 'Add' : 'Save'}</button>&nbsp;&nbsp;
                                
                            </div>

                        </div>
                    </div>
                </div>
            </Modal>


        </>
    )
}

export default AddEditReceiptLineItem