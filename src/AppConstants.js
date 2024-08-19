export const statusConstantCode = {
  status: {
    ACTIVE: 'AC',
    IN_ACTIVE: 'IN',
    PENDING: 'PENDING',
    TEMPORARY: 'TEMP',
    NEW: 'NEW',
    ASSIGNED: 'ASSIGNED',
    CLOSED: 'CLOSED',
    CANCELLED: 'CANCELLED',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    CREATED: 'CREATED',
    DONE: 'DONE',
    USER_WAIT: 'USER_WAIT',
    INPROCESS: 'INP',
    SERVICE_TEMP: 'SS_TEMP',
    SERVICE_ACTIVE: 'SS_AC',
    SERVICE_TOS: 'SS_TOS',
    SERVICE_INACTIVE: 'SS_IN',
    SERVICE_PEND: 'SS_PEND',
    CUST_TEMP: 'CS_TEMP',
    CUST_ACTIVE: 'CS_ACTIVE',
    CUST_PEND: 'CS_PEND',
    HELPDESK_NEW: 'HS_NEW',
    HELPDESK_CLOSED: 'HS_CLS',
    HELPDESK_CANCEL: 'HS_CANCE',
    HELPDESK_ASSIGN: 'HS_ASSGN',
    HELPDESK_ESCALATED: 'HS_ESCALATED',
    INTERACTION_CLOSED: 'CLOSED',
    INTERACTION_CANCEL: 'CANCELLED',
    ORDER_CLOSED: 'CLS',
    ORDER_CANCEL: 'CNCLED',
    WIP: 'WIP'
  },
  common: {
    YES: 'Y',
    NO: 'N',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    lIMIT: 10,
    PAGE: 0,
    PASSWORD_LENGTH: 8,
    AVAILABLE: 'AVAILABLE',
    ALL: 'ALL',
    INTERACTION: 'TMC_INTERACTION',
    HELPDESK: 'TMC_HELPDESK'
  },
  businessEntity: {
    PROJECT: 'PROJECT',
    SEVERITY: 'SEVERITY',
    HELPDESK_TYPE: 'HELPDESK_TYPE',
    HELPDESKSTATUS: 'HELPDESK_STATUS',
    HELPDESKCANCELREASON: 'HELPDESK_CANCEL_REASON',
    HPD_SOURCE: {
      IVR: 'I-VR'
    },
    AUDIOCONF: 'AUDIO_CONF',
    VIDEOCONF: 'VIDEO_CONF',
    WEB: 'WEB',
    IVR: 'IVR',
    MOBILELIVECHAT: 'MOBILE-LIVECHAT',
    WEBSITELIVECHAT: 'WEBSITE-LIVECHAT',
    WHATSAPPLIVECHAT: 'WHATSAPP-LIVECHAT',
    FBLIVECHAT: 'FB-LIVECHAT',
    MOBILEAPP: 'MOBILEAPP',
    WEBPORTAL: 'WEBPORTAL',
    EMAIL: 'E-MAIL',
    LIVECHAT: 'LIVECHAT',
    WALKIN: 'WALKIN',
    INSTAGRAM: 'INSTAGRAM-LIVECHAT',
    CONTACTPREFERENCE: 'CONTACT_PREFERENCE'
  },
  entityCategory: {
    CUSTOMER: 'CUSTOMER',
    SERVICE: 'SERVICE',
    PROFILE: 'PROFILE',
    USER: 'USER',
    INTERACTION: 'INTERACTION',
    ACCOUNT: 'ACCOUNT',
    ORDER: 'ORDER',
    HELPDESK: 'HELPDESK',
    HELPDESKTXN: 'HELPDESKTXN',
    APPOINTMENT: 'APPOINTMENT',
    REQUEST: 'REQUEST',
    TASK: 'TASK'
  },
  negativeIntxnTypes: ['REQCOMP', 'APPEALS', 'GRIEVANCE', 'INTXN_COMPLAINT', 'SERVICE_REQUEST', 'INTXN_INQUIRY'],
  businessSetup: ['PF_UTILITY'],
  topPerformanceActivity: [{
    label: "Interaction",
    value: "Interaction"
  }, 
    // {
    //   label: "Order",
    //   value: "Order"
    // }
  ],
  colorCode: {
    PRTYHGH: { color: 'text-danger', desc: 'High' },
    PRTYMED: { color: 'text-warning', desc: 'Medium' },
    PRTYLOW: { color: 'text-success', desc: 'Low' },
    // VIP: 'text-info'
  },
  cancelStatus: ['NEW'],
  type: {
    'PUBLIC_SERVICE': 'PUBLIC_SERVICES',
    'HELPDESK_SERVICE': 'HELPDESK_SERVICES',
    'CUSTOMER_SERVICE': 'CUSTOMER_SERVICES'
  },
  orderType: {
    signUp: 'OT_SU',
    upgrade: 'OT_UGD',
    downgrade: 'OT_DWNG',
    suspension: 'OT_SSP',
    reconnect: 'OT_REC',
    terminate: 'OT_SO'
  },  
  orderCategory: {
    New : 'OC_N',
    Existing: 'OC_E'	
  }
}

export const DEFAULT_LOCALE = 'en'
export const SalesDashboardConstant = {
  offlineStore: ['Walk In']
}

export const moduleConfig = {
  appointment: "CFG_APPOINTMENT",
  admin: "CFG_ADMIN",
  account: "CFG_ACCOUNT",
  billing: "CFG_BILLING",
  contract: "CFG_CONTRACT",
  customer: "CFG_CUSTOMER",
  dashboard: "CFG_DASHBOARD",
  helpdesk: "CFG_HELPDESK",
  interaction: "CFG_INTERACTION",
  invoice: "CFG_INVOICE",
  mis: "CFG_MIS",
  order: "CFG_ORDER",
  product: "CFG_PRODUCT",
  payment: "CFG_PAYMENT",
  profile: "CFG_PROFILE",
  service: "CFG_SERVICE"
}

export const emojis = [
  {
    emoji: 'smiley',
    emojiClass: 'fa-laugh text-success',
    symbol: '😃',
    color: '#0eb715',
    name: 'HAHA',
    percentage: '5'
  },
  {
    emoji: 'rage',
    emojiClass: 'fa-angry text-danger',
    symbol: '😡',
    color: '#f1556c',
    name: 'ANGRY',
    percentage: '1'
  },
  {
    emoji: 'neutral_face',
    emojiClass: 'fa-meh text-info',
    symbol: '😐',
    color: '#f7b84b',
    name: 'NEUTRAL',
    percentage: '2.5'
  },
  {
    symbol: '😟',
    emojiClass: 'fa-sad-tear text-warning',
    name: 'SAD',
    color: '#fdc117',
    emoji: 'worried',
    percentage: '1.5'
  }
]
export const metaConfig = {
  CONSUMER_FROM_ATTRIBUTE_ENABLED: "CONSUMER_FROM_ATTRIBUTE_ENABLED",
  PROFILE_DEPARTMENT_ATTRIBUTE_ENABLED: "PROFILE_DEPARTMENT_ATTRIBUTE_ENABLED",
  HELPDESK_REPORT_TYPES: "HELPDESK_REPORT_TYPES",
}