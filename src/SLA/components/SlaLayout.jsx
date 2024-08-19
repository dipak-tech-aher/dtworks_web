import React, { useContext, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppContext } from "../../AppContext"
import slaManagment from "../../assets/images/slaManagment.png"
// import productMain from "../../assets/images/product-main.png"
import productImage6 from "../../assets/images/product-img6.png"
import productImage5 from "../../assets/images/product-img5.png"
import image6 from '../../assets/images/app-config.svg'
import image5 from '../../assets/images/puzzle.png'
import image3 from '../../assets/images/user-config.svg'

const SlaLayout = (props) => {
    const paths = window?.location?.pathname?.split('/') ?? []
    // const currentPath = paths[(paths?.length ?? -1) - 1]
    // const history = useNavigate()
    // const { appConfig } = useContext(AppContext)
    const screenInfo = props?.children?.props?.props?.screenInfo
    // const avatar = props?.children?.props?.props?.avatar ?? null
    const [nextStepCount, setNextStepCount] = useState(0)
    const [openProgressPopup, setOpenProgressPopup] = useState(false)
    const [getPercentage, setPercentage] = useState(0)
    const [prevBtnDisable, setPrevBtnDisable] = useState(true)
    const [nextBtnDisable, setNextBtnDisable] = useState(false)
    const [getTotalCount, setGetTotalCount] = useState()
    const [currentProps, setCurrentProps] = useState({})
    let type

    useEffect(() => {
        if (Number(getPercentage) === 100) {
            setNextBtnDisable(true)
            setPrevBtnDisable(true)
        } else {
            if (nextStepCount === 0) {
                setPrevBtnDisable(true)
                setNextBtnDisable(false)
            } else if (nextStepCount === steps.length - 1) {
                setNextBtnDisable(true)
                setPrevBtnDisable(false)
            } else {
                setNextBtnDisable(false)
                setPrevBtnDisable(false)
            }
        }

    }, [getPercentage, nextStepCount])

    const proceedNextStep = (index) => {
        index = index + 1
        // if (getTotalCount && getTotalCount[steps[index]?.key] > 0) {
        setNextStepCount(index)
        const step = steps[index]
        setCurrentProps(step)
        // if (step) {
        //     history(`${step.path}`, { state: { data: { sourceName: step.sourceName } } })
        // }
        // }
    }

    const proceedPrevStep = (index) => {
        index = index - 1
        // if (getTotalCount && getTotalCount[steps[index]?.key] > 0) {
        setNextStepCount(index)
        const step = steps[index]
        setCurrentProps(step)
        // if (step) {
        //     history(`${step.path}`, { state: { data: { sourceName: step.sourceName } } })
        // }
        // }
    }

    const childGroup = () => {
        return React.Children.map(props.children, (child) => {
            return React.cloneElement(child, {
                totalCount: getTotalCount,
                percentage: getPercentage,
                proceedNextStep: proceedNextStep,
                proceedPrevStep: proceedPrevStep,
                steps,
                nextStepCount,
                setNextStepCount
            })
        })
    }

    const steps = [
        { key: 'add', label: 'Add SLA', path: '/sla-add', image: image3, layoutImage: slaManagment, description: 'Configure your Service Level Agrement', sourceName: "slaMenu" },
        { key: 'Map', label: 'Map SLA', path: '/sla-map-add', image: image5, layoutImage: productImage5, description: 'Map your added Service Level Agrement', sourceName: "slaMenu" },
        { key: 'add-response-alert', label: 'Add Response Alert', path: '/sla-map-add', image: image6, layoutImage: productImage6, description: 'Add Response alert for your added Service Level Agrement', sourceName: "slaMenu" },
        { key: 'add-resolution-alert', label: 'Add Resolution Alert', path: '/sla-map-add', image: image6, layoutImage: productImage6, description: 'Add Resolution alert for your added Service Level Agrement', sourceName: "slaMenu" },
    ]
    // const currentProps = steps?.find(ele => ele.path === `/${currentPath}`)
    return (
        <div className="cnt-wrapper">
            <div className="card-skeleton">
                <div className="customer-skel">
                    <div className="cmmn-skeleton">
                        <div className="row">
                            <div className="skel-configuration-settings">
                                <div className="col-md-8">
                                    <div className="skel-config-top-sect">
                                        <h2>{currentProps?.label ?? screenInfo}</h2>
                                        <p>
                                            {currentProps?.description ??
                                                "Follow the setup wizard that will guide you through the remaining steps to complete the configuration setup."
                                            }
                                        </p>
                                        <div className="skel-config-progress">
                                            <div className="progress-status progress-moved">
                                                <div
                                                    className="progress-bar"
                                                    style={{ width: getPercentage + "%" }}
                                                ></div>
                                            </div>
                                            <span>{getPercentage}% Completed</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <img src={currentProps?.layoutImage ?? slaManagment} alt="" className="img-fluid" />
                                </div>
                            </div>
                        </div>
                        {childGroup()}
                        <div className={openProgressPopup ? "skel-config-progress-flow" : "d-none"}>
                            <span className="material-icons skel-config-active-close cursor-pointer" onClick={() => { setOpenProgressPopup(false) }}>close</span>
                            <span className="font-bold">Workflow Configuration</span>
                            <div className="skel-config-progress">
                                <div className="progress-status">
                                    <div className="progress-bar" style={{ width: getPercentage + "%" }}>
                                    </div>
                                </div>
                                <br />
                                <span>{getPercentage}% Completed</span></div>
                            <hr className="cmmn-hline pt-1 pb-1" />
                            <ul>
                                {steps.map((step, index) => (
                                    <li key={index}>
                                        <div className={getTotalCount && getTotalCount[step?.key] > 0 ? "skel-progress-config-steps" : "steps-disable-state"}>
                                            <div className="skel-config-steps-divd">
                                                <div>
                                                    <span className="material-icons skel-config-active-tick">check_circle</span>
                                                </div>
                                                <div>
                                                    <span>Step: {index + 1}</span>
                                                    <p>{step?.label}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div class="row text-center mt-3">
                                <div className="col-6">
                                    <button type="button" class={prevBtnDisable ? "skel-btn-cancel" : "skel-btn-submit"} disabled={prevBtnDisable} onClick={() => { proceedPrevStep(nextStepCount) }}>Go to Previous Step</button>
                                </div>
                                <div className="col-6">
                                    <button type="button" class={nextBtnDisable ? "skel-btn-cancel" : "skel-btn-submit"} disabled={nextBtnDisable} onClick={() => { proceedNextStep(nextStepCount) }}>Proceed to Next Step</button>
                                </div>
                            </div>
                        </div>
                        <div id="skel-help-tips-base">
                            <a class="skel-help-tips" data-tooltip="Help Tips" data-placement="left" onClick={() => { setOpenProgressPopup(true) }}>
                                <i class="fa fa-question-circle"></i>
                                <i class="fa fa-times"></i>
                            </a>
                        </div>
                        {/* Floating Icons Ends */}
                    </div>
                </div>
            </div>
        </div>
    )
}
export default SlaLayout