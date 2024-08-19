import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from "react-toastify";
import { statusConstantCode } from "../../../../AppConstants";
import ReconnectTabPane from "./ReconnectTabPane";
import SuspendTabPane from "./SuspendTabPane";
import TerminateTabPane from "./TerminateTabPane";
import UpgradeDowngradeTabPane from "./UpgradeDowngradeTabPane";
import CreateOrderForm from "../../../OrderManagement/CreateOrder/CreateOrderForm";
import { get, post, put } from '../../../../common/util/restUtil';
import { properties } from '../../../../properties';
import { string, object } from "yup";
import moment from 'moment'
import { CreateOrderContext } from "../../../../AppContext";
import { unstable_batchedUpdates } from 'react-dom';
import SignUpTab from './SignUpTabPane';
import { isEmpty } from 'lodash'

const OrderManagement = (props) => {
    const { appsConfig, orderType, screenSource, subscriptionDetails, stats, productDetails, customerDetails, orderData, totalOutstanding } = props.data;
    const { setOrderData } = props.handler;
    const validationSchema = object().shape({
        fromDate: orderType === statusConstantCode.orderType.suspension ? string().required("This field is required") : string().nullable(),
        toDate: orderType === statusConstantCode.orderType.suspension ? string().required("This field is required") : string().nullable(),
        reason: orderType === statusConstantCode.orderType.suspension ? string().required("This field is required") : string().nullable(),
        paymentMode: [statusConstantCode.orderType.upgrade, statusConstantCode.orderType.downgrade, statusConstantCode.orderType.signUp].includes(orderType) ? string().required("This field is required") : string().nullable(),
        orderChannel: [statusConstantCode.orderType.upgrade, statusConstantCode.orderType.downgrade, statusConstantCode.orderType.signUp].includes(orderType) ? string().required("This field is required") : string().nullable(),
        orderMode: [statusConstantCode.orderType.upgrade, statusConstantCode.orderType.downgrade, statusConstantCode.orderType.signUp].includes(orderType) ? string().required("This field is required") : string().nullable(),
        deliveryMode: [statusConstantCode.orderType.upgrade, statusConstantCode.orderType.downgrade, statusConstantCode.orderType.signUp].includes(orderType) ? string().required("This field is required") : string().nullable(),
        priority: [statusConstantCode.orderType.upgrade, statusConstantCode.orderType.downgrade, statusConstantCode.orderType.signUp].includes(orderType) ? string().required("This field is required") : string().nullable(),
        expectedResDate: [statusConstantCode.orderType.upgrade, statusConstantCode.orderType.downgrade, statusConstantCode.orderType.signUp].includes(orderType) ? string().required("This field is required") : string().nullable(),
    })

    const AddressValidationSchema = object().shape({
        addressType: string().nullable(false).required("Address Type is required"),
        address1: string().nullable(false).required("Address line one is required"),
        address2: string().nullable(false).required("Address line two is required"),
        postcode: string().nullable(false).required("Post code is required"),
        country: string().nullable(false).required("Country is required"),
        state: string().nullable(false).required("State is required"),
        district: string().nullable(false).required("District is required"),
        city: string().nullable(false).required("City is required"),
    });

    console.log('subscriptionDetails ', subscriptionDetails)

    const sigPad = useRef({});
    const [activeTab, setActiveTab] = useState(0)
    const [openOrders, setOpenOrders] = useState(0)
    const [error, setError] = useState({})
    const [refresh, setRefresh] = useState(false)
    const [orderNo, setOrderNo] = useState()
    const [enableOrderForm, setEnableOrderForm] = useState(false)
    const [disableButtons, setDisableButtons] = useState(true)

    const [orderTypeDescription, setOrderTypeDescription] = useState()
    const [productList, setProductList] = useState([])
    const [originalProductList, setOriginalProductList] = useState([])
    const [serviceTypeLookup, setServiceTypeLookup] = useState([])
    const [originalProductData, setOriginalProductData] = useState({})

    const [selectedProductList, setSelectedProductList] = useState([])
    const [selectedAppointmentList, setSelectedAppointmentList] = useState([])
    const [selectedProducts, setSelectedProducts] = useState([])
    const [accountData, setAccountData] = useState([])
    const [serviceData, setServiceData] = useState({})

    const [termsAndCond, setTermsAndCond] = useState()
    const [addressError, setAddressError] = useState({});
    const [productBenefitLookup, setProductBenefitLookup] = useState([])
    const [openTermsAndCondition, setOpenTermsAndCondition] = useState(false)
    const [agreementDetail, setAgreementDetail] = useState({});
    const [customerTypeLookup, setCustomerTypeLookup] = useState([]);
    const [productCategory, setProductCategory] = useState([])
    const initialState = {
        terminationReason: "",
        refundDeposit: "N",
        contractFeesWaiver: "N",
        orderSource: screenSource === 'CREATE_ORDER' ? "Customer" : "Interaction"
    };
    const isDayNoExceeded = (agreeDtl) => {
        let selectedServiceActivatedOn = subscriptionDetails?.activationDate;
        var startDate = moment(selectedServiceActivatedOn, "YYYY-MM-DD");
        var endDate = moment();
        var dayDiff = endDate.diff(startDate, 'days');
        return (dayDiff < agreeDtl.noOfDays);
    }

    const clearSignature = () => {
        sigPad.current?.clear();
    };

    useMemo(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=PRODUCT_BENEFIT,SERVICE_TYPE,ORDER_TYPE,CUSTOMER_CATEGORY')
            .then((response) => {
                if (response.data) {
                    // businessMasterRef.current = response.data
                    unstable_batchedUpdates(() => {
                        setProductBenefitLookup(response.data.PRODUCT_BENEFIT)
                        setOrderTypeDescription(response.data.ORDER_TYPE?.find(f => f.code === orderType)?.description)
                        setCustomerTypeLookup(response.data.CUSTOMER_CATEGORY)
                        setServiceTypeLookup(response.data.SERVICE_TYPE)
                    })
                }
            }).catch((error) => console.error(error))
        get(properties.MASTER_API + `/template/get-terms-conditions?entityType=${orderType}&serviceType=${subscriptionDetails?.srvcTypeDesc?.code}`).then((response) => {
            if (response?.data?.length) {
                let agreeDtl = response?.data[0];
                setTermsAndCond(agreeDtl);
                if (isDayNoExceeded(agreeDtl)) {
                    toast.error(`You can ${orderType} only after  ${agreeDtl.noOfDays} days from the date of activation`); return;
                }
            }
        }).catch((error) => {
            console.error("error", error)
        }).finally()
    }, [])

    useEffect(() => {
        setOrderData({
            ...orderData,
            ...initialState
        })
    }, [])

    const fetchProductList = () => {
        if (isEmpty(productList)) {
            let originalProductData = {}

            const customerTypeProductMapping = customerTypeLookup.filter((e) => e.code === customerDetails.customerCatDesc?.code)?.[0]?.mapping?.productSubCategory;
            // console.log('customerTypeProductMapping--------->', customerTypeProductMapping)
            post(properties.PRODUCT_API + "/mapping-list", {})
                .then((response) => {
                    if (response.data) {
                        // setOriginalProductData(response.data)
                        originalProductData = response.data

                        const productList = originalProductData.productList.rows.filter((p) => customerTypeProductMapping?.includes(p.productSubCategory));
                        const prodSubType = [
                            ...new Map(
                                originalProductData.productList.rows
                                    .filter(f => f.productSubTypeDesc) // Ensure productSubTypeDesc exists
                                    .map(p => [p.productSubTypeDesc.code, p.productSubTypeDesc]) // Map code to productSubTypeDesc
                            ).values() // Get unique values
                        ];
                        // console.log('prodSubType-------->', prodSubType);

                        setProductCategory(prodSubType)

                        // const productList = originalProductData.productList.rows;


                        let bundleList = originalProductData.bundleList.rows.map((m) => m);
                        // console.log('bundleList-------->', bundleList)

                        productList.map((x) => {
                            let Rc = 0
                            let Nrc = 0
                            let totalRc = 0
                            let totalNrc = 0
                            let currency = '$'
                            if (x?.productChargesList && x?.productChargesList.length > 0) {
                                x?.productChargesList.forEach((y) => {
                                    if (y?.chargeDetails?.chargeCat === 'CC_RC' && (!y.objectReferenceId || y.objectReferenceId == null)) {
                                        Rc = Number(y?.chargeAmount || 0)
                                        totalRc = totalRc + Number(y?.chargeAmount || 0)
                                    } else if (y?.chargeDetails?.chargeCat === 'CC_NRC' && (!y.objectReferenceId || y.objectReferenceId == null)) {
                                        totalNrc = totalNrc + Number(y?.chargeAmount || 0)
                                        Nrc = Number(y?.chargeAmount || 0)
                                    }
                                    currency = y?.chargeDetails?.currencyDesc?.description || '$'
                                })
                            }
                            x.Rc = Rc
                            x.Nrc = Nrc
                            x.totalRc = totalRc
                            x.totalNrc = totalNrc
                            x.quantity = 0
                            x.isSelected = 'N'
                            x.currency = currency
                        })

                        bundleList = bundleList.filter((x) => {
                            if (x.productBundleDtl && x.productBundleDtl.length > 0) {

                                return true;
                            }

                            return false;
                        });

                        bundleList.map((x) => {
                            let Rc = 0
                            let Nrc = 0
                            let totalRc = 0
                            let totalNrc = 0
                            let currency = '$'

                            if (x?.productBundleDtl && x?.productBundleDtl.length > 0) {
                                x?.productBundleDtl?.forEach((bundleDtl) => {
                                    const rcAmount = bundleDtl.charges && bundleDtl.charges?.length > 0 && bundleDtl.charges
                                        .filter((charge) => charge.chargeType === 'CC_RC' && (!charge.objectReferenceId || charge.objectReferenceId == null))
                                        .reduce((total, charge) => total + Number(charge.chargeAmount), 0);

                                    const nrcAmount = bundleDtl.charges && bundleDtl.charges?.length > 0 && bundleDtl.charges
                                        .filter((charge) => charge.chargeType === 'CC_NRC' && (!charge.objectReferenceId || charge.objectReferenceId == null))
                                        .reduce((total, charge) => total + Number(charge.chargeAmount), 0);

                                    totalRc += rcAmount;
                                    totalNrc += nrcAmount;

                                    currency = bundleDtl.charges && bundleDtl.charges?.length > 0 && bundleDtl.charges?.[0].currency || '$'

                                });
                            }

                            x.Rc = Rc
                            x.Nrc = Nrc
                            x.totalRc = totalRc
                            x.totalNrc = totalNrc
                            x.quantity = 0
                            x.isSelected = 'N'
                            x.currency = currency
                        })

                        if (subscriptionDetails && subscriptionDetails?.accountDetails) {

                            const accountInitialValues = {
                                isAccountCreate: "N",
                                sameAsCustomerData: "Y",
                                firstName: '',
                                lastName: '',
                                email: '',
                                contactNbr: '',
                                dob: '',
                                gender: '',
                                idType: '',
                                idValue: '',
                                registrationNbr: "",
                                registrationDate: "",
                                accountCategory: "AC_POST",
                                accountClass: "",
                                accountPriority: "",
                                accountLevel: "PRIMARY",
                                billLanguage: "BLENG",
                                accountType: "",
                                notificationPreference: ["CNT_EMAIL"],
                                creditLimit: "",
                                accountBalance: "",
                                accountOutstanding: "",
                                accountStatusReason: "",
                                currency: "CUR-INR",
                                ...subscriptionDetails?.accountDetails,
                            }
                            // console.log('accountInitialValues ', accountInitialValues)
                            setAccountData(accountInitialValues)

                        }
                        let serviceList = []
                        customerDetails && customerDetails.customerAccounts &&
                            customerDetails.customerAccounts.length > 0 &&
                            customerDetails.customerAccounts
                                .filter((f) => {
                                    return f.accountServices && f.accountServices.length > 0;
                                })
                                .map((f) => {
                                    f.accountServices.map((ele) => {

                                        if (!!!['SS_IN', 'SS_AC', 'SS_PEND'].includes(ele.status)) {
                                            serviceList.push({ service: ele })
                                        }
                                    })
                                })
                        // console.log('=1===========',serviceList)

                        serviceList = serviceList.map(f => {
                            f.service.productUuid = productList.length > 0 && productList?.find(x => x.productId === f.service.productId)?.productUuid
                            return f
                        })

                        // console.log('==========2================================', {
                        //     ...serviceData,
                        //     ...serviceList
                        // })

                        setServiceData({
                            ...serviceData,
                            ...serviceList

                        })
                        // console.log('productList==>', productList)
                        // console.log('bundleList==>', bundleList)
                        setProductList([...productList, ...bundleList]) // need to do customer type filter
                        setOriginalProductList([...productList, ...bundleList])// need to do customer type filter
                    }
                }).catch((error) => console.error(error))
        }
    }

    useEffect(() => {
        if (orderType && orderType !== statusConstantCode.orderType.signUp) {
            post(`${properties.ORDER_API}/search?limit=1&page=0`, { searchParams: { serviceUuid: subscriptionDetails?.serviceUuid, orderType: orderType } }).then((resp) => {
                if (resp?.data && resp?.data?.row?.length > 0) {
                    const isOpen = resp?.data?.row.filter(f => ![statusConstantCode.status.ORDER_CLOSED, statusConstantCode.status.ORDER_CANCEL].includes(f.orderStatus.code))
                    setOpenOrders(isOpen.length)
                    if (isOpen.length > 0) {
                        toast.error(`There is an existing open order ${isOpen?.[0].orderNo} with the same Order Type. Kindly close the order before creating new one.`);
                        return;
                    }
                }
            })

        }
    }, [orderType, subscriptionDetails?.serviceUuid])

    useEffect(() => {
        // Reset activeTab to 0 when orderType changes
        if (prevOrderType.current !== orderType) {
            setActiveTab(0);
            prevOrderType.current = orderType;
        }

        // Handle enableOrderForm logic based on orderType and activeTab
        if ([statusConstantCode.orderType.upgrade, statusConstantCode.orderType.downgrade, statusConstantCode.orderType.signUp].includes(orderType)) {
            if ([statusConstantCode.orderType.upgrade, statusConstantCode.orderType.downgrade].includes(orderType) && activeTab === 2) {
                setEnableOrderForm(true);
            } else if ([statusConstantCode.orderType.signUp].includes(orderType) && activeTab === 1) {
                setEnableOrderForm(true);
            } else {
                setEnableOrderForm(false);
            }
        } else {
            setEnableOrderForm(false);
        }

        // Handle disableButtons logic based on orderType and subscriptionDetails
        if ([statusConstantCode.orderType.upgrade, statusConstantCode.orderType.downgrade, statusConstantCode.orderType.suspension].includes(orderType) && subscriptionDetails?.serviceStatus?.code === statusConstantCode.status.SERVICE_ACTIVE) {
            setDisableButtons(false);
        } else if (statusConstantCode.orderType.reconnect === orderType && subscriptionDetails?.serviceStatus?.code === statusConstantCode.status.SERVICE_TOS) {
            setDisableButtons(false);
        } else if (statusConstantCode.orderType.terminate === orderType && [statusConstantCode.status.SERVICE_ACTIVE, statusConstantCode.status.SERVICE_TOS].includes(subscriptionDetails?.serviceStatus?.code)) {
            setDisableButtons(false);
        } else if (statusConstantCode.orderType.signUp === orderType) {
            setDisableButtons(false);
            fetchProductList();
        }

        if (openOrders > 0 || totalOutstanding > 0) {
            setDisableButtons(true);
        }
    }, [activeTab, orderType, subscriptionDetails, openOrders, totalOutstanding]);

    const prevOrderType = useRef(orderType);


    const handleNextTab = async () => {
        let isError = false
        if ([statusConstantCode.orderType.downgrade, statusConstantCode.orderType.upgrade, statusConstantCode.orderType.signUp].includes(orderType)) {
            if (selectedProducts.length === 0) {
                isError = true
                toast.error("Please select the product to continue")
                return
            } else {
                for (const product of selectedProducts) {
                    if (product.contractFlag === 'Y') {
                        if (!product.selectedContract || product.selectedContract.length === 0) {
                            toast.error('Please choose the contract you would like to purchase')
                            return
                        }
                    }
                }
            }
        }
        let addressError = false

        if (enableOrderForm) {
            let error = validate(validationSchema, orderData, 'ORDER');
            if (error) {
                toast.error("Validation errors found. Please check all fields");
                return false
            }
            console.log('addressList ', addressList)
            addressError = validate(AddressValidationSchema, addressList[0], 'ADDRESS')
        }
        if (addressError) {
            toast.error("Validation errors found. Please check address details");
            return
        }
        if (activeTab === 2) {
            isError = true

            if ([statusConstantCode.orderType.suspension, statusConstantCode.orderType.downgrade, statusConstantCode.orderType.upgrade].includes(orderType) && subscriptionDetails?.serviceStatus.code !== statusConstantCode.status.SERVICE_ACTIVE) {
                toast.error(`The service is not in Active state.`);
                return;
            }

            if (orderType === statusConstantCode.orderType.reconnect && subscriptionDetails?.serviceStatus.code !== statusConstantCode.status.SERVICE_TOS) {
                toast.error(`The service is not in TOS state`);
                return;
            }

            if (orderType && orderType !== statusConstantCode.orderType.signUp) {
                post(`${properties.ORDER_API}/search?limit=1&page=0`, { searchParams: { serviceUuid: subscriptionDetails?.serviceUuid, orderType: orderType } }).then((resp) => {
                    if (resp?.data && resp?.data?.row?.length > 0) {
                        const isOpen = resp?.data?.row.filter(f => ![statusConstantCode.status.ORDER_CLOSED, statusConstantCode.status.ORDER_CANCEL].includes(f.orderStatus.code))
                        setOpenOrders(isOpen.length)
                        if (isOpen.length > 0) {
                            toast.error(`There is an existing open order ${isOpen?.[0].orderNo} with the same Order Type. Kindly close the order before creating new one.`);
                            return;
                        }
                    }
                })

            }

            const resp = await generateOrder();
            // console.log('resp ', resp)
            if (resp && resp.status === 200) isError = false
        }

        if (!isError) {
            setRefresh(true)
            setActiveTab(activeTab + 1);
        }
    }

    const [addressList, setAddressList] = useState([{
        addressType: '',
        address1: '',
        address2: '',
        postcode: '',
        country: '',
        state: '',
        district: '',
        city: ''
    }])

    const validate = (schema, data, type) => {
        try {
            if (type === 'ORDER') {
                setError({});

            } else if (type === 'ADDRESS') {
                setAddressError({});

            }
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                if (type === 'ORDER') {
                    setError((prevState) => {
                        return { ...prevState, [err.params.path]: err.message };
                    });
                } else if (type === 'ADDRESS') {
                    setAddressError((prevState) => {
                        return { ...prevState, [err.params.path]: err.message };
                    });
                }
            });
            return e;
        }
    };

    function getRCChargeAmount(productList) {
        let chargeAmount = 0;
        let selectedProduct
        if (Array.isArray(productList)) {

            selectedProduct = productList?.[0];
        } else {
            selectedProduct = productList;
        }

        // console.log('selectedProduct ', selectedProduct)
        if (selectedProduct) {
            const ccRcCharge = selectedProduct.productChargesList?.find(f => {
                if (f.chargeType) {
                    return f.chargeType === 'CC_RC'
                } else {
                    return f.chargeDetails?.chargeCat === 'CC_RC'
                }
            });
            // console.log('ccRcCharge ', ccRcCharge)
            chargeAmount = ccRcCharge?.chargeAmount || 0;
        }

        return Number(chargeAmount).toFixed(2);
    }

    function getNRCChargeAmount(productList) {
        let chargeAmount = 0;
        let selectedProduct
        if (Array.isArray(productList)) {

            selectedProduct = productList?.[0];
        } else {
            selectedProduct = productList;
        }
        if (selectedProduct) {
            const ccNrcCharge = selectedProduct.productChargesList?.find(f => {
                if (f.chargeType) {
                    return f.chargeType === 'CC_NRC'
                } else {
                    return f.chargeDetails?.chargeCat === 'CC_NRC'
                }
            });
            chargeAmount = ccNrcCharge?.chargeAmount || 0;
        }

        return Number(chargeAmount).toFixed(2);
    }

    const handleManualProductChange = (product, e) => {
        const { checked, value, name } = e.target;
        // console.log('checked-------->', checked, value, name)
        let quantity = 0
        let modifiedProductList = productList
        if ([statusConstantCode.orderType.upgrade, statusConstantCode.orderType.downgrade].includes(orderType)) {
            setSelectedProductList([])
            modifiedProductList = productList.map((p) => {
                if (p.productId !== product.productId) {
                    return { ...p, isSelected: 'N', selectedContract: [], quantity: 0, upfrontCharge: 'N', advanceCharge: 'N' };
                }
                else {
                    if (!['advancePayment', 'upfrontPayment'].includes(name)) {
                        return { ...p, selectedContract: [], quantity: 0 };
                    } else {
                        return { ...p }
                    }
                }
            })
        }
        const updatedProductList = modifiedProductList.map((p) => {
            if (p.productCategory !== 'PC_BUNDLE') {
                if (p.productId === product.productId) {
                    let updatedProduct = { ...p, isSelected: 'Y' };
                    if (name === 'upfrontPayment') {
                        updatedProduct.upfrontPayment = checked;
                        if (checked) {
                            updatedProduct.upfrontCharge = 'Y'
                        } else {
                            updatedProduct.upfrontCharge = 'N'
                        }
                    }
                    if (name === 'advancePayment') {
                        updatedProduct.advancePayment = checked;
                        if (checked) {
                            updatedProduct.advanceCharge = 'Y'
                        } else {
                            updatedProduct.advanceCharge = 'N'
                        }
                    }
                    if (name === 'quantity') {
                        quantity = parseInt(value) || 0;
                        updatedProduct.quantity = quantity >= 0 ? quantity : 0;
                    }
                    if (name === 'contract') {
                        if (checked) {
                            updatedProduct.selectedContract = p.selectedContract ? [...p.selectedContract, parseInt(value) || 0] : [parseInt(value) || 0];
                            updatedProduct.quantity = 1;
                        } else {
                            updatedProduct.selectedContract = p.selectedContract ? p.selectedContract.filter((c) => c !== (parseInt(value) || 0)) : [];
                            updatedProduct.quantity = updatedProduct.selectedContract.length === 0 ? 0 : 1
                        }
                    }
                    updatedProduct.selectedContract = [...new Set(updatedProduct.selectedContract ?? [])];
                    // console.log("updatedProduct.quantity ==> ", updatedProduct.quantity)
                    return updatedProduct;
                }
            } else {
                if (Number(p.bundleId) === Number(product.bundleId)) {
                    let updatedProduct = { ...p, isSelected: 'Y' };

                    if (name === 'upfrontPayment') {
                        updatedProduct.upfrontPayment = checked;
                        if (checked) {
                            updatedProduct.upfrontCharge = 'Y'
                        } else {
                            updatedProduct.upfrontCharge = 'N'
                        }
                    }
                    if (name === 'advancePayment') {
                        updatedProduct.advancePayment = checked;
                        if (checked) {
                            updatedProduct.advanceCharge = 'Y'
                        } else {
                            updatedProduct.advanceCharge = 'N'
                        }
                    }
                    if (name === 'quantity') {
                        quantity = parseInt(value) || 0;
                        updatedProduct.quantity = quantity >= 0 ? quantity : 0;
                    }
                    if (name === 'billType') {
                        // console.log('valuevaluevaluevaluevalue', value)
                        updatedProduct.isSplitOrder = value === 'splitBill' ? true : false;
                    }
                    if (name === 'contract') {
                        if (checked) {
                            updatedProduct.selectedContract = p.selectedContract ? [...p.selectedContract, parseInt(value) || 0] : [parseInt(value) || 0];
                            updatedProduct.quantity = 1;
                        } else {
                            updatedProduct.selectedContract = p.selectedContract ? p.selectedContract.filter((c) => c !== (parseInt(value) || 0)) : [];
                            updatedProduct.quantity = updatedProduct.selectedContract.length === 0 ? 0 : 1
                        }
                    }

                    return updatedProduct;
                }
            }

            return p;
        });

        // console.log('updatedProductList================>>>>>>>>>>>>>>', updatedProductList)
        // console.log('updatedProductList count ================>>>>>>>>>>>>>>', updatedProductList.length)
        setProductList(updatedProductList);
    }

    const handleAddProduct = (value, product) => {
        if (value) {
            setProductList(
                productList.map((c, i) => {
                    if (Number(c?.productId) === Number(product?.productId)) {
                        c = { ...c, quantity: 1, isSelected: 'Y' }
                    }
                    return c
                })
            )
        } else {
            setProductList(
                productList.map((c, i) => {
                    if (Number(c?.productId) === Number(product?.productId)) {
                        c = { ...c, quantity: 0, isSelected: 'N' }
                    }
                    return c
                })
            )
        }
    }

    const handleIncreaseProduct = (product) => {
        const productData = product.productCategory === 'PC_BUNDLE' ?
            productList?.find((x) => Number(x.bundleId) === Number(product.bundleId)) :
            productList?.find((x) => Number(x.productId) === Number(product.productId))
        const productQuantity = Number(productData?.quantity) < Number(productData?.volumeAllowed) ?
            Number(productData?.quantity) + 1 :
            Number(productData?.quantity);
        console.log("increase", productData)
        if (!productData?.volumeAllowed) {
            toast.error('Cannot select the quantity more than allowed volume');
            return;
        }
        setProductList(
            productList.map((c, i) => {
                const condition = product.productCategory === 'PC_BUNDLE' ? (Number(c?.bundleId) === Number(product?.bundleId)) : (Number(c?.productId) === Number(product?.productId))
                if (condition && c.contractFlag == 'N') {
                    c = { ...c, quantity: productQuantity, isSelected: 'Y' }
                }

                if (condition && c.contractFlag == 'Y') {
                    if (!c.selectedContract || c.selectedContract.length === 0) {
                        toast.error('Please choose the contract you would like to purchase')
                    } else {
                        c = { ...c, quantity: productQuantity, isSelected: 'Y' }
                    }

                }
                return c
            })
        )
    }

    const handleDecreaseProduct = (product) => {
        const productData = product.productCategory === 'PC_BUNDLE' ? productList?.find((x) => Number(x.bundleId) === Number(product.bundleId) && x?.isSelected === 'Y') : productList?.find((x) => Number(x.productId) === Number(product.productId) && x?.isSelected === 'Y')
        const upcomingQuantity = productData?.quantity - 1;
        if (productData && !(upcomingQuantity < 0)) {
            setProductList(
                productList.map((c, i) => {
                    const condition = product.productCategory === 'PC_BUNDLE' ? (Number(c?.bundleId) === Number(product?.bundleId)) : (Number(c?.productId) === Number(product?.productId))
                    if (condition && c.contractFlag == 'N') {
                        c = { ...c, quantity: Number(productData?.quantity) - 1, isSelected: Number(productData?.quantity) - 1 === 0 ? 'N' : 'Y' }
                    }
                    if (condition && c.contractFlag == 'Y') {
                        c = { ...c, quantity: Number(productData?.quantity) - 1, isSelected: Number(productData?.quantity) - 1 === 0 ? 'N' : 'Y' }
                        c.selectedContract = Number(productData?.quantity) - 1 === 0 ? [] : c.selectedContract
                    }
                    return c
                })
            )
            const productAppointData = selectedAppointmentList?.find((x) => x.productNo === product?.productNo)
            if ((Number(productData?.quantity) - 1 === 0) && product?.isAppointRequired === 'Y' && productAppointData) {
                handleConfirmAppointment(productAppointData)
            }
        }
    }

    const handleConfirmAppointment = (data) => {
        const reqBody = {
            appointDtlId: data?.appointDtlId,
            appointAgentId: data?.appointUserId,
            customerId: data?.customerId,
            productNo: data?.productNo,
            operation: 'DELETE'
        }
        post(properties.MASTER_API + '/temp-appointment/create', { ...reqBody }).then((resp) => {
            // console.log(resp.data)
            if (resp.status === 200) {
                setSelectedAppointmentList(selectedAppointmentList.filter((x) => x.productNo !== data?.productNo))
            }
        }).catch((error) => {
            console.log(error)
        })
    }

    const handleDeleteProduct = (product) => {
        setProductList(
            productList.map((c, i) => {
                if (Number(c?.productId) === Number(product?.productId)) {
                    c = { ...c, quantity: 0, isSelected: 'N' }
                }
                return c
            })
        )
        let totalRc = 0
        let totalNrc = 0
        selectedProductList.filter((x) => Number(x?.productId) !== Number(product?.productId)).forEach((y) => {
            totalRc = totalRc + Number(y?.totalRc || 0)
            totalNrc = totalNrc + Number(y?.totalNrc || 0)
        })
        setSelectedProductList(selectedProductList.filter((x) => Number(x?.productId) !== Number(product?.productId)))
        const productAppointData = selectedAppointmentList?.find((x) => x.productNo === product?.productNo)
        if (product?.isAppointRequired === 'Y' && productAppointData) {
            handleConfirmAppointment(productAppointData)
        }
    }

    const handleInputChange = (e) => {
        const { id, value } = e.target
        // console.log(id, value)
        setOrderData({
            ...orderData, [id]: value
        })
    }

    async function generateOrder() {
        const list = [];
        let orderCreationResp
        let totalAmount = 0;
        let orderDescription = orderTypeDescription;
        const createProductObject = (productDetails, quantity, totalRc, totalNrc) => ({
            productId: parseInt(productDetails?.productId),
            productQuantity: quantity || 1,
            productAddedDate: moment().format('YYYY-MM-DD hh:mm:ss'),
            billAmount: Number(totalRc) + Number(totalNrc) || 0,
            edof: moment().format('YYYY-MM-DD'),
            productSerialNo: productDetails?.productNo,
            bundleId: null,
            isBundle: false
        });

        const baseOrderObj = {
            orderFamily: orderData.orderFamily,
            orderMode: orderData.orderMode,
            orderDescription: orderDescription ? orderDescription : 'Update Order',
            serviceType: subscriptionDetails?.srvcTypeDesc?.code,
            accountUuid: subscriptionDetails?.accountUuid,
            serviceUuid: subscriptionDetails?.serviceUuid,
            accountId: subscriptionDetails?.accountId,
            serviceId: subscriptionDetails?.serviceId,
            fulfilmentStartDate: moment(orderData?.fromDate).format('YYYY-MM-DD'),
            fulfilmentEndDate: moment(orderData?.toDate).format('YYYY-MM-DD'),
            statusReason: orderData?.reason,
            upfrontCharge: 'N',
            advanceCharge: 'N',
            product: [createProductObject(subscriptionDetails, 1, 0, 0)]
        };


        if (![statusConstantCode.orderType.signUp].includes(orderType)) {
            switch (orderType) {
                case statusConstantCode.orderType.suspension:
                    totalAmount = Number(stats?.totalOutstanding + (Number(termsAndCond?.chargeDtl?.chargeAmount) || 0)).toFixed(2);
                    baseOrderObj.rcAmount = 0;
                    baseOrderObj.nrcAmount = Number(totalAmount) || 0;
                    baseOrderObj.billAmount = Number(totalAmount) || 0
                    list.push(baseOrderObj);
                    break;

                case statusConstantCode.orderType.reconnect:
                    totalAmount = subscriptionDetails?.productDetails?.[0]?.productChargesList.reduce((total, charge) => total + Number(charge.chargeAmount), 0);
                    baseOrderObj.rcAmount = subscriptionDetails?.productDetails?.[0].productChargesList.reduce((total, charge) => {
                        return charge.chargeDetails.chargeCat === 'CC_RC' ? total + Number(charge.chargeAmount) : total;
                    }, 0) || 0;
                    baseOrderObj.nrcAmount = subscriptionDetails?.productDetails?.[0].productChargesList.reduce((total, charge) => {
                        return charge.chargeDetails.chargeCat === 'CC_NRC' ? total + Number(charge.chargeAmount) : total;
                    }, 0) || 0;

                    baseOrderObj.billAmount = Number(totalAmount)
                    list.push(baseOrderObj);
                    break;

                case statusConstantCode.orderType.terminate:
                    baseOrderObj.billAmount = Number(totalAmount)
                    list.push(baseOrderObj);
                    break;

                case statusConstantCode.orderType.downgrade:
                case statusConstantCode.orderType.upgrade:
                    selectedProducts.forEach(product => {
                        totalAmount += Number(product?.totalRc) + Number(product?.totalNrc);

                        const selectedContract = product?.selectedContract?.[0];
                        const selectedProductBenefits = product?.productBenefit?.find(pb => pb.contract == selectedContract);
                        const productObj = {
                            ...baseOrderObj,
                            orderDescription: `${orderTypeDescription} Order`,
                            serviceType: product?.serviceType,
                            productBenefit: selectedProductBenefits,
                            actualProductBenefit: selectedProductBenefits,
                            actualContract: selectedContract,
                            billAmount: Number(totalAmount),
                            rcAmount: product?.totalRc,
                            nrcAmount: product?.totalNrc,
                            upfrontCharge: product?.upfrontPayment ? 'Y' : 'N',
                            advanceCharge: product?.advancePayment ? 'Y' : 'N',
                            contactPreference: orderData.contactPreference ? orderData.contactPreference.filter(m => m.value).map(m => m.value) : customerDetails?.contactPreferences.map(m => m.code) || [],
                            product: [createProductObject(product, product.quantity, product?.totalRc, product?.totalNrc)]
                        };

                        if (selectedContract) {
                            productObj.product[0].contract = Number(selectedContract);
                            list.push(productObj);
                        } else {
                            list.push(productObj);
                        }
                    });
                    break;
                default:
                    break;
            }

            const orderObj = {
                customerUuid: subscriptionDetails?.customerUuid,
                orderDescription: orderDescription ? orderDescription : 'Update Order',
                orderCategory: orderData.orderCategory || 'OC_E',
                orderSource: orderData.orderSource || 'CC',
                orderType: orderType,
                orderChannel: orderData.orderChannel || "WEB",
                orderFamily: orderData.orderFamily || 'OF_LGC',
                orderMode: orderData.orderMode || 'OFFLINE',
                agreementDetail: agreementDetail,
                contactPreference: orderData?.contactPreference ? orderData?.contactPreference?.filter(m => m.value).map(m => m.value) : customerDetails?.contactPreferences.map(m => m.code) || [],
                orderPriority: orderData.priority || 'PRTYMED',
                billAmount: Number(totalAmount) || 0,
                order: list,
            };

            try {
                orderCreationResp = await post(properties.ORDER_API + '/create', orderObj);
                if (orderCreationResp.data && orderCreationResp.status === 200) {
                    setOrderNo(orderCreationResp?.data?.orderId);
                    setActiveTab(3);
                } else {
                    toast.error("Failed to create - " + orderCreationResp.status);
                }
            } catch (error) {
                console.error(error);
            }
        } else {
            const serviceCreateList = []
            selectedProducts.forEach(x => {
                totalAmount += Number(x?.totalRc) + Number(x?.totalNrc);

                const selectedContract = x?.selectedContract?.[0];
                const selectedProductBenefits = x?.productBenefit?.find(pb => pb.contract == selectedContract);
                const details = []
                if (x.productCategory === 'PC_BUNDLE') {
                    for (const pb of x?.productBundleDtl) {
                        details.push({
                            action: 'ADD',
                            serviceName: pb?.productDtl.productName,
                            serviceCategory: pb?.productDtl.productSubType,
                            serviceType: pb?.productDtl.serviceType,
                            planPayload: {
                                productId: pb?.productDtl.productId,
                                productUuid: pb?.productDtl.productUuid,
                                bundleId: x.bundleId,
                                contract: x.selectedContract?.[0] || 0,
                                actualContract: x.oldSelectedContract ? x.oldSelectedContract?.[0] : x.selectedContract?.[0] || 0,
                                productBenefit: pb?.productDtl.productBenefit?.[0] || null,
                                actualProductBenefit: pb?.productDtl.oldProductBenefit?.[0] ? pb?.productDtl.oldProductBenefit?.[0] : pb?.productDtl.productBenefit?.[0] || null,
                                upfrontCharge: x?.upfrontCharge,
                                advanceCharge: x?.advanceCharge,
                            },
                            // serviceAgreement: serviceAgreement ? serviceAgreement : undefined,
                            serviceClass: pb?.productDtl.productClass,
                            quantity: String(x?.quantity),
                            customerUuid: customerDetails?.customerUuid,
                            currency: pb.currency ? pb.currency : accountData?.currency?.code ? accountData?.currency?.code : accountData?.currency,
                            billLanguage: (accountData?.billLanguage.code ? accountData?.billLanguage.code : accountData?.billLanguage) || "BLENG"
                        })
                    }
                } else {
                    details.push({
                        action: "ADD",
                        serviceName: x?.productName,
                        serviceCategory: x?.productSubType,
                        serviceType: x?.serviceType,
                        planPayload: {
                            productId: x?.productId,
                            productUuid: x?.productUuid,
                            contract: selectedContract,
                            actualContract: selectedContract,
                            promoContract: x.promoContract ? x.promoContract : 0,
                            promoCode: x.promoCode || [],
                            productBenefit: selectedProductBenefits,
                            promoBenefit: x.promoBenefit || null,
                            actualProductBenefit: selectedProductBenefits,
                            upfrontCharge: x?.upfrontCharge,
                            advanceCharge: x?.advanceCharge,
                        },
                        serviceClass: x?.produtClass,
                        quantity: String(x?.quantity),
                        customerUuid: customerDetails?.customerUuid,
                        currency: x.currency ? x.currency : accountData?.currency?.code ? accountData?.currency?.code : accountData?.currency,
                        billLanguage: (accountData?.billLanguage?.code ? accountData?.billLanguage?.code : accountData?.billLanguage) || "BLENG"
                    })
                }
                serviceCreateList.push({ details: details })
            })
            const requestBody = {
                service: serviceCreateList
            }
            // console.log(requestBody)
            post(properties.ACCOUNT_DETAILS_API + '/service/create', requestBody)
                .then(async (resp) => {
                    if (resp.data) {
                        if (resp.status === 200) {
                            resp?.data?.map((x) => {
                                const productData = selectedProducts?.find((y) => y.productUuid === x.service.productUuid)
                                x.quantity = String(productData?.quantity)
                                return x
                            })
                            setServiceData({
                                ...serviceData,
                                serviceUuid: resp?.data
                            })
                            const postpaidAccountData = selectedProducts?.find((y) => y.productType === 'PT_POSTPAID')
                            if (postpaidAccountData) {
                                const accountInfo = resp?.data?.find((x) => x.service.productUuid === postpaidAccountData.productUuid)
                                const accountCategoryInfo = serviceTypeLookup?.find((x) => x.code === 'PT_POSTPAID')
                                setAccountData({
                                    ...accountData,
                                    accountId: accountInfo?.account?.accountId,
                                    accountNo: accountInfo?.account?.accountNo,
                                    accountUuid: accountInfo?.account?.accountUuid,
                                    contactNo: accountInfo?.account?.contactNo,
                                    addressNo: accountInfo?.account?.addressNo,
                                    productType: postpaidAccountData?.productType,
                                    accountCategory: accountCategoryInfo?.mapping?.accountCategory,
                                    accountType: customerDetails.customerCatDesc?.code === 'REG' ? 'AT_RES' : 'AT_BUSS'
                                })
                            }
                            const serviceUpdateList = []
                            let serviceDet

                            selectedProducts.forEach((x) => {
                                const productData = resp?.data?.find((y) => {
                                    if (x.productCategory !== "PC_BUNDLE") {
                                        if (y?.service?.productUuid && y?.service?.productUuid === x.productUuid) {
                                            return y;
                                        }
                                    }
                                })
                                const bundleData = resp?.data?.map((y) => {
                                    if (x.productCategory === "PC_BUNDLE") {
                                        const productUuids = []
                                        x.productBundleDtl.filter(f => productUuids.push(f.productDtl.productUuid));
                                        // console.log('productUuidsproductUuids', productUuids)
                                        if (productUuids.includes(y?.service?.productUuid)) {
                                            return y;
                                        }
                                    }
                                })

                                const hasRealValues = bundleData && bundleData.length > 0 && bundleData.some(item => item !== null && item !== undefined && item !== '');
                                // console.log('hasRealValues=====',hasRealValues)
                                const serviceObject = {}
                                const details = []
                                if (x.productCategory === 'PC_BUNDLE') {
                                    for (const pb of x?.productBundleDtl) {
                                        serviceDet = resp?.data?.find((y) => y?.service?.productUuid === pb.productDtl?.productUuid)

                                        details.push({
                                            action: hasRealValues ? 'UPDATE' : 'ADD',
                                            serviceName: pb?.productDtl.productName,
                                            serviceCategory: pb?.productDtl.productSubType,
                                            serviceType: pb?.productDtl.serviceType,
                                            planPayload: {
                                                productId: pb?.productDtl.productId,
                                                productUuid: pb?.productDtl.productUuid,
                                                bundleId: x.bundleId,
                                                contract: x.selectedContract?.[0] || 0,
                                                actualContract: x.oldSelectedContract ? x.oldSelectedContract?.[0] : x.selectedContract?.[0] || 0,
                                                productBenefit: pb?.productDtl.productBenefit?.[0] || null,
                                                actualProductBenefit: pb?.productDtl.oldProductBenefit?.[0] ? pb?.productDtl.oldProductBenefit?.[0] : pb?.productDtl.productBenefit?.[0] || null,
                                                upfrontCharge: x?.upfrontCharge,
                                                advanceCharge: x?.advanceCharge,
                                            },
                                            // serviceAgreement: serviceAgreement ? serviceAgreement : agreement,
                                            serviceClass: pb?.productDtl.productClass,
                                            quantity: String(x?.quantity),
                                            customerUuid: customerDetails?.customerUuid,
                                            currency: pb.currency ? pb.currency : accountData?.currency?.code ? accountData?.currency?.code : accountData?.currency,
                                            billLanguage: (accountData?.billLanguage?.code ? accountData?.billLanguage?.code : accountData?.billLanguage) || "BLENG",
                                            accountUuid: serviceDet?.account?.accountUuid ? serviceDet?.account?.accountUuid : serviceDet?.service?.accountUuid ? serviceDet?.service?.accountUuid : null,
                                            serviceUuid: serviceDet?.service?.serviceUuid,
                                        })
                                    }
                                    serviceObject.details = details
                                } else {
                                    serviceDet = resp?.data?.find((y) => y?.service?.productUuid === x?.productUuid)

                                    serviceObject.details = [{
                                        action: productData ? 'UPDATE' : 'ADD',
                                        serviceName: x?.productName,
                                        serviceCategory: x?.productSubType,
                                        serviceType: x?.serviceType,
                                        planPayload: {
                                            productId: x?.productId,
                                            productUuid: x?.productUuid,
                                            contract: x.selectedContract?.[0] || 0,
                                            actualContract: x.oldSelectedContract ? x.oldSelectedContract?.[0] : x.selectedContract?.[0] || 0,
                                            promoContract: x.promoContract ? x.promoContract : 0,
                                            promoCode: x.promoCode || [],
                                            productBenefit: x.productBenefit?.[0] || null,
                                            promoBenefit: x.promoBenefit || null,
                                            actualProductBenefit: x.oldProductBenefit?.[0] ? x.oldProductBenefit?.[0] : x.productBenefit?.[0] || null,
                                            upfrontCharge: x?.upfrontCharge,
                                            advanceCharge: x?.advanceCharge,
                                        },
                                        // serviceAgreement: serviceAgreement ? serviceAgreement : agreement,
                                        serviceClass: x?.productClass,
                                        quantity: String(x?.quantity),
                                        customerUuid: customerDetails?.customerUuid,
                                        currency: x.currency ? x.currency : accountData?.currency?.code ? accountData?.currency?.code : accountData?.currency,
                                        billLanguage: (accountData?.billLanguage?.code ? accountData?.billLanguage?.code : accountData?.billLanguage) || "BLENG",
                                        accountUuid: serviceDet?.account?.accountUuid ? serviceDet?.account?.accountUuid : serviceDet?.service?.accountUuid ? serviceDet?.service?.accountUuid : null,
                                        serviceUuid: serviceDet?.service?.serviceUuid,
                                    }]
                                }
                                if (orderData.serviceAddress) {
                                    serviceObject.address = {
                                        isPrimary: false,
                                        address1: orderData.serviceAddress?.address1,
                                        address2: orderData.serviceAddress?.address1,
                                        address3: orderData.serviceAddress?.address1,
                                        city: orderData.serviceAddress?.city,
                                        district: orderData.serviceAddress?.district,
                                        state: orderData.serviceAddress?.state,
                                        postcode: orderData.serviceAddress?.postcode,
                                        latitude: orderData.serviceAddress?.latitude,
                                        longitude: orderData.serviceAddress?.longitude,
                                        country: orderData.serviceAddress?.country
                                    }
                                }
                                serviceUpdateList.push(serviceObject)
                            })

                            const requestBody = {
                                service: serviceUpdateList
                            }
                            console.log('requestBody ', requestBody)
                            // return
                            put(properties.ACCOUNT_DETAILS_API + '/service/update', requestBody)
                                .then(async (resp) => {
                                    if (resp.data) {
                                        if (resp.status === 200) {

                                            selectedProducts.forEach((x) => {
                                                // console.log('x is=========================>', x)           

                                                if (x.productCategory === 'PC_BUNDLE') {
                                                    for (const prod of x.productBundleDtl) {
                                                        let prodRrcAmount = 0, prodNrcAmount = 0

                                                        prodRrcAmount = prod.charges.reduce((total, charge) => charge.chargeType === 'CC_RC' ? (total + Number(charge.chargeAmount)) : total, 0);
                                                        prodNrcAmount = prod.charges.reduce((total, charge) => charge.chargeType === 'CC_NRC' ? (total + Number(charge.chargeAmount)) : total, 0);
                                                        const serviceDet = resp?.data?.find((y) => y?.service?.productUuid === prod.productDtl?.productUuid)
                                                        let ordeReqObj = {
                                                            orderFamily: orderData?.orderFamily,
                                                            orderMode: orderData?.orderMode,
                                                            billAmount: x?.isSplitOrder ? (Number(prodRrcAmount) + Number(prodNrcAmount)) : (Number(x?.totalRc) + Number(x?.totalNrc)),
                                                            orderDescription: prod.productDtl?.serviceTypeDescription?.description || "Bundle Order Signup",
                                                            serviceType: prod.productDtl?.serviceType,
                                                            accountUuid: serviceDet?.account?.accountUuid || serviceDet?.service?.accountUuid,
                                                            serviceUuid: serviceDet?.service?.serviceUuid,
                                                            serviceId: serviceDet?.service?.serviceId,
                                                            //orderDeliveryMode: "SPT_HOME",
                                                            rcAmount: x?.isSplitOrder ? prodRrcAmount : x?.totalRc,
                                                            nrcAmount: x?.isSplitOrder ? prodNrcAmount : x?.totalNrc,
                                                            upfrontCharge: x?.upfrontCharge,
                                                            advanceCharge: x?.advanceCharge,
                                                            isSplitOrder: x?.isSplitOrder,
                                                            isBundle: true,
                                                            contactPreference: customerDetails?.contactPreferences.filter(m => m.value).map(m => m.value) || ["CNT_PREF_EMAIL"]
                                                        }
                                                        // console.log('oldProductData for bundle===================>', oldProductData)                   

                                                        if (x?.selectedContract && Array.isArray(x?.selectedContract) && !isEmpty(x?.selectedContract)) {
                                                            for (const contract of x?.selectedContract) {
                                                                ordeReqObj.product = [{
                                                                    productId: Number(prod.productDtl?.productId),
                                                                    productQuantity: Number(x.quantity),
                                                                    productAddedDate: moment().format('YYYY-MM-DD hh:mm:ss'),
                                                                    billAmount: Number(prodRrcAmount) + Number(prodNrcAmount),
                                                                    edof: moment().format('YYYY-MM-DD'),
                                                                    productSerialNo: prod.productDtl?.productNo,
                                                                    contract: Number(contract),
                                                                    bundleId: Number(x?.bundleId),
                                                                    rcAmount: prodRrcAmount,
                                                                    nrcAmount: prodNrcAmount
                                                                }]
                                                                // console.log('ordeReqObjordeReqObjordeReqObjordeReqObj', ordeReqObj)
                                                                list.push(ordeReqObj)
                                                            }
                                                        } else {
                                                            ordeReqObj.product = [{
                                                                productId: Number(prod.productDtl?.productId),
                                                                productQuantity: Number(x.quantity),
                                                                productAddedDate: moment().format('YYYY-MM-DD hh:mm:ss'),
                                                                billAmount: Number(prodRrcAmount) + Number(prodNrcAmount),
                                                                edof: moment().format('YYYY-MM-DD'),
                                                                productSerialNo: prod.productDtl?.productNo,
                                                                contract: 0,
                                                                bundleId: Number(x?.bundleId),
                                                                rcAmount: prodRrcAmount,
                                                                nrcAmount: prodNrcAmount
                                                            }]
                                                            list.push(ordeReqObj)
                                                        }

                                                    }
                                                } else {
                                                    let ordeReqObj = {
                                                        orderFamily: orderData?.orderFamily,
                                                        orderMode: orderData?.orderMode,
                                                        billAmount: Number(x?.totalRc) + Number(x?.totalNrc),
                                                        orderDescription: x?.serviceTypeDescription?.description || "New Sign up Order",
                                                        serviceType: x?.serviceType,
                                                        accountUuid: serviceDet?.account?.accountUuid ? serviceDet?.account?.accountUuid : serviceDet?.service?.accountUuid ? serviceDet?.service?.accountUuid : null,
                                                        serviceUuid: serviceDet?.service?.serviceUuid ? serviceDet?.service?.serviceUuid : serviceData.serviceUuid,
                                                        serviceId: serviceDet?.service?.serviceId,
                                                        //orderDeliveryMode: "SPT_HOME",
                                                        rcAmount: x?.totalRc,
                                                        nrcAmount: x?.totalNrc,
                                                        isBundle: false,
                                                        isSplitOrder: true,
                                                        upfrontCharge: x?.upfrontCharge,
                                                        advanceCharge: x?.advanceCharge,
                                                        contactPreference: customerDetails?.contactPreferences ? customerDetails?.contactPreferences?.filter(m => m.value).map(m => m.value) : ["CNT_PREF_EMAIL"],
                                                        product: [{
                                                            productId: Number(x?.productId),
                                                            productQuantity: Number(x.quantity),
                                                            productAddedDate: moment().format('YYYY-MM-DD hh:mm:ss'),
                                                            billAmount: Number(x?.totalRc) + Number(x?.totalNrc),
                                                            edof: moment().format('YYYY-MM-DD'),
                                                            productSerialNo: x?.productNo,
                                                            bundleId: null,
                                                            rcAmount: x?.totalRc,
                                                            nrcAmount: x?.totalNrc
                                                        }]
                                                    }
                                                    if (x?.selectedContract && Array.isArray(x?.selectedContract)) {
                                                        for (const contract of x?.selectedContract) {
                                                            ordeReqObj.product[0].contract = Number(contract)

                                                            list.push(ordeReqObj)
                                                        }
                                                    } else {
                                                        list.push(ordeReqObj)
                                                    }
                                                }
                                            })
                                            const orderObj = {
                                                customerUuid: subscriptionDetails?.customerUuid,
                                                orderCategory: orderData.orderCategory || 'OC_N',
                                                orderSource: orderData.orderSource || 'CC',
                                                orderType: orderType,
                                                orderChannel: orderData.orderChannel || "WEB",
                                                orderFamily: orderData.orderFamily || 'OF_LGC',
                                                orderMode: orderData.orderMode || 'OFFLINE',
                                                agreementDetail: agreementDetail,
                                                contactPreference: orderData.contactPreference.filter(m => m.value).map(m => m.value) || [],
                                                orderPriority: orderData.priority || 'PRTYMED',
                                                billAmount: Number(totalAmount) || 0,
                                                orderDescription: orderDescription ? orderDescription : 'New Order',
                                                order: list,
                                            };
                                            try {
                                                orderCreationResp = await post(properties.ORDER_API + '/create', orderObj);
                                                if (orderCreationResp.data && orderCreationResp.status === 200) {
                                                    setOrderNo(orderCreationResp?.data?.orderId);
                                                    setActiveTab(3);
                                                } else {
                                                    toast.error("Failed to create - " + orderCreationResp.status);
                                                }
                                            } catch (error) {
                                                console.error(error);
                                            }
                                        } else {
                                            toast.error("Failed to create - " + orderCreationResp.status);
                                        }
                                    }
                                })
                        }
                    }
                })
                .catch((error) => {
                    console.error(error)
                })
                .finally();
        }
        return orderCreationResp
    }

    const handleSubmit = async () => {
        // let error = validate(validationSchema, orderData);
        // if (error) {
        //     toast.error("Validation errors found. Please check all fields");
        //     return false
        // }
        if ([statusConstantCode.orderType.suspension, statusConstantCode.orderType.downgrade, statusConstantCode.orderType.upgrade].includes(orderType) && subscriptionDetails?.serviceStatus.code !== statusConstantCode.status.SERVICE_ACTIVE) {
            toast.error(`The service is not in Active state.`);
            return;
        }

        if (orderType === statusConstantCode.orderType.reconnect && subscriptionDetails?.serviceStatus.code !== statusConstantCode.status.SERVICE_TOS) {
            toast.error(`The service is not in TOS state`);
            return;
        }

        const openOrders = await post(`${properties.ORDER_API}/search?limit=1&page=0`, { searchParams: { serviceUuid: subscriptionDetails?.serviceUuid, orderType: orderType } })
        if (openOrders?.data && openOrders?.data?.row?.length > 0) {
            const isOpen = openOrders?.data?.row.filter(f => f.orderStatus.code !== statusConstantCode.status.ORDER_CLOSED)
            if (isOpen.length > 0) {
                toast.error(`There is an existing open order ${isOpen?.[0].orderNo} with the same Order Type. Kindly close the order before creating new one.`);
                return;
            }
        }

        await generateOrder();

    }

    const contextData = {
        data: {
            appsConfig, orderType, customerDetails,
            productDetails, productBenefitLookup, totalOutstanding, interactionTerminationData: null,
            selectedAppointmentList, productList, serviceDetails: subscriptionDetails, orderData,
            selectedProducts, termsAndCond, addressList, addressError, screenSource, openOrders,
            openTermsAndCondition, orderNo, activeTab, refresh, agreementDetail, error, sigPad,
            productCategory, originalProductList
        },
        handler: {
            setIsManageServicesOpen: () => { },
            handleDeleteProduct, handleConfirmAppointment, handleAddProduct, handleIncreaseProduct,
            pageRefresh: () => { }, handleDecreaseProduct, setSelectedAppointmentList,
            setProductList, handleManualProductChange, setSelectedProducts, setTermsAndCond, setOrderData,
            setAddressError, setAddressList, handleInputChange, setOpenTermsAndCondition, setActiveTab,
            setRefresh, setAgreementDetail, getNRCChargeAmount, getRCChargeAmount, clearSignature, handleSubmit,
            setProductCategory, setOriginalProductList
        }

    }

    return (
        orderType && <CreateOrderContext.Provider value={contextData}>
            <div>
                {orderType === statusConstantCode.orderType.signUp && (
                    <>
                        {/* Signup Flow */}
                        <SignUpTab />
                    </>
                )}
            </div>
            <div>
                {[statusConstantCode.orderType.upgrade].includes(orderType) && (
                    <>
                        {/* Upgrade/Downgrade Flow */}
                        <UpgradeDowngradeTabPane />
                    </>
                )}
            </div>
            <div>
                {[statusConstantCode.orderType.downgrade].includes(orderType) && (
                    <>
                        {/* Upgrade/Downgrade Flow */}
                        <UpgradeDowngradeTabPane />
                    </>
                )}
            </div>
            <div>
                {orderType === statusConstantCode.orderType.suspension && (
                    <>
                        {/* TOS/Suspend Flow */}
                        <SuspendTabPane />
                    </>
                )}
            </div>
            <div>
                {orderType === statusConstantCode.orderType.reconnect && (
                    <>
                        {/* Unbar Flow */}
                        <ReconnectTabPane />
                    </>
                )}
            </div>
            <div>
                {orderType === statusConstantCode.orderType.terminate && (
                    <>
                        {/* Termination Flow */}
                        <TerminateTabPane />
                    </>
                )}
            </div>

            {
                enableOrderForm && screenSource === 'CREATE_ORDER' &&
                <>
                    <hr className="cmmn-hline mt-3" />
                    <CreateOrderForm />
                </>
            }

            {orderType && !disableButtons && <div className="skel-btn-center-cmmn mt-2 mb-2">
                <button
                    className={activeTab === 3 ? 'd-none' : "skel-btn-cancel"}
                    onClick={() => {
                        setRefresh(!refresh)
                        setActiveTab(activeTab - 1 ?? 0);
                    }}
                    disabled={activeTab === 0}
                >
                    Previous
                </button>
                <button
                    className={activeTab === 3 ? 'd-none' : "skel-btn-submit"}
                    onClick={handleNextTab}
                    disabled={activeTab === 3}
                >
                    {activeTab === 2 ? "Submit" : "Continue"}
                </button>
            </div>}
        </CreateOrderContext.Provider>
    );
}

export default OrderManagement;