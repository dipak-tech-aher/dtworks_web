import React, { useEffect, useState } from 'react'
import { CloseButton, Modal } from "react-bootstrap";
import ratingHappy from "../../../../assets/images/like.png";
import ratingDislike from "../../../../assets/images/dislike.png";
import ratingNeutral from "../../../../assets/images/not-sure.png";
import { post, get } from '../../../../common/util/restUtil';
import { properties } from '../../../../properties';
import { nanoid } from 'nanoid';
import moment from 'moment'
import { useHistory } from '../../../../common/util/history';
export default function SurveyFeedback(props) {
    let { customerNo, profileNo } = props?.data ?? {};
    // console.log(props?.data ?? {})
    const history = useHistory()
    const [feedbackObj, setFeedbackObj] = useState(null);
    const [surveyList, setSurveyList] = useState([]);
    const getfeedBacks = async () => {
        try {
            post(properties.CUSTOMER_API + '/get-survey', { customerNo, profileNo }).then((res) => {
                if (res?.data?.length) {
                    let formated = res?.data.map((feedback) => {
                        feedback.total = feedback?.surveyDtl.reduce((sum, item) => {
                            return sum + Number(item?.metricScale ?? 0)
                        }, 0)
                        feedback.score = feedback?.surveyDtl.reduce((sum, item) => {
                            return sum + Number(item?.metricScore ?? 0)
                        }, 0)
                        feedback.max = Math.max(...feedback?.surveyDtl.map(o => Number(o.metricScale ?? 0)))
                        return feedback
                    })

                    setSurveyList(formated)
                    console.log("feedback", formated)
                }
            }).catch(err => {
                console.log('Survey Feedback Error===>', err)
            })
        } catch (e) {
            console.log('error', e)
        }
    }
    useEffect(() => {
        if (customerNo || profileNo) getfeedBacks();
    }, [customerNo, profileNo]);
    const onRedirrect = () => {
        try {
            if (feedbackObj?.entityCategory === "INTERACTIONs") {
                get(`${properties.INTERACTION_API}/search?q=${feedbackObj?.entityCategoryValue}`).then((resp) => {
                    if (resp.status === 200) {
                        const response = resp.data?.[0];
                        const data = {
                            ...response,
                            sourceName: 'customer360'
                        }
                        if (response.customerUuid) {
                            localStorage.setItem("customerUuid", response.customerUuid)
                            localStorage.setItem("customerIds", response.customerId)
                        }
                        history(`/interaction360`, { state: { data } })
                    } else {
                        //
                    }
                }).catch(error => {
                    console.error(error);
                });
            } else if (feedbackObj?.entityCategory === "HELPDESK") {
                const requestBody = {
                    helpdeskNo: feedbackObj?.entityCategoryValue,
                    contain: ['CUSTOMER', 'INTERACTION']
                }
                post(`${properties.HELPDESK_API}/search?limit=10&page=0`, requestBody).then((response) => {
                    if (response && response?.data && response?.data?.rows && response?.data?.rows.length > 0) {
                        history(`/view-helpdesk`, { state: { data: response?.data?.rows[0] } })
                    }
                }).catch(error => {
                    console.error(error);
                });
            }
        } catch (e) {
            console.log('error', e)
        }
    }
    const showEmoji = (rating) => {
        if (Number(rating) < 49) {
            return ratingDislike
        } else if (Number(rating) >= 50 && Number(rating) < 69) {
            return ratingNeutral
        }
        return ratingHappy
    }
    const showFeedback = Boolean(feedbackObj);
    return (
        <>
            <div class="f-wrap-child">
                <div class="">
                    <div class="skel-view-base-card">
                        <span class="skel-profile-heading">Survey Feedback </span>
                        {surveyList?.length ?
                            <div class="skel-cust-view-det">
                                {surveyList.map((feedback) => {
                                    let sum = (Number(feedback?.score) / Number(feedback?.surveyDtl?.length));
                                    // let sum = (Number(feedback?.score) && Number(feedback?.total)) ? (Number(feedback?.score) / Number(feedback?.total)) : 0;
                                    // console.log(sum, feedback?.surveyDtl?.length)
                                    return (
                                        <div class="skel-inter-hist" key={nanoid()}>
                                            <div class="skel-serv-sect-lft">
                                                <span class="skel-lbl-flds txt-ellips-lg d-block" onClick={() => setFeedbackObj(feedback)}>{feedback.surveyName}</span>
                                                <span class="skel-survey-metric">{!isNaN(sum) ? sum ? sum.toFixed(2) : 0 : 0}/{feedback?.max}</span><br />
                                                <span class="skel-cr-date">{moment(feedback?.createdAt).format('hh:mm A z, DD-MM-YYYY')}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            : <span className="skel-widget-warning">
                                No Survey Feedback Found!!!
                            </span>
                        }
                    </div>
                </div>
            </div>
            {/*<!-- Feedback Modal -->*/}
            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={showFeedback} onHide={() => setFeedbackObj(null)} dialogClassName='cust-md-modal'>
                <Modal.Header>
                    <Modal.Title><h5 className="modal-title">Feedback details of {feedbackObj?.customerName}
                    </h5></Modal.Title>
                    <CloseButton onClick={() => setFeedbackObj(null)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>

                    </CloseButton>
                </Modal.Header>
                <Modal.Body>
                    <div className="skel-survey-feedback-sect">
                        <div className="skel-feeback-info">
                            <span className="skel-header-title">{feedbackObj?.surveyName}</span>
                            <span className="txt-lnk txt-underline cursor-pointer" onClick={() => onRedirrect()}>{feedbackObj?.entityCategoryValue}</span><br />
                            <span className='skel-int-cr-date'>{moment(feedbackObj?.createdAt).format(' DD-MM-YYYY hh:mm A z')}</span>
                            {/* <span className='skel-int-cr-date'>06-06-2024 03:45 PM IST</span> */}
                        </div>
                        <hr className='cmmn-hline' />
                        <div className='skel-feedback-ques'>
                            {feedbackObj?.surveyDtl?.map((item) => {
                                let sum = (Number(item?.metricScore) && Number(item?.metricScale)) ? (Number(item?.metricScore) / Number(item?.metricScale)) : 0, TotalSum = !isNaN(sum) ? sum ? (sum * 100).toFixed(1) : 0 : 0;
                                return (
                                    <div className='skel-ques-sect' key={nanoid()}>
                                        <span className='skel-header-title'>{item?.questionText}</span>
                                        <div className="mt-1 mb-1 d-flex skel-feedback-rating">
                                            <img src={showEmoji(TotalSum)} alt='' className='skel-rating-skills' />
                                            <span className="text-center rating mb-0"><span>{TotalSum}</span>/{item?.metricScale}</span>
                                        </div>
                                    </div>
                                )
                            })}

                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    )
}