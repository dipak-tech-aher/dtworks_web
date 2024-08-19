import { useRef, useState } from "react"
import DynamicTable from "../../../common/table/DynamicTable"

const GridComponent = ({ rows = [], headerColumns = [], title }) => {
    const [exportBtn, setExportBtn] = useState(false)
    const [perPage, setPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(0)
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleCellRender = (cell, row) =>{
        if (cell.column.Header === "S.No") {
            return (
                <span>{row.id++}</span>
            )
        } else {
            return (<span>{cell.value}</span>)
        }
    }

    return (
        <>
            <DynamicTable
                listKey={title}
                row={rows}
                isScroll={true}
                rowCount={rows?.length ? rows.length : 0}
                header={headerColumns}
                itemsPerPage={perPage}
                columnFilter={false}
                backendPaging={false}
                isTableFirstRender={isTableFirstRender}
                hasExternalSearch={hasExternalSearch}
                backendCurrentPage={currentPage}
                exportBtn={exportBtn}
                handler={{
                    handleCellRender: handleCellRender,
                    handlePageSelect: handlePageSelect,
                    handleItemPerPage: setPerPage,
                    handleCurrentPage: setCurrentPage,
                    handleExportButton: setExportBtn
                }}
            />
        </>
    )
}

export default GridComponent