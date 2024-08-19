import { useCallback, useEffect, useState } from "react";
import InteractionList from "../Modal/InteractionList";
import { unstable_batchedUpdates } from "react-dom";
import StackedBar from "../Chart/StackedBar";
import { nanoid } from 'nanoid';
import { get } from "../../../../../common/util/restUtil";
import { properties } from "../../../../../properties";

const ChannelWiseInteraction = (props) => {
    const { statementChannelWise = [], interactionDetails = {} } = props?.data
    const [isModelOpen, setIsModalOpen] = useState(false)
    const [popUpType, setPopUpType] = useState('')
    const [ModelType, setModelType] = useState()


    const handleOnClickChannelModal = (e) => {
        unstable_batchedUpdates(() => {
            setIsModalOpen(true)
            setPopUpType(e.currentTarget.dataset.type)
            setModelType(e.currentTarget.dataset.target)
        })
    }

    const handleOnCloseChannelModal = () => {
        unstable_batchedUpdates(() => {
            setIsModalOpen(false)
            setPopUpType('')
            setModelType('')
        })
    }

    return (
        <div className="cmmn-skeleton mt-2">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">Channels Last 7 days</span>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-graph-sect mt-2">
                <div className="row">
                    <div className="col-md-12">
                        <table className="table table-hover mb-0 table-centered table-nowrap">
                            <thead>
                                <tr>
                                    <th>Channel</th>
                                    <th className="text-center">Open</th>
                                    <th className="text-center">Closed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statementChannelWise &&
                                    statementChannelWise?.map(ele => (
                                        <tr key={nanoid()} >
                                            {console.log(ele)}
                                            <td>{ele?.channel ?? '-'}</td>
                                            <td className="text-center">
                                                <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={handleOnClickChannelModal} data-type='open' data-target={ele?.channelCode} data-toggle="modal">
                                                    {ele?.open?.count ?? 0}
                                                </p>
                                            </td>
                                            <td className="text-center">
                                                <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={handleOnClickChannelModal} data-type='closed' data-target={ele?.channelCode} data-toggle="modal">
                                                    {ele?.closed?.count ?? 0}
                                                </p>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                    <div className="col-md-12">
                        <div className="skel-graph-sect mt-2">
                            <StackedBar data={{ interactionLookUp: statementChannelWise }} />
                            {/* <embed src="./assets/chart/channel-wise.html" type="text/html" width="100%" height="380" /> */}
                        </div>
                    </div>
                </div>
            </div>
            {popUpType && <InteractionList data={{ isModelOpen, popUpType, ModelType, interactionDetails }} stateHandlers={{ handleOnCloseModal: handleOnCloseChannelModal }} />}
        </div>
    )
}

export default ChannelWiseInteraction;