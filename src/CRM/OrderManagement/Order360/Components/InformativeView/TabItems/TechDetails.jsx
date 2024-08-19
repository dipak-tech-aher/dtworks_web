import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import DynamicTable from '../../../../../../common/table/DynamicTable'
import { v4 as uuidv4 } from 'uuid';
import { unstable_batchedUpdates } from 'react-dom';
import { get, post, put } from '../../../../../../common/util/restUtil';
import { properties } from '../../../../../../properties';
import { toast } from 'react-toastify';

export default function TechnicalDetails(props) {
    const {productData, edit, setEdit, isPopupOpen, setIsPopupOpen}= props 

    const initValues = {
        techName: "",
        techUuid: uuidv4(),
        techDesc: "",
        quantity: 0,
        unitPrice: 0,
        totalAmount: 0,
        remarks: ""
    }
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const tableRef = useRef(true);
    const [add, setAdd] = useState({});
    const [filters, setFilters] = useState([]);
    const [technicalDetailsList, setTechnicalDetailsList] = useState([initValues]);
    const [validationErrors, setValidationErrors] = useState({});
    const [childOrderId, setChildOrderId] = useState();

    // const handleAddRow = () => {
    //     setTechnicalDetailsList([...technicalDetailsList, initValues]);
    // };

    const handleAddRow = () => {
        const newRow = { ...initValues };
        // setTechnicalDetailsList([...technicalDetailsList, newRow]);
        const newTechnicalDetailsList = [...technicalDetailsList];
        const newAdd = { ...add };
        if (newTechnicalDetailsList.length > 0) {
            const lastRow = newTechnicalDetailsList[newTechnicalDetailsList.length - 1];
            newAdd[lastRow.techUuid] = false;
        }

        newTechnicalDetailsList.push(newRow);
        setTechnicalDetailsList(newTechnicalDetailsList);
        setAdd(newAdd);
    };


    const handleDeleteRow = (parentIndex) => {
        const updatedParents = []
        technicalDetailsList.filter(f => {
            if (f.techUuid !== parentIndex.techUuid) {
                updatedParents.push(f)
            }
        })
        setTechnicalDetailsList(updatedParents);
    };

    const handleInputChange = (e, data) => {
        
        unstable_batchedUpdates(() => {
            let { id, value } = e.target;

            if (['unitPrice', 'totalAmount'].includes(id)) {
                value = parseFloat(value).toFixed(2);
            } 
            if(['quantity'].includes(id)) {
                value = parseFloat(value).toFixed(0);
            }
            setTechnicalDetailsList(
                technicalDetailsList.map((item) => {
                    if (data.techUuid === item.techUuid) {
                        if (id === "editBtn") {
                            item.isEdited = true
                        } else {
                            item[id] = value
                        }
                    }
                    return item;
                })
            );

            if (validationErrors[data.techUuid]) {
                setValidationErrors((prevErrors) => {
                    const updatedErrors = { ...prevErrors };
                    delete updatedErrors[data.techUuid][id];
                    if (Object.keys(updatedErrors[data.techUuid]).length === 0) {
                        delete updatedErrors[data.techUuid];
                    }
                    return updatedErrors;
                });
            }

            if (!data.ordTechId) {
                setAdd((prevEdit) => ({
                    ...prevEdit,
                    [data.techUuid]: true,
                }));
            }
        });
    };

    const handleCellRender = (cell, row) => {
        const isEditMode = edit[row.original.ordTechId] || false;
        const isAddMode = add[row.original.techUuid] || false;
        const hasError = validationErrors[row.original.techUuid] || {};

        const getInputClass = (field) => (hasError[field] ? 'form-control error' : 'form-control');

        if (cell.column.id == 'action' && row.original.ordTechId) {
            return (
                <div className="skel-btn-center-cmmn">
                    <button type="button" className="skel-btn-cancel" onClick={() => handleDeleteRow(row.original)}>
                        {/* <i className="fa fa-trash"></i> */}
                        Remove
                    </button>
                    <button type="button" className="skel-btn-submit" id="editBtn" onClick={(e) => { setEdit({ ...edit, [row.original.ordTechId]: !isEditMode }); handleInputChange(e, row.original) }}>

                        {/* {!isEditMode ? <i class="fas fa-save"></i> : <i className="fa fa-edit"></i>} */}
                        {!isEditMode ? 'Save' : 'Edit'}
                    </button>
                </div>
            );
        } else if (cell.column.id == 'action' && !row.original.ordTechId) {
            return (
                <div className="skel-btn-center-cmmn">
                    <button type="button" className="skel-btn-cancel" onClick={() => handleDeleteRow(row.original)}>
                        Remove
                    </button>
                    <button type="button" className="skel-btn-submit" onClick={
                        () => {
                            if (isAddMode) {
                                setAdd({ ...add, [row.original.techUuid]: !isAddMode })
                            } else {
                                handleAddRow()
                            }
                        }}>
                        {isAddMode ? 'Save' : 'Add'}
                    </button>
                </div>
            );
        } else if (['techName', 'techDesc', 'remarks'].includes(cell.column.id)) {
            return (<input type='text' id={cell.column.id} className={getInputClass(cell.column.id)} onChange={(e) => handleInputChange(e, row.original)} readOnly={isEditMode} value={cell.value} />);
        } else if (['unitPrice', 'totalAmount'].includes(cell.column.id)) {
            return (<input type='number' id={cell.column.id} className={getInputClass(cell.column.id)} onChange={(e) => handleInputChange(e, row.original)} readOnly={isEditMode} value={cell.value} />);
        } else if (['quantity'].includes(cell.column.id)) {
            return (<input type='number' id={cell.column.id} className={getInputClass(cell.column.id)} onChange={(e) => handleInputChange(e, row.original)} readOnly={isEditMode} value={cell.value} />);
        }
        return (<span>{cell?.value ?? '-'}</span>);
    };


    const UpdateTechnicalDetails = () => {
        try {
            let hasError = false;
            const newValidationErrors = {};

            technicalDetailsList.forEach((obj) => {
                if (!obj.techName) {
                    newValidationErrors[obj.techUuid] = { ...newValidationErrors[obj.techUuid], techName: true };
                    hasError = true;
                }
                if (!obj.techDesc) {
                    newValidationErrors[obj.techUuid] = { ...newValidationErrors[obj.techUuid], techDesc: true };
                    hasError = true;
                }
                if (!obj.quantity) {
                    newValidationErrors[obj.techUuid] = { ...newValidationErrors[obj.techUuid], quantity: true };
                    hasError = true;
                }
                if (!obj.totalAmount) {
                    newValidationErrors[obj.techUuid] = { ...newValidationErrors[obj.techUuid], totalAmount: true };
                    hasError = true;
                }
                if (!obj.unitPrice) {
                    newValidationErrors[obj.techUuid] = { ...newValidationErrors[obj.techUuid], unitPrice: true };
                    hasError = true;
                }
            });

            if (hasError) {
                setValidationErrors(newValidationErrors);
                toast.error('Kindly provide all the required values');
                return false;
            }

            let requestObj = {
                ...productData,
                technicalDetailsdata: technicalDetailsList.map((item) => {
                    return {
                        ...item,
                    }
                })
            }

            post(`${properties.ORDER_API}/tech-details/create`, requestObj).then(res => {
                if (res?.status === 200) {
                    toast.success(res?.message);
                    setIsPopupOpen(!isPopupOpen)
                } else {
                    toast.error('Something went wrong');
                }
            }).catch(err => console.log(err)).finally();
        } catch (e) {
            console.log('error', e);
        }
    };

    

    const handleAddViewTechDet = (row) => {
        setChildOrderId(row?.orderDtlId)
        get(`${properties.ORDER_API}/get-tech-details/${row.orderDtlId}`).then((res) => {
            if (res?.data.length > 0) {
                setTechnicalDetailsList([...res?.data, initValues]);
                const initialEditState = res.data.reduce((acc, row) => {
                    acc[row.ordTechId] = true;
                    return acc;
                }, {});
                setEdit(initialEditState);
            }
        }).catch((error) => console.error(error))
    };

    useEffect(()=>{
        if(isPopupOpen){
            handleAddViewTechDet(productData);
        }
    },[isPopupOpen])

    // console.log('technicalDetailsList===========', technicalDetailsList)

    return (
        <>
            <DynamicTable
                listSearch={[]}
                listKey={"Tech Details"}
                row={technicalDetailsList || []}
                rowCount={technicalDetailsList.length || 0}
                header={TechnicalDetColumns}
                fixedHeader={true}
                itemsPerPage={10}
                isScroll={false}
                backendPaging={false}
                exportBtn={true}
                exportBackend={false}           
                handler={{
                    handleCellRender: handleCellRender,
                    handleExportButton: () => { }
                }}
            />
            <div className="skel-btn-center-cmmn" >
                <button type="button" className="skel-btn-cancel" onClick={() => setIsPopupOpen(!isPopupOpen)} >
                    Cancel
                </button>
                <button type="button" className="skel-btn-submit" onClick={UpdateTechnicalDetails}>
                    Update
                </button>
            </div>
        </>
    )
}

export const TechnicalDetColumns = [
    {
        Header: "Action",
        accessor: "action",
        disableFilters: true,
        id: "action"
    },
    {
        Header: "Technical Name",
        accessor: "techName",
        disableFilters: true,
        id: "techName"
    },
    {
        Header: "Technical Desciption",
        accessor: "techDesc",
        disableFilters: true,
        id: "techDesc"
    },
    {
        Header: "Unit Price",
        accessor: "unitPrice",
        disableFilters: true,
        id: "unitPrice"
    },
    {
        Header: "Quantity",
        accessor: "quantity",
        disableFilters: true,
        id: "quantity"
    },
    {
        Header: "Total Amount",
        accessor: "totalAmount",
        disableFilters: true,
        id: "totalAmount"
    },
    {
        Header: "Remarks",
        accessor: "remarks",
        disableFilters: true,
        id: "remarks"
    },
];