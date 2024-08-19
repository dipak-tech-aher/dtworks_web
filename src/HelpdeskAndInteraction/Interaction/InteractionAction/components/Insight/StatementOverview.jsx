import { useState } from "react"
import { unstable_batchedUpdates } from "react-dom"
import Pie from "../Chart/Pie"
import InteractionList from "../Modal/InteractionList"

const StatementOverview = (props) => {
    console.log("props............",props);
    const { statementStatusWiseCount = {}, statementAvgDays = 0, interactionDetails } = props?.data
    console.log("statementAvgDays........",statementAvgDays);
    const [isModelOpen, setIsModalOpen] = useState(false)
    const [popUpType, setPopUpType] = useState('')

    const handleOnClickStatusModal = (e) => {
        unstable_batchedUpdates(() => {
            setIsModalOpen(true)
            setPopUpType(e.currentTarget.dataset.type)
        })
    }

    const handleOnCloseStatusModal = () => {
        unstable_batchedUpdates(() => {
            setIsModalOpen(false)
            setPopUpType('')
        })
    }
    
    return (
        <div className="cmmn-skeleton mt-2">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">Statement Level Overview for 7 days</span>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-graph-sect mt-3">
                <div className="row">
                    <div className="col-md-4">
                        <table className="table table-hover mb-0 table-centered table-nowrap">
                            <tbody>
                                <tr>
                                    <td><h5 className="font-size-14">Total</h5></td>
                                    <td> <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={handleOnClickStatusModal} data-type="total" data-target="#detailsmodal" data-toggle="modal">{statementStatusWiseCount?.total ?? 0}</p></td>
                                </tr>
                                <tr>
                                    <td><h5 className="font-size-14">Open</h5></td>
                                    <td><p className="text-dark cursor-pointer mb-0 txt-underline" onClick={handleOnClickStatusModal} data-type="open" data-target="#detailsmodal" data-toggle="modal">{statementStatusWiseCount?.open ?? 0}</p></td>
                                </tr>
                                <tr>
                                    <td><h5 className="font-size-14">Close</h5></td>
                                    <td><p className="text-dark cursor-pointer mb-0 txt-underline" onClick={handleOnClickStatusModal} data-type="closed" data-target="#detailsmodal" data-toggle="modal">{statementStatusWiseCount?.closed ?? 0}</p></td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="mt-2 text-center">Avg. Turnaround Time: 
                        <span className="font-weight-bold"> {(statementAvgDays&&Object.keys(statementAvgDays).length) ? <>
                                {statementAvgDays.days ? `${statementAvgDays.days} day's ` : ' '}
                                {statementAvgDays?.hours ? `${statementAvgDays?.hours} hrs ` : ' '}
                                {statementAvgDays?.minutes ? `${statementAvgDays?.minutes} min's ` : ' '}
                                {statementAvgDays?.seconds ? `${statementAvgDays?.seconds} sec's ` : ' 0 '}
                            </> : 0}</span>
                            </div>
                        {/* <div className="mt-2 text-center">Avg. Turnaround Time: <span className="font-weight-bold">{statementAvgDays} days</span></div> */}
                    </div>
                    <div className="col-md-8">
                        <Pie data={{ interactionLookUp: statementStatusWiseCount }} />
                    </div>
                </div>
            </div>
            {popUpType && <InteractionList data={{ isModelOpen, popUpType, interactionDetails }} stateHandlers={{ handleOnCloseModal: handleOnCloseStatusModal }} />}
        </div >
    )
}

export default StatementOverview