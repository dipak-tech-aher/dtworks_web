import React from 'react'

export default function LogicalInfromation() {
    return (
        <>
            <div className="cust-table">
                <table
                    role="table"
                    className="table table-responsive table-striped dt-responsive nowrap w-100"
                    style={{ textAlign: "center", marginLeft: 0 }}
                >
                    <thead>
                        <tr role="row" className="sticky-header">
                            <th colSpan={1} role="columnheader">
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        flexDirection: "row"
                                    }}
                                    className="font-weight-bold"
                                >
                                    Placeholder
                                    <span />
                                </div>
                            </th>
                            <th colSpan={1} role="columnheader">
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        flexDirection: "row"
                                    }}
                                    className="font-weight-bold"
                                >
                                    Placeholder
                                    <span />
                                </div>
                            </th>
                            <th colSpan={1} role="columnheader">
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        flexDirection: "row"
                                    }}
                                    className="font-weight-bold"
                                >
                                    Placeholder
                                    <span />
                                </div>
                            </th>
                            <th colSpan={1} role="columnheader">
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        flexDirection: "row"
                                    }}
                                    className="font-weight-bold"
                                >
                                    Placeholder
                                    <span />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody role="rowgroup">
                        <tr role="row" className="">
                            <td>Placeholder</td>
                            <td>
                                <span>Placeholder</span>
                            </td>
                            <td>
                                <span>Placeholder</span>
                            </td>
                            <td>
                                <span>Placeholder</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="table-footer-info">
                <div className="select-cus">
                    <select className="custom-select custom-select-sm ml-1">
                        <option value={10}>10 Rows</option>
                        <option value={20}>20 Rows</option>
                        <option value={30}>30 Rows</option>
                        <option value={40}>40 Rows</option>
                        <option value={50}>50 Rows</option>
                    </select>
                    <span className="ml-1">per Page</span>
                </div>
                <div className="tbl-pagination">
                    <ul className="page">
                        <li className="page__btn">
                            <i
                                className="fa fa-chevron-circle-left"
                                aria-hidden="true"
                            />
                        </li>
                        <li className="page__numbers active"> 1</li>
                        <li className="page__numbers">2</li>
                        <li className="page__numbers">3</li>
                        <li className="page__dots">...</li>
                        <li className="page__numbers"> 10</li>
                        <li className="page__btn">
                            <i
                                className="fa fa-chevron-circle-right"
                                aria-hidden="true"
                            />
                        </li>
                    </ul>
                </div>
            </div>
        </>
    )
}
