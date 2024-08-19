import React, { useEffect, useRef, useState } from 'react'
import moment from 'moment'
import DynamicTable from '../../../common/table/DynamicTable';
import { CloseButton, Form, Modal } from 'react-bootstrap';
import { get, post, put } from '../../../common/util/restUtil';
import { properties } from '../../../properties';
import { formFilterObject, USNumberFormat } from '../../../common/util/util';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';
import { useForm } from "react-hook-form";
import Swal from 'sweetalert2';

const PaymentHistory = (props) => {

    const { accountData } = props?.data
    const refresh = props?.data?.refresh || false
    const pageRefresh = props?.handler?.pageRefresh
    const isScroll = props?.data?.isScroll ?? true
    const [paymentHistoryList, setPaymentHistoryList] = useState([])
    const [exportBtn, setExportBtn] = useState(false)
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const isTableFirstRender = useRef(true);
    const [showCancelPopup, setShowCancelPopup] = useState(false);
    const [inputsDetails, setInputsDetails] = useState({ reason: '', remarks: '' })
    const { register, handleSubmit, setValue, formState: { errors }, clearErrors, reset } = useForm()
    const [selectedPayment, setSelectedPayment] = useState({})
    const masterLookupDataRef = useRef()


    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=INVOICE_CANCEL_REASON')
            .then((resp) => {
                if (resp?.status === 200) {
                    masterLookupDataRef.current = resp.data
                }
            }).catch((error) => console.error(error))
    }, [])


    useEffect(() => {
        getPaymentHistoryData()
    }, [currentPage, perPage/*,refresh*/])

    useEffect(() => {
        unstable_batchedUpdates(() => {
            setPerPage(10);
            setCurrentPage((currentPage) => {
                if (currentPage === 0) {
                    return '0'
                }
                return 0
            });
        })
    }, [refresh])

    const getPaymentHistoryData = () => {
        const requestBody = {
            customerUuid: accountData?.customerData?.customerUuid || accountData?.customerUuid,
            filters: formFilterObject(filters)
        }
        post(`${properties.BILLING_API}/paymentHistory?limit=${perPage}&page=${currentPage}`, requestBody).then((response) => {
            const { count, rows } = response.data;
            if (!!rows.length) {
                unstable_batchedUpdates(() => {
                    setTotalCount(count)
                    setPaymentHistoryList(rows)
                })
            }
            else {
                if (filters.length) {
                    toast.error('No Records Found')
                }
            }
        }).catch(error => console.log(error))
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Reference Date") {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY') : '-'}</span>
            )
        }
        else if (["Payment Date", "Cancelled Date"].includes(cell.column.Header)) {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY hh:mm:ss A') : '-'}</span>
            )
        }
        else if (cell.column.Header === "Customer Name") {
            let name = row?.original?.Customer?.firstName + " " + row?.original?.Customer?.lastName
            return (
                <span>{name}</span>
            )
        }
        else if (cell.column.Header === "Customer Number") {
            let cNo = row?.original?.Customer?.customerNo
            return (
                <span>{cNo}</span>
            )
        }
        else if (cell.column.Header === "Payment Captured By") {
            let name = row?.original?.createdByName.firstName + " " + row?.original?.createdByName?.lastName
            return (
                <span>{name}</span>
            )
        }
        else if (cell.column.Header === "Reference Name" || cell.column.Header === "Reference Number") {
            return (
                <span>{cell.value ? cell.value : '-'}</span>
            )
        }
        else if (cell.column.Header === "Amount Paid") {
            return (
                <span>{USNumberFormat(cell.value)}</span>
            )
        } else if (cell.column.Header === "Cancel Payment") {
            return (
                <button className={`skel-btn-submit ${row?.original?.cancelledReason ? 'disabled' : ' '}`} disabled={row?.original?.cancelledReason ? true : false}onClick={() => { setShowCancelPopup(true); setSelectedPayment(row?.original) }}>Cancel Payment</button>
            )
        } else if (cell.column.Header === "Cancelled By") {

            return (
                <span>{(row?.original?.cancelledByName?.firstName ?? '') + " " + (row?.original?.cancelledByName?.lastName ?? '')}</span>
            )
        }
        else {
            return (
                <span>{cell.value}</span>
            )
        }
    }

    const handleOnChange = (e) => {
        const target = e.target
        unstable_batchedUpdates(() => {
            setInputsDetails({ ...inputsDetails, [target.id]: target.value })
        })
    }

    const handleOnClose = () => {
        setShowCancelPopup(!showCancelPopup)
        clearErrors()
        setSelectedPayment({})
        setInputsDetails({})
        reset()
    }

    const onSubmit = () => {
        if (!selectedPayment.paymentId) {
            toast.error('Kindly select payment details')
            return false
        }

        if (!inputsDetails?.reason) {
            toast.error('Please provide cancellation Reason')
            return false
        }

        Swal.fire({
            title: 'Are you sure?',
            text: `This payment has been applied to invoice, Would you still want to cancel?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: `Yes`
        }).then((result) => {
            if (result.isConfirmed) {
                const requestBody = { reason: inputsDetails?.reason, remarks: inputsDetails?.remarks }
                put(`${properties.BILLING_API}/payment/cancel/${selectedPayment.paymentId}`, requestBody)
                    .then((resp) => {
                        if (resp.status === 200) {
                            toast.success('Payment Invoice updated Successfully')
                            handleOnClose()
                            pageRefresh()
                        }
                    })
                    .catch(error => console.error(error))
            } else {
                // handleOnClose()
            }
        })
    }

    return (
        <>
            <div className="col-md-12 card-box m-0">
                {
                    !!paymentHistoryList.length ?
                        <div className="card p-2">
                            <DynamicTable
                                isScroll={isScroll}
                                listKey={"Payment History"}
                                row={paymentHistoryList}
                                rowCount={totalCount}
                                header={PaymentHistoryColumns}
                                itemsPerPage={perPage}
                                backendPaging={true}
                                backendCurrentPage={currentPage}
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
                        <span className="msg-txt">No Payment History</span>
                }
            </div>

            {/*** Payment Table Modal***/}
            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={showCancelPopup} onHide={() => handleOnClose()} dialogClassName='cust-md-modal'>
                <Modal.Header>
                    <Modal.Title><h5 className="modal-title">Cancel Payment for - {selectedPayment?.paymentId ?? ''}
                    </h5></Modal.Title>
                    <CloseButton onClick={() => handleOnClose()} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>

                    </CloseButton>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <div className="row pt-1">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label htmlFor="reason" className="control-label">Reason For Cancellation<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <select className="form-control" id="reason" value={inputsDetails?.reason ?? ''} {...register("reason", { required: 'This is required' })} onChange={handleOnChange}>
                                        <option value="">Please Select Reason</option>
                                        {masterLookupDataRef?.current?.INVOICE_CANCEL_REASON &&
                                            masterLookupDataRef?.current?.INVOICE_CANCEL_REASON?.map((reason, index) => (
                                                <option key={index} value={reason?.code}>{reason?.description}</option>
                                            ))}
                                    </select>
                                    {errors?.reason && <span className="errormsg">{errors.reason.message}</span>}
                                </div>
                            </div>
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label for="Contactpreferenece" className="control-label">Remarks</label>
                                    <textarea className="form-control" onChange={handleOnChange} value={inputsDetails?.remarks ?? ''} maxLength="2500" id="remarks" name="remarks" rows="4"></textarea>
                                    <span>Maximum 2500 characters</span>
                                </div>
                            </div>
                        </div>
                        <div className='skel-btn-center-cmmn'>
                            <button type="button" className="skel-btn-cancel" onClick={handleOnClose}>Cancel</button>
                            <button className='skel-btn-submit'>Submit</button>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer style={{ display: 'block' }}>
                    <div className="skel-btn-center-cmmn">

                    </div>
                </Modal.Footer>
            </Modal>
        </>

    )
}



export default PaymentHistory

export const PaymentHistoryColumns = [
    {
        Header: "Cancel Payment",
        accessor: "cancelPayment",
        disableFilters: true,
        id: 'cancelPayment'
    },
    {
        Header: "Payment Receipt Number",
        accessor: "paymentId",
        disableFilters: true,
        id: 'paymentId'
    },
    {
        Header: "Customer Number",
        accessor: "customerNo",
        disableFilters: true,
        id: 'customerNumber'
    },
    {
        Header: "Customer Name",
        accessor: "customerName",
        disableFilters: true,
        id: 'customerName'
    },
    {
        Header: "Biilable Reference Number",
        accessor: "billRefNo",
        disableFilters: true,
        id: 'billRefNo'
    },
    {
        Header: "Payment Date",
        accessor: "createdAt",
        disableFilters: true,
        id: 'createdAt'
    },
    {
        Header: "Currency",
        accessor: "currencyDesc.description",
        disableFilters: true,
        id: 'currency'
    },
    {
        Header: "Amount Paid",
        accessor: "paymentAmount",
        disableFilters: true,
        id: 'paymentAmount'
    },
    {
        Header: "Payment Captured By",
        accessor: "createdBy",
        disableFilters: true,
        id: 'createdBy'
    },
    {
        Header: "Payment Mode",
        accessor: "paymentModeDesc.description",
        disableFilters: true,
        id: 'paymentMode'
    },
    {
        Header: "Reference Number",
        accessor: "refNo",
        disableFilters: true,
        id: 'refNo'
    },
    {
        Header: "Reference Date",
        accessor: "refDate",
        disableFilters: true,
        id: 'refDate'
    },
    {
        Header: "Reference Name",
        accessor: "refName",
        disableFilters: true,
        id: 'refName'
    }, {
        Header: "Cancelled Date",
        accessor: "cancelledDate",
        disableFilters: true,
        id: 'cancelledDate'
    }, {
        Header: "Cancelled By",
        accessor: "cancelledBy",
        disableFilters: true,
        id: 'cancelledBy'
    }, {
        Header: "Cancelled Reason",
        accessor: "cancelledReasondesc.description",
        disableFilters: true,
        id: 'cancelledReasondesc'
    }, {
        Header: "Cancelled Remarks",
        accessor: "cancelledRemarks",
        disableFilters: true,
        id: 'cancelledRemarks'
    }
]