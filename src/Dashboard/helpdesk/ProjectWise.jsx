import React, { useEffect, useMemo, useState, useRef } from 'react';
import { properties } from "../../properties";
import { slowPost } from "../../common/util/restUtil";
import { Modal } from 'react-bootstrap';
import DynamicTable from "../../common/table/DynamicTable";
import { ProjectWiseColumns } from "./Columns";
import moment from 'moment'
import { formFilterObject } from '../../common/util/util';

const ProjectWise = (props) => {
    const hasExternalSearch = useRef(false);
    const isTableFirstRender = useRef(true);
    const { searchParams, helpdeskSearchParams, isParentRefresh, modalStyle } = props?.data;
    const { handleOpenRightModal } = props?.handlers;

    const [projectWiseData, setProjectWiseData] = useState([]);
    const [filteredProjectsData, setFilteredProjectsData] = useState([]);
    const [projectCounts, setProjectCounts] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false);
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(false)
    const [listSearch, setListSearch] = useState([]);
    const [projectName, setProjectName] = useState(null);
    const Loader = props.loader
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const requestBody = {
            filters: formFilterObject(filters)
        }
        setListSearch(requestBody);
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await slowPost(properties.HELPDESK_API + '/project-wise', { ...searchParams, ...helpdeskSearchParams, ...requestBody, type: 'COUNT' })

                setProjectWiseData(response?.data);
                const projectCounts = {};
                response?.data?.forEach(item => {
                    const description = item?.oProjectDesc;
                    const code = item?.oProject;
                    const oCnt = item?.oCnt;

                    if (projectCounts[description]) {
                        projectCounts[description].push({ code, oCnt });
                    } else {
                        projectCounts[description] = [{ code, oCnt }];
                    }
                });

                setProjectCounts(projectCounts);

                const totalCount = Object.values(projectCounts)
                    .flatMap(items => items.map(({ oCnt }) => oCnt))
                    .reduce((total, count) => total + count, 0);

                setTotal(totalCount);


            } catch (error) {
                console.log(error);
            } finally {
                isTableFirstRender.current = false;
                setLoading(false);
            }
        };
        fetchData();
    }, [isRefresh, searchParams, isParentRefresh]);

    useEffect(() => {
        // console.log({ currentPage, perPage })
    }, [currentPage, perPage])

    const showDetails = async (value) => {
        // console.log('value ', value)
        let payload = { ...searchParams, ...helpdeskSearchParams, type: 'LIST', project: value }
        if (value === 'In Queue') {
            delete payload.project
        }
        const response = await slowPost(properties.HELPDESK_API + '/project-wise', payload);
        // console.log('response', response)

        setFilteredProjectsData(response.data)
        setShow(true)
    }

    const handleClose = () => {
        setShow(false);
        setFilteredProjectsData([]);
    };

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "createdAt") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
        }
        if (cell.column.id === "helpdeskNo") {
            return (
                <a href="javascript:void(null)" onClick={() => handleOpenRightModal(row.original)}>{cell?.value}</a>
                // <div title='View' onClick={() => handleOpenRightModal(row.original?.oHelpdeskId)} className="action-view" data-toggle="modal" data-target="#view-right-modal">{cell?.value}</div>
            )
        }
        if (cell.column.id === "currUserInfo") {
            return (<span>
                {(cell?.value?.currUserInfo?.firstName || '') + ' ' + (cell?.value?.currUserInfo?.lastName || '')}
            </span>)
        }
        else {
            return (<span>{cell.value ?? '-'}</span>)
        }
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    return (
        <div className="col-md-4 mt-2"> {loading ? (
            <Loader />
        ) : (
            <>
                <div className="cmmn-skeleton cmmn-skeleton-new">
                    <div className="card-body">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title"> Project wise Open Helpdesk ({total})</span>
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
                                    {Object.keys(projectCounts)?.length ? (
                                        Object.entries(projectCounts).map(([description, items]) => (
                                            <tr key={description}>
                                                <td>
                                                    <h5 className="font-size-14 mb-0 skel-font-sm-bold">
                                                        {description === 'undefined' ? 'In Queue' : description?.toUpperCase() === 'DTWORKS' ? 'DTWORKS' : description?.toUpperCase()}
                                                    </h5>
                                                </td>
                                                <td>
                                                    {items.map(({ code, oCnt }) => (
                                                        <p key={code} className="text-dark mb-0 cursor-pointer txt-underline" onClick={(e) => showDetails(code)}>
                                                            {oCnt}
                                                        </p>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className='text-center'>No data available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal">
                    <Modal.Header>
                        <b>Project Wise Open Helpdesk Details</b>
                        <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <DynamicTable
                            listSearch={listSearch}
                            listKey={`Project Wise Helpdesk`}
                            row={filteredProjectsData}
                            rowCount={filteredProjectsData?.length}
                            header={ProjectWiseColumns}
                            itemsPerPage={perPage}
                            // backendPaging={true}
                            isTableFirstRender={isTableFirstRender}
                            hasExternalSearch={hasExternalSearch}
                            backendCurrentPage={currentPage}
                            exportBtn={exportBtn}
                            // url={properties.HELPDESK_API + `/project-wise`}
                            method='slowPost'
                            handler={{
                                handleCellRender: handleCellRender,
                                handlePageSelect: handlePageSelect,
                                handleItemPerPage: setPerPage,
                                handleCurrentPage: setCurrentPage,
                                handleExportButton: setExportBtn,
                                handleFilters: setFilters
                            }}
                        />
                    </Modal.Body>
                </Modal>
            </>
        )}
        </div>
    )
}

export default ProjectWise;