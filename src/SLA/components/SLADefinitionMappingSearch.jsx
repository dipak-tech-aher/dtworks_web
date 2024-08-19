/* eslint-disable jsx-a11y/anchor-is-valid */
import { isEmpty } from 'lodash'
import { useCallback, useEffect, useRef, useState } from "react"
import { unstable_batchedUpdates } from "react-dom"
import { toast } from "react-toastify"
import DynamicTable from "../../common/table/DynamicTable"
import { DefaultDateFormate } from "../../common/util/dateUtil"
import { useHistory }from "../../common/util/history"
import { post } from "../../common/util/restUtil"
import { removeEmptyKey } from "../../common/util/util"
import { properties } from "../../properties"
import { SLASearchMappingColumns } from "../model/SLAColumns"

const SLADefinitionMappingSearch = () => {

    const initialValues = {
        slaMappingNo: "",
        slaCode: ""
    }
    const [searchParam, setSearchParam] = useState(initialValues)
    const [tableRowData, setTableRowData] = useState([])
    const [displayForm, setDisplayForm] = useState(true)
    const isFirstRender = useRef(true)
    const history = useHistory()

    const [totalCount, setTotalCount] = useState(0)
    const [listSearch, setListSearch] = useState([])
    const [perPage, setPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(0)
    // eslint-disable-next-line no-unused-vars
    const [filters, setFilters] = useState([])
    const [exportBtn, setExportBtn] = useState(false)
    const isTableFirstRender = useRef(true)
    const hasExternalSearch = useRef(false)

    const handleOnChange = (e) => {
        if (e) {
            e.preventDefault()
        }
        const { id, value } = e.target
        setSearchParam({ ...searchParam, [id]: value })
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "SLA Mapping No") {
            return (<span className="text-secondary" style={{ cursor: "pointer" }} onClick={(e) => redirectToRespectivePages(e, row.original)}>{cell.value}</span>)
        } else if (['Created Date'].includes(cell.column.Header)) {
            return (<span>{cell?.value ? DefaultDateFormate(cell?.value) : '-'}</span>)
        } else if (cell.column.Header === "Action") {
            return (
                <>
                    <div className="skel-action-btn">
                        <div title="Edit" onClick={(e) => redirectToRespectivePages(e, row.original, 'Edit')} className="action-edit"><i className="material-icons">edit</i></div>
                        <div title="View" onClick={(e) => redirectToRespectivePages(e, row.original, 'View')} className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">visibility</i></a></div>
                    </div>
                </>
            )
        }
        return (<span>{cell.value}</span>)
    }

    const getMappingSlaSearchData = useCallback(() => {
        const requestBodyFiltered = removeEmptyKey(searchParam) ?? {}
        if (isEmpty(requestBodyFiltered)) {
            toast.error('Please provide atleast one field for search')
            return false
        }
        setListSearch(requestBodyFiltered)
        post(`${properties.SLA_API}/mapping/search?limit=${perPage}&page=${currentPage}`, requestBodyFiltered)
            .then((response) => {
                if (response?.data) {
                    if (Number(response?.data?.count) > 0) {
                        unstable_batchedUpdates(() => {
                            setTotalCount(response.data.count)
                            setTableRowData(response.data.rows)
                        })
                    } else {
                        toast.error("Records not Found")
                        setTableRowData([])
                        setTotalCount(0)
                    }
                }
            })
            .catch(error => toast.error(error?.message))
            .finally()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, perPage])

    useEffect(() => {
        if (!isFirstRender.current) {
            getMappingSlaSearchData();
        }
        else {
            isFirstRender.current = false
        }
    }, [currentPage, getMappingSlaSearchData, perPage])

    const onSubmit = (e) => {
        if (e) {
            e.preventDefault();
            isTableFirstRender.current = true;
            unstable_batchedUpdates(() => {
                setFilters([])
                setCurrentPage((currentPage) => {
                    if (currentPage === 0) {
                        return '0'
                    }
                    return 0
                });
            })
        }
    }

    const redirectToRespectivePages = (e, rows, type = 'view') => {
        const data = { slaMappingNo: rows?.slaMappingNo, type }
        history(`/sla-map-${type?.toLowerCase() ?? 'view'}?slaMappingNo=` + rows?.slaMappingNo, { state: {data} })
    }

    return (
        <div className="container-fluid cust-skeleton cmmn-skeleton mt-2 mb-3">
            <div className="row mt-2">
                <div className="col-lg-12">
                    <div className="search-result-box m-t-30">
                        <div id="searchBlock" className="modal-body p-2 d-block">
                            {!!tableRowData?.length && <div className="d-flex justify-content-end">
                                <h6 style={{ color: "#142cb1", cursor: "pointer" }} onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</h6>
                            </div>}
                            {displayForm && <form onSubmit={onSubmit}>
                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="slaMappingNo" className="control-label">
                                                SLA Mapping No
                                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                            </label>
                                            <input
                                                className="form-control"
                                                id="slaMappingNo"
                                                type="text"
                                                maxLength={100}
                                                value={searchParam?.slaMappingNo ?? ""}
                                                onChange={handleOnChange}
                                                placeholder="Enter SLA Mapping No"
                                            />
                                            <div className="text-muted font-20 pl-1 fld-imp mt-1"><span class="text-danger">*</span> Please provide at least one field
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="templateName" className="control-label">Mapping Name <span className='error ml-1'>*</span></label>
                                            <input
                                                value={searchParam?.templateName ?? ''}
                                                onChange={handleOnChange}
                                                type="text"
                                                className="form-control"
                                                id="templateName"
                                                placeholder="Enter Mapping Name" />
                                        </div>
                                    </div>
                                    {/* <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="slaCode" className="control-label">
                                                SLA Code
                                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                            </label>
                                            <input
                                                className="form-control"
                                                id="slaCode"
                                                type="text"
                                                maxLength={100}
                                                value={searchParam?.slaCode ?? ""}
                                                onChange={handleOnChange}
                                                placeholder="Enter SLA Code"
                                            />
                                        </div>
                                    </div> */}
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="slaName" className="control-label">SLA Name <span className='error ml-1'>*</span></label>
                                            <input
                                                value={searchParam?.slaName ?? ''}
                                                onChange={handleOnChange}
                                                type="text"
                                                className="form-control"
                                                id="slaName"
                                                placeholder="Enter SLA Name" />
                                        </div>
                                    </div>
                                </div>
                                <div className='skel-btn-center-cmmn mt-2'>
                                    <button type="button" className="skel-btn-cancel" onClick={() => { setSearchParam(initialValues); setTableRowData([]) }}>Clear</button>
                                    <button type="submit" className="skel-btn-submit">Search</button>

                                </div>
                            </form>}
                            <div className="row mt-2">
                                <div className="col-lg-12">
                                    {
                                        !!tableRowData?.length &&
                                        <div className="">
                                            <div className="" id="datatable">
                                                <DynamicTable
                                                    listKey={"SLA Mapping Search"}
                                                    listSearch={listSearch}
                                                    row={tableRowData}
                                                    header={SLASearchMappingColumns}
                                                    rowCount={totalCount}
                                                    itemsPerPage={perPage}
                                                    backendPaging={true}
                                                    columnFilter={true}
                                                    backendCurrentPage={currentPage}
                                                    isTableFirstRender={isTableFirstRender}
                                                    hasExternalSearch={hasExternalSearch}
                                                    exportBtn={exportBtn}
                                                    exportIcon={true}
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
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default SLADefinitionMappingSearch