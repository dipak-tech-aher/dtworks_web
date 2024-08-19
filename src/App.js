import React, { lazy, useContext } from "react";
import { Navigate, BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AppContext } from "./AppContext";
import ExternalLogin from "./Authentication/ExternalLogin";
import Login from "./Authentication/login";
import GlobalMap from "./Map/GlobalMap";
import won from './assets/images/won.jpg';
import FallbackLoader from "./common/components/FallbackLoader";
import { PrivateRoute, PublicRoute } from "./common/route";
import { useHistory } from "./common/util/history";
import { computeDynamicBaseURL } from "./common/util/util";


const dynamicBase = computeDynamicBaseURL();
const AmeyoRedirect = lazy(() => import("./Ameyo/AmeyoRedirect"));
const ScrollToTop = lazy(() => import("./ScrollToTop"));
const AmeyoRedirectNew = lazy(() => import('./Ameyo/AmeyoRedirect_2.0'));
const AmeyoHelpdeskCreation = lazy(() => import('./Ameyo/AmeyoHelpdeskCreation'));
const Signup = lazy(() => import("./Authentication/signup"));
const Logout = lazy(() => import("./common/logout"));
const FAQ = lazy(() => import("./Authentication/FAQ"));
const LoginToForgotPass = lazy(() => import("./Authentication/loginToForgot"));
const Register = lazy(() => import("./Authentication/register"));
const RegisterVerify = lazy(() => import("./Authentication/registerVerify"));
const ClearAuth = lazy(() => import("./common/clearAuth"));
const FirstTimeChangePassword = lazy(() => import("./Authentication/firstTimeChangePassword"));
const OperationalDashboard = lazy(() => import("./Dashboard/operational/Dashboard"));
const Request = lazy(() => import("./CRM/Request"));
const NotificationView = lazy(() => import("./Administration/Notification/NotificationView"));
const UpdateInteraction = lazy(() => import("./HelpdeskAndInteraction/Interaction/UpdateInteraction"));
const NewCustomer = lazy(() => import('./CRM/Customer/newCustomer'));
const CustomerSearch = lazy(() => import('./CRM/Customer/customerSearch'));
const Customer360 = lazy(() => import("./CRM/Customer360/customer360"));
const FileUpload = lazy(() => import("./common/uploadAttachment/fileUpload"));
const CreateEnquireNewCustomer = lazy(() => import("./HelpdeskAndInteraction/Interaction/Inquiry/createInquiryNewCustomer"));
const EditTicketsLandingPage = lazy(() => import("./HelpdeskAndInteraction/Interaction/Complaint/EditTicketsLandingPage"));
const CreateComplaintOrServiceRequest = lazy(() => import("./HelpdeskAndInteraction/Helpdesk/CreateComplaintOrServiceRequest"));
const ExistingCustomerCreateInquiry = lazy(() => import("./HelpdeskAndInteraction/Interaction/Inquiry/exsitingCustomerCreateInquiry"));
const InteractionSearch = lazy(() => import("./HelpdeskAndInteraction/Interaction/InteractionSearch/InteractionSearch"));
const AdvanceSearch = lazy(() => import("./CRM/AdvanceSearch/AdvanceSearch"));
const EditCustomersInquiryDetails = lazy(() => import("./HelpdeskAndInteraction/Interaction/Inquiry/editCustomerInquiryNew"));
// const NotificationTable = lazy(() => import("./common/notificationTable"));
const AgentChatBox = lazy(() => import("./Chat/AgentChat/agent-chat"));
const Billing = lazy(() => import("./InvoiceAndBilling/BillGeneration/Billing"));
const SearchContract = lazy(() => import("./InvoiceAndBilling/Contract/SearchContract"));
const UnbilledSearchContractView = lazy(() => import("./InvoiceAndBilling/Contract/UnbilledSearchContractView"));
const SearchInvoice = lazy(() => import("./InvoiceAndBilling/Invoice/SearchInvoice"));
const SearchAccount = lazy(() => import("./InvoiceAndBilling/Accounting/SearchAccount"));
const CreateContract = lazy(() => import("./InvoiceAndBilling/Contract/CreateContract"));
const BillingUsage = lazy(() => import("./InvoiceAndBilling/Invoice/BillingUsage"));
const InvoiceDetailsView = lazy(() => import("./InvoiceAndBilling/Invoice/InvoiceDetailsView"));
const AccountBillingDetailsView = lazy(() => import("./InvoiceAndBilling/Accounting/AccountDetailsView/AccountBillingDetailsView"));
const ContractSearchView = lazy(() => import("./InvoiceAndBilling/Contract/ContractSearchView"));
const NewContract = lazy(() => import('./InvoiceAndBilling/Contract/newContract'));
const BillingHistory = lazy(() => import("./InvoiceAndBilling/BillGeneration/BillingHistory/BillingHistory"));
const AgentChatListView = lazy(() => import("./Chat/agentChatListView"));
const ChatDashboard = lazy(() => import("./Chat/chatMonitoring/ChatDashboard"));
const UploadTemplate = lazy(() => import("./common/Templates/uploadTemplate"));
const SearchCustomer = lazy(() => import("./CRM/Customer/SearchCustomer"));
const HelpdeskContainer = lazy(() => import("./HelpdeskAndInteraction/Helpdesk/HelpdeskContainer"));
const HelpdeskSearch = lazy(() => import("./HelpdeskAndInteraction/Helpdesk/HelpdeskSearch/HelpdeskSearch"));
const MonitoringSearch = lazy(() => import("./HelpdeskAndInteraction/Helpdesk/MonitoringSearch/MonitoringSearch"));
const MonitoringView = lazy(() => import("./HelpdeskAndInteraction/Helpdesk/MonitoringSearch/MonitoringView"));
// const ViewHelpdeskTicketOld = lazy(() => import("./HelpdeskAndInteraction/Helpdesk/HelpdeskSearch/ViewHelpdeskTicket"));
const ViewHelpdeskTicket = lazy(() => import("./HelpdeskAndInteraction/Helpdesk/HelpdeskSearch/ViewHelpdeskTicket/index"));
const WorkflowLayout = lazy(() => import("./common/Layout/WorkflowLayout/WorkflowLayout"));
const QAMonitoringLayout = lazy(() => import("./common/Layout/QAMonitoringLayout/QAMonitoringLayout"));
const PrintLayout = lazy(() => import("./common/Layout/PrintLayout/PrintLayout"));
const PdfARView = lazy(() => import("./InvoiceAndBilling/Accounting/AccountDetailsView/PdfARView"));
const Pdf360View = lazy(() => import("./CRM/Customer360/Pdf360View"));
const AgentMonitoring = lazy(() => import("./HelpdeskAndInteraction/Helpdesk/Monitoring/Monitoring"));
const EditOrderLandingPage = lazy(() => import("./HelpdeskAndInteraction/Interaction/Complaint/EditOrder/EditOrderLandingPage"));
const MasterTicket = lazy(() => import("./HelpdeskAndInteraction/Interaction/MasterTicket/MasterTicket"));
const CreateInteraction = lazy(() => import("./HelpdeskAndInteraction/Interaction/CreateInteraction/CreateInteraction"));
const EditViewInteractionLandingPage = lazy(() => import("./HelpdeskAndInteraction/Interaction/EditViewInteraction/EditViewInteractionLandingPage"));
const EditViewOrderInteraction = lazy(() => import("./HelpdeskAndInteraction/Interaction/EditViewOrderInteraction"));
const EditViewInteractionPage = lazy(() => import("./HelpdeskAndInteraction/Interaction/EditViewInteractionPage"));

