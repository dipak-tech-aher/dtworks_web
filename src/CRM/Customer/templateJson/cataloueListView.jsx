import React, { useState, useEffect } from 'react';

import DynamicTable from '../common/table/DynamicTable';
import { properties } from '../properties';
import { get } from '../common/util/restUtil';
import { useNavigate } from "react-router-dom";
import { LeadSearchColumns } from '../lead/leadSearchColumns';

const CatalogueListView = () => {
    const history = useNavigate();
    const [tableRowData, setTableRowData] = useState([]);
    useEffect(() => {

        get(`${properties.CUSTOMER_INQUIRY_API}`)
            .then((response) => {
                setTableRowData(response.data)
            }).catch((error) => {
                console.log(error)
            })
            .finally()
    }, [])

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Lead Id") {
            return (<span className="text-primary cursor-pointer" onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        } else {
            return (<span>{cell.value}</span>)
        }
    }

    const handleCellLinkClick = (e, rowData) => {
        const { leadId } = rowData
        history(`/edit-customer-inquiry`, {
            state: {
                data: {
                    leadId
                }
            }
        })
    }

    return (
        <div className="row" style={{ marginTop: "120px" }}>
            <div className="col-lg-12">
                {
                    !!tableRowData.length &&
                    <div className="card">
                        <div className="card-body">
                            <DynamicTable
                                row={tableRowData}
                                header={LeadSearchColumns}
                                itemsPerPage={10}
                                handler={{
                                    handleCellRender: handleCellRender,
                                    handleLinkClick: handleCellLinkClick
                                }}
                            />
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}

export default CatalogueListView;