import { useState } from "react"
import CategoryAndTypeList from "../Modal/CategoryAndTypeList"

const CategoryAndTypeOverview = (props) => {
    const { interactionWeeklyStatics = {} } = props?.data
    const [isModelOpen, setIsModelOpen] = useState(false)
    const [popUpType, setPopUpType] = useState()

    const handleOnClick = (e) => {
        setIsModelOpen(true)
        setPopUpType(e?.currentTarget?.dataset?.type ? JSON?.parse(e.currentTarget.dataset.type) : '')
    }

    const handleOnCloseModal = (e) => {
        setIsModelOpen(false)
        setPopUpType('')
    }

    return (
        <div className="cmmn-skeleton mt-2">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">Category and Type Overview for Last 7 days</span>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-graph-sect mt-2">
                <div className="row">
                    <div className="col-md-12">
                        <table className="table table-hover mb-0 table-centered table-nowrap">
                            <tbody>
                                <tr>
                                    <td><h5 className="font-size-14">Category</h5></td>
                                    <td>{interactionWeeklyStatics?.interactionCategory?.[0]?.name}</td>
                                    <td className="text-center"
                                        data-type={JSON.stringify({
                                            key: 'interactionCategory',
                                            value: interactionWeeklyStatics?.interactionCategory?.[0]?.element
                                        })} onClick={handleOnClick}>
                                        <p className="text-dark mb-0 cursor-pointer txt-underline" data-target={`#${interactionWeeklyStatics?.interactionCategory?.[0]?.element}`}
                                            data-toggle="modal">{interactionWeeklyStatics?.interactionCategory?.[0]?.value ?? 0}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td><h5 className="font-size-14">Type</h5></td>
                                    <td>{interactionWeeklyStatics?.interactionType?.[0]?.name}</td>
                                    <td className="text-center"
                                        data-type={JSON.stringify({
                                            key: 'interactionType',
                                            value: interactionWeeklyStatics?.interactionType?.[0]?.element
                                        })} onClick={handleOnClick}>
                                        <p className="text-dark cursor-pointer mb-0 txt-underline" data-target={`#${interactionWeeklyStatics?.interactionType?.[0]?.element}`}
                                            data-toggle="modal">{interactionWeeklyStatics?.interactionType?.[0]?.value ?? 0}</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {popUpType && <CategoryAndTypeList data={{ isModelOpen, popUpType }} stateHandlers={{ handleOnCloseModal }} />}
        </div>
    )
}

export default CategoryAndTypeOverview;