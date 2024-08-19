import { useCallback, useEffect, useState } from "react"
import { get, post } from "../../../../../common/util/restUtil"
import { properties } from "../../../../../properties"
import { nanoid } from "nanoid"
import { removeDuplicateObjects } from "../../../../../common/util/commonUtils"
import WorkForcePie from "../Chart/WorkForcePie"

const WorkForceAnalytics = (props) => {

    const { interactionDetails = {} } = props?.data
    const [interactionAnalytics, setInteractionAnalytics] = useState([])
    const [workflowHistory, setWorkflowHistory] = useState({ userList: [], roleList: [] })
    const [analysisInputs, setAnalysisInputs] = useState({})
    console.log('eeeee')
    const getWorkForceAnalytics = useCallback(() => {
        if (interactionDetails?.intxnNo) {
            const requestBody = { ...analysisInputs }
            post(`${properties.INTERACTION_API}/Work-force/analytics/${interactionDetails?.intxnNo}`, requestBody)
                .then((response) => {
                    if (response.status === 200) {
                        setInteractionAnalytics(response?.data)
                    }
                }).catch(error => console.error(error))
                .finally()
        }
    }, [analysisInputs, interactionDetails?.intxnNo])

    const getWorkflowHistory = useCallback(() => {
        if (interactionDetails?.intxnNo) {
            get(`${properties.INTERACTION_API}/history/${interactionDetails?.intxnNo}?getFollowUp=false&getAttachment=false`)
                .then((response) => {
                    if (response?.status === 200) {
                        let userList = response?.data?.rows?.map((item) => ({ code: item?.flwCreatedby?.userId, description: item?.flwCreatedby?.flwCreatedBy }))
                        userList = removeDuplicateObjects(userList, 'code')
                        let roleList = response?.data?.rows?.map((item) => ({ code: item?.fromRoleName?.roleId, description: item?.fromRoleName?.roleDesc }))
                        roleList = removeDuplicateObjects(roleList, 'code')
                        setWorkflowHistory({ userList, roleList })
                    }
                }).catch((error) => { console.error(error) })
                .finally()
        }
    }, [interactionDetails?.intxnNo])

    useEffect(() => {
        getWorkForceAnalytics()
    }, [getWorkForceAnalytics])

    useEffect(() => {
        getWorkflowHistory()
    }, [getWorkflowHistory])

    const handleOnChange = (e) => {
        setAnalysisInputs({
            ...analysisInputs,
            [e.target.id]: e.target.value,
            [`${e.target.id}Desc`]: e.target.options[e.target.selectedIndex].dataset.customValue
        })
    }

    return (
        < div className="cmmn-skeleton mt-2" >
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">Workforce Analytics</span>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-graph-sect mt-3">

                <div className="row">
                    <div className="col-md-4">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label">By Role</label>
                            <select id="roleId" className="form-control" value={analysisInputs?.roleId ?? ''} onChange={handleOnChange}>
                                <option value="">Select</option>
                                {workflowHistory?.roleList?.map((e) => (
                                    <option key={nanoid()} value={e?.code} data-custom-value={e?.description}>{e?.description}</option>
                                ))}
                            </select><span className="errormsg"></span>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="form-group">
                            <label htmlForr="userId" className="control-label">By User</label>
                            <select id="userId" className="form-control" value={analysisInputs?.userId ?? ''} onChange={handleOnChange}>
                                <option value="">Select</option>
                                {workflowHistory?.userList?.map((e) => (
                                    <option key={nanoid()} value={e?.code} data-custom-value={e?.description}>{e?.description}</option>
                                ))}
                            </select><span className="errormsg"></span>
                        </div>
                    </div>
                </div>
                <div className="mt-1 mb-2">Status wise ageing <span className="font-weight-bold">{analysisInputs?.userId ? `by ${analysisInputs?.userIdDesc}` : ''}</span></div>
                <div className="row">
                    <div className="col-md-4">
                        <table className="table table-hover mb-0 table-centered table-nowrap">
                            <tbody>
                                {interactionAnalytics?.length > 0 && interactionAnalytics?.map((ia) => {
                                    if (ia) {
                                        return (<tr key={nanoid()}>
                                            <td key={nanoid()}><h5 className="font-size-14">{ia?.keys ?? '-'}</h5></td>
                                            <td key={nanoid()}>
                                                <p className="text-dark mb-0 cursor-pointer"
                                                    data-toggle="modal">{Number(ia?.values?.years) ? `${ia?.values?.years} Year's ` : ''}
                                                    {ia?.values?.months ? `${ia?.values?.months} Month's ` : ''}
                                                    {ia?.values?.days ? `${ia?.values?.days} day's ` : ''}
                                                    {ia?.values?.hours ? `${ia?.values?.hours} hrs ` : ''}
                                                    {ia?.values?.minutes ? `${ia?.values?.minutes} min's ` : ''}
                                                    {ia?.values?.seconds ? `${ia?.values?.seconds} sec's ` : ''}
                                                </p>
                                            </td>
                                        </tr>)
                                    }
                                })}
                            </tbody>
                        </table>

                    </div>
                    <div className="col-md-8">
                        <WorkForcePie data={{ interactionLookUp: interactionAnalytics }} />
                        {/* <embed src="./assets/chart/status-wise.html" type="text/html" width="100%" height="418" /> */}
                    </div>
                </div>
            </div>
        </div>
    )
}
export default WorkForceAnalytics