// 360 SCREENS
// const Interaction360 = lazy(() => import("./HelpdeskAndInteraction/Interaction/Interaction360"));
const Interaction360 = lazy(() => import("./HelpdeskAndInteraction/Interaction/InteractionAction/EditAndViewInteraction"));

const Order360 = lazy(() => import("./CRM/OrderManagement/Order360"));
const Order360Old = lazy(() => import("./HelpdeskAndInteraction/Interaction/Order360"));
const SalesOrder360 = lazy(() => import("./InvoiceAndBilling/SalesOrder360/SalesOrder360"));
const CustomerDetailsView = lazy(() => import('./CRM/Customer/CustomerDetailsView'));
const ProfileDetailsView = lazy(() => import('./CRM/Profile/ProfileDetailsView'));
const Service360 = lazy(() => import('./CRM/ServiceManagement/Service360'));

// Dashboard
const CustomerDashboard = lazy(() => import("./Dashboard/CustomerDashboard"));
const OmniChannelDashboard = lazy(() => import("./Dashboard/OmniChannel"));
const WhatsAppDashboard = lazy(() => import('./Dashboard/whatsApp/WhatsAppDashboard'));
// const CatalougeDashboard = lazy(() => import('./Dashboard/catalougeDashboard'));
// const SalesDashboardNew = lazy(() => import("./Dashboard/salesDashboardNew"));
// const FinanceDashboard = lazy(() => import("./Dashboard/financeDashboard"));
// const AdminDashboard = lazy(() => import("./Dashboard/adminDashborad"));
const CustomerEngagement = lazy(() => import("./Dashboard/CustomerEngagementDashboard/customerEngagement"));
const ChatAgentDashboard = lazy(() => import("./Dashboard/ChatAgentDashboard/Dashboard"));
const SalesDashboard = lazy(() => import('./Dashboard/Sales/Dashboard'));
const LeadDashboard = lazy(() => import("./Dashboard/LeadDashboard/dashboard"));
const InteractionDashboard = lazy(() => import("./Dashboard/interaction/dashboard"));
const HelpdeskDashboard = lazy(() => import("./Dashboard/helpdesk/dashboard"));
const ARAgeingDashboard = lazy(() => import("./Dashboard/ArAgeing/arAgingDashboard"));
const ARAgeingReport = lazy(() => import("./ReportsAndBI/Reports/ArAgeing/arAgeing"));
const MBRDashboard = lazy(() => import("./ReportsAndBI/BI/MBRDashboard"));
const OMSDashboard = lazy(() => import("./Dashboard/OMSDashboard"));

//REPORTS AND BI
// Task Report(MIS)
const OpenTaskReport = lazy(() => import("./ReportsAndBI/Reports/Task/OpenTaskReport"));
const ClosedTaskReport = lazy(() => import("./ReportsAndBI/Reports/Task/ClosedTaskReport"));
const CreatedTaskReport = lazy(() => import("./ReportsAndBI/Reports/Task/CreatedTaskReport"));

const CreatedOrderReport = lazy(() => import("./ReportsAndBI/Reports/Order/CreatedOrderReport"));
const OpenOrderReport = lazy(() => import("./ReportsAndBI/Reports/Order/OpenOrderReport"));
const ClosedOrderReport = lazy(() => import("./ReportsAndBI/Reports/Order/ClosedOrderReport"));
const CreatedCustomerReport = lazy(() => import("./ReportsAndBI/Reports/Customer/CreatedCustomerReport"));
const FollowupCountReport = lazy(() => import("./ReportsAndBI/Reports/followupCountReport"));
const FollowupReport = lazy(() => import("./ReportsAndBI/Reports/followupReport"));
const TATSummaryReport = lazy(() => import("./ReportsAndBI/Reports/TatSummary"));
const FCRMISReport = lazy(() => import("./ReportsAndBI/Reports/fcrMisReport"));
// const FCRReport = lazy(() => import('./ReportsAndBI/Reports/FCRReport'));
const FCRAgentReport = lazy(() => import("./ReportsAndBI/Reports/FCRAgentReport"));
const TicketStatisticsReport = lazy(() => import("./ReportsAndBI/Reports/TicketStatisticsReport"));
const BIViewer = lazy(() => import("./ReportsAndBI/BI/bi-viewer"));
const LoginReport = lazy(() => import("./ReportsAndBI/Reports/loginReport"));
const ChatReport = lazy(() => import("./ReportsAndBI/Reports/chatReport"));
const AuditTrailReport = lazy(() => import("./ReportsAndBI/Reports/auditTrailReport"));
const ProductReport = lazy(() => import("./ReportsAndBI/Reports/productReport"));
const BillingReport = lazy(() => import("./ReportsAndBI/Reports/billingReport"));
const CreatedInteractionReport = lazy(() => import("./ReportsAndBI/Reports/Interaction/createdInteractionReport"));
const OpenInteractionReport = lazy(() => import("./ReportsAndBI/Reports/Interaction/openInteractionReport"));
const ClosedInteractionReport = lazy(() => import("./ReportsAndBI/Reports/Interaction/closedInteractionReport"));
const SalesReport = lazy(() => import("./ReportsAndBI/Reports/salesReport"));
const InvoiceReport = lazy(() => import("./ReportsAndBI/Reports/invoiceReport"));
const SLAReport = lazy(() => import("./ReportsAndBI/Reports/slaReport"));
const DeptInteractionReport = lazy(() => import("./ReportsAndBI/Reports/deptInteractionReport"));
const HelpDeskReport = lazy(() => import("./ReportsAndBI/Reports/helpdeskReport"));
const BIAggregation = lazy(() => import("./ReportsAndBI/BI/Aggregation"));

//Adminstration
const RequestStatementList = lazy(() => import("./Administration/RequestStatement/RequestStatementList"));
const ConfigurationSettings = lazy(() => import("./Administration/Configuration/ConfigurationSettings"));
const SystemParameters = lazy(() => import("./Administration/Configuration/SystemParameters"));
const SystemParametersList = lazy(() => import("./Administration/Configuration/SystemParametersList"));
const ApplicationDataConfiguration = lazy(() => import("./Administration/Configuration/ApplicationDataConfiguration"));
const UserManagement = lazy(() => import("./Administration/User/userManagement"));
const OrgHierarchy = lazy(() => import("./Administration/Organization/orgHierarchy"));
const NewUserRequest = lazy(() => import("./Administration/User/newUserRequest"));
const ApplicationDataConfigurationMenu = lazy(() => import("./Administration/Configuration/ApplicationDataConfigurationMenu"));
const AddEditSMSSettings = lazy(() => import("./Administration/PortalSetting/SMS/AddEditSMSSettings"));
const ApiSettingList = lazy(() => import("./Administration/PortalSetting/API/ApiSettingList"));
const AddEditAPISettings = lazy(() => import("./Administration/PortalSetting/APISettings/APISettings"));
const AddEditLDAPSettings = lazy(() => import("./Administration/PortalSetting/LdapSettings/LdapSettings"));
const channelSettings = lazy(() => import("./Administration/PortalSetting/ChannelSettings/ChannelSettings"));
const ApplicationLog = lazy(() => import("./Administration/PortalSetting/LOGS/ApplicationLog"));
const ServiceStatus = lazy(() => import("./Administration/PortalSetting/LOGS/ServiceStatus"));
const JobStatus = lazy(() => import("./Administration/PortalSetting/LOGS/JobStatus"));
const QAMonitoring = lazy(() => import("./Administration/PortalSetting/QAMonitoring/QAMonitoring"));
const SearchBulkUpload = lazy(() => import("./Administration/BulkUpload/SearchBulkUpload"));
const CreateBulkUpload = lazy(() => import("./Administration/BulkUpload/CreateBulkUpload"));
const SlaSettings = lazy(() => import("./Administration/PortalSetting/SLA/SlaSettings"));
const AddEditMapWorkflow = lazy(() => import("./Administration/MapWorkflow/AddEditMapWorkflow"));
const MapWorkflowList = lazy(() => import("./Administration/MapWorkflow/MapWorkflowList"));
const PortalSettingMenu = lazy(() => import("./Administration/PortalSetting/PortalSettingMenu"));
const AddEditSMTPSettings = lazy(() => import("./Administration/PortalSetting/SMTP/AddEditSMTPSettings"));
const EmailSmsTemplateList = lazy(() => import("./Administration/PortalSetting/EmailSmsTemplate/EmailSmsTemplateList"));
const WFViewer = lazy(() => import("./Administration/Workflow/wfViewer"));
const WFModeler = lazy(() => import("./Administration/Workflow/wfModeler"));
const AddEditWorkflow = lazy(() => import("./Administration/Workflow/addEditWorkflow"));
const WFStatusViewer = lazy(() => import("./Administration/Workflow/wfStatusViewer"));
const AddParameter = lazy(() => import("./Administration/ManageParameters/addParameter"));
const EditParameter = lazy(() => import("./Administration/ManageParameters/editParameter"));
const ParametersMapping = lazy(() => import("./Administration/ManageParameters/ParametersMapping"));
const ManageParameters = lazy(() => import("./Administration/ManageParameters/manageParameters"));
const MyProfile = lazy(() => import("./Administration/User/Profile/myProfile"));
const EditProfile = lazy(() => import("./Administration/User/Profile/EditProfile"));
const UserManagementForm = lazy(() => import("./Administration/User/userManagementForm"));
const UserView = lazy(() => import("./Administration/userView"));
const RoleTable = lazy(() => import("./Administration/RolesAndPermissions/RoleTable"));
const NewRole = lazy(() => import("./Administration/RolesAndPermissions/NewRole"));
const UpdateRole = lazy(() => import("./Administration/RolesAndPermissions/UpdateRole"));
const UserManagerMapping = lazy(() => import("./Administration/User/userManagerMapping"))
const ViewAnnouncements = lazy(() => import("./Administration/Announcements/ViewAnnouncements"))
const AddAnnouncements = lazy(() => import("./Administration/Announcements/AddAnnouncements"))
const EditAnnouncements = lazy(() => import("./Administration/Announcements/EditAnnouncements"))

// TEMPLATES COMPONENTS START
const Templates = lazy(() => import("./Templates"));
const MapTemplate = lazy(() => import("./Templates/MapTemplate"));
const MapTemplateForm = lazy(() => import("./Templates/MapTemplateForm"));
const AppoinmentDashboard = lazy(() => import("./Dashboard/appoinment/AppoinmentDashboard"));
const BusinessConfig = lazy(() => import("./common/header/BusinessConfig"));
// TEMPLATES COMPONENTS END

//PRODUCT MASTER START

const AddEditCharge = lazy(() => import("./ProductCatalog/Charge/AddEditCharge"));
const ListCharge = lazy(() => import("./ProductCatalog/Charge/ListCharge"));
const CreateProduct = lazy(() => import("./ProductCatalog/CreateProduct"));
const SearchProduct = lazy(() => import("./ProductCatalog/SearchProduct"));
const BundleProductMapping = lazy(() => import("./ProductCatalog/Bundle/AddEditMapBundle"));
//PRODUCT MASTER END

// SearchAR 

const searchAR = lazy(() => import("./InvoiceAndBilling/AR/SearchAR"))


//INVENTORY MASTER START
const VendorList = lazy(() => import("./Inventory/VendorManagement/VendorList"));
const AddInventory = lazy(() => import("./Inventory/InventoryManagement/CreateInventoryItem"));
const SearchInventory = lazy(() => import("./Inventory/InventoryManagement/InventoryList"));
//INVENTORY MASTER END

// const BIToolCreation = lazy(() => import("./BITool/BIToolCreation"));
const BIToolCreation = lazy(() => import("./ReportsAndBI/BI/BILogin"));

//Lead Management
const LeadsList = lazy(() => import("./CRM/LeadManagement/LeadsList"));
const AddEditLead = lazy(() => import("./CRM/LeadManagement/AddEditLead"));

// Mission Management
const MissionList = lazy(() => import("./CRM/MissionManagement/MissionList"));
const AddEditMission = lazy(() => import("./CRM/MissionManagement/AddEditMission"));

const TasksList = lazy(() => import("./CRM/TaskManagement/TasksList"));
const AddTask = lazy(() => import("./CRM/TaskManagement/AddEditTask"));
const EditTask = lazy(() => import("./CRM/TaskManagement/EditViewTask"));

//Web Ticket Portal
const ReportProblems = lazy(() => import("./WebPortal/ReportProblems"));

// Helpdesk
const CreateHelpdeskContainer = lazy(() => import("./HelpdeskAndInteraction/Helpdesk/CreateHelpdeskContainer"));
const CreateHelpdeskContainerNew = lazy(() => import("./HelpdeskAndInteraction/Helpdesk/CreateHelpdeskContainerNew"));

const CreateProfile = lazy(() => import("./Profile/CreateProfile"));
const SearchProfile = lazy(() => import("./Profile/SearchProfile"));
// FCR Report 
const FCRReport = lazy(() => import('./ReportsAndBI/Reports/FCR/FCRReport'))
// AbandonedCallReport
const AbandonedCallReport = lazy(() => import('./ReportsAndBI/Reports/AbandonedCallReport'))
// ACD Call Interval Summary Report Daily
const ACDCallIntervalSummaryReportDaily = lazy(() => import('./ReportsAndBI/Reports/ACDCallIntervalSummaryReportDaily'))
const ACDCallIntervalSummaryReportHourly = lazy(() => import('./ReportsAndBI/Reports/ACDCallIntervalSummaryReportHourly'))
//AgentProductivityReport
const AgentProductivityReportDaily = lazy(() => import('./ReportsAndBI/Reports/AgentProductivityReportDaily'))
const AgentProductivityReportHourly = lazy(() => import('./ReportsAndBI/Reports/AgentProductivityReportHourly'))

//SLA Management
const SlaLayout = lazy(() => import('./SLA/components/SlaLayout'))
const CreateSlaDefinitionContainer = lazy(() => import('./SLA/CreateSlaDefinitionContainer'))
const SearchSlaDefinition = lazy(() => import('./SLA/components/SearchSlaDefinition'))
const SLADefinitionMapping = lazy(() => import('./SLA/components/SLADefinitionMapping'))
const SLADefinitionMappingSearch = lazy(() => import('./SLA/components/SLADefinitionMappingSearch'))
const SLAMenu = lazy(() => import('./SLA/SLAMenu'))

//Knowledgebase

const KBStatementSearch = lazy(() => import("./KnowledgeBase/KBStatement"));

const CreateOrder = lazy(() => import("./CRM/OrderManagement/CreateOrder"));
const SearchOrder = lazy(() => import("./CRM/OrderManagement/SearchOrder/OrderSearch"));
// Contract 
const Contract360 = lazy(() => import("./CRM/Contract/Contract360"));
const ManageFormParameters = lazy(() => import("./Administration/DynamicFormParameter/ManageFormParameter"));
//Receipt
const SearchReceipt = lazy(() => import( "./InvoiceAndBilling/Accounting/Receipt/SearchReceipt"));
const AddEditReceipt = lazy(() => import( "./InvoiceAndBilling/Accounting/Receipt/AddEditReceipt"));
const SearchWriteOff = lazy(() => import( "./InvoiceAndBilling/Accounting/writeOff/SearchWriteOff")); 
const FAQList = lazy(() => import( "./Administration/Faq")); 
const addEditFaq = lazy(() => import( "./Administration/Faq/addEditFaq")); 


