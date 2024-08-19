import React, { useEffect, useRef, useState } from 'react'
import { slowPost } from '../../common/util/restUtil';
import { properties } from '../../properties';
import { groupBy, filter } from 'lodash'
import { unstable_batchedUpdates } from 'react-dom';
import { Accordion } from 'react-bootstrap';
import ExcelJS from 'exceljs';
import * as FileSaver from "file-saver";
const excelProperties = {
    borderStyle: {
        top: { style: 'thin', color: { argb: '000' } },
        left: { style: 'thin', color: { argb: '000' } },
        bottom: { style: 'thin', color: { argb: '000' } },
        right: { style: 'thin', color: { argb: '000' } }
    },
    font: { name: 'Calibri', size: 10 },
    fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'B9B6B6' }
    },
    defaultRowHeight: 12,
    defaultColWidth: 20
}
export default function CreatedInteractionReport(props) {
    const { searchParams, isParentRefresh } = props?.data
    const [loading, setLoading] = useState(false);
    const [isRefresh, setIsRefresh] = useState(false);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const Loader = props.loader
    const [active, setActive] = useState(null);
    useEffect(() => {
        slowPost(properties.INTERACTION_API + "/top-created-intxn-report", { searchParams }).then((resp) => {
            if (resp?.status == 200) {
                let { problem_code = [], Problem_cause } = groupBy(resp?.data?.rows, 'oCategory'), total = resp?.data?.rows?.filter((val) => val.oCategory === "total");
                problem_code = problem_code.map((val) => {
                    return {
                        ...val,
                        child: filter(Problem_cause, function (o) { return o.oProbCode === val.oProbCode; }
                        )
                    }
                })
                unstable_batchedUpdates(() => {
                    setItems(problem_code);
                    setTotal(total?.[0]?.oIntxnCnt ?? 0)
                })
            }
        }).catch((error) => console.log(error));
    }, [isRefresh, searchParams, isParentRefresh])
    const handleToggle = (index) => {
        if (active === index) {
            setActive(null);
        } else {
            setActive(index);
        }
    }
    const onExport = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('sheet1', {
                views: [{ state: 'frozen', ySplit: 1 }],
            })
            const headers = ['Raw labels', 'Count']
            worksheet.columns = headers.map(header => ({
                header,
                key: header
            }));
            const excelRows = items.map((val) => (
                {
                    'Raw labels': val.oProbCode, 'Count': val.oIntxnCnt,
                    ...val
                }
            ))
            // Add data rows
            excelRows.forEach(row => {
                worksheet.addRow(row)
                if (row?.child?.length) {
                    row.child.forEach(item => worksheet.addRow({
                        'Raw labels': item?.oProbCause ?? 'Not Available', 'Count': item.oIntxnCnt
                    }))
                }
            });
            // Total Colum added 
            worksheet.addRow({ 'Raw labels': 'Grand Total', 'Count': total })
            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                    cell.border = excelProperties?.borderStyle
                    cell.font = rowNumber === 1 ? { ...excelProperties?.font, bold: true } : excelProperties?.font
                    cell.fill = rowNumber === 1 ? excelProperties?.fill : { pattern: 'none' }
                })
            });
            const excelBuffer = await workbook.xlsx.writeBuffer();
            const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
            const data = new Blob([excelBuffer], { type: fileType });
            FileSaver.saveAs(data, 'created' + ".xlsx");
        } catch (e) {
            console.log('error', e)
        }
    }
    return (
        <> {loading ? (
            <Loader />
        ) : (
            <div className="cmmn-skeleton cmmn-skeleton-new">
                <div className="row h-100">
                    <div className="col-12 px-2">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title">Created Interaction Report </span>
                            <div className="skel-dashboards-icons">
                                <a href="javascript:void(null)" onClick={() => setIsRefresh(!isRefresh)}>
                                    <i className="material-icons">refresh</i>
                                </a>
                            </div>
                        </div>
                        <hr className="cmmn-hline mb-0" />
                        {items.length > 0 ? <>
                            <div className='row row mt-2 mb-3'>
                                {/* <div className='col-md-3'>
                                <div class="form-group mb-0">
                                    <label for="exampleFormControlSelect1" className='mb-0 font-14'>Interaction type</label>
                                    <select class="form-control" id="exampleFormControlSelect1">
                                    <option>1</option>
                                    <option>2</option>
                                    <option>3</option>
                                    <option>4</option>
                                    <option>5</option>
                                    </select>
                                    
                                </div>
                            </div>
                            <div className='col-md-auto pl-0 align-content-end pb-2'>
                                <span>1234</span>
                            </div> */}
                                {/* <div className='col-md'>
                                <div class="form-group mb-0">
                                    <label for="exampleFormControlSelect1" className='mb-0 font-14'>Service type</label>
                                    <select class="form-control" id="exampleFormControlSelect1">
                                    <option>1</option>
                                    <option>2</option>
                                    <option>3</option>
                                    <option>4</option>
                                    <option>5</option>
                                    </select>
                                    
                                </div>
                            </div> */}
                                {/* <div className='col-md-auto pl-0 align-content-end pb-2'>
                                <span>1234</span>
                            </div> */}
                                <div className='col-md text-right align-content-end'>
                                    <button type='submit' className='skel-btn-submit d-inline-block' onClick={() => onExport()}>Export</button>
                                </div>
                            </div>
                            <div className='row accordion-ir-label mt-1'>
                                <div className='col-md'>Raw Labels</div>
                                <div className='col-md-2 text-right'> Count</div>
                            </div>
                            <Accordion defaultActiveKey="10000" className='accordion-ir'>
                                {items.map((item, index) => {
                                    const { oProbCode, child, oIntxnCnt } = item;
                                    return (
                                        <Accordion.Item eventKey={index}>
                                            <Accordion.Header className='w-100' onClick={() => handleToggle(index)}>
                                                <div className='row'>
                                                    <div className='col-md text-left'><span className='pr-1'>{index === active ? '-' : '+ '}</span>{oProbCode}</div>
                                                    <div className='col-md-2 text-right'>{oIntxnCnt}</div>
                                                </div>

                                            </Accordion.Header>
                                            <Accordion.Body >
                                                {child?.map((val, i) => {
                                                    return <div key={i} className='d-flex justify-content-between'>
                                                        <div><h5 className="">{val.oProbCause ?? 'Not Available'}</h5></div>
                                                        <div>{val.oIntxnCnt}</div>
                                                    </div>
                                                })}
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    )
                                })
                                }
                            </Accordion>
                        </> : <div className='d-flex justify-content-center mt-3'> <h5 className="font-size-14 mb-0 skel-font-sm-bold">No records found</h5></div>}

                    </div>
                </div>
            </div>
        )}
        </>
    )
}
