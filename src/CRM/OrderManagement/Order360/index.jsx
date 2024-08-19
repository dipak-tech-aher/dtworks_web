import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import NormalViewIcon from '../../../assets/images/dashboard-icons.svg';
import InsightViewIcon2 from '../../../assets/images/livestream.svg';
import Order360InformativeView from './Components/InformativeView';
import Order360InsightView from './Components/InsightView';
import { AppContext, Order360Context } from '../../../AppContext';
import { useLocation } from 'react-router-dom';
import { get, post } from '../../../common/util/restUtil';
import { properties } from '../../../properties';
import { toast } from 'react-toastify';
import moment from 'moment';
import { unstable_batchedUpdates } from 'react-dom';
import OrderContractAgreementPrint from './Components/OrderPrint';
import Modal from 'react-modal';
import { useReactToPrint } from 'react-to-print';

Modal.setAppElement('#root')

export default function Order360(props) {
  const { state } = useLocation()
  const { auth } = useContext(AppContext);
  const [currentView, setCurrentView] = useState('informative-view');
  const [orderData, setOrderData] = useState({});
  const [childOrder, setChildOrder] = useState([]);
  const [orderedProductDetails, setOrderedProductDetails] = useState([]);
  const [customerDetails, setCustomerDetails] = useState({});
  const [masterDataLookup, setMasterDataLookup] = useState({});
  const [workflowLookup, setWorkflowLookup] = useState();
  const [roleLookup, setRoleLookup] = useState();
  const [userLookup, setUserLookup] = useState();
  const [currStatusLookup, setCurrStatusLookup] = useState();
  const [permissions, setPermissions] = useState({ assignToSelf: false, followup: false, readOnly: false, reAssign: false, displayOnly: true });
  const [interactionInputs, setInteractionInputs] = useState({ user: "", assignRole: "", assignDept: "", currStatus: "", remarks: "" });

  const viewOrderData = JSON.parse(localStorage.getItem('viewOrderData'))
  // console.log('propsData ', viewOrderData)
  // console.log('state?.data ', state?.data)

  const propsData = state?.data ? state?.data : viewOrderData;
  const orderNo = propsData?.rowData?.orderNo || propsData?.orderNo
  // console.log('state ', state?.data.rowData)
  // const orderNo = state?.data?.rowData ? state?.data?.rowData?.orderNo?.split('_')[0] : state?.data?.orderNo?.split('_')[0];
  // const childOrderNo = state?.data?.rowData?.childOrderId ? state?.data?.rowData?.childOrderId : state?.data?.childOrderId;
  const childOrderNo = propsData?.rowData?.childOrderId || propsData?.childOrderId
  const currentWorkflowRef = useRef();
  // console.log('permissions',permissions)
  // console.log('orderData',orderData)
  // console.log('customerDetails',customerDetails)
  /* Get Order Last Order remark - END */
  const [generatePdf, setGeneratePdf] = useState(false);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint: () => {
      setGeneratePdf(false);
    },
  });

  const handleGeneratePdf = () => {
    setGeneratePdf(true);
    setTimeout(() => {
      handlePrint();
      // setGeneratePdf(false)
    }, 5000);
  };

  const componentRef = useRef()

  const grantPermissions = (assignedRole, assignedUserId, status, assignedDept) => {
    // console.log({ status }, 'inside grant permission')
    if (["CLS", "CNCLED"].includes(status)) {
      setPermissions({
        assignToSelf: false,
        followup: false,
        readOnly: true,
        reAssign: false,
        displayOnly: true,
      });
    } else {
      const { user, currRoleId, currDeptId } = auth;
      // console.log({ assignedUserId, assignedRole, currRoleId, assignedDept, currDeptId }, 'inside grant permission')
      if (Number(assignedRole) === Number(currRoleId) && assignedDept === currDeptId) {
        if (assignedUserId !== "") {
          // console.log(Number(assignedUserId), '===', Number(user.userId), "set permissions")
          if (Number(assignedUserId) === Number(user.userId)) {
            setPermissions({
              assignToSelf: false,
              followup: false,
              readOnly: false,
              reAssign: true,
              displayOnly: true,
            });
          } else {
            setPermissions({
              assignToSelf: false,
              followup: true,
              readOnly: true,
              reAssign: false,
              displayOnly: true,
            });
          }
        } else {
          setPermissions({
            assignToSelf: true,
            followup: true,
            readOnly: true,
            reAssign: false,
            displayOnly: true,
          });
        }
      } else {
        if (assignedUserId !== "") {
          setPermissions({
            assignToSelf: false,
            followup: true,
            readOnly: true,
            reAssign: false,
            displayOnly: true,
          });
        } else {
          setPermissions({
            assignToSelf: false,
            followup: true,
            readOnly: true,
            reAssign: false,
            displayOnly: true,
          });
        }
      }
    }
  };
  const initialize = async () => {
    // isRoleChangedByUserRef.current = false;

    post(`${properties.ORDER_API}/search?limit=10&page=0`, { searchParams: { orderNo } })
      .then((response) => {
        if (response?.data?.row && response?.data?.row.length > 0) {
          unstable_batchedUpdates(() => {
            setOrderData(response?.data?.row[0]);
            setCustomerDetails(response?.data?.row[0].customerDetails);
            setChildOrder(response?.data?.row[0]?.orderProductDetails ?? [])
          })

          let assignRole = !!response?.data?.row[0]?.currRole?.roleId ? parseInt(response?.data?.row[0]?.currRole?.roleId) : "";
          let assignDept = !!response?.data?.row[0]?.currEntity?.unitId ? response?.data?.row[0]?.currEntity?.unitId : "";
          let user = !!response?.data?.row[0]?.currUser?.userId ? parseInt(response?.data?.row[0]?.currUser?.userId) : "";
          let orderStatus = !!response?.data?.row[0]?.orderStatus?.code ? response?.data?.row[0]?.orderStatus?.code : "";
          // console.log(assignRole, user, orderStatus, assignDept)
          grantPermissions(assignRole, user, orderStatus, assignDept);

        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally();
  };
  useEffect(() => {
    initialize();
  }, []);
  useMemo(() => {   
      get(properties.MASTER_API + "/lookup?searchParam=code_type&valueParam=PRODUCT_BENEFIT,TASK_STATUS,TICKET_SOURCE,TICKET_PRIORITY,ORD_STATUS_REASON,CHARGE_CATEGORY,USAGE_TYPE,FULFILMENT_STATUS")
        .then((resp) => {
          if (resp.data) {
            setMasterDataLookup({ ...resp.data })
          } else {
            toast.error("Error while fetching address details");
          }
        })
        .catch((error) => {
          console.error(error);
        })
        .finally();   
  }, []);
  useEffect(() => {
    if (orderData?.currEntity?.unitId && orderData?.currEntity?.unitId !== "" && permissions.readOnly === false
    ) {
      get(`${properties.WORKFLOW_DEFN_API}/get-status?entityId=${orderData?.orderUuid}&entity=ORDER`)
        .then((response) => {
          if (response.data) {
            const { flow, flwId } = response?.data;
            currentWorkflowRef.current = { flwId };
            if (flow !== "DONE") {
              let statusArray = [];
              setWorkflowLookup(response.data);
              response?.data?.entities &&
                response?.data?.entities.map((node) => {
                  node?.status?.map((st) => {
                    statusArray.push(st);
                  });
                });
              let statusLookup = [
                ...new Map(
                  statusArray.map((item) => [item["code"], item])
                ).values(),
              ];

              setRoleLookup([]);
              setCurrStatusLookup(statusLookup);
              setInteractionInputs({ user: "", assignRole: "", assignDept: "", currStatus: "", remarks: "" });
            } else if (flow === "DONE") {
              setPermissions({ assignToSelf: false, followup: false, readOnly: true, reAssign: false, displayOnly: true, });
            }
            if (childOrder?.orderStatus?.code === "CLS") {
              setPermissions({ assignToSelf: false, followup: false, readOnly: true, reAssign: false, displayOnly: true, });
            }
          }
        }).catch(error => console.log(error)).finally();
    }


    // // clearing previous value when changing product details
    // unstable_batchedUpdates(() => {
    //   setIsFollowUpHistoryOpen(false);
    //   setIsWorkflowHistoryOpen(false);
    // });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData, orderData?.currEntity?.unitId]);

  const contextProvider = {
    data: {
      orderNo,
      childOrderNo,
      orderData,
      customerDetails,
      permissions,
      masterDataLookup,
      childOrder,
      roleLookup,
      userLookup,
      currStatusLookup,
      workflowLookup,
      interactionInputs    
    },
    handlers: {
      initialize,
      setRoleLookup,
      setInteractionInputs
    }
  }


  // console.log('orderNo', orderData)
  return (
    <Order360Context.Provider value={contextProvider}>
      <div className="content">
        <div className="">
          <div className="cnt-wrapper">
            <div className="card-skeleton">
              <div className="cmmn-skeleton mt-2">
                <div className="skel-i360-base">
                  <div className="skel-intcard">
                    <div className="skel-flex-card-int mb-1">
                      <span className="skel-profile-heading mb-0">
                        {orderData?.orderNo}
                      </span>
                      <span className="status-active ml-1">{orderData?.orderStatus?.description}</span>
                    </div>
                    <div>Created at: {orderData?.orderDate ? moment(orderData?.orderDate).format("DD-MM-YYYY HH:mm:ss a") : ""}</div>
                    <div className='d-flex align-item-center mt-2'><i className="fa fa-file-pdf pr-1" aria-hidden="true"></i> 
                    <span className='cursor-pointer txt-lnk mt-0 d-block' onClick={handleGeneratePdf}>View/Download Agreement</span></div>
                  </div>
                  <div className="skel-intcard-insight">
                    <div className="db-list mb-0 pl-0">
                      <div onClick={() => setCurrentView(currentView === 'informative-view' ? 'insight-view' : 'informative-view')} className={`list-dashboard db-list-active cursor-pointer`}>
                        <span className="db-title">
                          <img src={currentView === 'informative-view' ? InsightViewIcon2 : NormalViewIcon} className="img-fluid pr-1" /> Switch to {currentView === 'informative-view' ? 'Insight' : 'Informative'} View
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {currentView === 'informative-view' ? (
            <Order360InformativeView />
          ) : (
            <Order360InsightView />
          )}
        </div>
        {generatePdf && (
          <Modal isOpen={generatePdf}>
            <OrderContractAgreementPrint
              data={orderData}
              ref={componentRef}
              source={"ORDER_360"}
              handler={{
                handlePreviewCancel: false,
                handlePrint: false,
                masterDataLookup
              }}
            />
          </Modal>
        )}
      </div>
    </Order360Context.Provider>

  )
}
