/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useMemo, useEffect } from 'react';
import { useTable, useSortBy, useFilters } from 'react-table';
import { unstable_batchedUpdates } from 'react-dom';
import ReactPaginate from 'react-paginate';
import { ColumnFilter } from './columnFilter';
import ExportExcelFile from "../excelUtils/ExportExcelFile"
import './table.css';
import { formatISODateDDMMMYY } from '../util/dateUtil';
import { Dropdown, Form } from 'react-bootstrap';

const DynamicTable = (props) => {
    // console.log("hii  from DynamicTable")
    // console.log(props, 'from dynamic table')
    // const fixedHeader = props.fixedHeader;
    const backendPaging = props.backendPaging
    const columnFilter = props.columnFilter
    const hideFooter = props.hideFooter;
    const handlePageSelect = props.handler.handlePageSelect
    const handleItemPerPage = props.handler.handleItemPerPage
    const handleCurrentPage = props.handler.handleCurrentPage
    const customButtons = props.customButtons;
    const bulkUpload = props.bulkUpload;
    const handleFilters = props.handler.handleFilters
    const handleExportButton = props.handler.handleExportButton
    const listKey = props.listKey !== undefined ? props.listKey : "NA"
    const listSearch = props.listSearch !== undefined ? props.listSearch : "NA"
    const listSelectedTab = props.listSelectedTab !== undefined ? props.listSelectedTab : "NA"

    let { row, exportBackend = true, rowCount, header, itemsPerPage, customClassName, backendCurrentPage, isTableFirstRender, hasExternalSearch, exportBtn, hiddenColumns = [], filterRequired = true, selectedRow = null, url, method, isScroll = true, report = false, exportIcon = false, SearchCriteria = {} } = props

    header = header.filter(x => !(x.isVisible === false)).map((x, idx) => ({ ...x, index: idx }));

    const [showFilter, setShowFilter] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState([...header]);
    const showFilterVisible = () => setShowFilter(!showFilter)

    const handleClear = (event) => {
        event.preventDefault();
        setSelectedColumns([...header]);
        setShowFilter(false);
    }

    const fileName = "" + listKey.replaceAll(/ /g, "_") + "_" + formatISODateDDMMMYY(Date().toLocaleString()); // filename of the excel file

    const [currentPage, setCurrentPage] = useState(0);
    const [PER_PAGE, setPER_PAGE] = useState(itemsPerPage)

    let offset = currentPage * PER_PAGE;

    const data = useMemo(() => {
        return row?.slice(offset, offset + PER_PAGE)
    }, [offset, PER_PAGE, row])

    let pagecount = Math.ceil(row?.length / PER_PAGE);

    const defaultColumn = useMemo(() => {
        return {
            Filter: ColumnFilter
        }
    }, [])

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        state,
        setAllFilters
    } = useTable({
        columns: selectedColumns,
        data: data,
        defaultColumn,
        manualFilters: backendPaging,
        initialState: {
            hiddenColumns: hiddenColumns
        }
    }, useFilters, useSortBy)

    const { filters } = state;

    if (backendPaging && isTableFirstRender) {
        if (hasExternalSearch) {
            useEffect(() => {
                if (isTableFirstRender.current && hasExternalSearch.current) {
                    setAllFilters([])
                }
                else {
                    hasExternalSearch.current = true
                }
            }, [hasExternalSearch, isTableFirstRender, setAllFilters])
        }

        useEffect(() => {
            if (!isTableFirstRender.current) {
                unstable_batchedUpdates(() => {
                    handleCurrentPage((backendCurrentPage) => {
                        if (backendCurrentPage === 0) {
                            return '0';
                        }
                        return 0;
                    });
                    handleFilters(filters);
                })
            }
            else {
                isTableFirstRender.current = false;
            }

        }, [filters, handleCurrentPage, isTableFirstRender, handleFilters])
    }

    // useEffect(() => {
    //     if (!backendPaging && filters) {
    //         handleFilters(filters)
    //     }
    // }, [filters])

    const handlePageSizeChange = (e) => {
        unstable_batchedUpdates(() => {
            setPER_PAGE(Number(e.target.value));
            setCurrentPage(0);
            if (backendPaging) {
                handleItemPerPage(Number(e.target.value));
                handleCurrentPage(0);
            }
        })
    }

    return (
        <div >
            <React.Fragment>
                <div className='skel-cust-role-btn mb-2'>

                    {bulkUpload && (bulkUpload)}
                    {exportBtn && (
                        <ExportExcelFile
                            list={row}
                            fileName={fileName}
                            listSelectedTab={listSelectedTab}
                            listKey={listKey}
                            listSearch={listSearch}
                            filters={filters}
                            handleExportButton={handleExportButton}
                            header={selectedColumns}
                            report={report}
                            exportBackEnd={exportBackend}
                            url={url} method={method} exportIcon={exportIcon} SearchCriteria={SearchCriteria}
                        />
                    )}
                    {customButtons && (customButtons)}
                    {columnFilter && (
                        <Dropdown className="skel-filter-dropdown" show={showFilter} onToggle={showFilterVisible}>
                            <Dropdown.Toggle variant="success" onClick={showFilterVisible}>
                                <div className='skel-cl-filters'>Column Filter <svg className="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium mat-filter css-i4bv87-MuiSvgIcon-root" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="FilterAltIcon"><path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z"></path></svg></div>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="skel-ul-data-filter skel-column-filter-cmmn" style={{ maxHeight: '300px' }}>
                                <Form className="mt-1 filter-form">
                                    <div className="form-group">
                                        {header?.map((column) => {
                                            let randNum = Math.floor(Math.random() * 100000);
                                            return (
                                                <div key={column.Header} className={`custom-control col-filter custom-checkbox`}>
                                                    <input
                                                        type="checkbox"
                                                        id={column.Header + '_id_' + randNum}
                                                        name={column.Header}
                                                        className="custom-control-input"
                                                        style={{ cursor: "pointer" }}
                                                        checked={selectedColumns.find(x => x.Header === column.Header) ? true : false}
                                                        onChange={(e) => {
                                                            let id = e?.target?.id?.split("_id_")?.[0]
                                                            let columnIndex = header.findIndex(x => x.Header === id);
                                                            let selectedColumnss = selectedColumns;
                                                            if (e.target.checked) {
                                                                selectedColumnss.push(header[columnIndex]);
                                                            } else {
                                                                selectedColumnss = selectedColumnss.filter(x => x.Header !== id);
                                                            }
                                                            selectedColumnss.sort((a, b) => {
                                                                return a.index - b.index;
                                                            });
                                                            setSelectedColumns([...selectedColumnss])
                                                        }}
                                                    />
                                                    <label className="custom-control-label" htmlFor={column.Header + '_id_' + randNum}>{column.Header}</label>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="form-group text-center">
                                        <button type='button' className="skel-btn-cancel" onClick={handleClear}>
                                            Clear
                                        </button>
                                    </div>
                                </Form>
                            </Dropdown.Menu>
                        </Dropdown>
                    )}
                </div>
            </React.Fragment>
            <div className={`${isScroll && "data-scroll1"}`} style={isScroll ? { width: "100%", maxHeight: "580px", overflowY: "auto", whiteSpace: "nowrap" } : {}}>
                <table {...getTableProps()}
                    className={`table ${customClassName ? customClassName : ''} table-responsive table-striped dt-responsive nowrap w-100 skel-cust-table-dyn`}
                    style={{ marginLeft: "0px" }}>
                    <thead className='sticky-header'>
                        {headerGroups.map((headerGroup, k) => (
                            <tr {...headerGroup.getHeaderGroupProps()} key={k} >
                                {headerGroup.headers.map((column, idx) => (
                                    column.hidden && column.hidden === true ? <></> :
                                        <th {...column.getHeaderProps(/*column.getSortByToggleProps(){
                                    onClick : () => handleClick()
                                    }*/)} key={idx}>
                                            <div className={column?.class ? "d-flex flex-justify-center" : 'skel-dyn-header-label'}>
                                                <span>{column.render('Header')}</span>
                                                {filterRequired && column.canFilter && <span className='skel-table-filter-dynamic'>
                                                    {(column.canFilter && filterRequired) ? column.render('Filter') : null}
                                                    {/* {column.isSorted ? (column.isSortedDesc ? '' : '') : ''} */}
                                                </span>}
                                            </div>
                                        </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {rows?.length ? rows.map((row, idx) => {
                            prepareRow(row)
                            return (
                                <tr {...row.getRowProps()} className={selectedRow === row?.index ? "row-act" : ""} /*style={{ wordBreak: "break-all" }} */ key={idx}>
                                    {

                                        row.cells.map((cell, idx) => {
                                            return (
                                                <td key={idx} className={cell?.column?.class ?? ''}>
                                                    {cell.render(props.handler.handleCellRender(cell, row))}
                                                </td>

                                            )
                                        })
                                    }
                                </tr>
                            )
                        }) : (
                            <tr><td colSpan={selectedColumns?.length}><span className='skel-widget-warning'>No records found</span></td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className={`table-footer-info ${hideFooter ? 'd-none' : ''}`}>

                {
                    (backendPaging) ?
                        <>

                            <div className="select-cus">
                                Showing 1 to {itemsPerPage} of {rowCount} record(s)
                                <select value={PER_PAGE}
                                    onChange={handlePageSizeChange}
                                    className="custom-select custom-select-sm ml-1" >
                                    {
                                        [10, 20, 30, 40, 50].map((pageSize) => (
                                            <option key={pageSize} value={pageSize}>
                                                {pageSize} Rows
                                            </option>
                                        ))
                                    }
                                </select>
                                <span className="ml-1">Per Page</span>
                            </div>
                            <div className="tbl-pagination">
                                <ReactPaginate
                                    previousLabel={"←"}
                                    nextLabel={"→"}
                                    pageCount={((rowCount !== undefined && !isNaN(rowCount) && !isNaN(PER_PAGE)) ? Math.ceil(rowCount / PER_PAGE) : 0)}
                                    onPageChange={({ selected: selectedPage }) => {
                                        handlePageSelect(selectedPage)
                                    }}
                                    forcePage={Number(backendCurrentPage)}
                                    containerClassName={"pagination"}
                                    previousLinkClassName={"pagination__link"}
                                    nextLinkClassName={"pagination__link"}
                                    disabledClassName={"pagination__link--disabled"}
                                    activeClassName={"pagination__link--active"}
                                />
                            </div>
                        </>
                        :
                        <>
                            <div className="select-cus">
                                <select value={PER_PAGE}
                                    onChange={handlePageSizeChange}
                                    className="custom-select custom-select-sm ml-1" >
                                    {
                                        [10, 20, 30, 40, 50].map((pageSize) => (
                                            <option key={pageSize} value={pageSize}>
                                                {pageSize} Rows
                                            </option>
                                        ))
                                    }
                                </select>
                                <span className="ml-1">Per Page</span>
                            </div>
                            <div className="tbl-pagination">
                                <ReactPaginate
                                    previousLabel={"←"}
                                    nextLabel={"→"}
                                    pageCount={pagecount}
                                    forcePage={currentPage}
                                    onPageChange={({ selected: selectedPage }) => {
                                        setCurrentPage(selectedPage)
                                    }}
                                    containerClassName={"pagination"}
                                    previousLinkClassName={"pagination__link"}
                                    nextLinkClassName={"pagination__link"}
                                    disabledClassName={"pagination__link--disabled"}
                                    activeClassName={"pagination__link--active"}
                                />
                            </div>
                        </>
                }

            </div>
        </div >
    );
}

export default DynamicTable;