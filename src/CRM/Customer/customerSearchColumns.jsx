export const CustomerSearchColumns = [
      {
        Header: "Customer Number",
        accessor: "customerDetails.customerNo",
        id: 'customerNo'
    },
    {
        Header: "Account Number",
        accessor: "accountDetails.accountNo",
        id: 'accountNo'
    },
    {
        Header: "Subscription Number",
        accessor: "serviceNo",
        id: 'serviceNo'
    },
    {
        Header: "Customer Name",
        accessor: "customerDetails.firstName",
        disableFilters: false,
        id: 'customerName'
    },
    {
        Header: "Mobile Number",
        accessor: "customerDetails.customerContact[0].mobileNo",
        id: 'mobileNo',
        disableFilters: false,
    },
    {
        Header: "Email",
        accessor: "customerDetails.customerContact[0].emailId",
        disableFilters: true,
    },
    {
        Header: "Customer Status",
        accessor: "customerDetails.statusDesc.description",
        disableFilters: true,
        id: 'customerServiceStatus'
    },
    {
        Header: "Service Status",
        accessor: "serviceStatus.description",
        disableFilters: true,
        id: 'status'
    }
]

export const SubscriptionSearchColumns = [
    {
        Header: "Subscription Number",
        accessor: "serviceNo",
        id: 'serviceNo'
    },
    {
        Header: "Customer Number",
        accessor: "customerDetails.customerNo",
        id: 'customerNo'
    },
    {
        Header: "Account Number",
        accessor: "accountDetails.accountNo",
        id: 'accountNo'
    },    
    {
        Header: "Customer Name",
        accessor: "customerDetails.firstName",
        disableFilters: false,
        id: 'customerName'
    },
    {
        Header: "Mobile Number",
        accessor: "customerDetails.customerContact[0].mobileNo",
        id: 'mobileNo',
        disableFilters: false,
    },
    {
        Header: "Email",
        accessor: "customerDetails.customerContact[0].emailId",
        disableFilters: true,
    },
    {
        Header: "Customer Status",
        accessor: "customerDetails.statusDesc.description",
        disableFilters: true,
        id: 'customerServiceStatus'
    },
    {
        Header: "Service Status",
        accessor: "serviceStatus.description",
        disableFilters: true,
        id: 'status'
    }
]

export const ExistingApplicationColumns = [
    {
        Header: "Customer Number",
        accessor: "customerNo",
        id: 'customerNo'
    },
    {
        Header: "Customer Name",
        accessor: "firstName",
        disableFilters: false,
        id: 'customerName'
    },
    {
        Header: "Mobile Number",
        accessor: "customerContact[0].mobileNo",
        id: 'mobileNo',
        disableFilters: false,
    },
    {
        Header: "Email",
        accessor: "customerContact[0].emailId",
        disableFilters: true,
    },
    {
        Header: "Customer Status",
        accessor: "statusDesc.description",
        disableFilters: true,
        id: 'customerServiceStatus'
    }
]

export const CustomerSearchHiddenColumns = [
    'customerId',
    'accountId',
    'serviceId',
    'status',
    'customerUuid'
]

export const ComplaintCustomerSearchHiddenColumns = [
    'customerUuid',
    'accountId',
    'serviceId',
    'action',
    'status'
]

export const ProfileSearchColumns = [
    {
        Header: "Action",
        accessor: "action",
        disableFilters: true,
        id: 'action'
    },
    {
        Header: "Profile ID",
        accessor: "profileNo",
        disableFilters: true,
        id: 'profileNo'
    },
    {
        Header: "Profile Name",
        accessor: "firstName",
        disableFilters: true,
        id: 'profileName'
    },
    {
        Header: "Mobile Number",
        accessor: "profileContact[0].mobileNo",
        id: 'mobileNo',
        disableFilters: true,
    },
    {
        Header: "Email",
        accessor: "profileContact[0].emailId",
        disableFilters: true,
        id: 'emailId'
    },
    {
        Header: "Profile Status",
        accessor: "status.description",
        disableFilters: true,
        id: 'profileStatus'
    }
]