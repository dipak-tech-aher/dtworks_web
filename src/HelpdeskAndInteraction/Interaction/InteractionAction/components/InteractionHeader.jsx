import { nanoid } from 'nanoid';
import { statusConstantCode } from "../../../../AppConstants";
import DashboardIcons from "../../../../assets/images/dashboard-icons.svg";
import LiveStream from "../../../../assets/images/livestream.svg";
import { getColorClass, getFullName } from "../../../../common/util/commonUtils";
import { DefaultDateFormate } from "../../../../common/util/dateUtil";
import { properties } from '../../../../properties';
import { getPermissions } from '../../../../common/util/util';
import { useCallback, useEffect, useState } from 'react';
import { useHistory } from '../../../../common/util/history';

const InteractionHeader = (props) => {
    const { interactionDetails, isInsightView, lookupData, dtWorksProductType } = props?.data
    const { setIsInSightView } = props?.stateHandlers
    const { handleOnClick } = props?.functionHandlers
    const [screenPermission, setScreenPermission] = useState()
    const [componentPermission, setComponentPermission] = useState()
    const history = useHistory()
    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions('INTERACTION_360')
                setScreenPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error)
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        if (screenPermission && Array.isArray(screenPermission?.components) && screenPermission?.components?.length > 0) {
            if (screenPermission?.accessType === 'allow') {
                let componentPermissions = {}
                screenPermission.components.forEach(component => {
                    componentPermissions[component.componentCode] = component.accessType;
                });
                setComponentPermission(componentPermissions)
            }
        }
    }, [screenPermission])

    const checkComponentPermission = useCallback((permission) => {
        if (componentPermission && componentPermission[permission]) {
            return componentPermission[permission] === 'allow'
        }
        return false
    }, [componentPermission])
    const handleOrderConversion = () => {
        const data = {
            ...interactionDetails
        }
        if (interactionDetails.customerId) {
            localStorage.setItem('createOrderData', JSON.stringify(data));

            window.open(`${properties.REACT_APP_BASE}/create-order`, "_blank")
        } else{
            history(`/new-customer`)
        }
    }
    return (
        <div className="cmmn-skeleton mt-2" key={nanoid()}>
            <div className="skel-i360-base">
                <div className="skel-intcard">
                    <div className="skel-flex-card-int" key={nanoid()}>
                        <span className="skel-profile-heading mb-0">{interactionDetails?.intxnNo ?? ''}</span>
                        <span className={`status-new ml-1 ${getColorClass(lookupData?.current?.INTERACTION_STATUS, interactionDetails?.intxnStatus?.code) ?? 'skel-d-status'}`}>{interactionDetails?.intxnStatus?.description ?? ''}</span>
                        <span className={`priority-high ml-1 mr-1 ${getColorClass(lookupData?.current?.PRIORITY, interactionDetails?.intxnPriority?.code) ?? 'skel-h-status'}`}>{interactionDetails?.intxnPriority?.description ?? ''}</span>
                    </div>
                    {interactionDetails?.helpdeskNo && <div className="my-1" key={nanoid()}>
                        <i className="fa fa-link" aria-hidden="true" />
                        <span className="txt-underline cursor-pointer" style={{ color: 'rgb(6 88 242)' }}
                            onClick={() => handleOnClick(statusConstantCode?.entityCategory?.HELPDESK, { helpdeskId: interactionDetails?.helpdeskId })}> {interactionDetails?.helpdeskNo ?? ''}</span>
                    </div>}
                    {dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE ?
                        <div>Subscription Number: <strong>{interactionDetails?.serviceDetails?.serviceNo ?? ''}</strong>
                        </div> : <></>}
                    {interactionDetails?.createdBy && <span key={nanoid()} className="skel-int-cr-date">{getFullName(interactionDetails?.createdBy) ?? ''} | Created Date: {interactionDetails?.createdAt ? DefaultDateFormate(interactionDetails?.createdAt, 'DD-MM-YYYY HH:mm:ss A') ?? '-' : '-'}</span>}
                    {(interactionDetails?.requestStatement || interactionDetails?.intxnProblemCode) &&
                        <span className="skel-int-statement" key={nanoid()}>
                            <blockquote>{
                                interactionDetails?.intxnProblemCode
                                    ? interactionDetails?.intxnProblemCode?.description
                                    : interactionDetails?.requestStatement
                            }</blockquote>
                        </span>}
                </div>
                <div className="skel-intcard-insight" key={nanoid()}>
                    <div className="db-list mb-0 pl-0" key={nanoid()}>

                        {checkComponentPermission('CONVERT_TO_ORDER') &&
                            <div className="list-dashboard db-list-active skel-btn-submit skel-informative-insight-view cursor-pointer">
                                <span className="db-title" onClick={() => { handleOrderConversion() }}>
                                    Convert to Order
                                </span>
                            </div>}
                        <div className="list-dashboard db-list-active skel-btn-submit skel-self-normal-view cursor-pointer" id="skel-self-interaction-insight-view" onClick={() => { setIsInSightView(!isInsightView) }}>
                            <span className="db-title"><img alt='insight' src={isInsightView ? DashboardIcons : LiveStream} className="img-fluid pr-1" /> {`Switch to  ${isInsightView ? 'Normal View' : 'Insight View'}`}</span>
                        </div>
                        <div className="list-dashboard db-list-active skel-btn-submit skel-informative-insight-view cursor-pointer" id="skel-informative-interaction-normal-view"
                            style={{ display: 'none' }}>
                            <span className="db-title">
                                <img src={DashboardIcons} alt='normal' className="img-fluid pr-1" /> Switch to Normal View
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default InteractionHeader