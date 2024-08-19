import React, { useEffect, useRef, useState } from 'react'
import { post } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';
import Modal from 'react-modal';
import DynamicTable from '../../../../../common/table/DynamicTable';
import { HelpdeskColumns } from '../Columns';
import { unstable_batchedUpdates } from 'react-dom';
import moment from 'moment';
import { RegularModalCustomStyles } from '../../../../../common/util/util';
import { toast } from 'react-toastify';
import { useHistory }from '../../../../../common/util/history';
export default function HelpdeskTypeOverView(props) {
    const history = useHistory()

    let { code, description = false } = props?.data?.helpdeskType || {}
    const [count, SetCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false)
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const tableRef = useRef(true);
    const [filters, setFilters] = useState([]);
    const [list, SetList] = useState([])
    const [totalCount, setTotalCount] = useState(0);
    useEffect(() => {
        if (code) {
            getHelpdeskOverView();
        }
    }, [code]);
    const getHelpdeskOverView = () => {
        try {
            let searchParams = {
                "searchParams": {
                    mode: "COUNT",
                    type: code
                }
            }
            post(properties.HELPDESK_API + '/helpdesk-type/overview', searchParams)
                .then((response) => {
                    const { data } = response;
                    if (data && data.length > 0) {
                        SetCount(data[0].count)
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
            if (!count) {
                toast.warn('No records found')
                return
            }
            const requestBody = {
                "searchParams": {
                    "mode": "LIST",
                    "type": code,
                    'limit': perPage,
                    page: currentPage
                }
            };
            post(`${properties.HELPDESK_API}/helpdesk-type/overview`, requestBody)
                .then((response) => {
                    const { status, data = {} } = response;
                    if (status === 200) {
                        unstable_batchedUpdates(() => {
                            SetList(data.rows || [])
                            setTotalCount(data?.count ?? 0)
                            setIsOpen(true)
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
    const handleCellLinkClick = (event, rowData) => {
        history(`/view-helpdesk`, {
            state: {data: rowData}
        })
    }
    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Helpdesk Number") {
            return (<span className="text-secondary cursor-pointer" title={row?.original?.helpdeskSubject ?? ''} onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        } else if (cell.column.id === "currUser") {
            return (<span>{`${row?.original?.assignedAgentDetailsFirstName ?? ''} ${row?.original?.assignedAgentDetailsLastName ?? ''}`}</span>)
        }  else if (cell.column.id === "oNo-Action") {
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
    useEffect(() => {
        if (count) getList();
    }, [perPage, currentPage])
    return (
        <div className="cmmn-skeleton mt-2">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">
                    Helpdesk Type Level Overview
                </span>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-graph-sect mt-2">
                <div className="row">
                    <div className="col-md-12">
                        <table className="table table-hover mb-0 table-centered table-nowrap">
                            <tbody>
                                <tr>
                                    <td>
                                        <h5 className="font-size-14">Type</h5>
                                    </td>
                                    <td>{description ? description : '-'}</td>
                                    <td className="text-center">
                                        <p
                                            className="text-dark cursor-pointer mb-0 txt-underline"
                                            onClick={() => getList()}
                                        >
                                            {count}
                                        </p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Modal
                isOpen={isOpen}
                contentLabel="Helpdesk Type Overview"
                style={RegularModalCustomStyles}
            >
                <div className="modal-header">
                    <h4 className="modal-title"></h4>
                    <button type="button" className="close" onClick={() => setIsOpen(!isOpen)}>×</button>
                </div>
                <DynamicTable
                    listKey={"Helpdesk Type Overview"}
                    row={list}
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
