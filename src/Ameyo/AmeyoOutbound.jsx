import React, { useCallback, useEffect, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { hideSpinner, showSpinner } from '../common/spinner';
import { properties } from '../properties';
import { ameyoGet } from '../common/util/restUtil';
import ViewTicketDetails from './outbound/ViewTicketDetails';
import { toast } from 'react-toastify';

const AmeyoOutbound = (props) => {
    // const qryString = new URLSearchParams(props?.location?.search);
    let identificationNo = props?.data?.phone
    if (identificationNo && identificationNo?.length > 7) {
        identificationNo = identificationNo.substring(identificationNo.length, (identificationNo.length - 7))
    }

    const accessToken = localStorage.getItem("accessToken")
    const [customerDetails, setCustomerDetails] = useState({})
    const [interactionList, setInteractionList] = useState({ count: 0, rows: [] })
    const [perPage, setPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    // eslint-disable-next-line no-unused-vars
    const [filters, setFilters] = useState()
    const isTableFirstRender = useRef(true)
    const hasExternalSearch = useRef(false)

    const globalSearchTicket = useCallback(() => {
        if (identificationNo && accessToken) {
            showSpinner()
            ameyoGet(`${properties.CUSTOMER_DETAILS}/contact/${identificationNo}`, '', accessToken).then((response) => {
                if (response && response?.data) {
                    const customerObj = response?.data?.customerDetails?.[0] ?? response?.data
                    let customer = {
                        customerId: customerObj?.customerId ?? '',
                        customerName: (customerObj?.firstName ?? '') + ' ' + (customerObj?.lastName ?? ''),
                        firstName: customerObj?.firstName ?? '',
                        lastName: customerObj?.lastName ?? '',
                        contactNo: response?.data?.contactNo ?? '',
                        email: response?.data?.email ?? '',
                        emailcheck: customerObj?.email ? true : false,
                        customerType: customerObj?.custType ?? '',
                        contactPreference: customerObj?.contactPreference ?? '',
                        contactId: response?.data?.contactId ?? '',
                        addressDetails: {
                            addressId: customerObj?.address?.addressId ?? '',
                            hno: customerObj?.address?.hno ?? '',
                            building: customerObj?.address?.buildingName ?? '',
                            street: customerObj?.address?.street ?? '',
                            cityTown: customerObj?.address?.city ?? '',
                            state: customerObj?.address?.state ?? '',
                            stateDesc: customerObj?.address?.state ?? '',
                            districtDesc: customerObj?.address?.district ?? '',
                            postCodeDesc: customerObj?.address?.postCode ?? '',
                            district: customerObj?.address?.district ?? '',
                            country: customerObj?.address?.country ?? '',
                            postCode: customerObj?.address?.postCode ?? ''
                        }
                    }
                    if (customer.contactNo.length > 7 && customer.contactNo.length === 10) {
                        customer.contactNo = customer.contactNo.substring(3, 10)
                    }
                    unstable_batchedUpdates(() => {
                        setCustomerDetails(customer)
                    })
                }
            }).finally(hideSpinner)
        }
    }, [accessToken, identificationNo])

    const getInteractionList = useCallback((customerId) => {
        if (customerId && accessToken) {
            showSpinner()
            ameyoGet(`${properties.INTERACTION_API}?customerId=${customerId}&limit=${perPage}&page=${currentPage}&list=ALL`, '', accessToken).then((resp) => {
                unstable_batchedUpdates(() => {
                    setInteractionList(resp?.data)
                    setTotalCount(resp?.data?.count || 0)
                })
            }).catch(error => console.error(error))
                .finally(hideSpinner)
        }
    }, [accessToken, currentPage, perPage])

    useEffect(() => {
        globalSearchTicket()
    }, [globalSearchTicket, identificationNo])


    useEffect(() => {
        getInteractionList(customerDetails?.customerId)
    }, [customerDetails?.customerId, currentPage, perPage, getInteractionList])

    useEffect(() => {
        if (!identificationNo) {
            toast.warn('Please Provide valid Phone Number')
        }

        if (!!!accessToken) {
            toast.warn('There is no permission to perform the action.')
        }
    }, [identificationNo, accessToken])

    return (
        <>
            <ViewTicketDetails
                data={{
                    customerDetails: customerDetails || {},
                    interactionList: interactionList || {},
                    currentPage: currentPage,
                    totalCount: totalCount,
                    isTableFirstRender: isTableFirstRender,
                    hasExternalSearch
                }}
                handlers={{
                    setCurrentPage,
                    setPerPage,
                    setFilters
                }}
            />
        </>
    )

}

export default AmeyoOutbound