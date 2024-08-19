/* eslint-disable jsx-a11y/anchor-is-valid */
import { isEmpty } from 'lodash'
import { useCallback, useEffect, useRef, useState } from "react"
import { unstable_batchedUpdates } from "react-dom"
import Switch from "react-switch"
import { toast } from "react-toastify"
import DynamicTable from '../../common/table/DynamicTable'
import { DefaultDateFormate } from '../../common/util/dateUtil'
import { useHistory }from '../../common/util/history'
import { get, post, put } from "../../common/util/restUtil"
import { removeEmptyKey } from "../../common/util/util"
import { properties } from "../../properties"
import { SLASearchColumns } from '../model/SLAColumns'

const SearchSlaDefinition = () => {
    const initialValues = {
        slaCode: "",
        slaType: "",
        status: "",
        slaName: ""
        // slaDescription: ""
    }
    const [tableRowData, setTableRowData] = useState([])
    const [searchInputs, setSearchInputs] = useState(initialValues)
    const [displayForm, setDisplayForm] = useState(true)
    const history = useHistory()

    const isFirstRender = useRef(true)
    const [totalCount, setTotalCount] = useState(0)
    const [listSearch, setListSearch] = useState([])
    const [perPage, setPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(0)
    // eslint-disable-next-line no-unused-vars
    const [filters, setFilters] = useState([])
    const [exportBtn, setExportBtn] = useState(false)

    const [slaType, setSlaType] = useState([])
    const [slaStatus, setSlaStatus] = useState([])
    const isTableFirstRender = useRef(true)
    const hasExternalSearch = useRef(false)


    const handleSubmit = (e) => {
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

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleInputChange = (e) => {
        const target = e.target;
        setSearchInputs({
            ...searchInputs,
            [target.id]: target.type === 'checkbox' ? target.checked : target.value
        })
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "SLA Name") {
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
        } else if (cell.column.Header === 'Status') {
            return (<Switch onChange={(e) => switchChange(row.original)} checked={cell.value === 'SL_AC' ? true : false} />)
        }
        return (<span>{cell.value}</span>)
    }

    const switchChange = (obj) => {
        const index = tableRowData?.findIndex((x) => x.slaUuid === obj.slaUuid)
        const payload = {
            status: obj?.status?.code === 'SL_AC' ? 'SL_IN' : 'SL_AC'
        }

        put(`${properties.SLA_API}/update/${obj.slaCode}`, payload).then((resp) => {
            if (resp.status === 200) {
                toast.success('Status Updated Successfully.')
                setTableRowData((prevStatus) => {
                    prevStatus[index]['status']['code'] = payload.status ?? prevStatus[index]['status']['code']
                    return [...prevStatus];
                })

            }
        }).catch(error => console.error(error))
    }

    const getMasterLookup = useCallback(() => {
        get(`${properties.MASTER_API}/lookup?searchParam=code_type&valueParam=SLA_TYPE,SLA_STATUS`)
            .then((response) => {
                if (response?.data) {
                    unstable_batchedUpdates(() => {
                        setSlaStatus(response?.data?.SLA_STATUS ?? [])
                        setSlaType(response?.data?.SLA_TYPE ?? [])
                    })
                }
            })
            .catch((error) => console.error(error))
    }, [])

    const getSlaSearchData = useCallback(() => {
        const requestBodyFiltered = removeEmptyKey(searchInputs) ?? {}
        if (isEmpty(requestBodyFiltered)) {
            toast.error('Please provide atleast one field for search')
            return false
        }
        setListSearch(requestBodyFiltered)
        post(`${properties.SLA_API}/search?limit=${perPage}&page=${currentPage}`, requestBodyFiltered)
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
            getSlaSearchData();
        }
        else {
            isFirstRender.current = false
        }
    }, [currentPage, getSlaSearchData, perPage])

    useEffect(() => {
        getMasterLookup()
    }, [getMasterLookup])

    const redirectToRespectivePages = (e, rows, type = 'view') => {
        const data = { slaCode: rows?.slaCode, type }
        history(`/sla-${type?.toLowerCase() ?? 'view'}?slaCode=` + rows?.slaCode, { state: {data} })
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
                            {
                                displayForm &&
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="slaCode" className="control-label">SLA Code <span className='error ml-1'>*</span></label>
                                                <input
                                                    value={searchInputs?.slaCode ?? ''}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    className="form-control"
                                                    id="slaCode"
                                                    placeholder="Enter SLA Code" />
                                                <div className="text-muted font-20 pl-1 fld-imp mt-1"><span class="text-danger">*</span> Please provide at least one field
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="slaName" className="control-label">SLA Name <span className='error ml-1'>*</span></label>
                                                <input
                                                    value={searchInputs?.slaName ?? ''}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    className="form-control"
                                                    id="slaName"
                                                    placeholder="Enter SLA Name" />
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="slaType" className="control-label">Type <span className='error ml-1'>*</span></label>
                                                <select id='slaType' className='form-control' value={searchInputs?.slaType ?? ''} onChange={handleInputChange} >
                                                    <option value="">Select SLA Type</option>
                                                    {
                                                        slaType?.map((e) => (
                                                            <option key={e.code} value={e.code}>{e.description}</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="status" className="control-label">Status <span className='error ml-1'>*</span></label>
                                                <select id='status' className='form-control' value={searchInputs?.status ?? ''} onChange={handleInputChange} >
                                                    <option value="">Select SLA Status</option>
                                                    {
                                                        slaStatus?.map((e) => (
                                                            <option key={e.code} value={e.code}>{e.description}</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>

                                        </div>
                                        {/* <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="slaDescription" className="control-label">Description <span className='error ml-1'>*</span></label>
                                                <input
                                                    value={searchInputs?.slaDescription ?? ''}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    className="form-control"
                                                    id="slaDescription"
                                                    placeholder="Enter SLA Description" />
                                            </div>
                                        </div> */}
                                    </div>
                                    <div className='skel-btn-center-cmmn mt-2'>
                                        <button type="button" className="skel-btn-cancel" onClick={() => { setSearchInputs(initialValues); setTableRowData([]) }}>Clear</button>
                                        <button type="submit" className="skel-btn-submit">Search</button>

                                    </div>
                                </form>}
                            {
                                <div className="row mt-2">
                                    <div className="col-lg-12">
                                        {
                                            !!tableRowData?.length &&
                                            <div className="">
                                                <div className="" id="datatable">
                                                    <DynamicTable
                                                        listKey={"SLA Search"}
                                                        listSearch={listSearch}
                                                        row={tableRowData}
                                                        header={SLASearchColumns}
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
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchSlaDefinition