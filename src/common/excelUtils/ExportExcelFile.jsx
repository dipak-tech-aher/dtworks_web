import * as FileSaver from "file-saver";
import ExcelJS from 'exceljs';
import exportExcelIcon from '../..//assets/images/exportexcel.svg'
import React, { useContext } from 'react';
import * as XLSX from "xlsx";
import { formatISODateDDMMMYY, formatISODateTime } from '../../common/util/dateUtil';
import { toast } from "react-toastify";
import moment from 'moment';
import { get, post } from '../../common/util/restUtil';
import { formFilterObject, USNumberFormat } from '../../common/util/util';
import { properties } from '../../properties';
import { createdInteractionColumns } from "../../ReportsAndBI/Reports/Interaction/Columns/createdInteractionColumns";
import { closedInteractionColumns } from "../../ReportsAndBI/Reports/Interaction/Columns/closedInteractionColumns";
import { openInteractionColumns } from "../../ReportsAndBI/Reports/Interaction/Columns/openInteractionColumns";
import { Columns as ARAgeingColumns } from "../../ReportsAndBI/Reports/ArAgeing/arAgeing";
import AuditTrailColumns from "../../ReportsAndBI/Reports/auditTrailColumns";
import BillingColumns from "../../ReportsAndBI/Reports/billingColumns";
import ChatColumns from "../../ReportsAndBI/Reports/chatColumns";
import DeptInteractionColumns from "../../ReportsAndBI/Reports/deptInteractionColumns";
import { FCRAgentColumns } from '../../ReportsAndBI/Reports/FCRAgentColumns';
import { FCRMISColumns } from '../../ReportsAndBI/Reports/fcrMisColumns';
import { FollowupCountColumns, FollowupCountInteractionColumns } from "../../ReportsAndBI/Reports/followupCountColumns";
import { AppContext } from "../../AppContext";
import axios from "axios"
import openTaskColumns from "../../ReportsAndBI/Reports/Task/Columns/OpenTaskColumns";
import { FollowInteractionColumns, FollowupColumns, FollowupFrequencyColumns } from "../../ReportsAndBI/Reports/followupColumns";
import InvoiceColumns from "../../ReportsAndBI/Reports/invoiceColumns";
import LoginColumns from "../../ReportsAndBI/Reports/loginColumns";
import ProductColumns from "../../ReportsAndBI/Reports/productColumns";
import SalesColumns from "../../ReportsAndBI/Reports/salesColumns";
import SLAColumns from "../../ReportsAndBI/Reports/slaColumns";
import { TATColumns, TATReportSummary } from "../../ReportsAndBI/Reports/tatColumns";
import { TicketStatisticsColumns } from "../../ReportsAndBI/Reports/TicketStatisticsColumns";
import createdCustomerColumns from "../../ReportsAndBI/Reports/Customer/Columns/CreatedCustomerColumns";
import closedOrderColumns from "../../ReportsAndBI/Reports/Order/Columns/ClosedOrderColumns";
import createdOrderColumns from "../../ReportsAndBI/Reports/Order/Columns/CreatedOrderColumns";
import openOrderColumns from "../../ReportsAndBI/Reports/Order/Columns/OpenOrderColumns";
import { FCRColumns } from "../../ReportsAndBI/Reports/FCR/FCRColumns";
import { AbandonedColumns } from "../../ReportsAndBI/Reports/AbandonedCallReport/AbandonedColumns";
import { ACDCallIntervalSummaryReportColumns } from "../../ReportsAndBI/Reports/ACDCallIntervalSummaryReportDaily/ACDCallIntervalSummaryReportColumns";
import { ACDCallIntervalSummaryReportHourlyColumns } from "../../ReportsAndBI/Reports/ACDCallIntervalSummaryReportHourly/ACDCallIntervalSummaryReportHourlyColumns";
import { AgentProductivityReportDailyColumns } from "../../ReportsAndBI/Reports/AgentProductivityReportDaily/AgentProductivityReportDailyColumns";
import { AgentProductivityReportHourlyColumns } from "../../ReportsAndBI/Reports/AgentProductivityReportHourly/AgentProductivityReportHourlyColumns";

