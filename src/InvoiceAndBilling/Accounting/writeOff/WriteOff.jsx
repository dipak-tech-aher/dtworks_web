import React, { useEffect, useState, useRef } from 'react'
import Modal from 'react-modal'
import { toast } from 'react-toastify';
import { hideSpinner, showSpinner } from '../../../common/spinner';
import { post } from '../../../common/util/restUtil';
import { properties } from '../../../properties';
import DynamicTable from '../../../common/table/DynamicTable';
import moment from 'moment'
import { formFilterObject, USNumberFormat, RegularModalCustomStyles } from '../../../common/util/util';
import { unstable_batchedUpdates } from 'react-dom';

const WriteOff = (props) => {

    const setIsOpen = props.handler.setIsOpen
    const pageRefresh = props?.handler?.pageRefresh
    const isOpen = props.data.isOpen
    const { billRefNo, customerId, customerName, customerUuid } = props.data
    const [invoice, setInvoice] = useState([])

    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(false);
    const isTableFirstRender = useRef(true);

    const initialValues = {
        billRefNo,
        customerId,
        customerName,
        invOsAmt: 0,
        remarks: "",
        invoiceId: []
    }
    const [writeOffData, setwriteOffData] = useState(initialValues)

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleOnWriteOffInputsChange = (e) => {
        const { target } = e;
        setwriteOffData({
            ...writeOffData,
            [target.id] : target.value
        })
    }
    useEffect(() => {
        const requestBody = {
            billRefNo,
            customerUuid
        }
        showSpinner()
        post(`${properties.INVOICE_API}/search?limit=${perPage}&page=${currentPage}`, requestBody)
            .then((response) => {
                if (response.status === 200) {
                    let { rows, count } = response?.data
                    rows.map((row) => {
                        row.select = 'N'
                        return row
                    })
                    unstable_batchedUpdates(() => {
                        setInvoice(rows.filter((inv) => inv.invoiceStatus !== 'CLOSED'));
                        setTotalCount(count)
                    })
                }
            })
            .catch((error) => {
                toast.error("Error while getting Invoice List", error)
            })
            .finally(() => {
                hideSpinner()
            })
    }, [])

    const handleOnSubmit = () => {
        const requestBody = {
            billRefNo,
            customerId,
            customerName,
            invoiceId: [],
            remarks: writeOffData.remarks
        }
        const invoiceIds = []
        invoice && invoice.map((inv) => {
            if (inv.select === 'Y') {
                invoiceIds.push(inv.invoiceId)
            }
        })
        if(invoiceIds.length === 0) {
            toast.error('Please Select the Invoice')
            return
        }
        requestBody.invoiceId = invoiceIds

        showSpinner()
        
        console.log('---->', requestBody)
        post(properties.WRITE_OFF_API, requestBody)
            .then((response) => {
                if (response.status === 200) {
                    toast.success("Write Off Applied Successfully")
                    setIsOpen(false)
                    pageRefresh()
                }
            })
            .catch((error) => {
                console.log(error)
            })
            .finally(hideSpinner)

    }
    const handleOnCancel = () => {
        setwriteOffData([])
        setInvoice([])
        setIsOpen(false)
    }
    const handleCellRender = (cell, row) => {

        if (cell.column.Header === "Select") {
            return (<>
                <div className="form-check">
                    <input id={`mandatory${row.original.invoiceId}`} className="form-check-input position-static checkmark"
                        type="checkbox" checked={cell.value === "Y" ? true : false} value={cell.value}
                        onChange={(e) => { handleSelect(e, row.original) }}
                    />
                </div>
            </>
            )
        } else if (cell.column.Header === "Sales Order Number") {
            let no = row?.original?.invoiceDetails && row?.original?.invoiceDetails[0]?.monthlyContractDet && row?.original?.invoiceDetails[0]?.monthlyContractDet?.soNumber
            return (<span>{no}</span>)
        } else if (cell.column.Header === "Invoice Date" || cell.column.Header === "Due Date") {
            return (<span>{cell.value && cell.value !== null ? moment(cell.value).format('DD MMM YYYY') : '-'}</span>
            )
        } else if (cell.column.Header === "Invoice O/S Amount" || cell.column.Header === "Invoice Amount") {
            return (
                <span>{cell.value && cell.value !== null ? USNumberFormat(cell.value) : USNumberFormat(0)}</span>
            )
        } else {
            return (<span>{cell.value}</span>)
        }
    }

    const handleSelect = (e, data) => {
        setInvoice(
            invoice.map((c) => {
                if (Number(c?.invoiceId) === Number(data?.invoiceId)) {
                    console.log('coming eee', e.target.checked)
                    if (e.target.checked === true) {
                        c.select = 'Y'
                    } else if (e.target.checked === false) {
                        c.select = 'N'
                    }
                }
                return c
            })
        )
    }

    useEffect(() => {
        let totalInvAmt = 0
        console.log(invoice)
        invoice.map((c) => {
            if (c.select === 'Y') {
                totalInvAmt = totalInvAmt + Number(c.invOsAmt)
            } 
        })
        setwriteOffData({
            ...writeOffData,
            invOsAmt: totalInvAmt
        })
    },[invoice])

    return (
        <Modal isOpen={isOpen} contentLabel="Worflow History Modal" style={RegularModalCustomStyles}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Write Off Invoice</h5>
                        <button type="button" className="close" onClick={() => { setIsOpen(false) }}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </div>
                    <div className="p-2">
                        <div className="scheduler-border">
                            <div className="row">
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="customerName" className="col-form-label">Customer Name</label>
                                        <input type="text" className="form-control" id="customerName" value={writeOffData.customerName} disabled />
                                    </div>
                                </div>

                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="invOsAmt" className="col-form-label">Invoice Outstanding Amount</label>
                                        <input type="text" className="form-control" id="invOsAmt" value={Number(writeOffData.invOsAmt).toFixed(2)} disabled />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="remarks" className="col-form-label">Reason</label>
                                        <textarea id="remarks" className="form-control" value={writeOffData.remarks}
                                            onChange={(e) => { handleOnWriteOffInputsChange(e) }}
                                        >
                                        </textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="adjusment modal-body">
                                {
                                    <>
                                        <div className="row">
                                            <section className="triangle col-12 pb-2">
                                                <div className="row col-12">
                                                    <div className="col-12">
                                                        <h4 id="" className="pl-3">Invoice</h4>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                        <div className="col-12 card-box m-0 ">
                                            {
                                                invoice && !!invoice.length ?
                                                    <div className="">
                                                        <DynamicTable
                                                            listKey={"Invoice List"}
                                                            row={invoice}
                                                            rowCount={totalCount}
                                                            header={InvoiceSearchColumns}
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
                                                    <span className="skel-widget-warning">No Invoice Available</span>
                                            }
                                        </div>
                                    </>
                                }
                            </div>
                            <div className="flex-row pre-bill-sec">
                                <div className="col-12 p-1">
                            <div id="customer-buttons" className="d-flex justify-content-center">
                                
                                        <button type="button" className="skel-btn-cancel" onClick={handleOnCancel}>Cancel</button>
                                        <button type="button" className="skel-btn-submit" onClick={handleOnSubmit}>Submit</button>
                                    </div>
                                </div>
                            </div>
                </div>
            </div>
        </Modal>
    )
}

export default WriteOff

export const InvoiceSearchColumns = [
    {
        Header: "Select",
        accessor: "select",
        disableFilters: true,
    },
    {
        Header: "Invoice No",
        accessor: "invNo",
        disableFilters: true
    },
    // {
    //     Header: "Order Number",
    //     accessor: "orderNo",
    //     disableFilters: true
    // },
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
    },
]
