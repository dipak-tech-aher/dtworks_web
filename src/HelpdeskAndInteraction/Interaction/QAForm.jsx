import React from "react"
import DynamicTable from "../../common/table/DynamicTable"
import moment from "moment"
import { CloseButton, Modal } from 'react-bootstrap';
import { useState } from "react"
import { unstable_batchedUpdates } from "react-dom";
// import jsonata from 'jsonata'
import { useEffect } from "react";
import { isEmpty } from 'lodash'

const QAForm = (props) => {

    const { isQAFormEnabled, interactionData, evaluation, permissions, evaluationForm, qaObjects } = props?.data
    const { setEvaluation, setGuideRefId } = props?.handlers
    const [modalOpen, setModalOpen] = useState(false)
    const [evaluationDetails, SetEvaluationDetails] = useState({})
    const [tab, setTab] = useState(0)



    // console.log('isQAFormEnabled ::::::::::::::::::::::::',a)
    //$.sections.guideline.qualityGuidelines

    // const customElementsRenderer = (metaDetails) => {
    //     const elements = []
    //     metaDetails.forEach(i => {
    //         if (i?.type === 'text') {
    //             elements.push(
    //                 <td>{i?.value}</td>
    //             )
    //         } else if (i?.type === 'dropdown') {
    //             elements.push(
    //                 <td className="py-2">
    //                     {/* onChange={(e) => handleFormOnChange(e, field?.id, formAttributes)} */}
    //                     {console.log('isQAFormEnabled?.[0]?.isRead', isQAFormEnabled?.[0]?.isRead)}
    //                     <select className="form-control number_only item_quantity" disabled={isQAFormEnabled?.[0]?.isRead} required={true} value={isQAFormEnabled?.[0]?.isRead ? 'YES' : ''}>
    //                         <option value="">Select Value</option>
    //                         {i?.value?.map((el, idx) => (
    //                             <option key={el.value} value={el.value}>{el.lable}</option>
    //                         ))}
    //                     </select>
    //                 </td>
    //             )
    //         }

    //     })
    //     return elements
    // }


    // const evaluationForm = {
    //     "qualityId": 1,
    //     "qaName": "TD123 Form",
    //     "qaDispalyName": "TD123 Form",
    //     "weightage": 100,
    //     "sections": [
    //         {
    //             "sectionName": "GREETING_SKILLS",
    //             "displayName": "GREETING SKILLS",
    //             "guideline": [
    //                 {
    //                     "opt": [
    //                         {
    //                             "label": "Yes",
    //                             "value": "YES"
    //                         },
    //                         {
    //                             "lable": "No",
    //                             "value": "NO"
    //                         }
    //                     ],
    //                     "guidelineId": 1,
    //                     "guidelineRefId": "callGreeting1",
    //                     "qualityGuidelines": "Did the Agent use Correct Call Opening (Greeting + Introduction)?",
    //                     "evaluationType": "Dropdown"
    //                 },
    //                 {
    //                     "opt": [
    //                         {
    //                             "label": "Yes",
    //                             "value": "YES"
    //                         },
    //                         {
    //                             "lable": "No",
    //                             "value": "NO"
    //                         }
    //                     ],
    //                     "guidelineId": 1,
    //                     "guidelineRefId": "callOpening1",
    //                     "qualityGuidelines": "Did the Agent use Correct Call Opening (Greeting + Introduction)?",
    //                     "evaluationType": "Dropdown"
    //                 }
    //             ]
    //         },
    //         {
    //             "sectionName": "GREETING_SKILLS",
    //             "displayName": "GREETING SKILLS",
    //             "guideline": [
    //                 {
    //                     "opt": [
    //                         {
    //                             "label": "Yes",
    //                             "value": "YES"
    //                         },
    //                         {
    //                             "label": "No",
    //                             "value": "No"
    //                         }
    //                     ],
    //                     "guidelineId": 1,
    //                     "guidelineRefId": "callGreeting",
    //                     "qualityGuidelines": "Did the Agent use Correct Call Opening (Greeting + Introduction)?",
    //                     "evaluationType": "Dropdown"
    //                 },
    //                 {
    //                     "opt": [
    //                         {
    //                             "label": "Yes",
    //                             "value": "YES"
    //                         },
    //                         {
    //                             "label": "No",
    //                             "value": "No"
    //                         }
    //                     ],
    //                     "guidelineId": 1,
    //                     "guidelineRefId": "callOpening",
    //                     "qualityGuidelines": "Did the Agent use Correct Call Opening (Greeting + Introduction)?",
    //                     "evaluationType": "Dropdown"
    //                 }
    //             ]
    //         }
    //     ]
    // }

    const handleFormOnChange = (e) => {
        const { target } = e
        setEvaluation(prevState => ({
            ...prevState,
            [target.id]: target?.value
        }))
    }

    const createGuideLineForm = (payload, values, type) => {
        return (
            <>
                <tr><td className="p-2 font-bold" colSpan={2}>{payload?.displayName}</td></tr>
                {payload?.guideline?.map((guide) => (
                    <React.Fragment key={guide?.guidelineId}>
                        <tr>
                            <td className="p-1">{guide?.qualityGuidelines}</td>
                            {guide?.evaluationType === 'Dropdown' && (
                                <td>
                                    <select
                                        id={guide?.guidelineRefId}
                                        className="form-control number_only item_quantity"
                                        disabled={type === 'view' ? true : isQAFormEnabled?.[0]?.isRead}
                                        required
                                        value={values?.[guide?.guidelineRefId] ?? evaluation?.[guide?.guidelineRefId]}
                                        onChange={handleFormOnChange}
                                    >
                                        <option value="">Select Value</option>
                                        {guide?.opt?.map((el) => (
                                            <option key={el.value} value={el.value}>{el.label}</option>
                                        ))}
                                    </select>
                                </td>
                            )}
                        </tr>
                    </React.Fragment>
                ))}
            </>
        );
    };


    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Created At") {
            return (<span>{cell.value ? moment(cell.value).format('DD-MM-YYYY') : ''}</span>)
        } else if (cell.column.Header === "Created By") {
            return (<span>{row?.original.userId?.firstName || ''} {row?.original.userId?.lastName || ''}</span>)
        }
        else if (cell.column.Header === "Action") {
            return (
                <button type="button" className="skel-btn-submit"
                    onClick={(e) => {
                        unstable_batchedUpdates(() => {
                            setModalOpen(true)
                            SetEvaluationDetails(row?.original)
                        })
                    }}>
                    View
                </button>
            )
        } else {
            return (<span>{cell.value || ''}</span>)
        }
    }

    const handleOnTabChange = (id) => {
        setTab(id)
    }

    return (
        <div>
            {!!!isQAFormEnabled?.[0]?.isRead && !!!permissions.readOnly &&
                <form>
                    <table className="skel-req-details mt-2" >
                        <tr><th>Parameter</th><th>Rating</th></tr>
                        {evaluationForm?.sections.map((section) => (
                            createGuideLineForm(section)
                        ))}
                    </table>
                </form>}
            {/* <div className="card">
                <DynamicTable
                    listKey={"Evaluation History"}
                    row={interactionData?.evaluation}
                    header={EvaluationColumns}
                    rowCount={interactionData?.evaluation?.length}
                    scroll={true}
                    itemsPerPage={10}
                    backendPaging={false}
                    columnFilter={true}
                    hasExternalSearch={false}
                    handler={{
                        handleCellRender: handleCellRender
                    }}
                />
            </div> */}
            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={modalOpen} onHide={() => setModalOpen(!modalOpen)} dialogClassName="wsc-cust-mdl-temp-prev">
                <Modal.Header>
                    <Modal.Title><h5 className="modal-title">Evaluation Details</h5></Modal.Title>
                    <CloseButton onClick={() => { setModalOpen(!modalOpen); SetEvaluationDetails({}) }} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                        <span>×</span>
                    </CloseButton>
                </Modal.Header>
                <Modal.Body>
                    {/* qaObjects */}
                    <ul className="nav nav-tabs">
                        {isQAFormEnabled?.[0]?.isEnabled &&
                            <>{qaObjects && qaObjects?.map((e, index) => (<li className="nav-item">
                                <button data-target={'#' + e?.qaDispalyName} role="tab" data-toggle="tab" aria-expanded="true" className={`nav-link ${tab === index ? 'active' : ''} `} onClick={() => handleOnTabChange(index)}>
                                    {e?.qaDispalyName}
                                </button>
                            </li>))}</>}
                    </ul>
                    <>
                        {qaObjects && qaObjects?.map((q, index) => (
                            <div className={`tab-pane ${tab === index ? 'active' : ''}`} id={q?.qaDispalyName}>
                                {tab === index && <div className="skel-inter-statement card-box border mt-2 w-100 ">
                                    <form>
                                        <table className="skel-req-details mt-2" >
                                            <tr><th>Parameter</th><th>Rating</th></tr>
                                            {q?.sections.map((section) => (
                                                createGuideLineForm(section, evaluationDetails?.evaluationPayload, 'view')
                                            ))}
                                        </table>
                                    </form>
                                </div>
                                }
                            </div>))
                        }
                    </>

                </Modal.Body>
                <Modal.Footer style={{ display: 'block' }}>
                    <div className="skel-btn-center-cmmn">
                        <button type="button" className="skel-btn-cancel" onClick={() => { setModalOpen(!modalOpen); SetEvaluationDetails({}) }}>Close</button>
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

const EvaluationColumns = [
    {
        Header: "Action",
        accessor: "Action",
        disableFilters: true,
        id: "Action",
    },
    {
        Header: "Evaluation ID",
        accessor: "evaluationNo",
        disableFilters: true,
        click: true,
        id: "evaluationNo",
    }, {
        Header: "Created Department",
        accessor: "interactionTxnDetails.fromEntityName.unitDesc",
        disableFilters: true,
        id: "interactionTxnDetails.fromEntityName.unitDesc",
    }, {
        Header: "Created Role",
        accessor: "interactionTxnDetails.fromRoleName.roleDesc",
        disableFilters: true,
        id: "interactionTxnDetails.fromRoleName.roleDesc",
    }, {
        Header: "Created By",
        accessor: "userId",
        disableFilters: true,
        id: "userId",
    }, {
        Header: "Created At",
        accessor: "createdAt",
        disableFilters: true,
        id: "createdAt",
    },
]


export default QAForm;
