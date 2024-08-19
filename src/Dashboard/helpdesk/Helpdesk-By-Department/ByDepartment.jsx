import React, { useEffect, useState, useRef } from 'react';
import { properties } from "../../../properties";
import { slowPost } from "../../../common/util/restUtil";
import { Modal } from 'react-bootstrap';
import DynamicTable from "../../../common/table/DynamicTable";
import { DeptWiseColumns } from "../Columns";
import moment from 'moment'

const ByDepartment = (props) => {
    const { searchParams, helpdeskSearchParams, isParentRefresh, modalStyle } = props?.data;
    const { handleOpenRightModal } = props?.handlers;
    const [deptWiseData, setDeptWiseData] = useState([]);
    const [deptWiseDataList, setDeptWiseDataList] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false);
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState([]);
    const Loader = props.loader
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await slowPost(properties.HELPDESK_API + '/helpdesk-by-dept', { type: "COUNT", ...searchParams, ...helpdeskSearchParams })

                setDeptWiseData(response?.data ?? []);

                const totalCount = (response?.data ?? []).map(x => x.oCnt ?? 0).reduce((total, count) => total + count, 0);
                setTotal(totalCount)
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isRefresh, searchParams, isParentRefresh])

    const showDetails = async (departmentCode) => {
        try {
            setLoading(true);
            const response = await slowPost(properties.HELPDESK_API + '/helpdesk-by-dept', { type: "LIST", ...searchParams, ...helpdeskSearchParams, departmentId: departmentCode })
            setDeptWiseDataList(response?.data ?? []);
            setShow(true);
        } catch (error) {
            console.log(error);
        } finally {
            setIsRefresh(!isRefresh);
            setLoading(false);
        }
    }

    const handleClose = () => {
        setShow(false);
        setDeptWiseDataList([]);
    };


    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oCreatedAt") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
        }
        if (cell.column.id === "oHelpdeskNo") {
            return (
                <a href="javascript:void(null)" onClick={() => handleOpenRightModal(row.original)}>{cell?.value}</a>
            )
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    return (
        <div className="col-md-4 mt-2"> {loading ? (
            <Loader />
        ) : (
            <div className="cmmn-skeleton cmmn-skeleton-new">
               
                    <div className="card-body">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title"> Helpdesk by Department ({total})</span>
                            <div className="skel-dashboards-icons">
                                <span>
                                    <i className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i>
                                </span>
                            </div>
                        </div>
                        <hr className="cmmn-hline" />
                        <div id="cardCollpase5cn" className='mh-min-310'>
                            <table className="table table-hover mb-0 table-centered table-nowrap">
                                <tbody>
                                    {deptWiseData?.length ? deptWiseData.map(({ oDepartment, oDepartmentCode, oCnt }) => (
                                        <tr key={oDepartmentCode}>
                                            <td>
                                                <h5 className="font-size-14 mb-0 skel-font-sm-bold">{oDepartment && oDepartment != "" ? oDepartment : oDepartmentCode}</h5>
                                            </td>
                                            <td>
                                                <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={(e) => showDetails(oDepartmentCode)}> {oCnt ?? 0} </p>
                                            </td>
                                        </tr>
                                    )) : (
                                        <td colSpan={2} className='text-center'>No data available</td>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                
                    <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal">
                    <Modal.Header>
                        <b>Helpdesk by Department</b>
                        <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <DynamicTable
                            listKey={"Assigned"}
                            row={deptWiseDataList}
                            rowCount={deptWiseDataList?.length}
                            header={DeptWiseColumns}
                            columnFilter={true}
                            fixedHeader={true}
                            itemsPerPage={perPage}
                            isScroll={true}
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
                    </Modal.Body>
                </Modal>
            </div >
        )}
        </div>

    )
}

export default ByDepartment;