import React, { useEffect, useState, useRef } from 'react';
import { properties } from "../../../properties";
import { slowPost } from "../../../common/util/restUtil";
import { Modal } from 'react-bootstrap';
import DynamicTable from "../../../common/table/DynamicTable";
import { AgeingWiseColumns } from "../Columns";
import moment from 'moment'
import Chart from './Chart';

const Ageing = (props) => {
    const { searchParams, helpdeskSearchParams, isParentRefresh, modalStyle } = props?.data;
    const { handleOpenRightModal } = props?.handlers;
    const [ageingWiseData, setAgeingWiseData] = useState([]);
    const [ageingCounts, setAgeingCounts] = useState([]);
    const [filteredAgeingData, setFilteredAgeingData] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false);
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState([]);
    const [chartAgeing, setChartAgeing] = useState([]);
    const Loader = props.loader
    const [loading, setLoading] = useState(false);
    const groupBy = (items, key) => items.reduce(
        (result, item) => ({
            ...result,
            [item[key]]: [
                ...(result[item[key]] || []),
                item,
            ],
        }),
        {},
    );
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // delete searchParams?.fromDate;
                // delete searchParams?.toDate;
                // delete searchParams?.startDate;
                // delete searchParams?.endDate;
                const response = await slowPost(properties.HELPDESK_API + '/open-helpdesk-by-aging', { ...searchParams, ...helpdeskSearchParams });

                // console.log('response from open ageing', response)
                setTotal(response?.data?.[0]?.oIntxnTotalCnt ?? 0)
                setAgeingWiseData([
                    {
                        description: "0 to 3 Days",
                        value: "0_3DAYS",
                        count: response?.data?.[0]?.o0To3DayCnt ?? 0
                    },
                    {
                        description: "4 to 7 Days",
                        value: "4_7DAYS",
                        count: response?.data?.[0]?.o4To7DayCnt ?? 0
                    },
                    {
                        description: "8 to 10 Days",
                        value: "8_10DAYS",
                        count: response?.data?.[0]?.o8To10DayCnt ?? 0
                    },
                    {
                        description: "> 10 Days",
                        value: "MORE_10DAYS",
                        count: response?.data?.[0]?.oMoreThan10DayCnt ?? 0
                    }
                ]);

                // const AgeingCounts = {};
                // response?.data?.forEach(item => {
                //     const description = item?.agingCategory;
                //     if (AgeingCounts[description]) {
                //         AgeingCounts[description]++;
                //     } else {
                //         AgeingCounts[description] = 1;
                //     }
                // });
                // setAgeingCounts(AgeingCounts);

                const AgeingCounts = {};
                response?.data?.forEach(item => {
                    const description = item?.agingCategory;
                    if (description) {
                        if (AgeingCounts[description]) {
                            AgeingCounts[description]++;
                        } else {
                            AgeingCounts[description] = 1;
                        }
                    }
                });
                // console.log('AgeingCounts', AgeingCounts)

                // Calculate total count
                const totalCount = Object.values(AgeingCounts).reduce((total, count) => total + count, 0);
                // setTotal(totalCount)
                // Add total key-value pair
                // AgeingCounts['Total'] = totalCount;

                setAgeingCounts(AgeingCounts);

                const uniqueRecords = [...new Map(response?.data.map(item => [item['helpdeskNo'], item])).values()];

                const statusGroupedInteraction = groupBy(uniqueRecords, 'agingCategory');

                const xAxisData = [];
                const yAxisData = [];
                for (var key in statusGroupedInteraction) {
                    if (statusGroupedInteraction.hasOwnProperty(key)) {
                        xAxisData.push(key);
                        if (statusGroupedInteraction[key][0]?.agingCategory === '> 10 days') {
                            yAxisData.push({
                                value: statusGroupedInteraction[key].length,
                                key,
                                itemStyle: {
                                    color: '#a90000'
                                }
                            });
                        } else {
                            yAxisData.push({
                                value: statusGroupedInteraction[key].length,
                                key,
                                itemStyle: {
                                    color: '#5c7bd9'
                                }
                            });
                        }
                    }
                }

                setChartAgeing([{ xAxisData, yAxisData }]);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isRefresh, isParentRefresh, searchParams]);


    const showDetails = async (value) => {
        // console.log('value====', value)

        const response = await slowPost(properties.HELPDESK_API + '/open-ageing-list', { ...searchParams, ...helpdeskSearchParams, type: value });
        // console.log('response', response)

        setFilteredAgeingData(response.data)
        setShow(true)


    }

    const handleClose = () => {
        setShow(false);
        setFilteredAgeingData([]);
    };


    const handleCellRender = (cell, row) => {
        if (cell.column.id === "createdAt") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
        }
        if (cell.column.id === "helpdeskNo") {
            return (<span className="text-secondary cursor-pointer" onClick={(e) => handleOpenRightModal(row.original)}>{cell.value}</span>)
            // <a href="javascript:void(null)" onClick={() => handleOpenRightModal(row.original)}>{cell?.value}</a>
        }
        if (cell.column.id === "currUserInfo") {
            return (<span>
                {cell?.value?.currUserInfo?.firstName + ' ' + cell?.value?.currUserInfo?.lastName}
            </span>)
        }
        else {
            return (<span>{cell.value ?? '-'}</span>)
        }
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    // console.log('loading ', loading)

    return (
        <div className="col-md-6 mt-2"> {loading ? (
            <Loader />
        ) : (
            <>
                <div className="cmmn-skeleton cmmn-skeleton-new">
                    <div className="card-body">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title"> Open Helpdesk by Ageing ({total})</span>
                            <div className="skel-dashboards-icons">
                                <span>
                                    <i className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i>
                                </span>
                            </div>
                        </div>
                        <hr className="cmmn-hline" />
                    </div>
                    <div className="card-body py-0">
                        <div className="row">
                            {ageingWiseData.map(({ description, value, count }) => (<div className="col-3" key={description}>
                                <div className="text-center">
                                    <p className="mb-2 text-truncate" title={description?.replace(/_/g, ' - ')}> {description?.replace(/_/g, ' - ')} </p>
                                    <p className={`${description === '> 10 Days' ? "text-danger" : "text-primary"} mb-0 cursor-pointer txt-underline`} onClick={() => showDetails(value)}> {count} </p>
                                </div>
                            </div>))}
                            <div className="col-12 text-center">
                                <div className="skel-graph-sect skel-graph-sect-new mt-2">
                                    <Chart data={{ chartData: ageingWiseData }} handlers={{ showDetails }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                    <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal">
                    <Modal.Header>
                        <b>Open Helpdesk by Ageing</b>
                        <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <DynamicTable
                            listKey={"Assigned"}
                            row={filteredAgeingData}
                            rowCount={filteredAgeingData?.length}
                            header={AgeingWiseColumns}
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
            </>
        )}
        </div>
    )
}

export default Ageing;