const ExportToExcelFile = ({ list, fileName, listKey, listSearch, listSelectedTab, filters, handleExportButton, header, url, method, report, exportIcon, SearchCriteria, exportBackend }) => {
    const { appConfig, auth } = useContext(AppContext);
    const apiUrl = url;
    const apiMethod = method
    const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const fileExtension = ".xlsx";
    const excelProperties = {
        borderStyle: {
            top: { style: 'thin', color: { argb: '000' } },
            left: { style: 'thin', color: { argb: '000' } },
            bottom: { style: 'thin', color: { argb: '000' } },
            right: { style: 'thin', color: { argb: '000' } }
        },
        font: { name: 'Calibri', size: 10 },
        fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'B9B6B6' }
        },
        defaultRowHeight: 12,
        defaultColWidth: 20
    }

    function moveGrandTotalToEnd(obj) {
        const { grandTotal, ...rest } = obj;
        return { ...rest, grandTotal };
    }

    const findSameObjects = (array1, array2) => {
        const set = new Set(array1.map(JSON.stringify));
        return array2.filter(obj => set.has(JSON.stringify(obj)));
    }

    // Iterate through the array and move "grandTotal" to the end of each object

    const exportToCSV = async (checkListKey, apiData, fileName, isReportEnabled) => {
        // console.log('apiData---------->', apiData)
        let tableData = [];
        let objConstruct = {};

        const checkListKeys = [
            'created-interaction', 'closed-interaction', 'open-interaction',
            'AR-AGEING-SNAP', 'Audit Trail Report', 'Billing Report',
            'Chat Report', 'Departmentwise Interaction Report', 'FCR Agent Report',
            'FCR MIS Report', 'FCR Report', 'FollowUp Interaction', 'FollowUp Count Report',
            'FollowUp Report', 'FollowUp Interaction List', 'Invoice Report',
            'User Login Report', 'Product Report', 'Sales Report',
            'SLA Interaction Report', 'TAT Report', 'Ticket Statistics',
            'Created Customer Report', 'Closed Order Report', 'Created Order Report',
            'Open Order Report', 'Abandoned Call Report', 'Follow-Up Frequency Report', 'ACD Call Interval Summary Report Daily',
            'ACD Call Interval Summary Report Hourly', 'Agent Productivity Report Daily', 'Agent Productivity Report Hourly',
            'total-customers', 'signups-signouts', 'order-overview', 'overall-ageing', 'sla-ageing', 'order-fulfillment', 'order-delivery', 'purchasing-frequency'
        ];

        apiData.forEach(element => {
            if (checkListKeys.includes(checkListKey)) {
                // let modelDetails = metaInfo?.filter((e) => e?.name === checkListKey)
                // modelDetails = findSameObjects(modelDetails, header)
                // modelDetails = header
                let modelDetails = [{ name: checkListKey, value: header }]

                const formatedData = modelDetails?.[0]?.value?.map((e) => {
                    if (e?.type === 'date') {
                        return { [e.Header]: element?.[e?.accessor] ? moment(element?.[e?.accessor]).format(e?.format ?? 'DD-MM-YYYY') : '' }
                    } else if (e?.type === 'time') {
                        return { [e.Header]: element?.[e?.accessor] ? moment(element?.[e?.accessor]).format(e?.format ?? 'hh:mm:ss') : '' }
                    } else if (e?.type === 'percentage') {
                        return { [e.Header]: element?.[e?.accessor] ? (Number(element?.[e?.accessor]).toFixed(e?.format ?? 2) + '%') : '-' }
                    } else {
                        return { [e.Header]: element?.[e?.accessor] ?? '' }
                    }
                })
                formatedData?.map((obj) => {
                    if (obj) objConstruct = { ...objConstruct, ...obj }
                    return '';
                })
            } else if (checkListKey === "Interaction Daily Report") {
                const reOrderedData = moveGrandTotalToEnd(element);
                // console.log('reOrderedData--------->', reOrderedData)
                objConstruct = reOrderedData
            } else if (checkListKey.includes("Review Contract List")) {
                console.log('element?.rcAmount---------->', element?.rcAmount)
                objConstruct = {
                    "To Be Action": element?.isOnhold === 'N' ? 'HOLD' : 'UNHOLD',
                    "Current  Status": element?.isOnhold === 'N' ? 'UNHOLD' : 'HOLD',
                    "Invoice Split": element?.isSplit,
                    "Contract ID": element?.contractId,
                    "Unbilled Contract ID": element?.monthlyContractId,
                    // "Sales Order Number": element?.monthlyContractDtl[0]?.soNumber,
                    "Customer Name": `${element?.customer?.firstName || ""} ${element?.customer?.lastName || ""}`,
                    "Billable Reference Number": element?.billRefNo,
                    "Total RC": element?.rcAmount ? Number(element?.rcAmount).toFixed(2) : 0,
                    "Total NRC": element?.otcAmount ? Number(element?.otcAmount).toFixed(2) : 0,
                    "Total RC AND NRC": (element?.rcAmount ? Number(element?.rcAmount).toFixed(2) : 0) + (element?.otcAmount ? Number(element?.otcAmount).toFixed(2) : 0),
                    "Total Usage": element?.usageAmount ? Number(element?.usageAmount).toFixed(2) : 0,
                    "Credit Adjustment": element?.creditAdjAmount ? Number(element?.creditAdjAmount).toFixed(2) : 0,
                    "Debit Adjustment": element?.debitAdjAmount ? Number(element?.debitAdjAmount).toFixed(2) : 0,
                    "Created At": element?.createdAt ? moment(element?.createdAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                }

            } else if (checkListKey === "Project Wise Helpdesk") {
                objConstruct = {
                    "Helpdesk No": element?.helpdeskNo,
                    "Email": element?.mailId,
                    "Source": element?.helpdeskSourceDesc?.description,
                    "Project": element?.projectDesc?.description,
                    "Current User": element?.currUserInfo?.firstName + ' ' + element?.currUserInfo?.lastName,
                    "Status": element?.statusDesc?.description,
                    "Actioned Date": formatISODateDDMMMYY(new Date(element?.statusChngDate))
                }
            } else if (checkListKey === "Campaign Listing") {
                objConstruct = {
                    "Campaign Name": element.campName,
                    "Campaign Description": element.campDescription,
                    "Access Number": element.serviceNo,
                    "Valid From": formatISODateDDMMMYY(new Date(element.validFrom)),
                    "Valid To": formatISODateDDMMMYY(new Date(element.validTo))
                }
            } else if (checkListKey === "Interactions Search") {
                objConstruct = {
                    "Interaction ID": element.intxnId,
                    "Interaction Category Type": element.ticketTypeDesc,
                    "Work Order Type": element.woTypeDescription,
                    "Access Number": element.accessNbr,
                    "Service Type": element.prodType,
                    "Customer Name": element.customerName,
                    "Customer Number": element.customerNbr,
                    "Account Name": element.accountName,
                    "Account Number": element.accountNo,
                    "Contact Number": element.contactNo,
                    "Assigned": element.assigned,
                    "Created Date": formatISODateDDMMMYY(new Date(element.createdAt)),
                    "Created By": element.createdBy,
                    // "Updated On":formatISODateDDMMMYY(new Date(element.updatedAt)),
                    "Status": element.currStatus
                }
            } else if (["Admin View User-User Management", "Admin View New-User-Request Management"].includes(checkListKey)) {
                const status = (checkListKey === "Admin View User-User Management") ? element.statusDesc?.description : "Pending";
                objConstruct = {
                    "First Name": element.firstName,
                    "Last Name": element.lastName,
                    "Email Id": element.email,
                    "Contact No": element.contactNo,
                    "User Type": element.userTypeDesc?.description,
                    "Status": status
                }
            } else if (checkListKey === "Bulk Upload Search") {
                objConstruct = {
                    "Upload Process ID": element.bulkUploadId,
                    "Upload Type": element.uploadTableName,
                    "Upload File Name": element.uploadFileName,
                    "Upload Status": element.uploadStatus,
                    "Uploaded By": (element?.createdByUser?.firstName || '-') + ' ' + (element?.createdByUser?.lastName || ''),
                    "Uploaded Date and Time": moment(element.createdAt).format('DD-MM-YYYY hh:mm:sss A')
                }
            } else if (checkListKey === "Request Statement List") {
                objConstruct = {
                    "ID": element.requestId,
                    "Interaction Statement": element?.requestStatement,
                    "Interaction Category": element?.intxnCategoryDesc?.description,
                    "Interaction Type": element?.intxnTypeDesc?.description,
                    "Service Category": element?.serviceCategoryDesc?.description,
                    "Service Type": element?.serviceTypeDesc?.description,
                    "Problem Cause": element?.intxnCauseDesc?.description,
                    "Priority": element?.priorityCodeDesc?.description,
                    "Interaction Resolution": element?.intxnResolutionDesc?.description
                }
            } else if (checkListKey === "Admin View User-Roles Setup") {
                objConstruct = {
                    "Role ID": element.roleId,
                    "Role Name": element.roleName,
                    "Role Description": element.roleDesc,
                    "Status": element?.status === 'AC' ? 'Active' : 'Inactive'
                }
            } else if (checkListKey === "Admin View Org List") {
                objConstruct = {
                    "Unit ID": element.unitId,
                    "Unit Name": element.unitName,
                    "Unit Type": element.unitType,
                    "Unit Desc": element.unitDesc,
                }
            } else if (checkListKey === "Admin View Ou List" || checkListKey === "Admin View Dept List") {
                objConstruct = {
                    "Unit ID": element.unitId,
                    "Unit Name": element.unitName,
                    "Unit Type": element.unitType,
                    "Unit Desc": element.unitDesc,
                    "Parent Unit": element.parentUnit,
                }
            } else if (checkListKey === "Catalogue Listing") {
                objConstruct = {
                    "Plan ID": element.planId,
                    "Refill Profile ID": element.refillProfileId,
                    "Tariff Code": element.prodType,
                    "Bundle Name": element.planName,
                    "Bundle Category": element.planType,
                    "Services": element.prodType,
                    "Denomination": element.charge
                }
            } else if (checkListKey === "Customer Advance Search") {
                objConstruct = {
                    "Customer Number": element?.customerNo,
                    "Customer Name": element?.customerName,
                    "Account Number": element?.accountNo,
                    "Account Name": element?.accountName,
                    "Access Number": element?.accessNbr,
                    "Service Type": element?.serviceTypeDesc,
                    "Primary Contact Number": element?.contactNo,
                    "ID Number": element?.idValue,
                    "Service Status": element?.serviceStatusDesc
                }
            } else if (checkListKey === "Manage Parameters") {
                objConstruct = {
                    "Business Parameter Name": element.code,
                    "Business Parameter Description": element.description,
                    "Parent Category": element.codeType,
                    "Status": element.status
                }
            } else if (checkListKey === "View All Notifications") {
                objConstruct = {
                    "Notification Title": element.source + " " + element.referenceId,
                    "Broadcast Message": element.subject,
                    "Notification Date - Time": formatISODateTime(element.createdAt)
                }
            } else if (checkListKey === "Account Property History") {
                objConstruct = {
                    "Account Property 1": element.property_1,
                    "Account Property 2": element.property_2,
                    "Account Property 3": element.property_3,
                    "Modified Date Time": formatISODateTime(element.updatedAt),
                    "Modified By": `${element.modifiedBy?.firstName} ${element.modifiedBy.lastName}`,
                }
            } else if (checkListKey === "Account Details History") {
                objConstruct = {
                    "Email": element.email,
                    "Title": element.contactType,
                    "First Name": element.contactType,
                    "Last Name": element.contactType,
                    "Contact Number": element.contactNo,
                    "Modified Date Time": formatISODateTime(element.updatedAt),
                    "Modified By": `${element.modifiedBy?.firstName} ${element.modifiedBy.lastName}`,
                }
            } else if (checkListKey === "Account Address History") {
                objConstruct = {
                    "Flat/House/Unit No": element.hno,
                    "Building Name/Others": element.buildingName,
                    "Street/Area": element.street,
                    "City/Town": element.city,
                    "District/Province": element.district,
                    "State/Region": element.state,
                    "ZIP": element.zip,
                    "Country": element.country,
                    "Modified Date Time": formatISODateTime(element.updatedAt),
                    "Modified By": `${element.modifiedBy?.firstName} ${element.modifiedBy.lastName}`,
                }
            } else if (checkListKey === "Customer Details History") {
                objConstruct = {
                    "Customer ID Type": element?.idTypeDesc?.description,
                    "ID Number": element?.idValue,
                    "Email": element.email,
                    "Contact Type": element?.contactTypeDesc?.description,
                    "Contact Number": element?.contactNo,
                    "Modified Date Time": formatISODateTime(element?.updatedAt),
                    "Modified By": `${element?.modifiedBy?.firstName} ${element?.modifiedBy.lastName}`,
                }
            } else if (checkListKey === "Customer Address History") {
                objConstruct = {
                    "Flat/House/Unit No": element?.hno,
                    "Building Name/Others": element?.buildingName,
                    "Street/Area": element?.street,
                    "City/Town": element?.city,
                    "District/Province": element?.district,
                    "State/Region": element?.state,
                    "ZIP": element?.zip,
                    "Country": element?.country,
                    "Modified Date Time": formatISODateTime(element?.updatedAt),
                    "Modified By": `${element?.modifiedBy?.firstName} ${element?.modifiedBy?.lastName}`,
                }
            } else if (checkListKey === "Customer Property History") {
                objConstruct = {
                    "Account Property 1": element?.property_1,
                    "Account Property 2": element?.property_2,
                    "Account Property 3": element?.property_3,
                    "Modified Date Time": formatISODateTime(element?.updatedAt),
                    "Modified By": `${element?.modifiedBy?.firstName} ${element?.modifiedBy.lastName}`,
                }
            } else if (checkListKey.includes("Contract List")) {
                // console.log('element----->', element)
                objConstruct = {
                    "Contract ID": element?.contractId,
                    "Customer Number": element?.customer?.crmCustomerNo || element?.customer?.customerNo,
                    "Customer Name": `${element?.customer?.firstName || ""} ${element?.customer?.lastName || ""}`,
                    "Billable Reference Number": element?.billRefNo,
                    "Contract Start Date": element?.actualStartDate ? moment(element?.actualStartDate).format('DD-MMM-YYYY') : '-',
                    "Contract End Date": element?.actualEndDate ? moment(element?.actualEndDate).format('DD-MMM-YYYY') : '-',
                    "Status": element?.statusDesc?.description || "",
                    "RC": USNumberFormat(element?.rcAmount),
                    "NRC": USNumberFormat(element?.otcAmount),
                    "Usage": USNumberFormat(element?.usageAmount),
                    "Credit Adjustment": USNumberFormat(element?.creditAdjAmount),
                    "Debit Adjustment": USNumberFormat(element?.debitAdjAmount),
                    "Last Bill Period": element?.lastBillPeriod ? moment(element?.lastBillPeriod).format('DD-MMM-YYYY') : '-',
                    "Next Bill Period": element?.nextBillPeriod ? moment(element?.nextBillPeriod).format('DD-MMM-YYYY') : '-',
                    "Created By": `${element?.createdByName?.firstName || ""} ${element?.createdByName?.lastName || ""}`,
                    "Created At": element?.createdAt ? moment(element?.createdAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                    "Updated By": `${element?.updatedByName?.firstName || ""} ${element?.updatedByName?.lastName || ""}`,
                    "Updated At": element?.updatedAt ? moment(element?.updatedAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                }
            } else if (checkListKey === "Invoice List" || checkListKey === "Sales Order Invoice List") {
                objConstruct = {
                    "Invoice No": element?.invoiceId,
                    // "Sales Order Number": element?.invoiceDetails[0]?.monthlyContractDet?.soNumber,
                    "Customer Number": element?.customer[0]?.customerNo,
                    "Customer Name": `${element?.customer[0]?.firstName || ""} ${element?.customer[0]?.lastName || ""}`,
                    "Billable Reference Number": element?.billRefNo,
                    "Invoice Start Date": element?.invStartDate ? moment(element?.invStartDate).format('DD-MMM-YYYY') : '-',
                    "Invoice End Date": element?.invEndDate ? moment(element?.invEndDate).format('DD-MMM-YYYY') : '-',
                    "Invoice Date": element?.invDate ? moment(element?.invDate).format('DD-MMM-YYYY') : '-',
                    "Due Date": element?.dueDate ? moment(element?.dueDate).format('DD-MMM-YYYY') : '-',
                    "Invoice Amount": USNumberFormat(element?.invAmt),
                    "Invoice O/S Amount": USNumberFormat(element?.invOsAmt),
                    "Invoice Status": checkListKey === "Invoice List" ? element?.invoiceStatus : checkListKey === "Sales Order Invoice List" ? element?.newInvoiceStatus : ''
                }
            } else if (checkListKey.includes("Account List")) {
                objConstruct = {
                    "Billable Reference Number": element?.account?.accountNo,
                    "Customer Number": element?.customer?.crmCustomerNo,
                    "Customer Name": `${element?.customer?.firstName} ${element?.customer?.lastName}`,
                    "Currency": element?.customer?.billableDetails[0]?.currencyDesc?.description,
                    "Contract ID": element?.contractId
                }
            } else if (checkListKey === "Billing") {
                objConstruct = {
                    "Contract ID": element?.contractId,
                    "Customer Number": element.customer?.crmCustomerNo,
                    "Customer Name": `${element?.customer?.firstName} ${element?.customer?.lastName}`,
                    "Billable Reference Number": element?.billRefNo,
                    "Contract Start Date": element?.startDate ? moment(element?.startDate).format('DD-MMM-YYYY') : '-',
                    "Contract End Date": element?.endDate ? moment(element?.endDate).format('DD-MMM-YYYY') : '-',
                    "Total RC": USNumberFormat(element?.rcAmount),
                    "Total NRC": USNumberFormat(element?.otcAmount),
                    "Total Usage": USNumberFormat(element?.usageAmount),
                    "Credit Adjustment": USNumberFormat(element?.creditAdjAmount),
                    "Debit Adjustment": USNumberFormat(element?.debitAdjAmount),
                    "Total Charge": USNumberFormat(element?.totalCharge)
                }
            } else if (checkListKey === "Billing History") {
                objConstruct = {
                    "Contract ID": element?.contractId,
                    "Customer No": element.customer?.crmCustomerNo,
                    "Customer Name": `${element?.customer?.firstName} ${element?.customer?.lastName}`,
                    "Billable Reference Number": element?.billRefNo,
                    "Contract Start Date": element?.startDate ? moment(element?.startDate).format('DD-MMM-YYYY') : '-',
                    "Contract End Date": element?.endDate ? moment(element?.endDate).format('DD-MMM-YYYY') : '-',
                    "Total RC": USNumberFormat(element?.rcAmount),
                    "Total NRC": USNumberFormat(element?.otcAmount),
                    "Total Usage": USNumberFormat(element?.usageAmount),
                    "Credit Adjustment": USNumberFormat(element?.creditAdjAmount),
                    "Debit Adjustment": USNumberFormat(element?.debitAdjAmount),
                    "Wavier": USNumberFormat(element?.wavier),
                    "Total Charge": USNumberFormat(element?.totalCharge)
                }
            } else if (checkListKey === "Invoice Preview List" || checkListKey === "Invoice Preview List History") {
                objConstruct = {
                    "Invoice ID": element?.invoiceId,
                    "Customer Number": element?.customer[0]?.customerNo,
                    "Customer Name": `${element?.customer[0]?.firstName || ''} ${element?.customer[0]?.lastName || ''}`,
                    "Billable Ref No": element?.billRefNo || '',
                    "Invoice Start Date": element?.invStartDate ? moment(element?.invStartDate).format('DD-MMM-YYYY') : '-',
                    "Invoice End Date": element?.invEndDate ? moment(element?.invEndDate).format('DD-MMM-YYYY') : '-',
                    "Invoice Date": element?.invDate ? moment(element?.invDate).format('DD-MMM-YYYY') : '-',
                    "Due Date": element?.dueDate ? moment(element?.dueDate).format('DD-MMM-YYYY') : '-',
                    "Invoice Amount": USNumberFormat(element.invAmt),
                    "Advance Amount": USNumberFormat(element.advanceAmount),
                    "Previous Balance Amount": USNumberFormat(element.previousBalanceAmount),
                    "Total Outstanding": USNumberFormat(element?.totalOutstanding),
                }
            } else if (checkListKey === "Search Customer") {
                objConstruct = {
                    "Customer Number": element?.crmCustomerNo,
                    "Customer Name": `${element?.firstName || ''} ${element?.lastName || ''}`,
                    "Customer Type": element?.customerTypeDesc?.description,
                    "Primary Contact Number": element?.contact?.contactNo,
                    "Customer Email": element?.contact?.email,
                    "Customer Status": element?.statusDesc?.description,
                    "Created By": `${element?.createdByName?.firstName} ${element?.createdByName?.lastName}`,
                    "Created At": element?.createdAt ? moment(element?.createdAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                    "Updated By": `${element?.updatedByName?.firstName} ${element?.updatedByName?.lastName}`,
                    "Updated At": element?.updatedAt ? moment(element?.updatedAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                }
            } else if (checkListKey === "Plan List" || checkListKey === "Service List") {
                let type = checkListKey.split(' ')[0];
                objConstruct = {
                    [`${type} Id`]: element[`${type.toLowerCase()}Id`],
                    [`${type} Name`]: element[`${type.toLowerCase()}Name`],
                    "Service Type": element?.serviceTypeDesc?.description,
                    "Charge Name": (element[`${type.toLowerCase()}Charges`] && element[`${type.toLowerCase()}Charges`].length > 0 && element[`${type.toLowerCase()}Charges`].map((charge) => { return (charge?.chargeDetails && charge?.chargeDetails?.chargeName) || '' }).toString()) || '-',
                    "Charge Amount": (element[`${type.toLowerCase()}Charges`] && element[`${type.toLowerCase()}Charges`].length > 0 && element[`${type.toLowerCase()}Charges`].map((charge) => { return USNumberFormat(charge?.chargeAmount) || '' }).toString()) || '-',
                    "Start Date": element?.startDate ? moment(element?.startDate).format('DD-MMM-YYYY') : '-',
                    "End Date": element?.endDate ? moment(element?.endDate).format('DD-MMM-YYYY') : '-',
                    "Status": element.statusDesc?.description,
                    "Updated By": `${element?.updatedByName?.firstName} ${element?.updatedByName?.lastName}`,
                    "Updated At": element?.updatedAt ? moment(element?.updatedAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                    "Created By": `${element?.createdByName?.firstName} ${element?.createdByName?.lastName}`,
                    "Created At": element?.createdAt ? moment(element?.createdAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                }
            } else if (checkListKey === "Addon List" || checkListKey === 'Asset List') {
                let type = checkListKey.split(' ')[0];
                objConstruct = {
                    [`${type} Id`]: element[`${type.toLowerCase()}Id`],
                    [`${type} Name`]: element[`${type.toLowerCase()}Name`],
                    "Service Type": element?.serviceTypeDes,
                    "Charge Name": (element[`${type.toLowerCase()}Charges`] && element[`${type.toLowerCase()}Charges`].length > 0 && element[`${type.toLowerCase()}Charges`].map((charge) => { return (charge?.chargeDetails && charge?.chargeDetails?.chargeName) || '' }).toString()) || '-',
                    "Charge Amount": (element[`${type.toLowerCase()}Charges`] && element[`${type.toLowerCase()}Charges`].length > 0 && element[`${type.toLowerCase()}Charges`].map((charge) => { return USNumberFormat(charge?.chargeAmount) || '' }).toString()) || '-',
                    "Start Date": element?.startDate ? moment(element?.startDate).format('DD-MMM-YYYY') : '-',
                    "End Date": element?.endDate ? moment(element?.endDate).format('DD-MMM-YYYY') : '-',
                    "Updated By": element?.updatedUser,
                    "Updated At": element?.updatedAt ? moment(element?.updatedAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                    "Created By": element?.createdUser,
                    "Created At": element?.createdAt ? moment(element?.createdAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                    "Status": element.statusDes,
                    "Volume Allowed": element.volumeAllowed,
                    "Multiple Selection": element.multipleSelection,
                }
            } else if (checkListKey === "Catalog List") {
                objConstruct = {
                    "Catalog Id": element?.catalogId,
                    "Catalog Name": element?.catalogName,
                    "Product Category": element?.serviceTypeDesc?.description,
                    "Plan": element?.planMap[0]?.planDetails[0]?.planName,
                    "Service Items": (element?.serviceMap && element?.serviceMap.length > 0 && element?.serviceMap.map((service) => { return (service?.serviceDetails && service?.serviceDetails[0]?.serviceName) || '' }).toString()) || '-',
                    "Asset Items": (element?.assetMap && element?.assetMap.length > 0 && element?.assetMap.map((asset) => { return (asset?.assetDetails && asset?.assetDetails[0]?.assetName) || '' }).toString()) || '-',
                    "Addon Items": (element?.addonMap && element?.addonMap.length > 0 && element?.addonMap.map((addon) => { return (addon?.addonDetails && addon?.addonDetails[0]?.addonName) || '' }).toString()) || '-',
                    "Status": element?.statusDesc?.description,
                    "Start Date": element?.startDate ? moment(element?.startDate).format('DD-MMM-YYYY') : '-',
                    "End Date": element?.endDate ? moment(element?.endDate).format('DD-MMM-YYYY') : '-',
                    "Created By": `${element?.createdByName?.firstName} ${element?.createdByName?.lastName}`,
                    "Created At": element?.createdAt ? moment(element?.createdAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                    "Updated By": `${element?.updatedByName?.firstName} ${element?.updatedByName?.lastName}`,
                    "Updated At": element?.updatedAt ? moment(element?.updatedAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                }
            } else if (checkListKey === "Charge List") {
                objConstruct = {
                    "Charge Id": element?.chargeId,
                    "Charge Name": element?.chargeName,
                    "Charge Category": element?.chargeCatDes,
                    "Service Type": element?.serviceTypeDes,
                    "Currency": element?.currencyDes,
                    "Status": element?.statusDes,
                    "GL Code": element?.glcode,
                    "Start Date": element?.startDate ? moment(element?.startDate).format('DD-MMM-YYYY') : '-',
                    "End Date": element?.endDate ? moment(element?.endDate).format('DD-MMM-YYYY') : '-',
                    "Created By": element?.createdUser,
                    "Created At": element?.createdAt ? moment(element?.createdAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                    "Updated By": element?.updatedUser,
                    "Updated At": element?.updatedAt ? moment(element?.updatedAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                }
            } else if (checkListKey === "Helpdesk Search") {
                objConstruct = {
                    "Helpdesk ID": element?.helpdeskNo,
                    // "ID Type": element?.customerDetails?.idType?.description ? element?.customerDetails.idType.description : '',
                    // "ID Value": element?.customerDetails?.idValue ? element?.customerDetails.idValue : '',
                    "Source": element?.helpdeskSource?.description ? element?.helpdeskSource?.description : '',
                    "Status": element?.status.description ? element?.status.description : '',
                    "Source Reference": element?.sourceReference ? element?.sourceReference : '',
                    [appConfig?.clientFacingName?.customer + "Number"]: element?.profileNo ? element?.profileNo : '',
                    "Full Name": (element?.customerDetails?.firstName || element?.customerDetails?.lastName) ? (element?.customerDetails?.firstName || '') + '' + (element?.customerDetails?.lastName || '') : '',
                    "Contact Number": element?.customerDetails?.contactDetails?.mobileNo ? element?.customerDetails?.contactDetails?.mobileNo : '',
                    "Email": element?.customerDetails?.contactDetails?.emailId ? element?.customerDetails?.contactDetails?.emailId : '',
                }

            } else if (checkListKey === "Mapped Workflow Template") {
                objConstruct = {
                    "Mapping Id": element?.mappingId,
                    "Template Name": element?.mappingName,
                    "createdAt": element?.createdAt ? moment(element?.createdAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                    "CreatedBy": element?.createdByName?.firstName || element?.createdByName?.lastName,
                    "Module": element?.moduleDescription?.description,
                    "serviceType": element?.mapping?.serviceTypeDescription,
                    "InteractionType": element?.mapping?.interactionTypeDescription,
                    "CustomerType": element?.mapping?.customerTypeDescription,
                    "TemplateId": element?.workflowId
                }
            } else if (checkListKey === "Chat Details") {
                objConstruct = {
                    "chatId": element?.chatId,
                    "Mobile No": element?.contactNo,
                    "Customer Name": element?.customerName,
                    "Start Date and Time": element?.startAt ? moment(element?.startAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                    "End Date and Time": element?.endAt ? moment(element?.endAt).format('DD MMM YYYY hh:mm:ss A') : '-',
                    "Status": element?.statusDesc?.description || '',
                    "Source": element?.chatSourceDesc.description || '',
                    "Created At": element?.createdAt ? moment(element?.createdAt).format('DD MMM YYYY hh:mm:ss A') : '-'
                }
            } else if (checkListKey === "Helpdesk Details") {
                objConstruct = {
                    "helpdeskNo": element?.helpdeskNo,
                    "Email Id": element?.mailId,
                    "Subject": element?.helpdeskSubject,
                    "Content": element?.helpdeskContent,
                    "Status": element?.statusDesc.description || '',
                    "Source": element?.helpdeskSourceDesc.description || '',
                    "Created At": element?.createdAt ? moment(element?.createdAt).format('DD MMM YYYY hh:mm:ss A') : '-'
                }
            } else if (checkListKey === "AR Ageing Header Report") {
                objConstruct = {
                    "Invoice Number": element?.invoiceId,
                    "ERP Invoice Ref No": element?.invNo,
                    "Receipt ID": element?.receiptId,
                    "Receipt Date": element?.receiptDate ? formatISODateDDMMMYY(element?.receiptDate) : '-',
                    "Receipt Created Date": element?.receiptCreatedDate ? formatISODateDDMMMYY(element?.receiptCreatedDate) : '-',
                    "Sales Order Number": element?.orderNo,
                    // "Sales Order Number": element?.soNumber,
                    // "Customer Number": element?.crmCustomerNo,
                    "Customer Number": element?.customerNo,
                    "Customer Name": element?.customerName,
                    "Related Party Information": element?.relatedPartyInfo,
                    "Invoice Start Date": element?.invStartDate ? formatISODateDDMMMYY(element?.invStartDate) : '-',
                    "Invoice End Date": element?.invEndDate ? formatISODateDDMMMYY(element?.invEndDate) : '-',
                    "Invoice Date": element?.invDate ? formatISODateDDMMMYY(element?.invDate) : '-',
                    "Invoice Due Date": element?.dueDate ? formatISODateDDMMMYY(element?.dueDate) : '-',
                    "Currency": element?.currency,
                    "Invoice Amount": (element?.invAmt),
                    "Invoice O/S Amount": (element?.invOsAmt),
                    "Status": element?.invoiceStatus,
                    "Due Aging": element?.dueAging,
                    "Current": element?.currentAmt,
                    "1–30 Days": element?.days130,
                    "31–60 Days": element?.days3160,
                    "61–90 Days": element?.days6190,
                    "91–180 Days": element?.days91180,
                    "181–360 Days": element?.days181360,
                    "361+ Days": element?.daysMorethan360,
                    "Opportunity Name": element?.opportunityName
                }
            } else if (checkListKey === "AR Ageing Snap Report") {
                objConstruct = {
                    "Invoice Number": element?.invoiceId,
                    "ERP Invoice Ref No": element?.invNo,
                    "Receipt ID": element?.receiptId,
                    "Receipt Date": element?.receiptDate ? formatISODateDDMMMYY(element?.receiptDate) : '-',
                    "Receipt Created Date": element?.receiptCreatedDate ? formatISODateDDMMMYY(element?.receiptCreatedDate) : '-',
                    "Sales Order Number": element?.orderNo,
                    // "Sales Order Number": element?.soNumber,
                    "Customer Number": element?.customerNo,
                    // "Customer Number": element?.crmCustomerNo,
                    "Customer Name": element?.customerName,
                    "Related Party Information": element?.relatedPartyInfo,
                    "Invoice Start Date": element?.invStartDate ? formatISODateDDMMMYY(element?.invStartDate) : '-',
                    "Invoice End Date": element?.invEndDate ? formatISODateDDMMMYY(element?.invEndDate) : '-',
                    "Invoice Date": element?.invDate ? formatISODateDDMMMYY(element?.invDate) : '-',
                    "Invoice Due Date": element?.dueDate ? formatISODateDDMMMYY(element?.dueDate) : '-',
                    "Currency": element?.currency,
                    "Invoice Amount": (element?.invAmt),
                    "Invoice O/S Amount": (element?.invOsAmt),
                    "Status": element?.invoiceStatus,
                    "Due Aging": element?.dueAging,
                    "Current": element?.currentAmt,
                    "1–30 Days": element?.days130,
                    "31–60 Days": element?.days3160,
                    "61–90 Days": element?.days6190,
                    "91–180 Days": element?.days91180,
                    "181–360 Days": element?.days181360,
                    "361+ Days": element?.daysMorethan360,
                    "Opportunity Name": element?.opportunityName,
                    "Closed Month": element?.arAgeingSnapMonthNm,
                    "Closed Year": element?.arAgeingSnapYear
                }
            } else if (checkListKey === "Assigned Helpdesk") {
                objConstruct = {
                    "Id": element?.oHelpdeskNo,
                    "User Name": element?.oCurrUser,
                    "Status": element?.oStatusDesc,
                    "Channel": element?.oHelpdeskSource,
                    "Severity": element?.oSeverity,
                    "Type": element?.oHelpdeskType,
                    "Aging": moment(element?.oCreatedAt).fromNow(),
                    "Generated At": element?.oCreatedAt ? moment(element?.oCreatedAt).format('DD-MM-YYYY') : ''
                }
            } else if (checkListKey === "Tech Details") {
                objConstruct = {
                    "Product Name": element?.productDetails?.productName,
                    "Product Type": element?.productDetails?.productTypeDescription?.description,
                    "Service Type": element?.productDetails?.serviceTypeDescription?.description,
                    "Technical Name": element?.techName,
                    "Technical Description": element?.techDesc,
                    "Quantity": element?.quantity,
                    "Unit Price": element?.unitPrice,
                    "Total Amount": element?.totalAmount
                }
            }else if (checkListKey === "FAQ") {
                objConstruct = {
                    "Question": element?.question,
                    "Answer": element?.answer,
                    "Channel": element?.channelDes?.map((item) => item?.description)?.toString() ?? '-',
                    "Created By": `${element?.createdByDetails?.firstName || ''} ${element?.createdByDetails?.lastName || '-'}`,
                    "Created On": element?.createdAt ? moment(element?.createdAt).format('DD MMM YYYY') : '',
                    "Status": element?.statusDesc?.description,
                }
            } else {
                let map = new Map()
                const keys = Object.keys(element)
                for (const h of header) {
                    const head = h.accessor
                    if (keys.includes(head)) {
                        // console.log('Key = ', h.Header, ' value = ', element[head])
                        map.set(h.Header, element[head])
                    }

                }
                const obj = Object.fromEntries(map);
                objConstruct = {
                    ...obj
                }

            }
            tableData.push(objConstruct);
        });

        if (tableData.length !== 0) {
            let excelBuffer;
            if (isReportEnabled) {
                // only for MIS Report
                const workbook = new ExcelJS.Workbook();
                // const backgroudImage = workbook.addImage({
                //     base64: appConfig?.appLogo,
                //     extension: 'png'
                // });
                const worksheet = workbook.addWorksheet(checkListKey, {
                    views: [{ state: 'frozen', ySplit: 1 }],
                    properties: {
                        defaultRowHeight: excelProperties?.defaultRowHeight,
                        defaultColWidth: excelProperties?.defaultColWidth
                    }
                })
                // worksheet.addImage(backgroudImage,{
                //     tl: { col: 2, row: 2 }, // Top-left position of the image
                //     ext: { width: 100, height: 100 }
                // })

                if (tableData?.length > 0) {
                    const headers = Object.keys(tableData?.[0]);
                    worksheet.columns = headers.map(header => ({
                        header,
                        key: header
                    }));

                    // Add data rows
                    tableData.forEach(row => worksheet.addRow(row));
                    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                            cell.border = excelProperties?.borderStyle
                            cell.font = rowNumber === 1 ? { ...excelProperties?.font, bold: true } : excelProperties?.font
                            cell.fill = rowNumber === 1 ? excelProperties?.fill : { pattern: 'none' }
                        })
                    });
                    if (SearchCriteria && Object.keys(SearchCriteria).length > 0) {
                        let searchfields = Object.keys(SearchCriteria)
                        if (searchfields.length > 0) {
                            searchfields.forEach((val) => {
                                if (SearchCriteria[val] && Array.isArray(SearchCriteria[val])) {
                                    SearchCriteria[val] = SearchCriteria[val].map((val) => val.label).toString()
                                } else if (SearchCriteria[val] && typeof SearchCriteria[val] === 'object' && SearchCriteria[val] !== null) {
                                    SearchCriteria[val] = SearchCriteria[val]?.label
                                }
                            })
                            const sheet2 = workbook.addWorksheet('Search Criteria');
                            sheet2.columns = Object.keys(SearchCriteria).map(header => ({
                                header,
                                key: header
                            }));
                            sheet2.addRow(SearchCriteria)
                            sheet2.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                                row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                                    cell.border = excelProperties?.borderStyle
                                    cell.font = rowNumber === 1 ? { ...excelProperties?.font, bold: true } : excelProperties?.font
                                    cell.fill = rowNumber === 1 ? excelProperties?.fill : { pattern: 'none' }
                                })
                            });
                        }
                    }

                    excelBuffer = await workbook.xlsx.writeBuffer();
                }
            } else {
                const ws = XLSX.utils.json_to_sheet(tableData,
                    {
                        origin: 'A2',                 //----Starting Excel cell Position
                        skipHeader: false             //----Header Skip 
                    });
                const wb = {
                    Sheets: { data: ws },
                    SheetNames: ['data'],
                };

                excelBuffer = XLSX.write(wb, {
                    bookType: 'xlsx',
                    type: 'array',
                });
            }


            //----Header As Upper Case The Origin Should Be A1 uncomment 123 to 129------//
            // var range = XLSX.utils.decode_range(ws['!ref']);
            // for (var C = range.s.r; C <= range.e.r; ++C) {
            //     var address = XLSX.utils.encode_col(C) + "1";
            //     if (!ws[address]) continue;
            //     ws[address].v = ws[address].v.toUpperCase();
            // }
            //----Header As Upper Case ------//

            const data = new Blob([excelBuffer], { type: fileType });
            FileSaver.saveAs(data, fileName + fileExtension);
        } else {
            toast.error("No records to export")
        }
    };

    const handleOnExportClick = async (e) => {
        fetchData();
    }

    const fetchData = () => {

        let url, requestBody, getApiMethod = 'NA';
        if (listSearch === 'NA') {
            requestBody = { filters: formFilterObject(filters) }
        } else {
            requestBody = listSearch;
        }
        const checkListKeys = [
            'created-interaction', 'closed-interaction', 'open-interaction',
            'AR-AGEING-SNAP', 'Audit Trail Report', 'Billing Report',
            'Chat Report', 'Departmentwise Interaction Report', 'FCR Agent Report',
            'FCR MIS Report', 'FCR Report', 'FollowUp Interaction', 'FollowUp Count Report',
            'FollowUp Report', 'FollowUp Interaction List', 'Invoice Report',
            'User Login Report', 'Product Report', 'Sales Report',
            'SLA Interaction Report', 'TAT Report', 'Ticket Statistics',
            'Created Customer Report', 'Closed Order Report', 'Created Order Report',
            'Open Order Report', 'Abandoned Call Report', 'Follow-Up Frequency Report', 'ACD Call Interval Summary Report Daily',
            'ACD Call Interval Summary Report Hourly', 'Agent Productivity Report Daily', 'Agent Productivity Report Hourly', 'Open Task Report', 'Created Task Report', 'Closed Task Report'
        ];

        if (listKey === "Interaction Daily Report") {
            // console.log('requestBody--------x---------->', requestBody)
            if (Object.keys(requestBody)?.length > 0) {
                url = apiUrl
                getApiMethod = method
            } else {
                toast.error("Date filter is required!");
                return
            }

        }

        if (listKey === "Project Wise Helpdesk") {
            url = apiUrl
            getApiMethod = method
        }

        if (listKey === "Campaign Listing") {
            url = `${properties.CAMPAIGN_API}/list`
            getApiMethod = "POST"

        }
        else if (listKey === "Unbilled Contract List" || listKey === "Review Contract List") {
            url = `${properties.CONTRACT_API}/monthly/search?excel=true`
            getApiMethod = "POST"
        }
        else if (listKey === "AR Ageing Header Report" || listKey === "AR Ageing Snap Report") {
            url = `${properties.REPORTS_API}/ar-ageing?excel=true`
            getApiMethod = "POST"
        }
        else if (listKey === "Interactions Search") {

            url = `${properties.INTERACTION_API}/search`
            getApiMethod = "POST"

        }
        else if (listKey === "Open Interaction Report") {

            url = apiUrl
            getApiMethod = "POST"

        }
        else if (["Admin View User-User Management", "Admin View New-User-Request Management"].includes(listKey)) {

            url = apiUrl
            getApiMethod = apiMethod

        } else if (listKey === "Request Statement List") {

            url = apiUrl
            getApiMethod = apiMethod

        } else if (listKey === "Admin View User-Roles Setup") {

            url = `${properties.ROLE_API}`
            getApiMethod = "GET"

        } else if (listKey === "Admin View Org List" || listKey === "Admin View Ou List" || listKey === "Admin View Dept List") {

            url = `${properties.ORGANIZATION}/search?unitType=${listSearch?.unitType || ''}`
            getApiMethod = "GET"

        } else if (listKey === "Catalogue Listing") {

            url = `${properties.CATALOGUE_API}/list`
            getApiMethod = "POST"

        } else if (listKey === "Customer Advance Search") {

            url = `${properties.CUSTOMER_API}/search`
            getApiMethod = "POST"

        } else if (listKey === "Account History") {

            url = `${properties.CUSTOMER_DETAILS}/account-history`
            getApiMethod = "POST"

        } else if (listKey === "Bulk Upload Search") {

            url = `${properties.BULK_UPLOAD_API}/search?excel=true`
            getApiMethod = "POST"

        } else if (listKey === "Manage Parameters") {

            if (listSearch?.codeType) {
                url = `${properties.MASTER_API}/list/` + listSearch?.codeType
                getApiMethod = "GET"
            } else {
                url = `${properties.MASTER_API}/list`
                getApiMethod = "GET"
            }

        } else if (listKey === "View All Notifications") {

            url = `${properties.NOTIFICATION_API}`
            getApiMethod = "GET"

        } else if (listKey === "Customer Details History") {

            url = `${properties.CUSTOMER_API}/details/history`
            getApiMethod = "POST"

        }
        else if (listKey === "Customer Address History") {

            url = `${properties.CUSTOMER_API}/address/history`
            getApiMethod = "POST"

        }
        else if (listKey === "Customer Property History") {

            url = `${properties.CUSTOMER_API}/property/history`
            getApiMethod = "POST"

        } else if (listKey === "Account Details History") {

            url = `${properties.CUSTOMER_API}/account/details/history`
            getApiMethod = "POST"

        }
        else if (listKey === "Account Address History") {

            url = `${properties.CUSTOMER_API}/account/address/history`
            getApiMethod = "POST"

        }
        else if (listKey === "Account Property History") {

            url = `${properties.CUSTOMER_API}/account/property/history`
            getApiMethod = "POST"

        }
        else if (listKey === "Contract List") {
            url = `${properties.CONTRACT_API}/search`
            getApiMethod = "POST"
        }
        else if (listKey === "Unbilled Contract List") {
            url = `${properties.CONTRACT_API}/monthly/search`
            getApiMethod = "POST"
        }
        else if (listKey === "Contract List") {
            url = `${properties.CONTRACT_API}/search`
            getApiMethod = "POST"
        }
        else if (listKey === "Unbilled Contract List") {
            url = `${properties.CONTRACT_API}/monthly/search`
            getApiMethod = "POST"
        }
        else if (listKey === "Contract History List") {
            url = `${properties.CONTRACT_API}/monthly/search?type=BILLED`
            getApiMethod = "POST"
        }
        else if (listKey === "Sales Order Contract List") {
            url = `${properties.CONTRACT_API}/sales-order/search`
            getApiMethod = "POST"
        }
        else if (listKey === "Sales Order Unbilled Contract List") {
            url = `${properties.CONTRACT_API}/sales-order/monthly/search`
            getApiMethod = "POST"
        }
        else if (listKey === "Sales Order Billed Contract List") {
            url = `${properties.CONTRACT_API}/sales-order/monthly/search?type=BILLED`
            getApiMethod = "POST"
        }

        else if (listKey === "Billing") {
            url = `${properties.CONTRACT_API}/monthly/search?type=UNBILLED`
            getApiMethod = "POST"
        }
        else if (listKey === "Billing History") {
            url = `${properties.BILLING_API}/contract/search`
            getApiMethod = "POST"
        }
        else if (listKey === "Invoice Preview List") {
            url = `${properties.INVOICE_API}/search?screen=billing`
            getApiMethod = "POST"
        }
        else if (listKey === "Invoice List" || listKey === "Invoice Preview List History") {
            url = `${properties.INVOICE_API}/search`
            getApiMethod = "POST"
        }
        else if (listKey === "Sales Order Invoice List") {
            url = `${properties.INVOICE_API}/sales-order/search`
            getApiMethod = "POST"
        }
        else if (listKey === "Account List") {
            url = `${properties.CONTRACT_API}/account/search`
            getApiMethod = "POST"
        }
        else if (listKey === "Search Customer") {
            url = `${properties.CUSTOMER_API}/searching`
            getApiMethod = "POST"
        }
        else if (listKey === "Plan List") {
            url = `${properties.PLANS_API}/search?excel=true`
            getApiMethod = "POST"
        }
        else if (listKey === "Service List") {
            url = `${properties.CATALOG_SERVICE_API}/search?excel=true`
            getApiMethod = "POST"
        }
        else if (listKey === "Addon List") {
            url = `${properties.ADDON_API}/all-list?excel=true`
            getApiMethod = "POST"
        }
        else if (listKey === "Asset List") {
            url = `${properties.ASSET_API}/all-list?excel=true`
            getApiMethod = "POST"
        }
        else if (listKey === "Catalog List") {
            url = `${properties.CATALOGUE_API}/search?excel=true`
            getApiMethod = "POST"
        }
        else if (listKey === "Plan List") {
            url = `${properties.PLANS_API}/search?excel=true`
            getApiMethod = "POST"
        }
        else if (listKey === "Charge List") {
            url = `${properties.CHARGE_API}/search?excel=true`
            getApiMethod = "POST"
        }
        else if (listKey === "Helpdesk Search") {
            url = `${properties.HELPDESK_API}/search?excel=true`
            getApiMethod = "POST"
        }
        else if (listKey === "Channel List" || listKey === "Demographic List" || listKey === "Agent List"
            || listKey === "Agent Helpdesk Summary" || listKey === "Agent Chat Summary") {
            url = apiUrl
            getApiMethod = apiMethod
        } else if (listKey === "Chat Details") {
            url = apiUrl
            getApiMethod = apiMethod
        } else if (listKey === "Helpdesk Details") {
            url = apiUrl
            getApiMethod = apiMethod
        } else if (listKey === "Created Order Report") {
            url = `${apiUrl}?excel=true`
            getApiMethod = "POST"
        } else if (listKey === "Tech Details") {
            console.log('im here')
            url = `${apiUrl}?excel=true`
            getApiMethod = apiMethod
        }
        // } else if (
        //     listKey === "created-interaction" || listKey === "closed-interaction" || listKey === "open-interaction") {
        //     url = `${properties.API_ENDPOINT}${properties.REPORTS_API}/get-report/${listKey}?excel=true&uid=${requestBody?.uid}`
        //     // if (listKey === 'followup-count-daily' || listKey === "followup-frequency" || listKey === "tat-summary" || listKey === "tat-level-summary" || listKey === "tat-cct-summary") {
        //     //     url = url + '&isDisabledOrder=true'
        //     // }
        //     getApiMethod = "GET"
        else if (checkListKeys.includes(listKey)) {
            url = `${apiUrl}&excel=true`
            getApiMethod = "GET"
        }
        // else if (listKey === "Open Task Report" || listKey === 'Created Task Report' || listKey === 'Closed Task Report') {
        //     url = `${apiUrl}&excel=true`
        //     getApiMethod = "GET"
        // }
        else {
            console.log('Else')
            url = apiUrl + '?excel=true'
            getApiMethod = apiMethod
        }

        if (exportBackend === true) {
            if (getApiMethod === "GET") {
                console.log('report', report)
                // if (report) {
                //     axios.get(url, {
                //         headers: {
                //             'Content-Type': 'application/json',
                //             "x-tenant-id": appConfig.biTenantId,
                //             Authorization: auth?.accessToken
                //         }
                //     }).then((resp) => {
                //         const response = resp?.data ?? {}
                //         exportToCSV(listKey, response?.data?.rows ?? [], fileName, report)
                //         handleExportButton(true)
                //     })
                //         .catch(error => console.error(error))
                //         .finally()
                // }
                // else {
                get(url).then(response => {
                    if (response && response.data && response.data.length > 0) {
                        exportToCSV(listKey, response.data, fileName, report)
                    } else if (response && response.data.rows) {
                        exportToCSV(listKey, response.data.rows, fileName, report)
                    }
                    handleExportButton(true)
                }).catch((error) => {
                    console.log(error)
                }).finally()
                // }
            } else {
                // console.log({ url, requestBody });
                // console.log('requestBody--------->', requestBody)
                post(url, requestBody)
                    .then((response) => {
                        const responseData = response?.data?.rows ?? response.data
                        exportToCSV(listKey, responseData, fileName, report)
                        handleExportButton(true)
                    }).catch((error) => {
                        console.log(error)
                    })
                    .finally()
            }
        } else {
            exportToCSV(listKey, list, fileName, report)
            handleExportButton(true)
        }
    };

    return (
        <button className="skel-btn-submit" style={{ backgroundColor: '#7f7f7f', borderColor: '#7f7f7f' }} onClick={handleOnExportClick}>Export Excel
            {exportIcon && <img alt="" src={exportExcelIcon} className="pl-2" />}
        </button>
        // <div className="text-left mt-0">
        //     <div className="">
        //         <button className="skel-btn-cancel skel-btn-export"
        //             onClick={handleOnExportClick}>Export Excel</button>
        //     </div>
        // </div>
    );
};

const metaInfo = [{
    name: 'created-interaction',
    value: openInteractionColumns
}, {
    name: 'closed-interaction',
    value: openInteractionColumns
}, {
    name: 'open-interaction',
    value: openInteractionColumns
}, {
    name: 'Created Task Report',
    value: openTaskColumns
}, {
    name: 'Closed Task Report',
    value: openTaskColumns
}, {
    name: 'Open Task Report',
    value: openTaskColumns
}, {
    name: 'AR-AGEING-SNAP',
    value: ARAgeingColumns
}, {
    name: 'Audit Trail Report',
    value: AuditTrailColumns
}, {
    name: 'Billing Report',
    value: BillingColumns
}, {
    name: 'Chat Report',
    value: ChatColumns
}, {
    name: 'Departmentwise Interaction Report',
    value: DeptInteractionColumns
}, {
    name: 'FCR Agent Report',
    value: FCRAgentColumns
}, {
    name: 'FCR MIS Report',
    value: FCRMISColumns
}, {
    name: 'FCR Report',
    value: FCRColumns
}, {
    name: 'FollowUp Interaction',
    value: FollowInteractionColumns
}, {
    name: 'FollowUp Count Report',
    value: FollowupCountColumns
}, {
    name: 'FollowUp Report',
    value: FollowupColumns
}, {
    name: 'FollowUp Interaction List',
    value: FollowInteractionColumns
}, {
    name: 'Invoice Report',
    value: InvoiceColumns
}, {
    name: 'User Login Report',
    value: LoginColumns
}, {
    name: 'Product Report',
    value: ProductColumns
}, {
    name: 'Sales Report',
    value: SalesColumns
}, {
    name: 'SLA Interaction Report',
    value: SLAColumns
}, {
    name: 'TAT Report',
    value: TATReportSummary
}, {
    name: 'Ticket Statistics',
    value: TicketStatisticsColumns
}, {
    name: 'Created Customer Report',
    value: createdCustomerColumns
}, {
    name: 'Closed Order Report',
    value: closedOrderColumns
}, {
    name: 'Created Order Report',
    value: createdOrderColumns
}, {
    name: 'Open Order Report',
    value: openOrderColumns
},
{
    name: 'Abandoned Call Report',
    value: AbandonedColumns
},
{
    name: 'ACD Call Interval Summary Report Daily',
    value: ACDCallIntervalSummaryReportColumns
},
{
    name: 'Follow-Up Frequency Report',
    value: FollowupFrequencyColumns
},
{
    name: 'ACD Call Interval Summary Report Hourly',
    value: ACDCallIntervalSummaryReportHourlyColumns
},
{
    name: 'Agent Productivity Report Daily',
    value: AgentProductivityReportDailyColumns
},
{
    name: 'Agent Productivity Report Hourly',
    value: AgentProductivityReportHourlyColumns
},
]

export default ExportToExcelFile;
