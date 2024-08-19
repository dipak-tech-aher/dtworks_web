import React, { useEffect, useRef, useState } from 'react'
import Chart from './Chart'
import { properties } from '../../../../../properties';
import { post } from '../../../../../common/util/restUtil';
import moment from 'moment';
import { unstable_batchedUpdates } from 'react-dom';
import { RegularModalCustomStyles } from '../../../../../common/util/util';
import Modal from 'react-modal';
import { HelpdeskColumns } from '../Columns';
import DynamicTable from '../../../../../common/table/DynamicTable';
import { toast } from 'react-toastify';
import { useHistory }from '../../../../../common/util/history';
export default function HelpdeskStatement7Days(props) {
    const history = useHistory()

    let helpdeskNo = props?.data?.detailedViewItem?.helpdeskNo;
    const [ChartData, SetChartData] = useState({})
    const [isOpen, setIsOpen] = useState(false)
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [avgDays, setavgDays] = useState({});
    const tableRef = useRef(true);
    const [filters, setFilters] = useState([]);
    const [tablelist, SetTableList] = useState([])
    const [status, setStatus] = useState('')
    const [totalCount, setTotalCount] = useState(0);
    useEffect(() => {
        if (helpdeskNo) {
            getChartData();
        }
    }, [helpdeskNo]);
    const getChartData = () => {
        try {
            let requestBody = {
                "searchParams": {
                    "mode": "COUNT",
                    helpdeskNo
                }
            }
            post(properties.HELPDESK_API + '/get/helpdesk/statement', requestBody)
                .then((response) => {
                    const { data } = response;
                    unstable_batchedUpdates(() => {
                        if (data && Object.keys(data?.data).length > 0) {
                            SetChartData(data?.data)
                        }
                        setavgDays(data?.avgturnArroud)
                        // setavgDays(data?.avgDays && Number(data?.avgDays) >=0 ? data?.avgDays : 0)
                    })

                })
                .catch(error => {
                    console.error(error);
                })
                .finally()
        } catch (e) {
            console.log('error', e)
        }
    }
    const getList = () => {
        try {
            const requestBody = {
                "searchParams": {
                    "mode": "LIST",
                    "status": status === 'ALL' ? '' : status,
                    helpdeskNo,
                    'limit': perPage,
                    page: currentPage
                }
            }
            post(`${properties.HELPDESK_API}/get/helpdesk/statement`, requestBody)
                .then((response) => {
                    const { status, data = {} } = response;
                    if (status === 200) {
                        unstable_batchedUpdates(() => {
                            SetTableList(data?.data?.rows || [])
                            setTotalCount(data?.data?.count ?? 0)
                            setIsOpen(true)
                            setavgDays(data?.avgturnArroud)
                            // setavgDays(data?.avgDays && Number(data?.avgDays) >=0 ? data?.avgDays : 0)
                        })
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally();
        } catch (e) {
            console.log('error', e)
        }
    }
    useEffect(() => {
        if (status) {
            getList()
        }
    }, [status, perPage, currentPage])
    const HelpdeskToggle = (count, type) => {
        if (!count) {
            toast.warn('No records found')
            return
        }
        console.log(count, type)
        setStatus(type);
    }
    const handleCellLinkClick = (event, rowData) => {
        history(`/view-helpdesk`, {
            state: {data: rowData}
        })
    }
    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Helpdesk Number") {
            return (<span className="text-secondary cursor-pointer" title={row?.original?.helpdeskSubject ?? ''} onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        }else if (cell.column.id === "createdAt") {
            return (<span>{moment(row.original?.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>)
        }
        return (<span>{cell.value}</span>)
    }
    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    const onBarClick = (val) => {
        HelpdeskToggle(val.value, val.name === "Closed" ? "HS_CLS" : val.name === "Open" ? "HS_NEW" : 'ALL')
    }
    const onClose = () => {
        unstable_batchedUpdates(() => {
            SetTableList([])
            setTotalCount(0)
            setIsOpen(!isOpen)
            setCurrentPage(0)
            setPerPage(10)
            setStatus('')
        })
    }
    return (
        <div className="cmmn-skeleton mt-2">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">
                    Statement Level Overview for 7 days 
                </span>

            </div>
            <hr className="cmmn-hline" />
            <div className="skel-graph-sect mt-3">
                <div className="row">
                    <div className="col-md-4">
                        <table className="table table-hover mb-0 table-centered table-nowrap">
                            <tbody>
                                <tr>
                                    <td>
                                        <h5 className="font-size-14">Total</h5>
                                    </td>
                                    <td>
                                        <p
                                            className="text-dark mb-0 cursor-pointer txt-underline"
                                            data-target="#detailsmodal"
                                            data-toggle="modal"
                                            onClick={() => HelpdeskToggle(ChartData?.total ?? 0, 'ALL')}
                                        >
                                            {ChartData?.total ?? 0}
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <h5 className="font-size-14">Open</h5>
                                    </td>
                                    <td>
                                        <p
                                            className="text-dark cursor-pointer mb-0 txt-underline"
                                            data-target="#detailsmodal"
                                            data-toggle="modal"
                                            onClick={() => HelpdeskToggle(ChartData?.open ?? 0, 'HS_NEW')}
                                        >
                                            {ChartData?.open ?? 0}
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <h5 className="font-size-14">Close</h5>
                                    </td>
                                    <td>
                                        <p
                                            className="text-dark cursor-pointer mb-0 txt-underline"
                                            data-target="#detailsmodal"
                                            data-toggle="modal"
                                            onClick={() => HelpdeskToggle(ChartData?.closed ?? 0, 'HS_CLS')}
                                        >
                                            {ChartData?.closed ?? 0}
                                        </p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="mt-2 text-center">
                            Avg. Turnaround Time:{" "}
                            <span className="font-weight-bold">{(avgDays&&Object.keys(avgDays).length) ? <>
                                {avgDays.days ? `${avgDays.days} day's ` : ' '}
                                {avgDays?.hours ? `${avgDays?.hours} hrs ` : ' '}
                                {avgDays?.minutes ? `${avgDays?.minutes} min's ` : ' '}
                                {avgDays?.seconds ? `${avgDays?.seconds} sec's ` : ' 0 '}
                            </> : 0}</span>
                            {/* <span className="font-weight-bold">{avgDays ? avgDays.toFixed(5) : 0} days</span> */}
                        </div>
                    </div>
                    <div className="col-md-8">
                        <Chart data={{ ChartData }} handlers={{ OnClick: onBarClick }} />
                    </div>
                </div>
            </div>
            <Modal
                isOpen={isOpen}
                contentLabel="HelpdeskList"
                style={RegularModalCustomStyles}
            >
                <div className="modal-header">
                    <h4 className="modal-title">Helpdesk List</h4>
                    <button type="button" className="close" onClick={() => onClose()}>×</button>
                </div>
                <DynamicTable
                    listKey={"HelpdeskList"}
                    row={tablelist}
                    rowCount={totalCount}
                    header={HelpdeskColumns}
                    fixedHeader={true}
                    columnFilter={false}
                    customClassName={'table-sticky-header'}
                    itemsPerPage={perPage}
                    isScroll={false}
                    backendPaging={true}
                    isTableFirstRender={tableRef}
                    backendCurrentPage={currentPage}
                    handler={{
                        handleCellRender: handleCellRender,
                        handlePageSelect: handlePageSelect,
                        handleItemPerPage: setPerPage,
                        handleCurrentPage: setCurrentPage,
                        handleFilters: setFilters
                    }}
                />
            </Modal>
        </div>
    )
}
