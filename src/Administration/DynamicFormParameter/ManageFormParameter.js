import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { properties } from "../../properties";
import { get, post, put } from "../../common/util/restUtil";


const ManageFormParameters = () => {

    const [parameterList, setParameterList] = useState([])
    const [selectedParamater, setSelectedParameter] = useState([{
        code: "",
        description: "",
        mappingKey: ""
    }])
    const [businessEntityList, setBusinessEntityList] = useState([])
    const [dynamicFormCode, setDynamicFormCode] = useState({})
    const [paramaterMappingPayload, setParamaterMappingPayload] = useState([])
    const [dynamicFormFieldList, setDynamicFormFieldList] = useState([])
    const [existintDynamicFormFieldList, setExistingDynamicFormFieldList] = useState([])

    useEffect(() => {
        get(properties.MASTER_API + "/code-types").then(resp => {
            if (resp.data) {
                setParameterList(resp.data)
            }
        }).catch((error) => {
            console.log(error)
        })
            .finally()
    }, [])

    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=DYNAMIC_FORM')
            .then((resp) => {
                if (resp.data) {
                    setDynamicFormFieldList(resp.data.DYNAMIC_FORM)
                }
            }).catch((error) => {
                console.log(error)
            })
            .finally()
    }, [])

    useEffect(() => {
        let existParam = [];
        dynamicFormFieldList.map((service) => {
            let param = {}
            if (existintDynamicFormFieldList?.[0]?.dynamic_field.includes(service?.code)) {
                service.isSelected = 'Y';
                param.code = service?.code
                param.description = service?.description
                existParam.push(param)
            }
            return service
        })
        setParamaterMappingPayload([...paramaterMappingPayload,...existParam])

    }, [existintDynamicFormFieldList])


    useEffect(() => {
        setExistingDynamicFormFieldList([])
        setParamaterMappingPayload([])
        dynamicFormFieldList.map((service) => {
            service.isSelected = 'N';
            return service
        })
        // dynamicFormFieldList.map((service) => {
        //     let param = {}
        //     if (existintDynamicFormFieldList?.[0]?.dynamic_field.includes(service?.code)) {
        //         service.isSelected = 'N';
        //         setParamaterMappingPayload(paramaterMappingPayload.filter((x) => x.code !== service.code))
               
        //     }
        //     return service
        // })
        let payload = Object.values(dynamicFormCode);
        if (payload.length > 0) {
            post(properties.COMMON_API + '/get-dynamic-form-field', payload)
                .then((resp) => {
                    if (resp.data) {
                        setExistingDynamicFormFieldList(resp.data)
                    }
                }).catch((error) => {
                    console.log(error)
                })
                .finally()
        }


    }, [dynamicFormCode])

    const handleBusinessParameterChange = (e) => {
        const { target } = e;
        if (target.value !== "") {
            setSelectedParameter(JSON.parse(target.options[target.selectedIndex]?.dataset?.entity));
            handleBusinessParamaterChange(JSON.parse(target.options[target.selectedIndex]?.dataset?.entity))
        } else {
            setSelectedParameter({});
            setBusinessEntityList([])
        }
    }

    const handleBusinessParamaterChange = (data) => {
        let existingEntity;
        existingEntity = businessEntityList.filter(entity => {
            if (entity.codeType == data.codeType) {
                return entity;
            }
        })


        if (businessEntityList?.length >= 2) {
            toast.error("You cannot select more than 2 business parameter")
            return;
        }

        if (existingEntity?.length == 0) {

            let paramValue = {};
            get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=' + data.code)
                .then((resp) => {
                    if (resp.data) {
                        paramValue.codeType = data.codeType;
                        paramValue.description = data.description;
                        paramValue.data = resp.data[data.codeType];
                        setBusinessEntityList((prevList) => [...prevList, paramValue]);
                    }
                }).catch((error) => {
                    console.log(error)
                })
                .finally()
        }
    }

    const handleBusinessParameterChangeForField = (e) => {
        const { target } = e;
        setDynamicFormCode(prevState => ({
            ...prevState,
            [target.id]: target.value
        }));
    }

    const handleAddParameterMapping = (data, e) => {
        setDynamicFormFieldList(
            dynamicFormFieldList.map((service) => {
                if (service?.code === data?.code) {
                    service.isSelected = e.target.checked ? 'Y' : 'N'
                }
                return service
            })
        )
        if (e.target.checked) {
            setParamaterMappingPayload([...paramaterMappingPayload,
            {
                code: data.code,
                description: data.description
            }
            ])
        } else {
            setParamaterMappingPayload(paramaterMappingPayload.filter((x) => x.code !== data.code))
        }
    }

    const handleRemoveParameterMapping = (data) => {
        dynamicFormFieldList(
            businessEntityList.map((service) => {
                if (service?.code === data.code) {
                    service.isSelected = 'N'
                }
                return service
            })
        )
        setParamaterMappingPayload(paramaterMappingPayload.filter((x) => x.code !== data.code))
    }

    const handleSaveParameterMapping = () => {
        let id = existintDynamicFormFieldList?.[0]?.id ? existintDynamicFormFieldList?.[0]?.id : ''
        console.log('id',id)
        let businessParamCode;
        let dynamicField = [];
        if (Object.keys(dynamicFormCode).length == 0 || paramaterMappingPayload.length == 0) {
            toast.error("Please select business entity and field");
            return;
        } else {
            paramaterMappingPayload.map(val => {
                dynamicField.push(val.code)
            })
            businessParamCode = Object.values(dynamicFormCode)
        }

        const requestBody = {
            businessParamCode,
            dynamicField,
        }
        if(id){
            requestBody.id = id
        }
        post(properties.COMMON_API + '/create-dynamic-form', requestBody)
            .then((resp) => {
                if (resp.status === 200) {
                    toast.success("Business Entity updated successfully")
                }
                else {
                    toast.error("Error while updating business entity")
                }
            }).catch((error) => {
                console.log(error)
            })
            .finally();
    }

    const handleRemoveBusinessEntity = (data) => {
        let existingEntity;
        let dynamicForm;
        existingEntity = businessEntityList.filter(entity => {
            if (entity.codeType != data.codeType) {
                return entity;
            }else{
                dynamicForm = {...dynamicFormCode}
                if(dynamicForm[entity.codeType]){
                    delete dynamicForm[entity.codeType];
                    
                }
            }
        })
        setDynamicFormCode(dynamicForm)
        setBusinessEntityList(existingEntity)
    }

    return (
        <>
            <div className="col-12 align-items-left">
                <label><h5>Business Parameter:</h5></label>
                <select className="form-control" id={selectedParamater.code} required
                    value={selectedParamater.code}
                    style={{ width: "400px" }}
                    autoFocus
                    onChange={handleBusinessParameterChange}
                >
                    <option key={1} value={""}>Select Parameter</option>
                    {
                        parameterList.map((e) => (
                            <option key={e.code} value={e.code} data-entity={JSON.stringify(e)}>{e.description}</option>
                        ))
                    }
                </select>
            </div>
            <br />
            <hr />
            <div className="row">
                {businessEntityList?.length > 0 && businessEntityList.map((entity, index) => {
                    return <div className="col-4" key={index}>
                        <label><h5>{entity.description}:</h5>
                            <span className='a cursor-pointer' style={{ padding: "10px", marginTop: "-10px" }} onClick={() => handleRemoveBusinessEntity(entity)}><i className="fa fa-times" aria-hidden="true"></i></span>
                        </label>
                        <select className="form-control" id={entity.codeType} required
                            name={entity.codeType}
                            style={{ width: "400px" }}
                            autoFocus
                            onChange={handleBusinessParameterChangeForField}
                        >
                            <option key={1} value={""}>Select Parameter</option>
                            {
                                entity.data.map((e) => (
                                    <option key={e.code} value={e.code} data-entity={JSON.stringify(e)}>{e.description}</option>
                                ))
                            }
                        </select>
                    </div>
                })

                }
            </div>

            <div className="modal-body bg-secondary m-2">
                <div className="col-12">
                    <div className="row">
                        <div className="col-7">
                            <div className="card p-0">
                                <div className="card-body">
                                    <div className="col-xl-12 p-0">
                                        <div className="card-box p-0">
                                            <div className="tab-content pt-0">
                                                <div className={`tab-pane active`}>
                                                    <div className="list-group">
                                                        <div className="input-group input-group-merge p-2 d-none">
                                                            <input type="text" className="form-control height38" placeholder="Search" style={{ border: "1px solid #ccc" }}
                                                                value={selectedParamater} onChange={() => { }}
                                                            />
                                                            <div className="input-group-append">
                                                                <div className="input-group-text">
                                                                    <i className="mdi mdi-filter-outline"></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ height: "400px", overflowY: "auto" }} className="mt-1">
                                                            {
                                                                dynamicFormFieldList && dynamicFormFieldList.length > 0 ?
                                                                    <>
                                                                        {
                                                                            dynamicFormFieldList.map((product) => (
                                                                                <button type="button" className="list-group-item list-group-item-action grow p-0">
                                                                                    <div className="col-12 p-0">
                                                                                        <div className="card-box p-0 cardbg">
                                                                                            <div className="col-12 p-0">
                                                                                                <div className="row col-12 p-0">
                                                                                                    <div className="col-12 text-left table-responsive">
                                                                                                        <table className="w-100 table table-border mb-0 height60">
                                                                                                            <tr>
                                                                                                                <td align="center" width="10%" >
                                                                                                                    {
                                                                                                                        <input type="checkbox" id={`mandatory ${product?.code}`} value={product?.isSelected}
                                                                                                                            style={{ cursor: "pointer" }}
                                                                                                                            checked={product?.isSelected === 'Y' ? true : false}
                                                                                                                            onChange={(e) => handleAddParameterMapping(product, e)}
                                                                                                                        />
                                                                                                                    }
                                                                                                                </td>
                                                                                                                <td className="font-14 bold" width="45%">{product?.description}</td>
                                                                                                                <td className="font-12 bold" width="45%">{product?.code}</td>
                                                                                                            </tr>
                                                                                                        </table>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <hr></hr>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </button>
                                                                            ))
                                                                        }
                                                                    </>
                                                                    :
                                                                    <span className="msg-txt">No Dynamic Field Available</span>
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-1 text-center" style={{ maxWidth: "45px" }}>
                            <a className="txt-decoration-none"><i className="fas fa-arrow-circle-right text-primary" style={{ fontSize: "30px", paddingTop: "220px" }}></i></a>
                        </div>
                        <div className="col">
                            <div className="table-responsive bg-white p-0 shadow">
                                <table className="table table-bordered table-centered mb-0 border">
                                    <thead className="thead-light">
                                        <tr>
                                            <th width="60%"><h5>Selected Fields</h5></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <div style={{ height: "400px", overflowY: "auto" }}>
                                                    {
                                                        paramaterMappingPayload && paramaterMappingPayload.length > 0 && paramaterMappingPayload.map((service) => (
                                                            <div className="card autoheight mb-0 mt-1">
                                                                <div className="card-header bg-light border">
                                                                    <div className="card-widgets">
                                                                        <div style={{ cursor: "pointer" }} data-toggle="remove" onClick={() => handleRemoveParameterMapping(service)}><i className="mdi mdi-close"></i></div>
                                                                    </div>
                                                                    <h5 className="card-title mb-0 text-dark">{service?.description}
                                                                        <span className="float-right badge badge-primary badgefont mr-2 font-12">{service?.mappingDescription}</span>
                                                                    </h5>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-footer d-flex skel-btn-center-cmmn">
                <button type="button" className="skel-btn-submit" onClick={handleSaveParameterMapping}>Save</button>
                <button type="button" className="skel-btn-cancel" data-dismiss="modal" >Cancel</button>
            </div>
        </>

    )
}
export default ManageFormParameters;
