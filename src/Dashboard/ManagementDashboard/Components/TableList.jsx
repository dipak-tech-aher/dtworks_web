import React from "react";

const TableList = ({ items = [] }) => {

    return (
        <>
            <table class="table table-hover mb-0 table-centered table-nowrap">
                <tbody>
                    {items?.reduce((rows, item, index) => {
                        if (index % 2 === 0) {
                            rows.push([item]);
                        } else {
                            rows[rows?.length - 1].push(item)
                        }
                        return rows;
                    }, []).map((pair, rowIndex) => (
                        <tr key={rowIndex}>
                            {pair.map((ele, colIndex) => (
                                <React.Fragment key={colIndex}>
                                    <td>{ele.oName}<br /><span className="txt-underline">{ele?.oValue ?? 0}</span></td>
                                </React.Fragment>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}

export default TableList