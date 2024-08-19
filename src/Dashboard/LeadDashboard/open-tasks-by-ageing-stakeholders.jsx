import React, { useState, useEffect, useRef } from 'react';
import { post, get } from "../../common/util/restUtil";
import { properties } from '../../properties';
import moment from 'moment';
import { CloseButton, Modal } from 'react-bootstrap';
import DynamicTable from '../../common/table/DynamicTable';
import { toast } from 'react-toastify';
import BarChart from './Charts/barChart';

const OpenTaskByAgeingStakeholders = (props) => {
    const { mode, label, searchParams, isParentRefresh } = props?.data
    const [groupedList, setGroupedList] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [masterLookupData, setMasterLookupData] = useState([]);
    const [dataList, setDataList] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [category, setCategory] = useState();
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        get(
            properties.MASTER_API +
            "/lookup?searchParam=code_type&valueParam=AGEING"
        )
            .then((response) => {
                const { data } = response;
                setMasterLookupData(data);
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);

    const [columns, setColums] = useState([
        {
            Header: "Stakeholder name",
            accessor: "oLeadName",
            disableFilters: true,
            id: "oLeadName"
        },
        {
            Header: "Stakeholder category",
            accessor: "oLeadCategoryDesc",
            disableFilters: true,
            id: "oLeadCategoryDesc"
        },
        {
            Header: "Task name",
            accessor: "oTaskName",
            disableFilters: true,
            id: "oTaskName"
        },
        {
            Header: "Task Description",
            accessor: "oTaskDescription",
            disableFilters: true,
            id: "oTaskDescription"
        },
        {
            Header: "Status",
            accessor: "oStatusDesc",
            disableFilters: true,
            id: "oStatusDesc"
        },
        {
            Header: "Priority",
            accessor: "oPriorityDesc",
            disableFilters: true,
            id: "oPriorityDesc"
        },
        {
            Header: "Assigned user",
            accessor: "oAssignedToDesc",
            disableFilters: true,
            id: "oAssignedToDesc"
        },
        {
            Header: "Created user",
            accessor: "oCreatedByDesc",
            disableFilters: true,
            id: "oCreatedByDesc"
        },
        {
            Header: "Current department",
            accessor: "oCurrDeptDesc",
            disableFilters: true,
            id: "oCurrDeptDesc"
        },
        {
            Header: "Created at",
            accessor: "oCreatedAt",
            disableFilters: true,
            id: "oCreatedAt"
        }
    ]);

    useEffect(() => {
        let reqBody = { ...searchParams, mode: mode, type: "COUNT" };
        post(properties.LEAD_API + "/stakeholders-open-tasks-by-ageing-count", { searchParams: reqBody }).then((response) => {
            if (response?.status == 200) {
                const { data } = response;
                setGroupedList(data);
                let arr = []
                data?.map((item, index) => (
                    Object.entries(item).map(([key, value]) => {
                        console.log('masterLookupData?.AGEING?.find((ele) => ele?.code === key)?.description-------->', masterLookupData?.AGEING?.find((ele) => ele?.code === key)?.description)
                        arr.push({
                            type: masterLookupData && masterLookupData?.AGEING?.find((ele) => ele?.code === key)?.description,
                            count: value,
                            code: key
                        })
                    })
                ));
                setChartData(arr)
            }
        }).catch((error) => console.log(error));
    }, [isRefresh, isParentRefresh, masterLookupData])

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oCurrUser") {
            return (<span>{cell.value ?? "Others"}</span>);
        }
        else if (cell.column.id === "oCreatedAt") {
            return (<span>{cell.value ? moment(cell.value).format("DD-MM-YYYY hh:mm:ss") : '-'}</span>);
        }
        return (<span>{cell.value}</span>);
    }

    const capitalizeFirstLetter = (string) => {
        string = string.toLowerCase();
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const getList = (code) => {
        setCategory(code)
        let reqBody = { ...searchParams, mode: mode, type: "LIST", category: code, ageing: code, limit: perPage, page: currentPage };

        post(properties.LEAD_API + "/stakeholders-open-tasks-by-ageing-list", { searchParams: reqBody }).then((response) => {
            if (response?.status == 200) {
                const { data } = response;
                setDataList([...data]);
                const total = chartData?.find((ele) => ele?.code === code)?.count;
                setTotalCount(total);
            } else {
                toast.error("Something went wrong");
            }
        }).catch((error) => toast.error("Something went wrong"));
    }

    const countClicked = (code) => {
        getList(code);
        setModalOpen(true);
    }

    useEffect(() => {
        getList(category);
    }, [currentPage, perPage, filters])

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    return (
        <React.Fragment>
            <div className="cmmn-skeleton">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title"> {label/*capitalizeFirstLetter(label)*/}</span>
                    <div className="skel-dashboards-icons">
                        <a href="javascript:void(null)" onClick={() => setIsRefresh(!isRefresh)}>
                            <i className="material-icons">refresh</i>
                        </a>
                    </div>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect mt-3 mh-370">
                    <BarChart data={{ chartData }} handler={{ countClicked }} />
                    {/* <table className="table table-hover mb-0 table-centered table-nowrap">
                        <tbody>
                            {groupedList?.length > 0 ? (
                                groupedList.map((item, index) => (
                                    Object.entries(item).map(([key, value]) => (<tr key={index}>
                                        <td>
                                            <h5 className="skel-font-sm-bold"> {masterLookupData?.AGEING?.find((ele) => ele?.code === key)?.description ?? 'Others'} </h5>
                                        </td>
                                        <td>
                                            <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => countClicked(key)}> {value} </p>
                                        </td>
                                    </tr>))
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className='text-center'>
                                        <p className="skel-widget-warning">No Records found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table> */}
                </div>
            </div>

            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={modalOpen} onHide={() => setModalOpen(!modalOpen)} dialogClassName="wsc-cust-mdl-temp-prev">
                <Modal.Header>
                    <Modal.Title><h5 className="modal-title">Stakeholder List</h5></Modal.Title>
                    <CloseButton onClick={() => setModalOpen(!modalOpen)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}></CloseButton>
                </Modal.Header>
                <Modal.Body>
                    <div className="col-lg-12 col-md-12 col-xs-12">
                        <DynamicTable
                            row={dataList ?? []}
                            rowCount={totalCount}
                            itemsPerPage={perPage}
                            header={columns}
                            backendPaging={true}
                            isScroll={true}
                            isTableFirstRender={isTableFirstRender}
                            hasExternalSearch={hasExternalSearch}
                            backendCurrentPage={currentPage}
                            columnFilter={true}
                            handler={{
                                handleCellRender: handleCellRender,
                                handlePageSelect: handlePageSelect,
                                handleItemPerPage: setPerPage,
                                handleCurrentPage: setCurrentPage,
                                handleFilters: setFilters
                            }}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ display: 'block' }}>
                    <div className="skel-btn-center-cmmn">
                        <button type="button" className="skel-btn-cancel" onClick={() => setModalOpen(!modalOpen)}>Close</button>
                    </div>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
};

export default OpenTaskByAgeingStakeholders;