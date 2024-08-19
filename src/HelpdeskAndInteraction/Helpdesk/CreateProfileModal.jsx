import React, { useEffect, useState, useCallback, useContext } from "react";
import Modal from "react-modal";

import { post, get, put } from "../../common/util/restUtil";
import { properties } from "../../properties";
import { RegularModalCustomStyles } from "../../common/util/util";
import { unstable_batchedUpdates } from "react-dom";
import { toast } from "react-toastify";
import { object, string } from "yup";
import { NumberFormatBase } from "react-number-format";
import Select from "react-select";
import { AppContext } from "../../AppContext";
import { isObjectEmpty } from "../../common/util/validateUtil";
import { statusConstantCode } from "../../AppConstants";
import { isEmpty, get as getObject } from "lodash";
import AddressComponent from "./AddressComponent";
const CreateProfileValidationSchema = object().shape({
  contactNbr: string().nullable(false).required("Contact number is required"),
});
const AddressValidationSchema = object().shape({
  addressType: string().nullable(false).required("Address Type is required"),
  address1: string().nullable(false).required("Address line one is required"),
  address2: string().nullable(false).required("Address line two is required"),
  postcode: string().nullable(false).required("Post code two is required"),
  country: string().nullable(false).required("Country is required"),
  state: string().nullable(false).required("State is required"),
  district: string().nullable(false).required("District is required"),
  city: string().nullable(false).required("City is required"),
});

