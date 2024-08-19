import { isEmpty } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import { Element } from 'react-scroll'
import { hideSpinner, showSpinner } from '../../common/spinner'
import { properties } from '../../properties'
import CustomerDetails from './CustomerDetails'
import InteractionList from './InteractionList'
import ServiceRequestList from './ServiceRequestList'
import { get } from '../../common/util/restUtil'
let clone = require('clone');

const ViewTicketDetails = (props) => {

    const { identificationNo } = props?.data
    const [customerDetails, setCustomerDetails] = useState({})
    const [serviceRequestList, setServiceRequestList] = useState({ count: 0, rows: [] })
    const [interactionList, setInteractionList] = useState({ count: 0, rows: [] })
    const [selectedTicket, setSelectedTicket] = useState()

    const globalSearchTicket = useCallback(() => {
        if (identificationNo) {
            get(`${properties.CUSTOMER_API}/oms/search/${identificationNo}`).then((resp) => {
                if (resp && resp?.data && resp?.data?.count > 0) {
                    const serviceRequest = []
                    const interactionRequest = []
                    resp?.data?.rows?.forEach((e) => {
                        if (e.ticketType !== 'TTY0001') {
                            serviceRequest.push(e)
                        } else {
                            interactionRequest.push(e)
                        }
                    })
                    unstable_batchedUpdates(() => {
                        setSelectedTicket(resp?.data?.rows?.[0])
                        setServiceRequestList({ count: serviceRequest?.length ?? 0, rows: serviceRequest })
                        setInteractionList({ count: interactionRequest?.length ?? 0, rows: interactionRequest })
                    })
                }
            }).catch((error) => {
                console.error(error)
            }).finally(hideSpinner)
        }
    }, [identificationNo])

    const getTicketDetails = useCallback((ticketId) => {
        if (ticketId) {
            showSpinner()
            get(`${properties.CUSTOMER_API}/oms/details/${ticketId}`).then((resp) => {
                if (resp && resp?.data) {
                    const address = resp?.data?.addressDetails?.reduce((merged, ele) => { return { ...merged, ...ele } }, {})
                    let response = clone(resp?.data)
                    response.addressDetails = address
                    setCustomerDetails(response)
                }
            }).catch((error) => {
                console.error(error)
            }).finally(hideSpinner)
        }
    }, [])

    useEffect(() => {
        globalSearchTicket()
    }, [globalSearchTicket, identificationNo])

    useEffect(() => {
        getTicketDetails(selectedTicket?.appId)
    }, [getTicketDetails, selectedTicket])

    return (
        <>
            {!isEmpty(customerDetails) ? <div className="cust360 col-md-12">
                <div className="scrollspy-div">
                    {/* Customer Details */}
                    <Element name="customerSection" className="edit-customer">
                        {/* <div className="row">
                            <section className="triangle col-12 pb-2">
                                <div className="row col-12">
                                    <div className="col-9">
                                        <h4 id="list-item-0" className="pl-1">{customerDetails?.customerName ?? ''}</h4>
                                    </div>
                                    <div className="col-3 text-left">
                                        <span style={{ marginBottom: "5px", float: "right" }}>
                                        </span>
                                    </div>
                                </div>
                            </section>
                        </div> */}
                        <div className="row pt-1">
                            <div className="col-md-12">
                                <div className="form-row ml-0 mr-0">
                                    <div className="form-row col-md-12 p-0 ml-0 mr-0">
                                        <div className="col-md-12 card-box m-0 p-0">
                                            {
                                                <CustomerDetails
                                                    data={{
                                                        customerDetails: customerDetails
                                                    }}
                                                />
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Element>
                    {/* Service Request List */}
                    <Element name="serviceRequestSection" className="edit-customer">
                        <section className="col-md-12">
                            <div className="tit-his row col-md-12">
                                <div className="col-md-8">
                                    <h5 className="pl-1">Service Request History</h5>
                                </div>
                            </div>
                        </section>
                        <div className="col-md-12 pl-2 pr-2 pt-2 pb-1">
                            <div className="form-row ml-0 mr-0">
                                <div className="form-row col-md-12 p-0 ml-0 mr-0">
                                    <div className="col-md-12 m-0 p-0">
                                        <ServiceRequestList
                                            data={{
                                                customerDetails: customerDetails,
                                                serviceRequestList: serviceRequestList
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Element>
                    {/* Interaction Request List */}
                    <Element name="serviceRequestSection" className="edit-customer">
                        <section className="col-md-12">
                            <div className="tit-his row col-md-12">
                                <div className="col-md-8">
                                    <h5 className="pl-1">Interaction History</h5>
                                </div>
                            </div>
                        </section>
                        <div className="col-md-12 pl-2 pr-2 pt-2 pb-1">
                            <div className="form-row ml-0 mr-0">
                                <div className="form-row col-md-12 p-0 ml-0 mr-0">
                                    <div className="col-md-12 m-0 p-0">
                                        <InteractionList
                                            data={{
                                                customerDetails: customerDetails,
                                                interactionList: interactionList
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Element>
                </div>
            </div>
                :
                <p className="skel-widget-warning">No records found!!!</p>
            }
        </>
    )
}

export default ViewTicketDetails