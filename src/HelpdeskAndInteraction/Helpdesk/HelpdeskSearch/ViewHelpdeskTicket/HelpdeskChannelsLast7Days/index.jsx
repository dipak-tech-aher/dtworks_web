import React, { useEffect, useRef, useState } from 'react'
import { properties } from '../../../../../properties';
import { post } from '../../../../../common/util/restUtil';
import Chart from './Chart';
import { RegularModalCustomStyles, groupBy } from '../../../../../common/util/util';
import { unstable_batchedUpdates } from 'react-dom';
import DynamicTable from '../../../../../common/table/DynamicTable';
import moment from 'moment';
import { toast } from 'react-toastify';
import { HelpdeskColumns } from '../Columns';
import Modal from 'react-modal';
import { useHistory }from '../../../../../common/util/history';

export default function HelpdeskChannelsLast7Days(props) {
    const history = useHistory()
    let helpdeskNo = props?.data?.helpdeskNo ?? ''
    const [list, SetList] = useState([])
    const [tablelist, SetTableList] = useState([])
    const [ChartData, SetChartData] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const tableRef = useRef(true);
    const [filters, setFilters] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [statusObj, setStatus] = useState('')
    useEffect(() => {
        getChannalOverView();
    }, []);
    const getChannalOverView = () => {
        try {
            let searchParams = {
                "searchParams": {
                    mode: "COUNT",
                    helpdeskNo
                }
            }
            post(properties.HELPDESK_API + '/get-helpdesk/channels-wise', searchParams)
                .then((response) => {
                    const { data } = response;
                    if (data && data.length > 0) {
                        let groupData = groupBy(data, "helpdesk_source"), tempArray = [], Xaxis = [], Yaxis = [];
                        console.log(groupData)
                        for (var key in groupData) {
                            let obj = {}
                            if (groupData.hasOwnProperty(key)) {
                                console.log(key)
                                groupData[key].forEach(element => {
                                    obj.channel = element.channel
                                    obj.helpdesk_source = element.helpdesk_source
                                    if (element.status === 'HS_CLS' || element.status === 'HS_CANCE') {
                                        if (obj.closed) obj.closed += Number(element.count); else obj.closed = Number(element.count);
                                    } else {
                                        if (obj.open) obj.open += Number(element.count); else obj.open = Number(element.count);
                                    }

                                });
                            }
                            tempArray.push(obj)
                        }
                        tempArray.forEach((item) => {
                            Xaxis.push(item.channel)
                            Yaxis.push(Number(item.open) + Number(item.closed ?? 0))
                        })
                        unstable_batchedUpdates(() => {
                            SetList(tempArray)
                            SetChartData([{ Xaxis, Yaxis }])
                        })
                    }


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
                    "status": statusObj?.status ?? '',
                    "channal": statusObj?.channal,
                    'limit': perPage,
                    'page': currentPage,
                    helpdeskNo
                }
            }
            post(`${properties.HELPDESK_API}/get-helpdesk/channels-wise`, requestBody)
                .then((response) => {
                    const { status, data = {} } = response;
                    if (status === 200) {
                        unstable_batchedUpdates(() => {
                            SetTableList(data.rows || [])
                            setTotalCount(data?.count || [])
                            setIsOpen(true)
                        })

                    }

                })
                .catch((error) => {
                    console.error(error);
                })
            // .finally();
        } catch (e) {
            console.log('error', e)
        }
    }
    const handleCellLinkClick = (event, rowData) => {
        history(`/view-helpdesk`, {
            state: {data: rowData}
        })
    }
    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Helpdesk Number") {
            return (<span className="text-secondary cursor-pointer" onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        } else if (cell.column.id === "oNo-Action") {
            return (
                <>
                    <div className="skel-action-btn">
                        <div title="Edit" className="action-edit"><i className="material-icons">edit</i></div>
                        <div title="View" className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">visibility</i></a></div>
                    </div>
                </>
            )
        } else if (cell.column.id === "createdAt") {
            return (<span>{moment(row.original?.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>)
        }
        return (<span>{cell.value}</span>)
    }
    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    const onBarClick = (val) => {
        const filterData = list.filter((item) => item.channel === val.name)
        if (filterData && filterData.length > 0) {
            HelpdeskToggle(val.value, filterData[0].helpdesk_source)
        }
    }
    useEffect(() => {
        if (statusObj) {
            getList()
        }
    }, [statusObj, perPage, currentPage])
    const HelpdeskToggle = (count, channal, status) => {
        if (!count) {
            toast.warn('No records found')
            return
        }
        setStatus({ channal, status });
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
                    Channels Last 7 days
                </span>

            </div>
            <hr className="cmmn-hline" />
            <div className="skel-graph-sect mt-4">
                <div className="row">
                    <div className="col-md-12">
                        <table className="table table-hover mb-0 table-centered table-nowrap">
                            <thead>
                                <tr>
                                    <th>Channel</th>
                                    <th className="text-center">Open</th>
                                    <th className="text-center">Closed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list && list.length > 0 ? <>{list.map((val, i) => {
                                    return (
                                        <tr key={i}>
                                            <td>{val.channel}</td>
                                            <td className="text-center">
                                                <p
                                                    className="text-dark mb-0 cursor-pointer txt-underline"
                                                    onClick={() => HelpdeskToggle(val.open, val.helpdesk_source, 'HS_NEW')}
                                                >
                                                    {val?.open ?? 0}
                                                </p>
                                            </td>
                                            <td className="text-center">
                                                <p
                                                    className="text-dark mb-0 cursor-pointer txt-underline"
                                                    onClick={() => HelpdeskToggle(val.closed, val.helpdesk_source, 'HS_CLS')}
                                                >
                                                    {val?.closed ?? 0}
                                                </p>
                                            </td>
                                        </tr>
                                    )
                                })}</> : null}
                                {/* <tr><td>No records found </td></tr> */}
                            </tbody>
                        </table>
                    </div>
                    <div className="col-md-12">
                        <div className="skel-graph-sect mt-4">
                            <Chart ChartData={ChartData} handlers={{ OnClick: onBarClick }} />
                        </div>
                    </div>
                </div>
            </div>
            <Modal
                isOpen={isOpen}
                contentLabel="HelpdeskList"
                style={RegularModalCustomStyles}
            >
                <div className="modal-header">
                    <h4 className="modal-title"></h4>
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