const CreateProfileModal = (props) => {
  const { auth, appConfig } = useContext(AppContext);
  const { isCreateProfileOpen, detailedViewItem } = props.data;
  console.log('appConfig---------create profile----------->', appConfig?.businessSetup)
  const { setIsCreateProfileOpen, doSoftRefresh } = props.handlers;
  const [channel, setChannel] = useState();

  const [createProfileInputsErrors, setCreateProfileInputsErrors] = useState(
    {}
  );
  const [error, setError] = useState({});
  const [addressList, setAddressList] = useState([
    {
      address1: "",
      address2: "",
      address3: "",
      postcode: "",
      country: "",
      state: "",
      city: "",
      addressType: "",
      district: "",
    },
  ]);
  // const [addressList, setAddressList] = useState([{}]);
  const [countryLookup, setCountryLookup] = useState([]);
  const isExisting =
    detailedViewItem?.customerDetails &&
      !!Object.keys(detailedViewItem?.customerDetails).length
      ? true
      : false;
  // console.log('isExisting---------->', isExisting)
  const initialValues = {
    firstName: "",
    lastName: "",
    category: "",
    contactNbr: "",
    email: "",
    contactPreference: "",
    idType: "",
    idValue: "",
    searchProfile: "",
    useExistingProfile: isExisting,
    extn: "",
  };

  const [source, setSource] = useState("PARENT");
  const [readOnly, setReadOnly] = useState(false); //at the time of ncrtc we made as false
  const [createProfileInputs, setCreateProfileInputs] = useState(initialValues);
  const [categoryLookup, setCategoryLookup] = useState([]);
  const [contactPreferenceLookup, setContactPreferenceLookup] = useState([]);
  const [idTypeLookup, setIdTypeLookup] = useState([]);
  const [project, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedMappingProjects, setSelectedMappingProjects] = useState();
  const [mappedExtn, setMappedExtn] = useState([]);
  const [phoneNolength, setPhoneNolength] = useState();
  const [phoneNoPrefix, setPhoneNoPrefix] = useState([]);
  const [addressTypeLookup, setAddressTypeLookup] = useState([]);
  const [isAddressRequried, setisAddressRequried] = useState(false);

  const [isChecked, setIschecked] = useState(false);

  const getLookupData = useCallback(() => {
    get(
      properties.MASTER_API +
      "/lookup?searchParam=code_type&valueParam=CUSTOMER_CATEGORY,CONTACT_PREFERENCE,CUSTOMER_ID_TYPE,PROJECT,COUNTRY,ADDRESS_TYPE"
    )
      .then((response) => {
        const { data } = response;
        const contactPreferenceOptions = data?.CONTACT_PREFERENCE.map(
          (preference) => {
            return {
              value: preference.code,
              label: preference.description,
            };
          }
        );

        let projectOptions = data?.PROJECT?.filter((f) =>
          f.mapping?.department?.includes(auth?.currDeptId)
        ).map((p) => ({ label: p.description, value: p.code }));
        let currProjects = [];
        if (detailedViewItem?.customerDetails?.projectMapping?.length > 0) {
          let currentDeptProject =
            detailedViewItem?.customerDetails?.projectMapping?.filter(
              (f) => f?.entity === auth?.currDeptId
            );
          currProjects = projectOptions?.filter((f) =>
            currentDeptProject?.[0]?.project.includes(f?.value)
          );
        }
        // projectOptions?.forEach((p) => {
        //     // projectOptions.push({ 'label': p.description, 'value': p.code })

        //     if (detailedViewItem?.customerDetails?.projectMapping?.length > 0) {
        //         let currentDeptProject = detailedViewItem?.customerDetails?.projectMapping?.filter((f) => f?.entity === auth?.currDeptId)
        //         currentDeptProject && Array.isArray(currentDeptProject) && currentDeptProject?.length > 0 && currentDeptProject?.[0]?.project.length > 0 && currentDeptProject?.[0]?.project?.forEach((m) => {
        //             if (m === p.code) {
        //                 currProjects.push({
        //                     'label': p.description, 'value': p.code
        //                 })
        //             }
        //         })
        //     }
        // });

        unstable_batchedUpdates(() => {
          setCategoryLookup(data["CUSTOMER_CATEGORY"]);
          setContactPreferenceLookup(contactPreferenceOptions || []);
          setIdTypeLookup(data["CUSTOMER_ID_TYPE"]);
          setProjects(projectOptions || []);
          setAddressTypeLookup(data["ADDRESS_TYPE"]);

          // setCreateProfileInputs({
          //     ...createProfileInputs,
          //     projectMapping: currProjects
          // })
          const prefix = data?.COUNTRY.map((e) => {
            return {
              value: e.mapping.countryCode,
              label: "(" + e.mapping.countryCode + ") " + e.description,
              phoneNolength: e.mapping.phoneNolength,
            };
          });
          setPhoneNoPrefix(prefix);
          const prefix1 = data?.COUNTRY.map((e) => {
            return {
              code: e.description,
              description: "(" + e.mapping.countryCode + ") " + e.description,
            };
          });
          setCountryLookup(prefix1);
          setSelectedMappingProjects(currProjects);
        });
      })
      .catch((error) => {
        console.error(error);
      })
      .finally();
  }, []);

  useEffect(() => {
    getLookupData();
  }, [getLookupData]);

  useEffect(() => {
    // console.log('CreateProfileModal.useEffect', detailedViewItem)
    unstable_batchedUpdates(() => {
      setChannel(detailedViewItem?.customerDetails?.source);
      const contactPreferences =
        detailedViewItem?.customerDetails?.contactPreferences?.map((e) => {
          return {
            label: e.description,
            value: e.code,
          };
        });

      setCreateProfileInputs({
        // firstName: (detailedViewItem?.customerDetails?.customer?.fullName) ? detailedViewItem?.customerDetails?.customer?.fullName : (detailedViewItem?.name) ? detailedViewItem?.name : detailedViewItem?.customerName,
        firstName:
          (detailedViewItem?.customerDetails?.firstName || "") +
          " " +
          (detailedViewItem?.customerDetails?.lastName || ""),
        category: detailedViewItem?.customerDetails?.profileCategory?.code,
        extn: detailedViewItem?.customerDetails?.contactDetails?.mobilePrefix
          ? detailedViewItem?.customerDetails?.contactDetails?.mobilePrefix
          : detailedViewItem?.mobilePrefix,
        contactNbr: detailedViewItem?.customerDetails?.contactDetails?.mobileNo
          ? detailedViewItem?.customerDetails?.contactDetails?.mobileNo
          : detailedViewItem?.contactNo,
        // email: detailedViewItem?.email ?? detailedViewItem?.emailId ?? detailedViewItem?.mailId ?? detailedViewItem?.customerDetails?.contactDetails?.emailId,
        email:
          (detailedViewItem?.customerDetails?.contactDetails?.emailId
            ? detailedViewItem?.customerDetails?.contactDetails?.emailId
            : detailedViewItem?.email) || detailedViewItem?.mailId, //detailedViewItem?.email || detailedViewItem?.emailId || detailedViewItem?.mailId || "",
        contactPreference: contactPreferences,
        idType: detailedViewItem?.customerDetails?.idType?.code || null,
        idValue: detailedViewItem?.customerDetails?.idValue || null,
        customerId: detailedViewItem?.customerDetails?.profileId,
        contactId: detailedViewItem?.contactId,
        searchProfile: "",
        useExistingProfile: isExisting,
      });
      // Address value field
      let {
        address1,
        address2,
        address3,
        postcode,
        country,
        state,
        city,
        addressNo,
        district,
        addressType = "",
      } = getObject(detailedViewItem, "customerDetails.profileAddress", {}),
        valueObj = {
          address1,
          address2,
          address3,
          postcode,
          country,
          state,
          city,
          addressNo,
          addressType: addressType?.code ?? "",
          district,
        };
      for (let key of Object.keys(valueObj)) {
        if (valueObj[key]) {
          setisAddressRequried(true);
          break;
        }
      }
      setAddressList([valueObj]);
      setReadOnly(isExisting);
    });
  }, []);

  useEffect(() => {
    if (selectedMappingProjects && Array.isArray(selectedMappingProjects)) {
      unstable_batchedUpdates(() => {
        setCreateProfileInputs({
          ...createProfileInputs,
          projectMapping: selectedMappingProjects,
        });
      });
    }
  }, [selectedMappingProjects]);

  const validate = (schema, data, address) => {
    try {
      setCreateProfileInputsErrors({});
      if (address) setError({});
      schema.validateSync(data, { abortEarly: false });
    } catch (e) {
      // Address Component Validation
      if (address) {
        e.inner.forEach((err) => {
          setError((prevState) => {
            return { ...prevState, [err.params.path]: err.message };
          });
        });
        // End
      } else {
        e.inner.forEach((err) => {
          setCreateProfileInputsErrors((prevState) => {
            return { ...prevState, [err.params.path]: err.message };
          });
        });
      }

      return e;
    }
  };

  const handleOnCreateProfileInputsChange = (e) => {
    const { target } = e;
    // console.log("target.value ---------->", target?.value)
    if (target.id === "contactPreference" || target.id === "projectMapping") {
      // Handle multi-select inputs
      const selectedOptions = target?.value.map((option) => ({
        value: option?.value,
        label: option?.label,
      }));
      setCreateProfileInputs({
        ...createProfileInputs,
        [target.id]: selectedOptions,
      });
      //   setIschecked(!isChecked);
    } else {
      // console.log('createProfileInputs--------->', createProfileInputs)
      // console.log('vvvv--------->', {
      //     ...createProfileInputs,
      //     [target.id]: target?.id === 'useExistingProfile' ? !createProfileInputs?.useExistingProfile : target?.value
      // })

      if (target.id === "useExistingProfile") {

        console.log(createProfileInputs, target?.checked, target.id);
        createProfileInputs?.useExistingProfile ?
          setCreateProfileInputs((prev) => {
            return {
              ...prev,
              [target.id]: target.checked,
              setIschecked,
              "searchProfile": ""
            }
          }) :
          setCreateProfileInputs((prev) => {
            return {
              ...prev,
              [target.id]: target.checked,
              setIschecked
            }
          });

      } else {
        setCreateProfileInputs({
          ...createProfileInputs,
          [target.id]: target?.value,
          setIschecked
        });
      }
    }
  };
  useEffect(() => { console.log(createProfileInputs) }, [createProfileInputs]);
  const createCustomer = () => {
    const mappedProjects = [];

    if (!isObjectEmpty(createProfileInputs?.projectMapping)) {
      let projectArray = [];
      createProfileInputs?.projectMapping.forEach((f) => {
        projectArray.push(f.value);
      });
      mappedProjects.push({
        entity: auth?.currDeptId,
        project: projectArray,
      });
    }

    const requestBody = {
      firstName:
        detailedViewItem?.customerDetails?.firstName ||
        createProfileInputs?.firstName,
      lastName:
        detailedViewItem?.customerDetails?.lastName ||
        createProfileInputs?.firstName,
      idType: createProfileInputs?.idType || null,
      idValue: createProfileInputs?.idValue || null,
      contactPreferences: createProfileInputs?.contactPreference?.map(
        (option) => option.value
      ),
      projectMapping: mappedProjects,
      helpdeskNo: detailedViewItem?.helpdeskNo || null,
      profileCategory: createProfileInputs?.category,
      contact: {
        isPrimary: true,
        firstName:
          detailedViewItem?.customerDetails?.firstName ||
          createProfileInputs?.firstName,
        lastName:
          detailedViewItem?.customerDetails?.lastName ||
          createProfileInputs?.firstName,
        contactType: "CNTMOB",
        emailId: createProfileInputs?.email,
        mobilePrefix: createProfileInputs?.extn || "+673",
        mobileNo: createProfileInputs?.contactNbr,
      },
    };
    if (
      isAddressRequried &&
      addressList &&
      addressList.length > 0 &&
      Object.keys(addressList[0]).length
    ) {
      for (let key of Object.keys(addressList[0])) {
        let value = addressList[0][key];
        if (value) {
          requestBody.address = {
            ...requestBody.address,
            isPrimary: true,
            [key]: value,
          };
        }
      }
    }

    if (appConfig?.businessSetup?.includes('CUSTOMER_SERVICES')) {
      // Customer Creation
      let reqPayload = {
        details: {
          firstName: requestBody?.firstName,
          customerCategory: createProfileInputs?.category,
          contactPreferences: requestBody?.contactPreferences,
          status: "CS_ACTIVE",
          source: "CREATE_INTERACTION",
          projectMapping: mappedProjects,
          contactPayload: {
            mobileNo: requestBody?.contact?.mobileNo,
            emailId: requestBody?.contact?.emailId,
            contactType: requestBody?.contact?.contactType,
            mobilePrefix: requestBody?.contact?.mobilePrefix,
            whatsappNo: requestBody?.contact?.whatsappNo,
            whatsappNoPrefix: requestBody?.contact?.mobilePrefix,
            helpdeskNo: detailedViewItem?.helpdeskNo
          }
        },
      }
      post(properties.CUSTOMER_API + '/create', reqPayload)
        .then((response) => {
          const { status, message } = response;
          if (status === 200) {
            handleOnCancel();
            detailedViewItem?.helpdeskId !== undefined ?
              handleRefresh()
              :
              doSoftRefresh('UPDATE_CUSTOMER_DETAILS_CHAT', detailedViewItem?.chatId)
            toast.success(message);
          }
        })
        .catch(error => {
          console.error(error);
        })
        .finally()
    } else {
      // Profile Creation
      post(properties.PROFILE_API + "/create", requestBody)
        .then((response) => {
          const {
            status,
            message,
            data: { profileNo },
          } = response;
          console.log("response", response);
          if (status === 200) {
            handleOnCancel();
            detailedViewItem?.helpdeskId !== undefined
              ? handleRefresh()
              : doSoftRefresh(
                "UPDATE_CUSTOMER_DETAILS_CHAT",
                detailedViewItem?.chatId
              );
            toast.success(message);
            if (profileNo) toast.success(`Your profile ID is {${profileNo}}`);
          }
        })
        .catch((error) => {
          console.error(error);
        })
        .finally();
    }
  };

  const handleRefresh = () => {
    doSoftRefresh(
      "UPDATE_CUSTOMER_DETAILS",
      detailedViewItem?.helpdeskId,
      detailedViewItem?.currUser ? "ASSIGNED" : "QUEUE"
    );
    doSoftRefresh("UPDATE_DETAILED_VIEW", detailedViewItem?.helpdeskId);
  };

  const updateCustomer = () => {
    if (createProfileInputs?.searchProfile) {
      // helpdesk map
      const reqBody = {
        profileNo: createProfileInputs?.profileNo,
        contactId: createProfileInputs?.contactId,
        profileType: channel,
      };
      put(
        `${properties.HELPDESK_API}/map/${detailedViewItem?.helpdeskNo}`,
        reqBody
      )
        .then((resp) => {
          if (resp.status === 200) {
            handleOnCancel();
            detailedViewItem?.helpdeskId !== undefined
              ? handleRefresh()
              : // doSoftRefresh('UPDATE_CUSTOMER_DETAILS', detailedViewItem?.helpdeskId, detailedViewItem?.currUser ? 'ASSIGNED' : 'QUEUE')
              doSoftRefresh(
                "UPDATE_CUSTOMER_DETAILS_CHAT",
                detailedViewItem?.chatId
              );
            toast.message(resp.message);
          }
        })
        .catch((error) => {
          console.log(error);
        })
        .finally();
    } else {
      let mappedProjects = [];
      if (!isObjectEmpty(createProfileInputs?.projectMapping)) {
        let projectArray = [];
        createProfileInputs?.projectMapping.forEach((f) => {
          projectArray.push(f.value);
        });

        if (
          detailedViewItem?.customerDetails?.projectMapping &&
          Array.isArray(detailedViewItem?.customerDetails?.projectMapping)
        ) {
          mappedProjects =
            (detailedViewItem?.customerDetails?.projectMapping &&
              detailedViewItem?.customerDetails?.projectMapping?.filter(
                (f) => f.entity !== auth.currDeptId
              )) ||
            [];
        }
        mappedProjects.push({
          entity: auth?.currDeptId,
          project: projectArray,
        });
      }
      if (
        channel === statusConstantCode?.entityCategory?.CUSTOMER &&
        !detailedViewItem?.customerDetails?.profileUuid &&
        !createProfileInputs?.profileUuid
      ) {
        toast.warn("Profile Uid is not found");
        return false;
      }

      let requestBody = {};

      if (channel === statusConstantCode?.entityCategory?.PROFILE) {
        requestBody = {
          profileNo:
            detailedViewItem?.customerDetails?.profileNo ||
            createProfileInputs?.profileNo,
          firstName:
            detailedViewItem?.customerDetails?.firstName ||
            createProfileInputs?.firstName,
          lastName:
            detailedViewItem?.customerDetails?.lastName ||
            createProfileInputs?.lastName,
          idType: createProfileInputs?.idType || null,
          idValue: createProfileInputs?.idValue || null,
          projectMapping: mappedProjects,
          contactPreferences: createProfileInputs?.contactPreference?.map(
            (option) => option.value
          ),
          contact: {
            isPrimary: false,
            firstName:
              detailedViewItem?.customerDetails?.firstName ||
              createProfileInputs?.firstName,
            contactType:
              detailedViewItem?.customerDetails?.contactDetails?.contactType
                ?.code || createProfileInputs?.contactType,
            lastName:
              detailedViewItem?.customerDetails?.lastName ||
              createProfileInputs?.lastName,
            emailId: createProfileInputs?.email,
            mobilePrefix:
              detailedViewItem?.customerDetails?.contactDetails?.mobilePrefix ||
              createProfileInputs?.mobilePrefix,
            mobileNo: createProfileInputs?.contactNbr,
            contactNo:
              detailedViewItem?.customerDetails?.contactDetails?.contactNo ||
              createProfileInputs?.contactNbr,
          },
        };
        if (
          isAddressRequried &&
          addressList &&
          addressList.length > 0 &&
          Object.keys(addressList[0]).length
        ) {
          for (let key of Object.keys(addressList[0])) {
            let value = addressList[0][key];
            if (value) {
              requestBody.address = {
                ...requestBody.address,
                isPrimary: true,
                [key]: value,
              };
            }
          }
        }
      } else {
        requestBody = {
          details: {
            customerNo:
              detailedViewItem?.customerDetails?.profileNo ||
              createProfileInputs?.profileNo,
            firstName:
              detailedViewItem?.customerDetails?.firstName ||
              createProfileInputs?.firstName,
            lastName:
              detailedViewItem?.customerDetails?.lastName ||
              createProfileInputs?.lastName,
            idType: createProfileInputs?.idType || null,
            idValue: createProfileInputs?.idValue || null,
            projectMapping: mappedProjects,
            contactPreferences: createProfileInputs?.contactPreference?.map(
              (option) => option.value
            ),
            source: "HELPDESK",
          },
          contact: {
            isPrimary: false,
            firstName:
              detailedViewItem?.customerDetails?.firstName ||
              createProfileInputs?.firstName,
            lastName:
              detailedViewItem?.customerDetails?.lastName ||
              createProfileInputs?.lastName,
            emailId: createProfileInputs?.email,
            mobilePrefix:
              detailedViewItem?.customerDetails?.contactDetails?.mobilePrefix ||
              createProfileInputs?.mobilePrefix,
            mobileNo: createProfileInputs?.contactNbr,
            contactNo:
              detailedViewItem?.customerDetails?.contactDetails?.contactNo ||
              createProfileInputs?.contactNo,
          },
        };
        if (
          isAddressRequried &&
          addressList &&
          addressList.length > 0 &&
          Object.keys(addressList[0]).length
        ) {
          for (let key of Object.keys(addressList[0])) {
            let value = addressList[0][key];
            if (value) {
              console.log(value, key);
              requestBody.address = {
                ...requestBody.address,
                isPrimary: true,
                [key]: value,
              };
            } else {
              if (requestBody.address) requestBody.address[key] = null;
            }
          }
        }
      }

      put(
        channel === statusConstantCode?.entityCategory?.PROFILE
          ? `${properties.PROFILE_API}/update`
          : `${properties.CUSTOMER_API}/${detailedViewItem?.customerDetails?.profileUuid ||
          createProfileInputs?.profileUuid
          }`,
        requestBody
      )
        .then((response) => {
          const { status, message } = response;
          if (status === 200) {
            handleOnCancel();
            handleRefresh();
            // detailedViewItem?.helpdeskId !== undefined ?
            //     doSoftRefresh('UPDATE_CUSTOMER_DETAILS', detailedViewItem?.helpdeskId, detailedViewItem?.currUser ? 'ASSIGNED' : 'QUEUE')
            //     :
            //     doSoftRefresh('UPDATE_CUSTOMER_DETAILS_CHAT', detailedViewItem?.chatId)
            toast.success(message);
          }
        })
        .catch((error) => {
          console.error(error);
        })
        .finally();
    }
  };

  const handleOnSubmit = () => {
    if (validate(CreateProfileValidationSchema, createProfileInputs)) {
      toast.error("Validation Errors Found");
      return;
    } else {
      // Address Field Validation Checking
      console.log("isAddressRequried", isAddressRequried, addressList);
      if (
        isAddressRequried &&
        addressList &&
        addressList.length > 0 &&
        Object.keys(addressList[0]).length
      ) {
        for (let key of Object.keys(addressList[0])) {
          let value = addressList[0][key];
          if (!value && key !== "address3") {
            if (validate(AddressValidationSchema, addressList[0], true)) {
              toast.error(
                "Validation Errors Found. Please provide address details"
              );
              return;
            }
            break;
          }
        }
      }
    }
    readOnly ? updateCustomer() : createCustomer();
  };

  const handleOnSearchProfile = () => {
    const validateEmail = (email) => {
      return String(email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    };

    if (isNaN(createProfileInputs.searchProfile)) {
      const email = validateEmail(createProfileInputs.searchProfile);
      if (!email) {
        toast.warn("Please provide the vaild email");
        return false;
      }
    }

    get(
      `${properties.HELPDESK_API}/profile?searchParam=${createProfileInputs.searchProfile}`
    )
      .then((response) => {
        const { status, data, message } = response;
        if (status === 200 && data && !isEmpty(data)) {
          const contactPreferences =
            data?.customerDetails?.contactPreferences?.map((e) => {
              return {
                label: e.description,
                value: e.code,
              };
            });

          let currProjects = [];
          if (data?.customerDetails?.projectMapping?.length > 0) {
            let currentDeptProject =
              data?.customerDetails?.projectMapping?.filter(
                (f) => f?.entity === auth?.currDeptId
              );
            currProjects = project?.filter(
              (f) =>
                Array.isArray(currentDeptProject?.[0]?.project) &&
                currentDeptProject?.[0]?.project?.includes(f?.value)
            );
          }

          // console.log('data', data)

          // project?.forEach((p) => {
          //     // console.log(data?.customerDetails)
          //     if (data?.customerDetails?.projectMapping?.length > 0) {
          //         currentDeptProject && Array.isArray(currentDeptProject) && currentDeptProject?.length > 0 && currentDeptProject?.[0]?.project.length > 0 &&
          //             currentDeptProject?.[0]?.project?.forEach((m) => {
          //                 if (m === p.value) {
          //                     currProjects.push({
          //                         'label': p.label, 'value': p.value
          //                     })
          //                 }
          //             })
          //     }
          // })

          unstable_batchedUpdates(() => {
            setChannel(data?.customerDetails?.source);
            setCreateProfileInputs({
              ...createProfileInputs,
              profileNo: data?.customerDetails?.profileNo,
              profileUuid: data?.customerDetails?.profileUuid,
              firstName: `${data?.customerDetails?.firstName
                ? data.customerDetails?.firstName
                : ""
                } ${data?.customerDetails?.lastName
                  ? data.customerDetails?.lastName
                  : ""
                }`,
              category: data?.customerDetails?.profileCategory?.code,
              contactNbr: data?.mobileNo,
              contactPreference: contactPreferences,
              projectMapping: currProjects,
              email: data?.email || data?.emailId || data?.mailId,
              idType: data?.customerDetails?.idType?.code || null,
              idValue: data?.customerDetails?.idValue || null,
              customerId: data?.customerDetails?.profileId,
              contactId: data?.contactId,
              useExistingProfile: false,
              contactNo: data?.contactNo,
              mobilePrefix: data?.mobilePrefix,
              lastName: data?.customerDetails?.lastName || "",
              extn: data?.mobilePrefix || "",
            });
            // Profile Address Binding
            let {
              address1,
              address2,
              address3,
              postcode,
              country,
              state,
              city,
            } = getObject(data, "customerDetails.profileAddress", {});
            setAddressList([
              { address1, address2, address3, postcode, country, state, city },
            ]);
            // End
            setSource("API");
            setReadOnly(true);
            toast.success(message);
          });
        } else {
          toast.error("No Profile Details Found");
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally();
  };

  // console.log('setCreateProfileInputs', createProfileInputs)

  const handleOnClear = () => {
    let newInitialValues = {
      ...initialValues,
      email: createProfileInputs.email,
    };
    unstable_batchedUpdates(() => {
      setReadOnly(false);
      setCreateProfileInputs(newInitialValues);
    });
  };

  const handleOnCancel = () => {
    unstable_batchedUpdates(() => {
      setIsCreateProfileOpen(!isCreateProfileOpen);
      setCreateProfileInputs(initialValues);
    });
  };
  return (
    <Modal
      isOpen={isCreateProfileOpen}
      contentLabel="Worflow History Modal"
      style={RegularModalCustomStyles}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">
              {readOnly ? "Update" : "Create"} Profile{" "}
              {detailedViewItem?.profileNo || ""}
            </h4>
            <button
              type="button"
              className="close"
              onClick={() => setIsCreateProfileOpen(!isCreateProfileOpen)}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <fieldset
              className={`scheduler-border ${readOnly ? "d-none" : ""}`}
            >
              <div className="row pt-1">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="inputState" className="col-form-label">
                      Search Profile{" "}
                    </label>
                    <div className="form-group form-inline">
                      <input
                        disabled={!createProfileInputs.useExistingProfile}
                        type="text"
                        id="searchProfile"
                        placeholder="Email / Mobile Number"
                        className="form-control"
                        value={createProfileInputs.searchProfile}
                        onChange={handleOnCreateProfileInputsChange}
                      />
                      <div className="input-group-append">
                        <button
                          disabled={!createProfileInputs.useExistingProfile}
                          className="skel-btn-submit"
                          type="button"
                          onClick={handleOnSearchProfile}
                        >
                          <i className="fe-search"></i>
                        </button>
                        <div className="form-group">
                          <div className="form-group form-inline">
                            <div className="switchToggle">
                              <input type="checkbox" disabled={readOnly} name="useExistingProfile"
                                id="useExistingProfile"
                                checked={createProfileInputs?.useExistingProfile}
                                onChange={(e) => {
                                  handleOnCreateProfileInputsChange(e);
                                  console.log(createProfileInputs);
                                }} />
                              <label htmlFor="useExistingProfile">Toggle</label>
                            </div>
                          </div>
                          &nbsp;
                          <label
                            htmlFor="inputState"
                            className="col-form-label"
                          >
                            Use Existing Profile
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
            <fieldset className="scheduler-border">
              <div className="row pl-3">
                {/* {console.log('createProfileInputs----------->', createProfileInputs)} */}
                <div className="row col-12">
                  {/* {detailedViewItem?.profileNo && <div className={(detailedViewItem?.profileNo && readOnly) ? "col-3" : "col-4"}>
                                        <div className="form-group">
                                            <label htmlFor="profileNo" className="col-form-label">Profile Id</label>
                                            <input readOnly={true} type="text" className="form-control" id="firstName" value={createProfileInputs.profileNo}/>
                                        </div>
                                    </div>} */}
                  <div className="col-4">
                    <div className="form-group">
                      <label htmlFor="firstName" className="col-form-label">
                        First Name
                      </label>
                      <input
                        readOnly={readOnly}
                        type="text"
                        className="form-control"
                        id="firstName"
                        value={createProfileInputs.firstName}
                        onChange={handleOnCreateProfileInputsChange}
                      />
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-group">
                      <label htmlFor="lastName" className="col-form-label">
                        Last Name
                      </label>
                      <input
                        readOnly={readOnly}
                        type="text"
                        className="form-control"
                        id="lastName"
                        value={createProfileInputs.lastName}
                        onChange={handleOnCreateProfileInputsChange}
                      />
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-group">
                      <label htmlFor="category" className="col-form-label">
                        Profile Category
                      </label>
                      <select
                        disabled={readOnly}
                        className="form-control"
                        id="category"
                        value={createProfileInputs.category}
                        onChange={handleOnCreateProfileInputsChange}
                      >
                        <option value="" key="selectCat">
                          Select
                        </option>
                        {categoryLookup.map((e) => (
                          <option value={e.code} key={e.code}>
                            {e.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-group">
                      <div style={{ display: "flex" }}>
                        <div style={{ width: "30%" }}>
                          <label className="col-form-label">Extn</label>
                          <Select
                            id="extn"
                            menuPortalTarget={document.body}
                            styles={{
                              menuPortal: (base) => ({
                                ...base,
                                zIndex: 99999,
                              }),
                            }}
                            options={phoneNoPrefix}
                            isMulti={false}
                            value={
                              [
                                {
                                  label: createProfileInputs?.extn,
                                  value: createProfileInputs?.extn,
                                },
                              ] || mappedExtn
                            }
                            onChange={(e) => {
                              setMappedExtn(e);
                              let phoneNoLen;
                              phoneNoPrefix.filter((s) => {
                                if (s.value === e.value) {
                                  phoneNoLen = s.phoneNolength;
                                }
                              });
                              setPhoneNolength(phoneNoLen);
                              handleOnCreateProfileInputsChange({
                                target: {
                                  id: "extn",
                                  value: e.value,
                                },
                              });
                            }}
                          ></Select>
                        </div>
                        &nbsp;
                        <div style={{ width: "70%" }}>
                          <label className="col-form-label">
                            Contact Number&nbsp;<span>*</span>
                          </label>
                          <NumberFormatBase
                            className={`form-control ${createProfileInputsErrors.reason
                              ? "input-error"
                              : ""
                              } `}
                            id="contactNbr"
                            placeholder="Enter Contact Number"
                            value={createProfileInputs?.contactNbr}
                            maxLength={phoneNolength}
                            minLength={phoneNolength}
                            pattern={phoneNolength && `.{${phoneNolength},}`}
                            // required
                            title={
                              phoneNolength
                                ? `Required ${phoneNolength} digit number`
                                : ""
                            }
                            onChange={handleOnCreateProfileInputsChange}
                          />
                        </div>
                        {/* <div className="col-3">
                                                    <div className="form-group">
                                                        <label htmlFor="contactNbr" className="col-form-label">{appConfig?.clientFacingName?.customer ?? 'Customer'} Contact Number <span>*</span></label>
                                                        <NumberFormatBase className={`form-control ${createProfileInputsErrors.reason ? "error-border" : ""}`} id="contactNbr" value={createProfileInputs.contactNbr} onChange={handleOnCreateProfileInputsChange}
                                                        />
                                                    </div>
                                                    <span className="errormsg">{createProfileInputsErrors.contactNbr ? createProfileInputsErrors.contactNbr : ""}</span>
                                                </div> */}
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-group">
                      <label htmlFor="email" className="col-form-label">
                        {appConfig?.clientFacingName?.customer ?? "Customer"}{" "}
                        Email ID
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="email"
                        value={createProfileInputs?.email}
                        onChange={handleOnCreateProfileInputsChange}
                      />
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-group">
                      <label
                        htmlFor="contactPreference"
                        className="col-form-label"
                      >
                        Contact preference{" "}
                      </label>
                      <Select
                        value={createProfileInputs.contactPreference}
                        options={contactPreferenceLookup}
                        menuPortalTarget={document.modal}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                        getOptionLabel={(option) => `${option.label}`}
                        isMulti
                        // className={`${error.contactPreference && "error-border"}`}
                        onChange={(selectedOption) =>
                          handleOnCreateProfileInputsChange({
                            target: {
                              id: "contactPreference",
                              value: selectedOption,
                            },
                          })
                        }
                      />
                    </div>
                    {/* <div className="form-group col-md-3">
                                        <label htmlFor="idType" className="col-form-label">ID Type</label>
                                        <select id="idType" disabled={readOnly} className="form-control" value={createProfileInputs.idType} onChange={handleOnCreateProfileInputsChange} >
                                            <option value="" key='selectIdType'>Select</option>
                                            {
                                                idTypeLookup.map((e) => (
                                                    <option value={e.code} key={e.code}>{e.description}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className="col-3">
                                        <div className="form-group">
                                            <label htmlFor="idValue" className="col-form-label">ID Value</label>
                                            <input type="text" disabled={readOnly} id="idValue" className="form-control" value={createProfileInputs.idValue} onChange={handleOnCreateProfileInputsChange} />
                                        </div>
                                    </div> */}
                  </div>
                </div>
              </div>
              <div>
                <div className="col-6">
                  <div className="form-group row">
                    <div className="custom-control custom-checkbox">
                      <input
                        type="checkbox"
                        className="custom-control-input"
                        id="proceedChecks"
                        checked={isAddressRequried}
                        onChange={() => { }}
                        onClick={(e) => setisAddressRequried(e.target.checked)}
                      />
                      <label
                        className="custom-control-label"
                        htmlFor="proceedChecks"
                      >
                        Is Address Requried
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              {isAddressRequried && (
                <>
                  <section className="triangle">
                    <h4 id="list-item-1" className="pl-2">
                      Profile Address
                    </h4>
                  </section>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-group">
                        <AddressComponent
                          index={0}
                          countryLookup={countryLookup}
                          addressList={addressList}
                          setAddressList={setAddressList}
                          error={error}
                          setError={setError}
                          addressTypeLookup={addressTypeLookup}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className=" pt-2">
                <div className="col-12 pl-2 bg-light border">
                  {" "}
                  <h5 className="text-primary">
                    {appConfig?.clientFacingName?.customer ?? "Customer"}{" "}
                    Project Mapping
                  </h5>{" "}
                </div>
              </div>
              <br></br>
              {project && (
                <form className="d-flex justify-content-center">
                  <div style={{ width: "100%" }}>
                    <Select
                      // closeMenuOnSelect={false}
                      //  defaultValue={selectedMappingProjects ? selectedMappingProjects : null}
                      options={project}
                      getOptionLabel={(option) => `${option.label}`}
                      // formatOptionLabel={option => `${option.label} - ${option.value}`}
                      value={createProfileInputs.projectMapping}
                      onChange={(selectedOption) =>
                        handleOnCreateProfileInputsChange({
                          target: {
                            id: "projectMapping",
                            value: selectedOption,
                          },
                        })
                      }
                      isMulti
                      isClearable
                      name="project"
                      menuPortalTarget={document.Modal}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </div>
                </form>
              )}
            </fieldset>
            <div className="row justify-content-center">
              <button
                className={`skel-btn-cancel ${source !== "API" ? "d-none" : ""
                  }`}
                type="button"
                onClick={handleOnClear}
              >
                Clear
              </button>
              <button
                className="skel-btn-submit"
                type="button"
                data-dismiss="modal"
                onClick={handleOnSubmit}
              >
                {readOnly ? "Update" : "Submit"}
              </button>

              {/* <button className="btn btn-secondary btn-sm" type="button" data-dismiss="modal" onClick={handleOnCancel}>Close</button> */}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateProfileModal;
