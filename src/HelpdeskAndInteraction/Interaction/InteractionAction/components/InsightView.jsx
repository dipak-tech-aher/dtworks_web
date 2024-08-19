import { isEmpty } from 'lodash';
import { useCallback, useEffect, useState } from "react";
import { unstable_batchedUpdates } from "react-dom";
import sure from "../../../../assets/images/sure.png";
import { get } from "../../../../common/util/restUtil";
import { properties } from "../../../../properties";
import Line from "./Chart/Line";
import CategoryAndTypeOverview from './Insight/CategoryAndTypeOverview';
import ChannelWiseInteraction from "./Insight/ChannelWiseInteraction";
import LocationWiseInteraction from './Insight/LocationWiseInteraction';
import StatementOverview from './Insight/StatementOverview';
import WorkForceAnalytics from './Insight/WorkForceAnalytics';

const InsightView = (props) => {

    const { interactionDetails = {}, weeklyStatementLookUpRef, weeklyInteractionsLookUpRef, isPublicService } = props?.data
    const [statementHistory, setStatementHistory] = useState([])
    const [statementChannelWise, setStatementChannelWise] = useState()
    const [statementStatusWiseCount, setStatementStatusWiseCount] = useState({ total: 0, open: 0, closed: 0 })
    const [statementAvgDays, setStatementAvgDays] = useState()
    const [interactionWeeklyStatics, setInteractionWeeklyStatics] = useState()

    const processWeeklyStatement = useCallback((data) => {
        unstable_batchedUpdates(() => {
            setStatementChannelWise(data?.groupedChannels ?? []);
            setStatementHistory(data?.statementOverView ?? [])
            setStatementStatusWiseCount(data?.statusWise)
            setStatementAvgDays(data?.statementAvgDays || 0);
        })
    }, [])

    const processWeeklyInteractionStatement = useCallback((data) => {
        setInteractionWeeklyStatics(data)
    }, [])

    const getWeeklyStatementOverView = useCallback(() => {
        if (interactionDetails?.requestId && isEmpty(weeklyStatementLookUpRef.current)) {
            get(`${properties.INTERACTION_API}/get-related-statement-info/count/${interactionDetails.requestId}`)
                .then((response) => {
                    if (response?.status === 200) {
                        const { data = {} } = response
                        weeklyStatementLookUpRef.current = data ?? {}
                        processWeeklyStatement(data ?? {})
                    }
                }).catch((error) => { console.error(error) })
        }

    }, [interactionDetails.requestId, processWeeklyStatement, weeklyStatementLookUpRef])

    const getWeeklyInteraction = useCallback(() => {
        if (interactionDetails?.intxnNo && isEmpty(weeklyInteractionsLookUpRef?.current)) {
            get(`${properties.INTERACTION_API}/weekly/count?interactionType=${interactionDetails?.intxnType?.code}&interactionCategory=${interactionDetails?.intxnCategory?.code}`)
                .then((response) => {
                    if (response?.status === 200) {
                        const { data = {} } = response
                        weeklyInteractionsLookUpRef.current = data ?? {}
                        processWeeklyInteractionStatement(data ?? {})
                    }
                }).catch((error) => { console.error(error) })
        }
    }, [interactionDetails, processWeeklyInteractionStatement, weeklyInteractionsLookUpRef])


    useEffect(() => {
        if (weeklyStatementLookUpRef?.current) {
            processWeeklyStatement(weeklyStatementLookUpRef?.current)
        } else {
            getWeeklyStatementOverView()
        }
    }, [getWeeklyStatementOverView, interactionDetails, processWeeklyStatement, weeklyStatementLookUpRef])

    useEffect(() => {
        if (weeklyInteractionsLookUpRef?.current) { processWeeklyInteractionStatement(weeklyInteractionsLookUpRef?.current) }
        else { getWeeklyInteraction() }
    }, [getWeeklyInteraction, processWeeklyInteractionStatement, weeklyInteractionsLookUpRef])

    return (
        <div className="skel-informative-data mt-2 mb-2">
            <div className="row">
                <div className="col-md-8">
                    <div className="cmmn-skeleton">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title">Frequency of the Similar Interaction for last 7 days</span>
                        </div>
                        <hr className="cmmn-hline" />
                        <div className="skel-graph-sect mt-0">
                            <Line data={{ statementHistory }} />
                        </div>
                    </div>
                    {<StatementOverview data={{ statementStatusWiseCount, statementAvgDays, interactionDetails }} />}
                    <WorkForceAnalytics data={{ interactionDetails }} />
                </div>
                <div className="col-md-4">
                    <div className="cmmn-skeleton mb-2">
                        <div className="text-center mt-4 mb-3">
                            <img src={sure} alt='sure' width="60" className="" />
                            <h5 className="text-center rating sure mt-2"><span>0</span>/5</h5>
                            <p className="line-height-normal"><span className="text-40">“</span>Query has resolved successfully with-in short period!
                                Very happy with their resolution.</p>

                        </div>
                    </div>
                    <CategoryAndTypeOverview data={{ interactionWeeklyStatics }} />
                    <ChannelWiseInteraction data={{ statementChannelWise, interactionDetails }} />
                    {!isPublicService && <LocationWiseInteraction />}
                </div>
            </div >
        </div >
    )
}

export default InsightView;

