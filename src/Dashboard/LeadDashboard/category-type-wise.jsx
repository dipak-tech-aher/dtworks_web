import React, { useState, useEffect, useRef, useContext } from 'react';
import { post, get } from "../../common/util/restUtil";
import { properties } from '../../properties';
import moment from 'moment';
import { CloseButton, Modal } from 'react-bootstrap';
import DynamicTable from '../../common/table/DynamicTable';
import { useHistory }from '../../common/util/history';
import { toast } from 'react-toastify';
import PieChart from './Charts/PieChart';
import { AppContext } from '../../AppContext';

const CategoryTypeWise = (props) => {
    const { handlers } = useContext(AppContext);
    const history = useHistory()
    console.log('handlers----------->', handlers)
    const { mode, label, searchParams, isParentRefresh } = props?.data
    const { setIsParentRefresh } = handlers
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

    const [columns, setColums] = useState([
        {
            Header: "Stakeholder Name",
            accessor: "oLeadName",
            disableFilters: true,
            id: "oLeadName"
        },
        {
            Header: "Category",
            accessor: "oLeadCategoryDesc",
            disableFilters: true,
            id: "oLeadCategoryDesc"
        },
        {
            Header: "Type",
            accessor: "oLeadTypeDesc",
            disableFilters: true,
            id: "oLeadTypeDesc"
        },
        {
            Header: "Created By",
            accessor: "oCreatedUser",
            disableFilters: true,
            id: "oCreatedUser"
        },
        {
            Header: "Created At",
            accessor: "oCreatedAt",
            disableFilters: true,
            id: "oCreatedAt"
        }
    ]);

    const keys = {
        CATEGORY: {
            lookupCode: "CUSTOMER_CATEGORY",
            findKey: "oLeadCategory",
            apifindKey: "leadCategory"
        },
        TYPE: {
            lookupCode: "CUSTOMER_TYPE",
            findKey: "oLeadType",
            apifindKey: "leadType"
        }
    }

    useEffect(() => {
        let reqBody = { /*...searchParams,*/ mode: mode, type: "COUNT" };
        post(properties.LEAD_API + "/category-type-wise", { searchParams: reqBody }).then((response) => {
            if (response?.status == 200) {
                const { data } = response;
                const responseObj = data.map((element) => {
                    let obj = {
                        name: element?.oLeadCategoryDesc,
                        code: element?.oLeadCategory,
                        value: Number(element?.oCnt ?? 0),
                        count: Number(element?.oCnt ?? 0),
                        type: element?.oLeadCategoryDesc,
                    }
                    return obj
                });
                setGroupedList(responseObj);
                setChartData(responseObj)
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
        let reqBody = { /*...searchParams,*/ mode: mode, type: "LIST", [keys[mode]['apifindKey']]: [{ value: code }], limit: perPage, page: currentPage };
        post(properties.LEAD_API + "/category-type-wise", { searchParams: reqBody }).then((response) => {
            if (response?.status == 200) {
                const { data } = response;
                setDataList([...data]);
                const total = groupedList?.find((ele) => ele?.code === code)?.value;
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
                    <span className="skel-header-title"> {capitalizeFirstLetter(label)} by {capitalizeFirstLetter(mode)} </span>
                    <div className="skel-dashboards-icons">
                        <a href="javascript:void(null)" onClick={() => setIsRefresh(!isRefresh)}>
                            <i className="material-icons">refresh</i>
                        </a>
                    </div>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect mt-3 mh-370">
                    <PieChart data={{ chartData }} handler={{ countClicked }} />
                </div>
            </div>

            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={modalOpen} onHide={() => {
                setModalOpen(!modalOpen);
                setIsRefresh(!isRefresh);
            }} dialogClassName="wsc-cust-mdl-temp-prev">
                <Modal.Header>
                    <Modal.Title><h5 className="modal-title">Stakeholder List</h5></Modal.Title>
                    <CloseButton onClick={() => {
                        setModalOpen(!modalOpen);
                        setIsRefresh(!isRefresh);
                    }
                    } style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}></CloseButton>
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
        </React.Fragment >
    );
};

export default CategoryTypeWise;