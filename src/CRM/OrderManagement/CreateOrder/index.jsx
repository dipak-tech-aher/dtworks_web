import { fontSize } from "@mui/system";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { CloseButton, Modal } from "react-bootstrap";
import { get, post, slowGet, slowPost } from '../../../common/util/restUtil';
import { properties } from '../../../properties';
import { toast } from 'react-toastify';
import moment from 'moment';
import { unstable_batchedUpdates } from 'react-dom';
import RequestStatement from "./RequestStatement";
import { useComboboxControls } from "react-datalist-input";
import clone from "clone";
import { statusConstantCode } from "../../../AppConstants";
import ConsumerDetailsView from "../../../HelpdeskAndInteraction/Interaction/CreateInteraction/ConsumerDetailsView";
import OrderManagement from "../../Customer360/ManageServices/ManageCatalog/OrderManagement";

export default function CreateOrder(props) {
  const { appsConfig } = props
  const createOrderData = JSON.parse(localStorage.getItem('createOrderData'))

  // console.log('createOrderData ', createOrderData)
  const dtWorksProductType = appsConfig.businessSetup?.[0]
  const subscriptionDetails = props?.location?.state?.data ? props?.location?.state?.data : createOrderData.serviceDetails
  const customerDetails = props?.location?.state?.data ? subscriptionDetails?.customerDetails : createOrderData.customerDetails
  // console.log('subscriptionDetails ', subscriptionDetails)

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalRC, setTotalRC] = useState(0);
  const [totalNRC, setTotalNRC] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [statementList, setStatementList] = useState([]);
  const [orderData, setOrderData] = useState({});
  const [error, setError] = useState({});
  const [selectedCategory, setSelectedCategory] = useState()
  const [isFormDisabled, setIsFormDisabled] = useState(false)
  const [formDetails, setFormDetails] = useState({})
  const [selectedStatement, setSelectedStatement] = useState({})
  const [permission, setPermission] = useState({})
  const [orderType, setOrderType] = useState()
  const [orderCategory, setOrderCategory] = useState()
  let stats
  let openInteractionCount = useRef(0),
    closedInteractionCount = useRef(0),
    totalInteractionsCount = useRef(0);
  const manageServiceRef = useRef();
  const [workflowPaylod, setWorkflowPaylod] = useState({
    flowId: "",
    conversationUid: "",
    data: {
      source: "knowledgeBase",
    },
  });

  let [workflowResponse, setWorkflowResponse] = useState([]);
  let [resolutionData, setResolutionData] = useState([]);
  const [serviceTypeLookup, setServiceTypeLookup] = useState([])


  let newArray = clone(resolutionData)

  const { isExpanded, setIsExpanded, setValue, value } = useComboboxControls({
    isExpanded: true,
  });

  const handleKnowledgeSelect = (knowledgeBase) => {
    // console.log(knowledgeBase)
    unstable_batchedUpdates(() => {
      if (knowledgeBase) {
        setOrderCategory(knowledgeBase?.orderCategory)
        setOrderType(knowledgeBase?.orderType)
        // handleFrequentInteractionChange(knowledgeBase, "");
        setOrderData({
          ...orderData,
          statementId: Number(knowledgeBase?.requestId) || "",
          statement: knowledgeBase?.requestStatement || "",
          statementSolution: knowledgeBase?.intxnResolution || "",
          problemCause: knowledgeBase?.intxnCause || "",
          serviceType: knowledgeBase.serviceType || "",
          orderType: knowledgeBase?.orderType || "",
          orderCategory: knowledgeBase?.orderCategory || "",
          serviceCategory: knowledgeBase?.serviceCategory || "",
          contactPreference: customerDetails?.contactPreferences,
          appointmentRequired: knowledgeBase?.isAppointment === 'Y' ? true : false,
          priorityCode: knowledgeBase?.priorityCode || "",
          orderSource: 'Customer'
        });

        // getWorkFlow({ serviceCategory: knowledgeBase?.serviceCategory, serviceType: knowledgeBase?.serviceType, orderType: knowledgeBase?.intxnType, orderCategory: knowledgeBase?.intxnCategory })

        setError({
          ...error,
          statementId: "",
          statement: "",
          statementSolution: "",
          problemCause: "",
          serviceType: "",
          orderType: "",
          orderCategory: "",
          serviceCategory: "",
        });
        // setOpenCreateInteraction(true);
      } else {
        setOrderData({
          ...orderData,
          statementId: "",
          statement: "",
        });
        setError({
          ...error,
          statementId: "",
          statement: "",
        });
      }
    });
  };

  const workflowApiCall = (reqBody, data, paylodData) => {
    unstable_batchedUpdates(() => {
      if (data && data?.length > 0) {
        reqBody.data.resolutionData = JSON.stringify(data);
      }
      // // console.log("reqBody ==> ", reqBody)
      slowPost(`${properties.WORKFLOW_API}/resolution`, reqBody)
        .then((resp) => {
          let messageObject = {
            from: "bot",
            msg: resp.data,
          };
          setWorkflowResponse([...workflowResponse, messageObject]);
          newArray.push(messageObject);
          setResolutionData(newArray);
        })
        .catch(error => {
          // console.log(error)
        })
    });
  };

  const flushOlderResponse = () => {
    workflowResponse = [];
    setWorkflowResponse(workflowResponse);
  };

  useEffect(() => {
    manageServiceRef.current = subscriptionDetails
    post(`${properties.INVOICE_API}/search?limit=&page=`, { serviceUuid: subscriptionDetails?.serviceUuid }).then((resp) => {
      if (resp.data) {
        const closedInvoices = resp.data.rows.filter(m => m.invoiceStatus === 'CLOSED')
        const openInvoices = resp.data.rows.filter(m => m.invoiceStatus === 'OPEN')

        let outstandingAmt = 0, rc = 0, nrc = 0
        for (const inv of openInvoices) {
          // invoiceDetails.push(inv.invoiceDetails)

          rc += inv.invoiceDetails.reduce((total, charge) => {
            // console.log('charge ', charge)
            if (charge?.chargeCategory === 'CC_RC') {
              return total + Number(charge.chargeAmt)
            } else return total
          }, 0)

          nrc += inv.invoiceDetails.reduce((total, charge) => {
            if (charge?.chargeCategory === 'CC_NRC') {
              return total + Number(charge.chargeAmt)
            } else return total
          }, 0)

        }

        const totalRevenue = closedInvoices.reduce((total, inv) => {
          return total + Number(inv.invOsAmt)
        }, 0)

        outstandingAmt = rc + nrc
        setTotalRevenue(totalRevenue)
        setTotalOutstanding(outstandingAmt)
        setTotalRC(rc)
        setTotalNRC(nrc)
      }
    }).catch((error) => console.error(error))

  }, [])

  const getStatementList = (value) => {
    unstable_batchedUpdates(() => {
      if (value) {
        slowGet(
          `${properties.KNOWLEDGE_API}/search?q=${value}&st=${subscriptionDetails?.srvcTypeDesc?.code}`
        )
          .then((resp) => {
            if (resp?.data) {
              const arr = resp?.data?.map((i) => ({
                id: i.requestId, value: i.requestStatement, ...i,
              }))
              unstable_batchedUpdates(() => {
                setStatementList(arr);
                setIsExpanded(true);//to show the list in search bar        
              })
            }
          })
          .catch((error) => {
            console.error(error);
          })
          .finally();
      }
    })
  };

  const handleFrequentInteractionChange = (statement, type) => {
    // console.log("inside frequent interaction");
    resolutionData = [];
    setResolutionData([]);
    newArray = []
    unstable_batchedUpdates(() => {
      setIsFormDisabled(false)
      setFormDetails([])
      setValues([])

      setSelectedStatement(statement);
      const reqBody = {
        requestId: orderData?.statementId,
        consumerUuid: subscriptionDetails.customerUuid,
        consumerId: customerDetails?.customerId,
        consumerNo: customerDetails?.customerNo,
        accountUuid: subscriptionDetails?.accountUuid,
        serviceUuid: subscriptionDetails?.serviceUuid,
        from: statusConstantCode.entityCategory.ORDER,
      };

      console.log("inside frequent call get-knowledge-base");
      post(`${properties.KNOWLEDGE_API}/get-smartassistance-list`, { ...reqBody }).then(async (resp) => {
        // console.log("resp?.data?.requestId", resp?.data?.requestId);
        if (resp?.data?.requestId) {
          const intelligenceResponse = resp?.data?.intelligenceResponse;
          setWorkflowPaylod({
            flowId: resp?.data?.flwId,
            conversationUid: resp?.data?.conversationUid,
            data: {
              source: "knowledgeBase",
            },
          });
          workflowApiCall({
            flowId: resp?.data?.flwId,
            conversationUid: resp?.data?.conversationUid,
            data: {
              source: "knowledgeBase",
              reqBody
            },
          });

          setValue(resp.data.requestStatement);

          let slaDate
          try {
            const slaDateResp = await getEdoc({ requestId: resp?.data?.requestId ?? null });
            if (slaDateResp?.data && slaDateResp?.data?.oResolutionDate) {
              slaDate = moment(slaDateResp?.data?.oResolutionDate).format('YYYY-MM-DD');
              setslaEdoc(slaDate ?? '');
            }
          } catch (error) {
            console.error('Error fetching edoc:', error);
          }
          const setData = {
            interactionResolution: resp.data.intxnResolutionDesc?.description || "",
            statementId: Number(resp.data.requestId) || "",
            statement: resp.data.requestStatement || "",
            statementSolution: resp.data.intxnResolution || "",
            problemCause: resp.data.intxnCause || "",
            serviceType: resp.data.serviceType || "",
            interactionType: resp.data.intxnType || "",
            interactionCategory: resp.data.intxnCategory || "",
            serviceCategory: resp.data.serviceCategory || "",
            contactPreference: customerDetails?.contactPreferences,
            intelligenceResponse: intelligenceResponse,
            appointmentRequired: resp?.data?.isAppointment === 'Y' ? true : false,
            priorityCode: resp?.data?.priorityCode,
            edoc: orderData?.edoc || slaDate || ""
          }
          console.log("orderData ==> ", orderData)
          setOrderData({
            ...orderData,
            ...setData
          });
          setError({
            ...error,
            statementId: "",
            statement: "",
            statementSolution: "",
            problemCause: "",
            serviceType: "",
            interactionType: "",
            interactionCategory: "",
            serviceCategory: "",
          })

          getWorkFlow(setData)

        }
      })
        .catch((error) => {
          console.error(error);
        })
        .finally();

    });
  };
  const [currStatusLookup, setCurrStatusLookup] = useState([])
  const [workflowLookUp, setWorkflowLookup] = useState([])
  const [roleLookUp, setRoleLookup] = useState([])
  const [userLookUp, setUserLookup] = useState([])
  const [userList, setUserList] = useState([])

  const getWorkFlow = (data) => {
    // console.log("inside getworkflow", data)
    if (data?.serviceCategory
      && data?.serviceType
      && data?.interactionType
      && data?.interactionCategory) {
      const requestBody = {
        serviceType: data?.serviceType,
        serviceCategory: data?.serviceCategory,
        interactionCategory: data?.interactionCategory,
        interactionType: data?.interactionType,
        statementId: data?.statementId
      }
      post(`${properties.WORKFLOW_API}/get-dept-role`, requestBody)
        .then((resp) => {
          if (resp?.data?.workflow?.entities && resp?.data?.workflow?.entities?.length > 0) {
            // let entity = resp?.data?.workflow?.entities.map((unit) => (unit))
            unstable_batchedUpdates(() => {
              let statusArray = resp?.data?.workflow?.entities?.map(node => { return node?.status }).flat()
              let statusLookup = [
                ...new Map(
                  statusArray.map((item) => [item["code"], item])
                ).values(),
              ]
              setWorkflowLookup(resp?.data?.workflow)
              setCurrStatusLookup(statusLookup)
              setOrderData((preState) => ({
                ...preState,
                ...data,
                serviceType: data?.serviceType,
                serviceCategory: data?.serviceCategory,
                workflowUuid: resp?.data?.workflowUuid ?? '',
                toRole: '',
                toDept: '',
                currUser: ''
              }))
              setRoleLookup([])

              // if (entity && entity?.length === 1 && entity?.[0]?.roles.length === 1 && entity?.[0]?.entity.length === 1 &&
              //   entity?.[0]?.roles?.[0].roleId && entity?.[0]?.entity?.[0]?.unitId) {
              //   setOrderData({
              //     ...orderData,
              //     workflowUuid: resp?.data?.workflowUuid ?? '',
              //     toRole: entity?.[0]?.roles?.[0].roleId,
              //     toDept: entity?.[0]?.entity?.[0]?.unitId
              //   })
              // } else {
              //   setOrderData({ ...orderData, workflowUuid: resp?.data?.workflowUuid ?? '', toRole: '', toDept: '' })
              // }
            })
          }
        }).catch(error => console.error(error))
        .finally()
    } else {
      unstable_batchedUpdates(() => {
        setWorkflowLookup({})
        setCurrStatusLookup([])
        setOrderData({ ...orderData, workflowUuid: '', toRole: '', toDept: '', currUser: '' })
        setRoleLookup([])
      })
    }
  }

  const getEdoc = async (data) => {
    let slaDate
    try {
      if (data?.requestId || data?.problemCodeId) {
        const params = data?.requestId ? `?requestId=${data?.requestId}` : data?.problemCodeId ? `?problemCodeMapId=${data?.problemCodeId}` : ''
        slaDate = await get(`${properties.SLA_API}/get-edoc${params}`)
      }
    } catch (error) {

    }

    return slaDate
  }

  const [timer, setTimer] = useState(null);
  const [values, setValues] = useState([]);
  const [slaEdoc, setslaEdoc] = useState()

  const handleStatementChange = (e) => {

    unstable_batchedUpdates(() => {
      newArray = [];
      setResolutionData([]);
      setIsFormDisabled(false)
      setFormDetails([])
      setValues([])
      setslaEdoc()
      // workflowResponse = []
      // setWorkflowResponse([]);
      const { target } = e;

      const knowledgeBase = statementList.find(
        (x) => x.requestStatement?.toLowerCase()?.includes(target?.value?.toLowerCase())
      );

      if (knowledgeBase) {
        setError({
          ...error,
          statementId: "",
          statement: "",
          statementSolution: "",
          problemCause: "",
          serviceType: "",
          orderType: "",
          orderCategory: "",
          serviceCategory: "",
        });

        // setOpenCreateInteraction(true);
      } else {
        setOrderData({
          ...orderData,
          statementId: "",
          statement: "",
        });
        setError({
          ...error,
          statementId: "",
          statement: "",
        });
      }
      clearTimeout(timer);
      const newTimer = setTimeout(() => {
        getStatementList(target.value);
      }, 500);
      setTimer(newTimer);
    });
  };

  const handleClearResolution = useCallback(() => {
    unstable_batchedUpdates(() => {
      newArray = []
      setResolutionData([])
      setIsFormDisabled(false)
      setSelectedCategory()
      // console.log("idata cleared on handle create resolution")
      setOrderData({
        orderResolution: "",
        statement: "",
        statementId: "",
        statementSolution: "",
        orderType: "",
        orderCategory: "",
        serviceType: "",
        serviceCategory: "",
        channel: "IVR",
        problemCause: "",
        priorityCode: "",
        contactPreference: [],
        remarks: "",
        useCustomerAddress: true,
        markAsInteractionAddress: true,
      })
    })
  }, [])


  return (
    <>
      <div className="cnt-wrapper mb-2">
        <div className="card-skeleton">
          <div className="skel-cr-order">
            <div className="row my-2 mx-lg-n1 service-360-tiles">
              <div className="col-md px-lg-1">
                <div className="cmmn-skeleton tr m-0">
                  <div className="row align-items-center">
                    <div className="col-md-auto">
                      <div className="icon">
                        <i className="fa fa-dollar-sign"></i>
                      </div>
                    </div>
                    <div className="col-md pl-0">
                      <p className="mb-0">
                        Total Revenue <br />
                        Generated
                      </p>
                      <p className="mb-0 font-weight-bold">{totalRevenue}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md px-lg-1">
                <div className="cmmn-skeleton toa m-0">
                  <div className="row align-items-center">
                    <div className="col-md-auto">
                      <div className="icon">
                        <i className="fa fa-dollar-sign"></i>
                      </div>
                    </div>
                    <div className="col-md pl-0">
                      <p className="mb-0">
                        Total RC <br />
                        Amount
                      </p>
                      <p className="mb-0 font-weight-bold">{totalRC}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md px-lg-1">
                <div className="cmmn-skeleton top m-0">
                  <div className="row align-items-center">
                    <div className="col-md-auto">
                      <div className="icon">
                        <i className="fa fa-dollar-sign"></i>
                      </div>
                    </div>
                    <div className="col-md pl-0">
                      <p className="mb-0">
                        Total NRC
                        <br /> Amount
                      </p>
                      <p className="mb-0 font-weight-bold">{totalNRC}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md px-lg-1">
                <div className="cmmn-skeleton taa m-0">
                  <div className="row align-items-center">
                    <div className="col-md-auto">
                      <div className="icon">
                        <i className="fa fa-dollar-sign"></i>
                      </div>
                    </div>
                    <div className="col-md pl-0">
                      <p className="mb-0">
                        Total Outstanding <br />
                        Amount
                      </p>
                      <p className="mb-0 font-weight-bold">{totalOutstanding}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md px-lg-1">
                <div className="cmmn-skeleton oe m-0">
                  <div className="row align-items-center">
                    <div className="col-md-auto">
                      <div className="icon">
                        <i className="fa fa-box-open"></i>
                      </div>
                    </div>
                    <div className="col-md pl-0">
                      <p className="mb-0">
                        Total Service <br /> Available
                      </p>
                      <p className="mb-0 font-weight-bold">0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="col-lg-3 col-md-12 col-xs-12">
                <div className="cmmn-skeleton mt-2">
                  <div className="mt-2">
                    <button
                      className="accordion-expand "
                      data-toggle="collapse"
                      aria-expanded="true"
                    >
                      <span className="skel-profile-heading">
                        Most Frequent Orders
                      </span>
                    </button>

                  </div>
                </div>
              </div>
              <div className="col-lg-6 col-md-12 col-xs-12">
                <div className="row">
                  <div className="col-lg-12 col-md-12 col-xs-12">
                    <div className="mt-2">
                      <RequestStatement data={{
                        appsConfig,
                        isExpanded,
                        value,
                        statementList
                      }}
                        handler={{
                          setValue,
                          flushOlderResponse,
                          handleClearResolution,
                          setIsExpanded,
                          handleKnowledgeSelect,
                          handleStatementChange,
                        }}
                      />

                      <OrderManagement data={
                        {
                          appsConfig,
                          orderType,
                          customerDetails,
                          stats,
                          productDetails: subscriptionDetails?.productDetails?.[0],
                          subscriptionDetails,
                          screenSource: "CREATE_ORDER",
                          orderData,
                          totalOutstanding
                        }
                      }
                        handler={{
                          setOrderData
                        }}
                      />


                    </div>
                  </div>
                </div>
              </div>
              <ConsumerDetailsView
                appsConfig={appsConfig}
                screenSource={"CREATE_ORDER"}
                helpdeskDetails={null}
                handleHelpdeskModal={null}
                customerData={customerDetails}
                customerUuid={customerDetails?.customerUuid}
                customerEmailId={customerDetails?.customerEmailId}
                customerMobileNo={customerDetails?.customerMobileNo}
                handleOpenMinimalInfo={() => { }}
                dtWorksProductType={dtWorksProductType}
                customerNo={customerDetails?.customerNo}
                selectedService={subscriptionDetails}
                serviceList={[]}
                setOpenServiceModal={false}
                handleInteractionModal={() => { }}
                totalInteractionsCount={totalInteractionsCount}
                openInteractionCount={openInteractionCount}
                closedInteractionCount={closedInteractionCount}
                permission={permission}
                userResolutionList={[]}
                from={'ORDER'}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
