import React, { useEffect, useState, useRef, useCallback } from "react";
import SlaData from './json/leftTab.json';
import { Link } from "react-router-dom";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useTranslation } from "react-i18next";

import { post } from "../common/util/restUtil";
import { properties } from "../properties";
import { useNavigate } from "react-router-dom";
import KioskSearch from "../HelpdeskAndInteraction/Interaction/Inquiry/kioskSearch";

const LeftTab = (props) => {
  const { complaintsCount, serviceRequestCount, refresh, dateRange, todoPageCount, setTodoPageCount, selfDept } = props;

  const { t } = useTranslation();
  const history = useNavigate();

  const [tabContent, setTabContent] = useState([]);
  const [tabTitle, setTabTitle] = useState([]);
  const [interactionLists, setInteractionLists] = useState([]);

  const hasMoreTodo = useRef(true);
  const mergeTodoPrevList = useRef(false);

  useEffect(() => {
    setTabContent(SlaData.data.tabContent);
    setTabTitle(SlaData.data.title);
  }, [refresh]);

  const getToDoData = useCallback(() => {

    const requestBody = {
      searchType: "ADV_SEARCH",
      userId: JSON.parse(localStorage.getItem('auth')).user.userId,
      roleId: JSON.parse(localStorage.getItem('auth')).currRoleId,
      type: "",
      status: "",
      selfDept,
      startDate: dateRange.startDate.split("-").reverse().join("-"),
      endDate: dateRange.endDate.split("-").reverse().join("-")
    }
    /***enable it once API is ready */
    // 
    // post(`${properties.INTERACTION_API}/search?limit=10&page=${todoPageCount}`, requestBody)
    //   .then((response) => {
    //     if (response.data) {
    //       if (response.status === 200) {
    //         const { count, rows } = response.data;
    //         setInteractionLists((interactionLists) => {
    //           let updatedLength = mergeTodoPrevList.current ? interactionLists.length + rows.length : rows.length
    //           hasMoreTodo.current = updatedLength < Number(count) ? true : false;
    //           return mergeTodoPrevList.current ? [...interactionLists, ...rows] : rows;
    //         })
    //         mergeTodoPrevList.current = false;
    //       }
    //     }
    //   })
    //   .finally()
  }, [dateRange, todoPageCount, selfDept])

  useEffect(() => {
    getToDoData();

    //console.log(interactionLists.length)
  }, [getToDoData, refresh])

  const handleOnScroll = (e) => {
    const { scrollHeight, scrollTop, clientHeight } = e.target;
    const defaultIndex = Number(e.target.attributes.defaultindex.value);
    if (Math.ceil(scrollHeight - scrollTop) === clientHeight && hasMoreTodo.current) {
      if (defaultIndex === 2) {
        mergeTodoPrevList.current = true;
        setTodoPageCount(todoPageCount + 1);
      }
    }
  }

  const viewInteraction = (details) => {
    const { customerId, serviceId, intxnId, accountId, intxnTypeDesc, woType, woTypeDesc, intxnType } = details;
    const isAdjustmentOrRefund = ['Adjustment', 'Refund'].includes(woTypeDesc) ? true : ['Fault'].includes(woTypeDesc) && intxnType === 'REQSR' ? true : false;
    const data = {
      customerId,
      serviceId,
      interactionId: intxnId,
      accountId,
      type: isAdjustmentOrRefund ? 'complaint' : intxnTypeDesc.toLowerCase(),
      woType,
      isAdjustmentOrRefund,
      row: details
    }
    if (intxnTypeDesc === 'Complaint')
      history(`/edit-complaint`, { state: { data } })
    else if (data.intxnTypeDesc === 'Service Request')
      history(`/edit-service-request`, { state: { data } })
    else if (intxnType === 'REQWO') {
      history(`/edit-work-order`, {
        state: {
          data: {
            customerId,
            serviceId,
            interactionId: intxnId,
            accountId,
            type: 'order',
            woType,
            isAdjustmentOrRefund: false,
            row: details
          }
        }
      })
    }
    else
      history(`/edit-inquiry`, { state: {data} })
  }

  return (
    <div className="col-lg-3  mt-1 dashboard-left">
      <div className="card-box" >
        <Tabs>
          <TabList>

            {tabTitle.map((title, i) => <Tab key={i}>{title}</Tab>)}
          </TabList>

          {
            tabContent && tabContent.map((tcontent, i) =>
              <TabPanel defaultindex={2} key={i} onScroll={handleOnScroll}>
                <div className="row m-1" key={i}>
                  {
                    tcontent && tcontent.slaDetails.map((slaDetails, j) =>
                      <div key={j} className="col-6">
                        <p className=" text-truncate ticketlist">{slaDetails?.title}</p>
                        <div className="row">
                          <div className="col-3">
                            <div className="text-center">
                              <button type="button" className={"btn-xs btn btn-rounded waves-effect waves-light pr-1 pl-1 " + ((serviceRequestCount?.total > 7) ? "btn-danger" : (serviceRequestCount?.total < 4 && serviceRequestCount?.total > 2) ? "btn-warning" : "btn-success")}>{serviceRequestCount?.total}</button>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="text-center">
                              <button type="button" className={"btn-xs btn btn-rounded waves-effect waves-light pr-1 pl-1 " + ((complaintsCount?.total > 7) ? "btn-danger" : (complaintsCount?.total < 4 && complaintsCount?.total > 2) ? "btn-warning" : "btn-success")}>{complaintsCount?.total}</button>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="text-center">
                              <button type="button" className={"btn-xs btn btn-rounded waves-effect waves-light pr-1 pl-1 " + ((0 > 7) ? "btn-danger" : (0 < 4 && 0 > 2) ? "btn-warning" : "btn-success")}>{0}</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                </div>
                {
                  !!interactionLists.length ? interactionLists.map((detail, i) =>
                    detail.currStatus !== 'CLOSED' ?
                      <div key={i} className="col-lg-12 pt-2">
                        <div className="card-box project-box cardborder">
                          <div className="dropdown float-right d-none">
                            <Link to="#" className="dropdown-toggle card-drop arrow-none" data-toggle="dropdown" aria-expanded="false">
                              <i className="mdi mdi-dots-horizontal m-0 text-muted h3"></i>
                            </Link>
                            <div className="dropdown-menu dropdown-menu-right">
                              <Link className="dropdown-item" to="#">{t("remove")}</Link>
                            </div>
                          </div>
                          <h5 className="mt-0">
                            <span className="text-primary cursor-pointer" onClick={() => viewInteraction(detail)}>
                              {/*(detail.ticketTypeDesc === 'Service Request') ? `SR${(detail.intxnId)}` : ""}
                            {(detail.ticketTypeDesc === 'Complaint') ? `CT${(detail.intxnId)}` : ""}
                            {(detail.ticketTypeDesc === 'Inquiry') ? `INQ${(detail.intxnId)}` : ""}
                            {(detail.ticketTypeDesc === 'Adjustment') ? `ADJ${(detail.intxnId)}` : ""}
                            {(detail.ticketTypeDesc === 'Refund') ? `REF${(detail.intxnId)}` : ""}
                            {(detail.ticketTypeDesc === 'Proactive') ? `PROAC${(detail.intxnId)}` : ""}
                            {(detail.ticketTypeDesc === null) ? `TKT${(detail.intxnId)}` : ""}
                            {/* {(detail.intxnType === 'REQINQ') ? 'SR' : (detail.intxnType === 'REQCOMP') ? 'TKT' : ''}{(detail.intxnId)} */
                                (detail.intxnId)
                              }
                            </span>
                            <span className="ml-1 badge badge-outline-danger d-none">6hrs Overdue</span>
                          </h5>
                          <span className="text-dark d-none"><i className="mdi mdi-account-circle"></i> <small>{t("assigned_from")} CEM</small></span>
                          <div className="badge badge-outline-success text-success mb-2 ml-2">{detail.priorityDesc}</div>
                          <p className="text-muted font-13 mb-1 sp-line-2 d-none">{t("service_type")}: ''</p>
                          <span className={"badge badge-pill " + (detail?.intxnTypeDesc === 'Service Request' ? "badge-soft-pink" : detail?.intxnTypeDesc === 'Complaint' ? "badge-soft-blue" : "badge-soft-info")}>{detail?.intxnTypeDesc}</span>
                        </div>
                      </div>
                      : ''
                  )
                    : (
                      <div className="m-3"> You have ressolved all the assigned tickets!</div>
                    )
                }
              </TabPanel>
            )
          }
        </Tabs>
      </div>
    </div>
  );
};

export default LeftTab;
