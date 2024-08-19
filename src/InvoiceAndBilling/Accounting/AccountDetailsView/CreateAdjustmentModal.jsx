import React, { useEffect, useState, useRef } from 'react'
import Modal from 'react-modal'
import ContractAjustmentForm from './ContractAdjustmentForm'
import { string, object } from "yup";
import { toast } from 'react-toastify';

import { post } from '../../../common/util/restUtil';
import { properties } from '../../../properties';
import { unstable_batchedUpdates } from 'react-dom';
import { ContractSerachCols, ContractDetailCols, ContractDetailEditCols } from '../../Contract/contractSerachCols';
import DynamicTable from '../../../common/table/DynamicTable';
import moment from 'moment'
import { formFilterObject, RegularModalCustomStyles, USNumberFormat } from '../../../common/util/util';
import { InvoiceSearchColumns } from '../../Invoice/InvoiceSearchColumns';
import { InvoiceDetailListColumns } from '../../Invoice/InvoiceTables/InvoiceDetailList';

const CreateAdjustmentModal = (props) => {

    console.log('props?.data ', props?.data)
    const setIsOpen = props?.handler?.setIsOpen
    const pageRefresh = props?.handler?.pageRefresh
    const isOpen = props?.data?.isOpen
    const accountData = props?.data?.accountData
    const customerData = accountData?.[0].customerData
    const initialState = {
        adjustmentCat: "",
        adjustmentPeriod: moment().format('YYYY-MM-DD'),
        adjustmentType: "",
        adjustmentImmediate: "N",
        reason: "",
        maxAdjAmount: 0,
        adjAmount: "",
        remarks: "",
        billRefNo: accountData[0].billRefNo,
        contractId: []
    }
    const contractHiddenColumns = useRef(null)
    const contractDetailHiddenColumns = useRef(null)
    const [adjustmentInputs, setAdjustmentInputs] = useState(initialState);
    const [adjustmentInputsErrors, setAdjustmentInputsErrors] = useState({});

    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(false);
    const isTableFirstRender = useRef(true);
    const [amountRefresh, setAmountRefresh] = useState(false)
    const [contract, setContract] = useState([])
    const [contractDetail, setContractDetail] = useState([])

    const AdjustmentValidationSchema = object().shape({
        adjustmentCat: string().required("Adjustment Category is required"),
        billRefNo: string().required("Billable Reference Number is required"),
        reason: string().required("Reason is required"),
        adjustmentType: string().required("Adjustment Type is required"),
        maxAdjAmount: string().required("Maximum Adjustment Amount is required"),
        adjAmount: string().required("Adjustment Amount is required")
    });
    const [selectedRecordId, setSelectedRecordId] = useState('')
    const validate = (schema, data) => {
        try {
            setAdjustmentInputsErrors({});
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                setAdjustmentInputsErrors((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    };

    useEffect((fromCallback = false) => {
        console.log('customerData ', customerData)
        const requestBody = {
            // billRefNo: customerData.customerNo,
            customerUuid: customerData?.customerUuid
        }
        let adjUrl
        if (adjustmentInputs.adjustmentCat === 'PREBILL') {
            adjUrl = `${properties.CONTRACT_API}/monthly/search?limit=${perPage}&page=${fromCallback ? 0 : Number(currentPage)}${adjustmentInputs.adjustmentCat === 'PREBILL' ? '&type=UNBILLED' : ''}`
        } else if (adjustmentInputs.adjustmentCat === 'POSTBILL') {
            adjUrl = `${properties.INVOICE_API}/search?limit=${perPage}&page=${fromCallback ? 0 : Number(currentPage)}`
        }
        contractHiddenColumns.current = ['edit', 'startDate', 'endDate', 'nextBillPeriod', 'lastBillPeriod', 'status', 'contractRefId', 'chargeName', 'totalCharge', 'itemName', 'serviceNumber', 'billPeriod']
        contractDetailHiddenColumns.current = ['lastBillPeriod', 'nextBillPeriod', 'contractRefId', 'totalCharge', 'status', 'remove', 'edit', 'billPeriod', 'balanceAmount']
        if (adjustmentInputs.adjustmentCat !== '') {
            post(adjUrl, requestBody)
                .then((response) => {
                    if (response.data) {
                        let { rows, count } = response.data;
                        rows.map((row) => {
                            row.select = 'N'
                            return row
                        })
                        unstable_batchedUpdates(() => {
                            setTotalCount(count);
                            if (adjustmentInputs.adjustmentCat === 'PREBILL') {
                                setContract(rows.filter((con) => ['UNBILLED', 'PENDING'].includes(con.status)));
                            } else {
                                setContract(rows.filter((con) => con.invoiceStatus === 'OPEN'));
                            }
                            setContractDetail([])
                        })
                    }
                })
                .catch((error) => {
                    console.log(error)
                })
                .finally()
        }

    }, [adjustmentInputs.adjustmentCat, adjustmentInputs.adjustmentPeriod, currentPage, perPage])

    useEffect(() => {
        let amount = 0
        contract && !!contract.length && contract.map((c) => {
            if (c.select === 'Y') {
                if (adjustmentInputs.adjustmentCat === 'PREBILL') {
                    c?.monthlyContractDtl && !!c?.monthlyContractDtl.length && c?.monthlyContractDtl.map((monC) => {
                        amount += Number(monC.chargeAmt)
                    })
                } else if (adjustmentInputs.adjustmentCat === 'POSTBILL') {
                    c?.invoiceDetails && !!c?.invoiceDetails.length && c?.invoiceDetails.map((monC) => {
                        amount += Number(monC.invOsAmt)
                    })
                }

            }
        })
        setAdjustmentInputs({ ...adjustmentInputs, maxAdjAmount: Number(amount) })
    }, [contract, amountRefresh])

    useEffect(() => {
        if (contractDetail && contractDetail.length > 0) {
            let amount = 0
            let selected = false
            contractDetail?.length && contractDetail?.map((monC) => {
                if (monC.select === 'Y') {
                    selected = true
                    if (adjustmentInputs.adjustmentCat === 'PREBILL') {
                        amount += Number(monC.chargeAmt)
                    } else if (adjustmentInputs.adjustmentCat === 'POSTBILL') {
                        amount += Number(monC.invOsAmt)
                    }
                }
            })
            if (selected === true) {
                setAdjustmentInputs({ ...adjustmentInputs, maxAdjAmount: Number(amount) })
            }
            else {
                setAmountRefresh(!amountRefresh)
            }
        }
    }, [contractDetail])

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleOnSubmit = () => {
        if (validate(AdjustmentValidationSchema, adjustmentInputs)) {
            toast.error("Validation Errors Found")
            return;
        }
        const headerInfo = []
        const lineItemInfo = []
        const contractId = []
        const contractDtlId = []
        for (const record of contract) {
            if (adjustmentInputs.adjustmentCat === 'PREBILL') {
                if (Number(record.monthlyContractId) === Number(selectedRecordId)) {
                    contractId.push(record.contractId)
                }
            } else if (adjustmentInputs.adjustmentCat === 'POSTBILL') {
                if (Number(record.invoiceId) === Number(selectedRecordId)) {
                    contractId.push(record.contractId)
                }
            }
            if (contractId.length !== 0) {
                headerInfo.push(record)
                break;
            }
        }

        if (contractId.length === 0) {
            toast.error(`Please Select the ${adjustmentInputs.adjustmentCat === 'PREBILL' ? 'Contract' : 'Invoice'}`)
            return
        }
        contractDetail && !!contractDetail.length && contractDetail.map((c) => {
            if (c.select === 'Y') {
                contractDtlId.push(Number(c.contractDtlId))
                lineItemInfo.push(c)
            }
        })
        if (contractDtlId.length === 0) {
            toast.error(`Please Select the ${adjustmentInputs.adjustmentCat === 'PREBILL' ? 'Contract Detail' : 'Invoice Detail'}`)
            return
        }
        let body = {
            ...adjustmentInputs,
            contractId: contractId,
            contractDtlId: contractDtlId,
            mappingPayload: { headerInfo, lineItemInfo }
        }

     
        post(properties.ADJUSTMENT_API, body)
            .then((resp) => {
                if (resp.status === 200) {
                    toast.success("Adjustment added successfully")
                    unstable_batchedUpdates(() => {
                        setIsOpen(false)
                        pageRefresh()
                    })
                }
            })
            .catch((error) => {
                console.log("error", error)
            })
            .finally()
    }

    const handleOnClear = () => {
        setSelectedRecordId('')
        setAdjustmentInputs(initialState)
        setContract([])
        setContractDetail([])
    }

    const handleContractAdjustment = (e, data) => {
        unstable_batchedUpdates(() => {
            setSelectedRecordId(data?.monthlyContractId)
            const list =
                setContractDetail(data?.monthlyContractDtl.map((dtl) => { return { ...dtl, select: 'N' } }))
        })
    }

    const handleContractDetailAdjustment = (e, data) => {
        setContractDetail(
            contractDetail.map((c) => {
                if (Number(c?.monthlyContractDtlId) === Number(data?.monthlyContractDtlId)) {
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

    const handleInvoiceAdjustment = (e, data) => {
        unstable_batchedUpdates(() => {
            setSelectedRecordId(data?.invoiceId)
            const list = data?.invoiceDetails.filter((con) => con.invoiceStatus === 'OPEN')
            setContractDetail(list.map((dtl) => { return { ...dtl, select: 'N' } }))
        })
    }

    const handleInvoiceDetailAdjustment = (e, data) => {
        setContractDetail(
            contractDetail.map((c) => {
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

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Select") {
            return (
                <div className="form-check">
                    <input id={`mandatory${row.original.monthlyContractId}`} className="form-check-input position-static checkmark" type="radio" name="selectedRecordId" style={{ cursor: "pointer" }}
                        checked={(Number(row.original.monthlyContractId) === Number(selectedRecordId))}
                        onChange={(e) => { handleContractAdjustment(e, row.original) }}
                    />
                </div>
            )
        }
        else if (cell.column.Header === "Status") {
            return (
                <span>{row?.original?.statusDesc?.description}</span>
            )
        }
        else if (cell.column.Header === "Contract Start Date" || cell.column.Header === "Contract End Date" || cell.column.Header === "Last Bill Period" || cell.column.Header === "Next Bill Period") {
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
        else if (cell.column.Header === "MRR" || cell.column.Header === "NRR" || cell.column.Header === "Usage" || cell.column.Header === "Credit Adjustment" || cell.column.Header === "Debit Adjustment" || cell.column.Header === "Total Charge") {
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
        else if (cell.column.Header === "Sales Order Number") {
            return (
                <span>{row?.original?.monthlyContractDtl && row?.original?.monthlyContractDtl[0]?.soNumber}</span>
            )
        }
        else if (['Updated At', 'Created At'].includes(cell.column.Header)) {
            return (<span>{cell.value ? moment(cell.value).format('DD MMM YYYY hh:mm:ss A') : '-'}</span>)
        }
        else if (cell.column.Header === "Created By") {
            return (<span>{row?.original?.createdByName?.firstName + " " + row?.original?.createdByName?.lastName}</span>)
        }
        else if (cell.column.Header === "Updated By") {
            return (<span>{(row?.original?.updatedByName?.firstName || '') + " " + (row?.original?.updatedByName?.lastName||'')}</span>)
        }
        else {
            return (
                <span>{cell.value}</span>
            )
        }
    }

    const handleCellRenderDetail = (cell, row) => {

        if (cell.column.Header === "Select") {
            return (
                <div className="form-check">
                    <input id={`mandatory${row.original.monthlyContractDtlId}`} className="form-check-input position-static checkmark" type="checkbox" checked={cell.value === "Y" ? true : false} value={cell.value}
                        onChange={(e) => { handleContractDetailAdjustment(e, row.original) }}
                    />
                </div>
            )
        }
        else if (cell.column.Header === "Last Bill Period" || cell.column.Header === "Next Bill Period" || cell.column.Header === "Bill Period") {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY') : '-'}</span>
            )
        }
        // else if (cell.column.Header === "Contract Start Date" || cell.column.Header === "Contract End Date") {
        //     return (
        //         <span>{cell.value ? moment(cell.value).format('DD MMM YYYY') : '-'}</span>
        //     )
        // }
        else if (["Contract Start Date"].includes(cell.column.Header)) {
            let startDate = row?.original?.omsStartDate ? row?.original?.omsStartDate : cell.value
            return (
                <span>{startDate ? moment(startDate).format('DD MMM YYYY') : '-'}</span>
            )
        }
        else if (["Contract End Date"].includes(cell.column.Header)) {
            let endDate = row?.original?.omsEndDate ? row?.original?.omsEndDate : cell.value
            return (
                <span>{endDate ? moment(endDate).format('DD MMM YYYY') : '-'}</span>
            )
        }
        else if (cell.column.Header === "Duration") {
            let duration = row?.original?.omsDurationMonth ? row.original.omsDurationMonth : cell.value
            return (
                <span>{duration}</span>
            )
        }
        // else if (cell.column.Header === "Actual Start Date" || cell.column.Header === "Contract Start Date") {
        //     let date = row?.original?.actualStartDate
        //     return (
        //         <span>{date ? moment(date).format('DD MMM YYYY') : '-'}</span>
        //     )
        // }
        // else if (cell.column.Header === "Actual End Date") {
        //     return (
        //         <span>{cell.value ? moment(cell.value).format('DD MMM YYYY') : '-'}</span>
        //     )
        // }
        // else if (cell.column.Header === "Contract End Date" || cell.column.Header === "End Date") {
        //     let date = row?.original?.endDate
        //     return (
        //         <span>{date ? moment(date).format('DD MMM YYYY') : '-'}</span>
        //     )
        // }
        else if (cell.column.Header === "Billable Reference Number") {
            let billRefNo = accountData[0]?.billRefNo
            return (
                <span>{billRefNo}</span>
            )
        }
        else if (cell.column.Header === "Status") {
            return (
                <span>{row?.original?.statusDesc?.description}</span>
            )
        }
        else if (cell.column.Header === "RC" || cell.column.Header === "OTC" || cell.column.Header === "Usage" || cell.column.Header === "Credit Adjustment" || cell.column.Header === "Debit Adjustment" || cell.column.Header === "Total Amount" || cell.column.Header === "Price Per Unit") {
            return (
                <span>{USNumberFormat(cell.value)}</span>
            )
        }
        else if (cell.column.Header === "Balance Amount") {
            return (
                <span>{row?.original?.chargeType === 'CC_USGC' ? "" : USNumberFormat(cell.value)}</span>
            )
        }
        else if (cell.column.Header === "Prorated") {
            return (
                <span>{cell.value === 'Y' ? 'Yes' : cell.value === 'N' ? 'No' : '-'}</span>
            )
        }
        else if (cell.column.Header === "Charge Name") {
            return (
                <span>{row?.original?.charge?.chargeName ? row?.original?.charge?.chargeName : row?.original?.chargeName}</span>
            )
        }
        else if (cell.column.Header === "Charge Type") {
            return (
                <span>{row?.original?.charge?.chargeCat ? row?.original?.charge?.chargeCatDesc?.description : row?.original?.chargeTypeDesc?.description}</span>
            )
        }
        else if (cell.column.Header === "Fee Type") {
            let frequency = row?.original?.frequencyDesc?.description
            return (
                <span>{frequency || "-"}</span>
            )
        }
        else if (cell.column.Header === "Service Number") {
            let sNo = row?.original?.identificationNo
            return (
                <span>{sNo}</span>
            )
        }
        else if (['Updated At', 'Created At'].includes(cell.column.Header)) {
            return (<span>{cell.value ? moment(cell.value).format('DD MMM YYYY hh:mm:ss A') : '-'}</span>)
        }
        else if (cell.column.Header === "Created By") {
            return (<span>{row?.original?.createdByName?.firstName + " " + row?.original?.createdByName?.lastName}</span>)
        }
        else if (cell.column.Header === "Updated By") {
            return (<span>{row?.original?.updatedByName?.firstName + " " + row?.original?.updatedByName?.lastName}</span>)
        }
        else {
            return (
                <span>{cell.value}</span>
            )
        }
    }

    const handleInvoiceCellRender = (cell, row) => {
        if (cell.column.Header === "Select") {
            return (
                <div className="form-check">
                    <input id={`mandatory${row.original.invoiceId}`} className="form-check-input position-static checkmark" type="radio" name="selectedRecordId" style={{ cursor: "pointer" }}
                        checked={(Number(row.original.invoiceId) === Number(selectedRecordId))}
                        onChange={(e) => { handleInvoiceAdjustment(e, row.original) }}
                    />
                </div>
            )
        } else if (cell.column.Header === "Sales Order Number") {
            let no = row?.original?.invoiceDetails && row?.original?.invoiceDetails[0]?.monthlyContractDet && row?.original?.invoiceDetails[0]?.monthlyContractDet?.soNumber
            return (
                <span>{no}</span>
            )
        }
        else if (cell.column.Header === "Invoice No") {
            return (
                <span>{cell.value}</span>
            )
        }
        else if (cell.column.Header === "Invoice Start Date" || cell.column.Header === "Invoice End Date" || cell.column.Header === "Invoice Date" || cell.column.Header === "Due Date") {
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
                <span>{USNumberFormat(cell.value)}</span>
            )
        }
        else if (cell.column.Header === "Invoice Status") {
            return (
                <span>{cell.value}</span>
            )
        }
        else {
            return (
                <span>{cell.value}</span>
            )
        }
    }

    const handleInvoiceDetailCellRender = (cell, row) => {
        if (cell.column.Header === "Select") {
            return (
                <div className="form-check">
                    <input id={`mandatory${row.original.invoiceDtlId}`} className="form-check-input position-static checkmark" type="checkbox" checked={cell.value === "Y" ? true : false} value={cell.value}
                        onChange={(e) => { handleInvoiceDetailAdjustment(e, row.original) }}
                    />
                </div>
            )
        }
        else if (cell.column.Header === "Billable Reference Number") {
            let billRefNo = contract[0].billRefNo
            return (
                <span>{billRefNo}</span>
            )
        }
        else if (cell.column.Header === "Invoice Start Date" || cell.column.Header === "Invoice End Date") {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY') : '-'}</span>
            )
        }
        else if (cell.column.Header === "Charge Amount" || cell.column.Header === "Credit Adjustment" || cell.column.Header === "Debit Adjustment" || cell.column.Header === "Invoice O/S Amount" || cell.column.Header === "Invoice Amount") {
            return (
                <span>{USNumberFormat(cell.value)}</span>
            )
        }
        else if (cell.column.Header === "Fee Type") {
            let frequency = row?.original?.monthlyContractDet?.frequencyDesc?.description
            return (
                <span>{frequency || "-"}</span>
            )
        }
        else if (cell.column.Header === "Charge Name") {
            return (
                <span>{row?.original?.contractDetail?.charge?.chargeName ? row?.original?.contractDetail?.charge?.chargeName : row?.original?.contractDetail?.chargeName}</span>
            )
        }
        else if (cell.column.Header === "Prorated") {
            return (
                <span>{row?.original?.monthlyContractDet?.prorated === 'Y' ? 'Yes' : row?.original?.monthlyContractDet?.prorated === 'N' ? 'No' : '-'}</span>
            )
        }
        else if (cell.column.Header === "Contract Name") {
            let sNo = row?.original?.contractDetail?.itemName
            return (
                <span>{sNo}</span>
            )
        }
        else {
            return (
                <span>{cell.value}</span>
            )
        }
    }

    return (
        <>
            <Modal isOpen={isOpen} contentLabel="Worflow History Modal" style={RegularModalCustomStyles}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Create Adjustment</h5>
                            <button type="button" className="close" onClick={() => { setIsOpen(false) }}>
                                <span aria-hidden="true">×</span>
                            </button>
                        </div>
                        <div className="p-2">
                            <fieldset className="scheduler-border">
                                <div className="row">
                                    <div className="col-4">
                                        <div className="form-group">
                                            <label htmlFor="adjustmentCat" className="col-form-label">Adjustment Category<span>*</span></label>
                                            <select id="adjustmentCat" className="form-control" value={adjustmentInputs.adjustmentCat}
                                                onChange={(e) => {
                                                    setContract([]);
                                                    setContractDetail([])
                                                    setAdjustmentInputs({ ...adjustmentInputs, adjustmentCat: e.target.value })
                                                    setAdjustmentInputsErrors({ ...adjustmentInputsErrors, adjustmentCat: "" })
                                                }}
                                            >
                                                <option value="">Select Adjustment Category</option>
                                                <option value="PREBILL">Prebill</option>
                                                <option value="POSTBILL">Postbill</option>
                                            </select>
                                            <span className="errormsg">{adjustmentInputsErrors.adjustmentCat ? adjustmentInputsErrors.adjustmentCat : ""}</span>
                                        </div>
                                    </div>
                                    {
                                        adjustmentInputs.adjustmentCat === 'POSTBILL' &&
                                        <div className="col-4 d-none">
                                            <div className="form-group">
                                                <label htmlFor="adjustmentPeriod" className="col-form-label">Adjustment Period</label>
                                                <input type="date" className="form-control" id="adjustmentPeriod" placeholder="" value={adjustmentInputs.adjustmentPeriod}
                                                    onChange={(e) => { setAdjustmentInputs({ ...adjustmentInputs, adjustmentPeriod: e.target.value }) }}
                                                />
                                            </div>
                                        </div>
                                    }
                                </div>
                            </fieldset>
                        </div>
                        {
                            adjustmentInputs.adjustmentCat !== '' &&
                            <>
                                <div className="pl-3">
                                    <div className="row">
                                        <section className="triangle col-12">
                                            <div className="row col-12">
                                                <div className="col-12">
                                                    <h4 className="pl-3">{adjustmentInputs.adjustmentCat === 'PREBILL' ? 'Contract' : adjustmentInputs.adjustmentCat === 'POSTBILL' ? 'Invoice' : ''}</h4>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                    <div className="col-md-12 card-box m-0 ">
                                        {
                                            contract && !!contract.length &&
                                            <div className="card">
                                                {
                                                    adjustmentInputs.adjustmentCat === 'PREBILL' ?
                                                        <DynamicTable
                                                            listKey={"Contract List"}
                                                            row={contract}
                                                            rowCount={totalCount}
                                                            header={ContractSerachCols}
                                                            itemsPerPage={perPage}
                                                            backendPaging={true}
                                                            backendCurrentPage={currentPage}
                                                            isTableFirstRender={isTableFirstRender}
                                                            hiddenColumns={contractHiddenColumns.current}
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
                                                        :
                                                        <DynamicTable
                                                            listKey={"Invoice List"}
                                                            row={contract}
                                                            rowCount={totalCount}
                                                            header={InvoiceSearchColumns}
                                                            itemsPerPage={perPage}
                                                            backendPaging={true}
                                                            backendCurrentPage={currentPage}
                                                            isTableFirstRender={isTableFirstRender}
                                                            hiddenColumns={['invoicePdf']}
                                                            exportBtn={exportBtn}
                                                            handler={{
                                                                handleCellRender: handleInvoiceCellRender,
                                                                handlePageSelect: handlePageSelect,
                                                                handleItemPerPage: setPerPage,
                                                                handleCurrentPage: setCurrentPage,
                                                                handleFilters: setFilters,
                                                                handleExportButton: setExportBtn
                                                            }}
                                                        />
                                                }

                                            </div>
                                        }
                                    </div>
                                </div>
                                <div className="pl-3">
                                    <div className="row">
                                        <section className="triangle col-12">
                                            <div className="row col-12">
                                                <div className="col-12">
                                                    <h4 className="pl-3">{adjustmentInputs.adjustmentCat === 'PREBILL' ? 'Contract' : adjustmentInputs.adjustmentCat === 'POSTBILL' ? 'Invoice' : ''} Details</h4>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                    <div className="col-md-12 card-box m-0 ">
                                        {
                                            contractDetail && !!contractDetail.length &&
                                            <div className="card">
                                                {
                                                    adjustmentInputs.adjustmentCat === 'PREBILL' ?
                                                        <DynamicTable
                                                            listKey={"Contract Detail List"}
                                                            row={contractDetail}
                                                            header={ContractDetailEditCols}
                                                            itemsPerPage={perPage}
                                                            hiddenColumns={contractDetailHiddenColumns.current}
                                                            exportBtn={exportBtn}
                                                            handler={{
                                                                handleCellRender: handleCellRenderDetail,
                                                                handleExportButton: setExportBtn
                                                            }}
                                                        />
                                                        :
                                                        <DynamicTable
                                                            listKey={"Invoice Details List"}
                                                            row={contractDetail}
                                                            header={InvoiceDetailListColumns}
                                                            itemsPerPage={10}
                                                            hiddenColumns={[]}
                                                            exportBtn={exportBtn}
                                                            handler={{
                                                                handleCellRender: handleInvoiceDetailCellRender,
                                                                handleExportButton: setExportBtn
                                                            }}
                                                        />
                                                }
                                            </div>
                                        }
                                    </div>
                                </div>
                                {
                                    <ContractAjustmentForm
                                        data={{
                                            adjustmentInputs: adjustmentInputs,
                                            accountData: accountData,
                                            adjustmentInputsErrors: adjustmentInputsErrors
                                        }}
                                        handler={{
                                            setAdjustmentInputs: setAdjustmentInputs,
                                            setAdjustmentInputsErrors: setAdjustmentInputsErrors
                                        }}
                                    />
                                }
                                <div className="flex-row pre-bill-sec">
                                    <div className="col-12 p-1">
                                        <div id="customer-buttons" className="d-flex justify-content-center">
                                            <button type="button" className="btn btn-primary btn-sm waves-effect waves-light ml-2" onClick={handleOnSubmit}>Submit</button>
                                            <button type="button" className="btn btn-primary btn-sm waves-effect waves-light ml-2" onClick={handleOnClear}>Clear</button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        }
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default CreateAdjustmentModal