const managementDashboard = lazy(() => import( "./Dashboard/ManagementDashboard/Dashboard"))

function App() {
  const { appConfig } = useContext(AppContext);
  let routeObj = {}
  // if (process.env.NODE_ENV !== "development") {
    routeObj.basename = dynamicBase
  // }
  return (

    <Router basename={dynamicBase}>
      <ToastContainer hideProgressBar closeButton={false} closeOnClick style={{ zIndex: 99999 }} />
      <ScrollToTop />
      <React.Suspense fallback={<FallbackLoader />}>
        <Routes>
          {/* default path to my profile dont change it*/}
          <Route path="/" element={<PrivateRoute component={MyProfile} props={{ screenName: 'My Account', screenAction: 'View' }} />} />
          <Route path="/webTicket" element={<ReportProblems />} />
          <Route path="/user/login" element={<Login />} />
          <Route path="/logout" element={<PrivateRoute component={Logout} />} />
          <Route path="/user/faq" element={<FAQ />} />
          <Route path="/clearAuth" element={<PrivateRoute component={ClearAuth} />} />
          <Route path="/user/signup/:inviteToken" element={<Signup />} />
          <Route path="/user/forgotpassword" element={<LoginToForgotPass />} />
          <Route path="/user/register" element={<Register />} />
          <Route path="/user/registerverify/:inviteToken" element={<RegisterVerify />} />
          <Route path="/wf-modeler" element={<PrivateRoute component={WFModeler} props={{ screenName: 'Workflow Designer', screenAction: 'Edit' }} />} />
          <Route path="/wf-viewer" element={<PrivateRoute component={WFViewer} props={{ screenName: 'Workflow Designer', screenAction: 'View' }} />} />
          <Route path="/wf-addedit" element={<PrivateRoute component={AddEditWorkflow} props={{ screenName: 'Workflow Designer', screenAction: 'Add/Update' }} />} />
          <Route path="/wf-status-viewer" element={<PrivateRoute component={WFStatusViewer} props={{ screenName: 'Workflow Designer', screenAction: 'Status View' }} />} />
          <Route path="/admin-user-view" element={<PrivateRoute component={UserView} props={{ screenName: 'Admin Management', screenAction: 'View' }} />} />
          <Route path="/search" element={<PrivateRoute component={CustomerSearch} props={{ screenName: 'Customer Management', screenAction: 'Search' }} />} />
          <Route path="/new-customer" element={<PrivateRoute component={NewCustomer} props={{ screenName: 'Customer Management', screenAction: 'Create' }} />} />
          <Route path="/customer360" element={<PrivateRoute component={Customer360} props={{ screenName: 'Customer 360', screenAction: 'View' }} />} />
          <Route path="/create-inquiry-new-customer" element={<PrivateRoute component={CreateEnquireNewCustomer} props={{ screenName: 'Inquiry', screenAction: 'Create' }} />} />
          <Route path="/create-inquiry-existing-customer" element={<PrivateRoute component={ExistingCustomerCreateInquiry} props={{ screenName: 'Inquiry', screenAction: 'Create' }} />} />
          <Route path="/edit-customer-inquiry" element={<PrivateRoute component={EditCustomersInquiryDetails} props={{ screenName: 'Inquiry', screenAction: 'Edit' }} />} />

          <Route path="/role" element={<PrivateRoute component={RoleTable} props={{ screenName: 'Role Management', screenAction: 'Search' }} />} />
          <Route path="/newrole" element={<PrivateRoute component={NewRole} props={{ screenName: 'Role Management', screenAction: 'Create' }} />} />
          <Route path="/attachment" element={<PrivateRoute component={FileUpload} props={{ screenName: 'Attachment', screenAction: 'Add' }} />} />
          <Route path="/updaterole" element={<PrivateRoute component={UpdateRole} props={{ screenName: 'Role Management', screenAction: 'Update' }} />} />
          <Route path="/create-complaint" element={<PrivateRoute component={CreateComplaintOrServiceRequest} props={{ screenName: 'Complaint', screenAction: 'Create' }} />} />
          <Route path="/create-service-request" element={<PrivateRoute component={CreateComplaintOrServiceRequest} props={{ screenName: 'Request', screenAction: 'Create' }} />} />
          <Route path="/edit-complaint" element={<PrivateRoute component={EditTicketsLandingPage} props={{ screenName: 'Complaint', screenAction: 'Update' }} />} />
          <Route path="/edit-inquiry" element={<PrivateRoute component={EditTicketsLandingPage} props={{ screenName: 'Inquiry', screenAction: 'Update' }} />} />
          <Route path="/edit-service-request" element={<PrivateRoute component={EditTicketsLandingPage} props={{ screenName: 'Request', screenAction: 'Update' }} />} />
          <Route path="/ticket-search" element={<PrivateRoute component={InteractionSearch} props={{ screenName: 'Interaction', screenAction: 'Search' }} />} />
          <Route path="/manage-parameters" element={<PrivateRoute component={ManageParameters} props={{ screenName: 'Parameter Management', screenAction: 'View' }} />} />
          <Route path="/edit-parameters" element={<PrivateRoute component={EditParameter} props={{ screenName: 'Parameter Management', screenAction: 'Update' }} />} />
          <Route path="/add-parameters" element={<PrivateRoute component={AddParameter} props={{ screenName: 'Parameter Management', screenAction: 'Create' }} />} />
          <Route path="/edit-customer" element={<PrivateRoute component={NewCustomer} props={{ screenName: 'Customer Management', screenAction: 'Create' }} />} />
          <Route path="/mapping-parameters" element={<PrivateRoute component={ParametersMapping} props={{ screenName: 'Parameter Management', screenAction: 'Search' }} />} />
          <Route path="/advance-search" element={<PrivateRoute component={AdvanceSearch} props={{ screenName: 'Advance Search', screenAction: 'View' }} />} />

          <Route path="/user/myprofile" element={<PrivateRoute component={MyProfile} props={{ screenName: 'My Account', screenAction: 'View' }} />} />
          <Route path="/business-config" element={<PrivateRoute component={BusinessConfig} props={{ screenName: 'Business Config', screenAction: 'Edit' }} />} />
          <Route path="/user/editprofile" element={<PrivateRoute component={EditProfile} props={{ screenName: 'My Account', screenAction: 'Edit' }} />} />
          <Route path="/new-contract" element={<PrivateRoute component={NewContract} props={{ screenName: 'Contract Management', screenAction: 'Create' }} />} />
          <Route path="/add-charge" element={<PrivateRoute component={AddEditCharge} props={{ screenName: 'Charge Management', screenAction: 'Create' }} />} />
          <Route path="/list-charge" element={<PrivateRoute component={ListCharge} props={{ screenName: 'Charge Management', screenAction: 'List' }} />} />
          <Route path="/create-product" element={<PrivateRoute component={CreateProduct} props={{ screenName: 'Product Management', screenAction: 'Add' }} />} />
          <Route path="/search-product" element={<PrivateRoute component={SearchProduct} props={{ screenName: 'Product Management', screenAction: 'Search' }} />} />
          <Route path="/edit-charge" element={<PrivateRoute component={AddEditCharge} props={{ screenName: 'Charge Management', screenAction: 'Update' }} />} />
          <Route path="/product-bundle-list" element={<PrivateRoute component={BundleProductMapping} props={{ screenName: 'Product Bundle Management', screenAction: 'Map' }} />} />
          <Route path="/agent-chat" element={<PrivateRoute component={AgentChatBox} props={{ screenName: 'Chat Management', screenAction: 'View' }} />} />
          <Route path="/agentChatListView" element={<PrivateRoute component={AgentChatListView} props={{ screenName: 'Chat Management', screenAction: 'List' }} />} />
          <Route path="/chat-monitoring" element={<PrivateRoute component={ChatDashboard} props={{ screenName: 'Dashboard', screenAction: 'Chat' }} />} />
          <Route path="/billing" element={<PrivateRoute component={Billing} props={{ screenName: 'Billing Management', screenAction: 'View' }} />} />
          <Route path="/billing-history" element={<PrivateRoute component={BillingHistory} props={{ screenName: 'Billing Management', screenAction: 'View' }} />} />
          <Route path="/billing-usage" element={<PrivateRoute component={BillingUsage} props={{ screenName: 'Billing Management', screenAction: 'View' }} />} />
          <Route path="/create-contract" element={<PrivateRoute component={CreateContract} props={{ screenName: 'Contract Management', screenAction: 'Create' }} />} />
          <Route path="/search-contract" element={<PrivateRoute component={SearchContract} props={{ screenName: 'Contract Management', screenAction: 'Search' }} />} />
          <Route path="/unbilled-search-contract" element={<PrivateRoute component={SearchContract} props={{ screenName: 'Contract Management', screenAction: 'View' }} />} />
          <Route path="/contract-search-view" element={<PrivateRoute component={ContractSearchView} props={{ screenName: 'Contract Management', screenAction: 'Search' }} />} />
          <Route path="/unbilled-contract-search-view" element={<PrivateRoute component={UnbilledSearchContractView} props={{ screenName: 'Contract Management', screenAction: 'View' }} />} />
          <Route path="/search-invoice" element={<PrivateRoute component={SearchInvoice} props={{ screenName: 'Invoice Management', screenAction: 'Search' }} />} />
          <Route path="/search-account" element={<PrivateRoute component={SearchAccount} props={{ screenName: 'Invoice Management', screenAction: 'Search' }} />} />
          <Route path="/invoice-details-view" element={<PrivateRoute component={InvoiceDetailsView} props={{ screenName: 'Invoice Management', screenAction: 'View' }} />} />
          <Route path="/account-billing-details-view" element={<PrivateRoute component={AccountBillingDetailsView} props={{ screenName: 'AR', screenAction: 'View' }} />} />

          {/* DASHBOARD STARTS*/}

          <Route path="/my-workspace" element={<PrivateRoute component={OperationalDashboard} props={{ screenName: `${appConfig?.clientFacingName?.operationalDashboard?.screenName ?? 'Engagement Dashboard'}`, screenAction: `${appConfig?.clientFacingName?.operationalDashboard?.screenAction ?? 'View'}` }} />} />
          <Route path="/appointment-dashboard" element={<PrivateRoute component={AppoinmentDashboard} props={{ screenName: 'Dashboard', screenAction: 'Appoinment' }} />} />
          <Route path="/agent-chat-dashboard" element={<PrivateRoute component={ChatAgentDashboard} props={{ screenName: 'Dashboard', screenAction: 'Chat Agent' }} />} />
          <Route path="/customer-engagement-dashboard" element={<PrivateRoute component={CustomerEngagement} props={{ screenName: 'Dashboard', screenAction: 'Customer Engagement' }} />} />
          <Route path="/lead-dashboard" element={<PrivateRoute component={LeadDashboard} props={{ screenName: 'Dashboard', screenAction: 'Stakeholder' }} />} />
          <Route path="/oms-dashboard" element={<PrivateRoute component={OMSDashboard} props={{ screenName: 'OMS Dashboard', screenAction: 'View' }} />} />

          {/* DASHBOARD ENDS*/}

          <Route path="/helpdesk" element={<PrivateRoute component={HelpdeskContainer} props={{ screenName: 'Helpdesk Management', screenAction: 'Create' }} />} />
          <Route path="/helpdesk-search" element={<PrivateRoute component={HelpdeskSearch} props={{ screenName: 'Helpdesk Management', screenAction: 'Search' }} />} />
          <Route path="/view-helpdesk" element={<PrivateRoute component={ViewHelpdeskTicket} props={{ screenName: 'Helpdesk Management', screenAction: 'View' }} />} />

          <Route path="/user/change-password/:forgotpasswordtoken" element={<FirstTimeChangePassword />} />
          <Route path="/login-report" element={<PrivateRoute component={LoginReport} props={{ screenName: 'Report', screenAction: 'Login' }} />} />
          <Route path="/chat-report" element={<PrivateRoute component={ChatReport} props={{ screenName: 'Report', screenAction: 'Chat' }} />} />
          <Route path="/audit-trail-report" element={<PrivateRoute component={AuditTrailReport} props={{ screenName: 'Report', screenAction: 'Audit' }} />} />
          <Route path="/product-report" element={<PrivateRoute component={ProductReport} props={{ screenName: 'Report', screenAction: 'Product' }} />} />
          <Route path="/billing-report" element={<PrivateRoute component={BillingReport} props={{ screenName: 'Report', screenAction: 'Billing' }} />} />
          <Route path="/created-interaction-report" element={<PrivateRoute component={CreatedInteractionReport} props={{ screenName: 'Report', screenAction: 'Created Interaction' }} />} />
          <Route path="/open-interaction-report" element={<PrivateRoute component={OpenInteractionReport} props={{ screenName: 'Report', screenAction: 'Open Interaction' }} />} />
          <Route path="/closed-interaction-report" element={<PrivateRoute component={ClosedInteractionReport} props={{ screenName: 'Report', screenAction: 'Closed Interaction' }} />} />
          <Route path="/sales-report" element={<PrivateRoute component={SalesReport} props={{ screenName: 'Report', screenAction: 'Sales' }} />} />
          <Route path="/invoice-report" element={<PrivateRoute component={InvoiceReport} props={{ screenName: 'Report', screenAction: 'Invoice' }} />} />
          <Route path="/sla-report" element={<PrivateRoute component={SLAReport} props={{ screenName: 'Report', screenAction: 'SLA' }} />} />
          <Route path="/dep-interaction-report" element={<PrivateRoute component={DeptInteractionReport} props={{ screenName: 'Report', screenAction: 'Department Interaction' }} />} />
          <Route path="/upload-template" element={<PrivateRoute component={UploadTemplate} props={{ screenName: 'Bulk Upload', screenAction: 'Upload' }} />} />
          <Route path="/customer-search" element={<PrivateRoute component={SearchCustomer} props={{ screenName: 'Customer Management', screenAction: 'Search' }} />} />
          <Route path="/portal-settings" element={<PrivateRoute component={PortalSettingMenu} props={{ screenName: 'Portal Settings', screenAction: 'Menu' }} />} />
          <Route path="/portal-settings/smtp" element={<PrivateRoute component={AddEditSMTPSettings} props={{ screenName: 'Portal Settings', screenAction: 'SMTP' }} />} />
          <Route path="/portal-settings/sms" element={<PrivateRoute component={AddEditSMSSettings} props={{ screenName: 'Portal Settings', screenAction: 'SMS' }} />} />
          <Route path="/portal-settings/api-setting" element={<PrivateRoute component={ApiSettingList} props={{ screenName: 'Portal Settings', screenAction: 'API' }} />} />
          <Route path="/portal-settings/email-sms-template" element={<PrivateRoute component={EmailSmsTemplateList} props={{ screenName: 'Portal Settings', screenAction: 'EMAIL' }} />} />
          <Route path="/bi-viewer" element={<PrivateRoute component={BIViewer} props={{ screenName: 'BI Management', screenAction: 'View' }} />} />

          <Route path="/map-workflow-template" element={<PrivateRoute layout={WorkflowLayout} component={AddEditMapWorkflow} props={{ screenName: 'Workflow Management', screenAction: 'Mapping' }} />} />
          <Route path="/map-workflow-template-list" element={<PrivateRoute layout={WorkflowLayout} component={MapWorkflowList} props={{ screenName: 'Workflow Management', screenAction: 'List' }} />} />
          <Route path="/portal-settings/quality-monitoring/evaluation" element={<PrivateRoute layout={QAMonitoringLayout} component={QAMonitoring} props={{ screenName: 'Portal Settings', screenAction: 'Evaluation' }} />} />
          <Route path="/portal-settings/quality-monitoring/guidelines" element={<PrivateRoute layout={QAMonitoringLayout} component={QAMonitoring} props={{ screenName: 'Portal Settings', screenAction: 'Guidelines' }} />} />
          <Route path="/search-bulk-upload" element={<PrivateRoute component={SearchBulkUpload} props={{ screenName: 'Bulk Upload', screenAction: 'Upload' }} />} />
          <Route path="/create-bulk-upload" element={<PrivateRoute component={CreateBulkUpload} props={{ screenName: 'Bulk Upload', screenAction: 'Upload' }} />} />
          <Route path="/monitoring-search" element={<PrivateRoute component={MonitoringSearch} props={{ screenName: 'Quality Monitoring', screenAction: 'Search' }} />} />
          <Route path="/quality-monitoring-view" element={<PrivateRoute component={MonitoringView} props={{ screenName: 'Quality Monitoring', screenAction: 'View' }} />} />
          <Route path="/customer360/preview-print" element={<PrivateRoute layout={PrintLayout} component={Pdf360View} props={{ screenName: 'Customer 360', screenAction: 'Print' }} />} />
          <Route path="/account-receivable/preview-print" element={<PrivateRoute layout={PrintLayout} component={PdfARView} props={{ screenName: 'AR', screenAction: 'Print' }} />} />
          <Route path="/user/external-login" element={<ExternalLogin />} />
          <Route path="/followup-count-report" element={<PrivateRoute component={FollowupCountReport} props={{ screenName: 'Report', screenAction: 'Follow Up Count' }} />} />
          <Route path="/followup-report" element={<PrivateRoute component={FollowupReport} props={{ screenName: 'Report', screenAction: 'Follow Up' }} />} />
          <Route path="/tat-summary" element={<PrivateRoute component={TATSummaryReport} props={{ screenName: 'Report', screenAction: 'TAT' }} />} />
          <Route path="/fcr-mis-report" element={<PrivateRoute component={FCRMISReport} props={{ screenName: 'Report', screenAction: 'FCR-MIS' }} />} />
          <Route path="/fcr-report" element={<PrivateRoute component={FCRReport} props={{ screenName: 'Report', screenAction: 'FCR' }} />} />
          <Route path="/fcr-agent-report" element={<PrivateRoute component={FCRAgentReport} props={{ screenName: 'Report', screenAction: 'FCR Agent' }} />} />
          <Route path="/ticket-statistics-report" element={<PrivateRoute component={TicketStatisticsReport} props={{ screenName: 'Report', screenAction: 'Statistics' }} />} />
          <Route path="/portal-settings/add-api-settings" element={<PrivateRoute component={AddEditAPISettings} props={{ screenName: 'Portal Settings', screenAction: 'API' }} />} />
          <Route path="/portal-settings/add-ldap-settings" element={<PrivateRoute component={AddEditLDAPSettings} props={{ screenName: 'Portal Settings', screenAction: 'LDAP' }} />} />
          <Route path="/portal-settings/channel-settings" element={<PrivateRoute component={channelSettings} props={{ screenName: 'Portal Settings', screenAction: 'Channel' }} />} />
          <Route path="/portal-settings/sla-settings" element={<PrivateRoute component={SlaSettings} props={{ screenName: 'Portal Settings', screenAction: 'SLA' }} />} />
          <Route path="/edit-work-order" element={<PrivateRoute component={EditOrderLandingPage} props={{ screenName: 'Order Management', screenAction: 'Update' }} />} />
          <Route path="/agent-monitoring" element={<PrivateRoute component={AgentMonitoring} props={{ screenName: 'Agent Monitoring', screenAction: 'Update' }} />} />
          <Route path="/sales-order-360" element={<PrivateRoute component={SalesOrder360} props={{ screenName: 'Order 360', screenAction: 'View' }} />} />
          <Route path="/view-service" element={<PrivateRoute component={Service360} props={{ screenName: 'Service 360', screenAction: 'View' }} />} />
          <Route path="/customer-dashboard" element={<PrivateRoute component={CustomerDashboard} props={{ screenName: 'Dashboard', screenAction: 'Customer' }} />} />
          <Route path="/portal-settings/application-logs" element={<PrivateRoute component={ApplicationLog} props={{ screenName: 'Portal Settings', screenAction: 'Search' }} />} />
          <Route path="/portal-settings/service-status" element={<PrivateRoute component={ServiceStatus} props={{ screenName: 'Portal Settings', screenAction: 'Service Status' }} />} />
          <Route path="/portal-settings/job-status" element={<PrivateRoute component={JobStatus} props={{ screenName: 'Portal Settings', screenAction: 'Job Status' }} />} />
          <Route path="/master-ticket" element={<PrivateRoute component={MasterTicket} props={{ screenName: 'Master Management', screenAction: 'Search' }} />} />
          <Route path="/create-master-ticket" element={<PrivateRoute component={MasterTicket} props={{ screenName: 'Master Management', screenAction: 'Create' }} />} />
          <Route path="/edit-master-ticket" element={<PrivateRoute component={MasterTicket} props={{ screenName: 'Master Management', screenAction: 'Update' }} />} />
          <Route path="/whatsapp-dashboard" element={<PrivateRoute component={WhatsAppDashboard} props={{ screenName: 'Dashboard', screenAction: 'WhatsApp' }} />} />
          <Route path="/create-interaction" element={<PrivateRoute component={CreateInteraction} props={{ screenName: 'Interaction Management', screenAction: 'Create' }} />} />
          <Route path="/edit-view-interaction" element={<PrivateRoute component={EditViewInteractionLandingPage} props={{ screenName: 'Interaction Management', screenAction: 'View/Update' }} />} />
          <Route path="/view-customer" element={<PrivateRoute component={CustomerDetailsView} props={{ screenName: 'Customer Management', screenAction: 'View' }} />} />
          <Route path="/view-profile" element={<PrivateRoute component={ProfileDetailsView} props={{ screenName: 'Profile Management', screenAction: 'View' }} />} />
          <Route path="/edit-order" element={<PrivateRoute component={EditViewOrderInteraction} props={{ screenName: 'Order Management', screenAction: 'Update' }} />} />
          <Route path="/edit-interaction" element={<PrivateRoute component={EditViewInteractionPage} props={{ screenName: 'Interaction Management', screenAction: 'Update' }} />} />
          <Route path="/update-user" element={<PrivateRoute component={UserManagementForm} props={{ screenName: 'User Management', screenAction: 'Create/Update' }} />} />
          <Route path="/user-manager" element={<PrivateRoute component={UserManagerMapping} layout={ApplicationDataConfiguration} props={{ screenName: 'User Manager', screenAction: 'Mapping', screenInfo: 'User Manager Configuration', avatar: 'won' }} />} />

          {/* System Configuration */}
          <Route path="/configuration-settings" element={<PrivateRoute component={ConfigurationSettings} props={{ screenName: 'Configuration Settings', screenAction: 'View' }} />} />
          <Route path="/system-parameters" element={<PrivateRoute component={SystemParameters} props={{ screenName: 'System Parameters', screenAction: 'Configuration' }} />} />
          <Route path="/system-parameters-list" element={<PrivateRoute component={SystemParametersList} props={{ screenName: 'System Parameters', screenAction: 'List' }} />} />
          <Route path="/application-data-configuration" element={<PrivateRoute component={ApplicationDataConfigurationMenu} layout={ApplicationDataConfiguration} props={{ screenName: 'Application Data Configuration', screenAction: 'View', screenInfo: 'Application Data Configuration' }} />} />
          <Route path="/user-management" element={<PrivateRoute component={UserManagement} layout={ApplicationDataConfiguration} props={{ screenName: 'User Managment', screenAction: 'View', screenInfo: 'User Data Configuration' }} />} />
          <Route path="/organisation-management" element={<PrivateRoute component={OrgHierarchy} layout={ApplicationDataConfiguration} props={{ screenName: 'Business Unit Managment', screenAction: 'View', screenInfo: 'Business Unit Data Configuration' }} />} />
          <Route path="/role-management" element={<PrivateRoute component={RoleTable} layout={ApplicationDataConfiguration} props={{ screenName: 'Role Managment', screenAction: 'View', screenInfo: 'Role Data Configuration' }} />} />
          <Route path="/business-parameter-management" element={<PrivateRoute component={ManageParameters} layout={ApplicationDataConfiguration} props={{ screenName: 'Business Parameter Management', screenAction: 'View', screenInfo: 'Business Parameter Data Configuration' }} />} />
          <Route path="/request-statement-list" element={<PrivateRoute component={RequestStatementList} layout={ApplicationDataConfiguration} props={{ screenName: 'Request Statement Configuration', screenAction: 'View', screenInfo: 'Request Statement Data Configuration' }} />} />
          <Route path="/business-parameter-mapping" element={<PrivateRoute component={ManageParameters} layout={ApplicationDataConfiguration} props={{ screenName: 'Business Parameter Mapping', screenAction: 'View', screenInfo: 'Business Parameter Mapping Configuration' }} />} />
          <Route path="/new-user-approval" element={<PrivateRoute component={NewUserRequest} layout={ApplicationDataConfiguration} props={{ screenName: 'User Managment', screenAction: 'View', screenInfo: 'User Approval Configuration' }} />} />

          {/* APPOINTMENT ROUTES START */}

          <Route path="/templates" element={<PrivateRoute component={Templates} props={{ screenName: 'Template Management', screenAction: 'Create' }} />} />
          <Route path="/map-templates" element={<PrivateRoute component={MapTemplate} props={{ screenName: 'Template Management', screenAction: 'View' }} />} />
          <Route path="/map-template-form" element={<PrivateRoute component={MapTemplateForm} props={{ screenName: 'Template Management', screenAction: 'Map' }} />} />

          {/* APPOINTMENT ROUTES END */}
          <Route path="/closed-order-report" element={<PrivateRoute component={ClosedOrderReport} props={{ screenName: 'Report', screenAction: 'Closed Order' }} />} />
          <Route path="/open-order-report" element={<PrivateRoute component={OpenOrderReport} props={{ screenName: 'Report', screenAction: 'Open Order' }} />} />
          <Route path="/created-order-report" element={<PrivateRoute component={CreatedOrderReport} props={{ screenName: 'Report', screenAction: 'Created Order' }} />} />
          <Route path="/created-customer-report" element={<PrivateRoute component={CreatedCustomerReport} props={{ screenName: 'Report', screenAction: 'Created Customer' }} />} />
          <Route path="/helpdesk-report" element={<PrivateRoute component={HelpDeskReport} props={{ screenName: 'Report', screenAction: 'Helpdesk' }} />} />
          <Route path="/omni-channel-dashboard" element={<PrivateRoute component={OmniChannelDashboard} props={{ screenName: 'Dashboard', screenAction: 'Omni Channel Dashboard' }} />} />
          <Route path="/new-user-management" element={<PrivateRoute component={NewUserRequest} props={{ screenName: 'User Management', screenAction: 'Create' }} />} />
          <Route path="/interaction360" element={<PrivateRoute component={Interaction360} props={{ screenName: 'Interaction 360', screenAction: 'View' }} />} />
          <Route path="/order360" element={<PrivateRoute component={Order360} props={{ screenName: 'Order 360', screenAction: 'View' }} />} />
          <Route path="/order360-old" element={<PrivateRoute component={Order360Old} props={{ screenName: 'Order 360', screenAction: 'View' }} />} />
          <Route path="/manage-request" element={<PrivateRoute component={Request} props={{ screenName: 'Request', type: "open", screenAction: 'Manage Request' }} />} />
          <Route path="/closed-request" element={<PrivateRoute component={Request} props={{ screenName: 'Request', type: "closed", screenAction: 'Closed Request' }} />} />
          <Route path="/search-ar" element={<PrivateRoute component={searchAR} props={{ screenName: 'AR', screenAction: 'Search' }} />} />
          <Route path="/create-item" element={<PrivateRoute component={AddInventory} props={{ screenName: 'Inventory Management', screenAction: 'Add' }} />} />
          <Route path="/item-list" element={<PrivateRoute component={SearchInventory} props={{ screenName: 'Inventory Management', screenAction: 'Search' }} />} />
          <Route path="/vendor-list" element={<PrivateRoute component={VendorList} props={{ screenName: 'Inventory Management', screenAction: 'Vendor List' }} />} />
          <Route path="/notification" element={<PrivateRoute component={NotificationView} props={{ screenName: 'Notification', screenAction: 'View' }} />} />
          <Route path="/sales-dashboard" element={<PrivateRoute component={SalesDashboard} props={{ screenName: 'Sales Dashboard', screenAction: 'View' }} />} />
          <Route path="/bi-creation" element={<BIToolCreation />} />
          <Route path="/helpdesk-dashboard" element={<PrivateRoute component={HelpdeskDashboard} props={{ screenName: 'Helpdesk Dashboard', screenAction: 'View' }} />} />
          <Route path="/interaction-dashboard" element={<PrivateRoute component={InteractionDashboard} props={{ screenName: 'Interaction Dashboard', screenAction: 'View' }} />} />
          <Route path="/update-interaction-status" element={<PrivateRoute component={UpdateInteraction} props={{ screenName: 'Interaction Update', screenAction: 'Update' }} />} />
          <Route path="/ar-ageing-dashboard" element={<PrivateRoute component={ARAgeingDashboard} props={{ screenName: 'AR Ageing Dashboard', screenAction: 'View' }} />} />
          <Route path="/ar-ageing-report" element={<PrivateRoute component={ARAgeingReport} props={{ screenName: 'AR Ageing Header Report', screenAction: 'View' }} />} />

          {/* BI Aggregation */}
          <Route path="/bi-aggregation" element={<BIAggregation />} />
          <Route path="/leads-list" element={<PrivateRoute component={LeadsList} props={{ screenName: 'Stakeholder', screenAction: 'List' }} />} />
          <Route path="/leads-add" element={<PrivateRoute component={AddEditLead} props={{ screenName: 'Stakeholder', screenAction: 'Add' }} />} />
          <Route path="/leads-edit" element={<PrivateRoute component={AddEditLead} props={{ screenName: 'Stakeholder', screenAction: 'Edit/View' }} />} />
          <Route path="/tasks-list" element={<PrivateRoute component={TasksList} props={{ screenName: 'Task', screenAction: 'List' }} />} />
          <Route path="/tasks-add" element={<PrivateRoute component={AddTask} props={{ screenName: 'Task', screenAction: 'Add' }} />} />
          <Route path="/tasks-edit" element={<PrivateRoute component={EditTask} props={{ screenName: 'Task', screenAction: 'Edit / View' }} />} />
          <Route path="/open-task-report" element={<PrivateRoute component={OpenTaskReport} props={{ screenName: 'Open Task', screenAction: 'Report' }} />} />
          <Route path="/closed-task-report" element={<PrivateRoute component={ClosedTaskReport} props={{ screenName: 'Closed Task', screenAction: 'Report' }} />} />
          <Route path="/created-task-report" element={<PrivateRoute component={CreatedTaskReport} props={{ screenName: 'Created Task', screenAction: 'Report' }} />} />
          <Route path="/mission-list" element={<PrivateRoute component={MissionList} props={{ screenName: 'Mission', screenAction: 'List' }} />} />
          <Route path="/mission-add" element={<PrivateRoute component={AddEditMission} props={{ screenName: 'Mission', screenAction: 'Add' }} />} />
          <Route path="/mission-Edit" element={<PrivateRoute component={AddEditMission} props={{ screenName: 'Mission', screenAction: 'Edit' }} />} />
          <Route path="/ameyo/create-interaction/*" element={<AmeyoRedirect />} />
          <Route path="/ameyo/create-ticket/*" element={<AmeyoRedirectNew />} />

          <Route path="/ameyo/create-helpdesk/*" element={<CreateHelpdeskContainerNew />} />
          <Route path="/mbr-dashboard" element={<PrivateRoute component={MBRDashboard} props={{ screenName: 'Dashboard', screenAction: 'Management' }} />} />
          <Route path="/create-helpdesk" element={<PrivateRoute component={CreateHelpdeskContainerNew} props={{ screenName: 'Helpdesk', screenAction: 'Create' }} />} />
          <Route path="/create-profile" element={<PrivateRoute component={CreateProfile} props={{ screenName: 'Profile', screenAction: 'Create' }} />} />
          <Route path="/search-profile" element={<PrivateRoute component={SearchProfile} props={{ screenName: 'Profile', screenAction: 'Search' }} />} />
          <Route path="/map" element={<PrivateRoute component={GlobalMap} props={{ screenName: 'Global Map', screenAction: 'View' }} />} />
          <Route path="/abandoned-call-report" element={<PrivateRoute component={AbandonedCallReport} props={{ screenName: 'Abandoned Call', screenAction: 'Report' }} />} />
          <Route path="/acd-call-interval-summary-report-daily" element={<PrivateRoute component={ACDCallIntervalSummaryReportDaily} props={{ screenName: 'ACD Call Interval Summary Report Daily', screenAction: 'Report' }} />} />
          <Route path="/acd-call-interval-summary-report-hourly" element={<PrivateRoute component={ACDCallIntervalSummaryReportHourly} props={{ screenName: 'ACD Call Interval Summary Report Hourly', screenAction: 'Report' }} />} />
          <Route path="/agent-productivity-report-daily" element={<PrivateRoute component={AgentProductivityReportDaily} props={{ screenName: 'Agent Productivity Daily', screenAction: 'Report' }} />} />
          <Route path="/agent-productivity-report-hourly" element={<PrivateRoute component={AgentProductivityReportHourly} props={{ screenName: 'Agent Productivity Hourly', screenAction: 'Report' }} />} />

          {/* <PrivateRoute exact path="/maps" component={EarthquakeMap} props={{ screenName: 'Global Maps', screenAction: 'View' }} /> */}

          {/* SLA Management */}
          <Route path="/sla" element={<PrivateRoute component={SLAMenu} layout={SlaLayout} props={{ screenName: 'SLA Managment', screenAction: 'View', screenInfo: 'SLA Managment' }} />} />
          <Route path="/sla-add" element={<PrivateRoute component={CreateSlaDefinitionContainer} layout={SlaLayout} props={{ screenName: 'SLA Managment', screenAction: 'Create', screenInfo: 'SLA Managment' }} />} />
          <Route path="/sla-view" element={<PrivateRoute component={CreateSlaDefinitionContainer} layout={SlaLayout} props={{ screenName: 'SLA Managment', screenAction: 'View' }} />} />
          <Route path="/sla-edit" element={<PrivateRoute component={CreateSlaDefinitionContainer} layout={SlaLayout} props={{ screenName: 'SLA Managment', screenAction: 'Edit' }} />} />
          <Route path="/sla-search" element={<PrivateRoute component={SearchSlaDefinition} layout={SlaLayout} props={{ screenName: 'SLA Managment', screenAction: 'Search' }} />} />
          <Route path="/sla-map-add" element={<PrivateRoute component={SLADefinitionMapping} layout={SlaLayout} props={{ screenName: 'SLA Managment - Mapping', screenAction: 'Create' }} />} />
          <Route path="/sla-map-search" element={<PrivateRoute component={SLADefinitionMappingSearch} layout={SlaLayout} props={{ screenName: 'SLA Managment - Mapping', screenAction: 'Search' }} />} />
          <Route path="/sla-map-edit" element={<PrivateRoute component={SLADefinitionMapping} layout={SlaLayout} props={{ screenName: 'SLA Managment - Mapping', screenAction: 'Edit' }} />} />
          <Route path="/sla-map-view" element={<PrivateRoute component={SLADefinitionMapping} layout={SlaLayout} props={{ screenName: 'SLA Managment - Mapping', screenAction: 'View' }} />} />
          
          {/* KB Statement Search */}
          <Route path="/kb-search" element={<PrivateRoute component={KBStatementSearch} props={{ screenName: 'Knowledgebase', screenAction: 'List' }} />} />

          <Route path="/create-order" element={<PrivateRoute component={CreateOrder} props={{ screenName: 'Order', screenAction: 'Create' }} />} />
          <Route path="/search-order" element={<PrivateRoute component={SearchOrder} props={{ screenName: 'Order', screenAction: 'Search' }} />} />
          <Route path="/announcements" element={<PrivateRoute component={ViewAnnouncements} props={{ screenName: 'Announcements', screenAction: 'Search' }} />} />
          <Route path="/add-announcement" element={<PrivateRoute component={AddAnnouncements} props={{ screenName: 'Announcements', screenAction: 'Create' }} />} />
          <Route path="/edit-announcement" element={<PrivateRoute component={EditAnnouncements} props={{ screenName: 'Announcements', screenAction: 'Edit' }} />} />
          <Route path="/contract360" element={<PrivateRoute component={Contract360} props={{ screenName: 'Contract 360', screenAction: 'View' }} />} />

          <Route path="/search-receipt" element={<PrivateRoute component={SearchReceipt} props={{ screenName: 'Receipt', screenAction: 'Search' }} />} />
          <Route path="/add-receipt" element={<PrivateRoute component={AddEditReceipt} props={{ screenName: 'Receipt', screenAction: 'Add' }} />} />
          <Route path="/edit-receipt" element={<PrivateRoute component={AddEditReceipt} props={{ screenName: 'Receipt', screenAction: 'Edit' }} />} />
          <Route path="/search-write-off" element={<PrivateRoute component={SearchWriteOff} props={{ screenName: 'Write Off', screenAction: 'Search' }} />} />
          <Route path="/faq" element={<PrivateRoute component={FAQList} props={{ screenName: 'FAQ', screenAction: 'List' }} />} />
          <Route path="/add-faq" element={<PrivateRoute component={addEditFaq} props={{ screenName: 'FAQ', screenAction: 'Add' }} />} />
          <Route path="/edit-faq" element={<PrivateRoute component={addEditFaq} props={{ screenName: 'FAQ', screenAction: 'Edit' }} />} />

          <Route path="/managment-dashboard" element={<PrivateRoute component={managementDashboard} props={{ screenName: 'Management Dashboard', screenAction: 'View' }} />} />

          <Route path="/manage-form-parameters" element={<PrivateRoute component={ManageFormParameters} props={{ screenName: 'Form management', screenAction: 'View' }} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          {/* <Navigate to={"/" /> */}

        </Routes>
      </React.Suspense>
    </Router>


  );
}

export default App;

