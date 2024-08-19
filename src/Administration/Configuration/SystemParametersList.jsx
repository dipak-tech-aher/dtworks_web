import React, { useEffect, useState, useRef } from 'react';
import Switch from "react-switch";
import { post, get, put } from "../../common/util/restUtil";
import { useHistory } from '../../common/util/history';
import { properties } from "../../properties";
import { toast } from 'react-toastify';
import DynamicTable from '../../common/table/DynamicTable';
import moment from 'moment';
import Swal from 'sweetalert2';

const SystemParametersList = (props) => {
    const history = useHistory()
    const [configList, setConfigList] = useState([])
    const [confirmed, setConfirmed] = useState(false);    
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [enableNewBtn, setEnableNewBtn] = useState(false);

    useEffect(() => {
        get(properties.MASTER_API + '/config/search').then((resp) => {
            setConfigList(resp?.data)
            setTotalCount(resp?.data?.length)
            // console.log(resp.data?.some(e=> e.status === 'AC'))
            if (resp.data?.some(e => e.status === 'AC')) {
                setEnableNewBtn(true)
            }
        })
    }, [])

    const switchChange = (key, row) => {
        let obj = {};
        let text= ''
        const originalConfigList = JSON.parse(JSON.stringify(configList));

        const index = originalConfigList.findIndex(config => config.configUuid === key);

        if (index !== -1) {
            obj.status = originalConfigList[index].status === 'AC' ? 'IN' : 'AC';
            obj.configUuid = originalConfigList[index].configUuid;
            
            const updatedConfigList = JSON.parse(JSON.stringify(originalConfigList));
            updatedConfigList[index].status = updatedConfigList[index].status === 'AC' ? 'IN' : 'AC';

            setConfigList(updatedConfigList);

            console.log('updatedConfigList', updatedConfigList)
            const allInactive = updatedConfigList.every((config) => config.status === 'IN');
            const activeCount = updatedConfigList.filter(config => config.status === 'AC').length;

            if(activeCount > 1){
                text= 'Already there is an active configuration. Please confirm whether we can proceed to deactivate existing.'
            }

            if(allInactive){
                text = 'Are you sure you want to deactivate all configurations?'
            }
            if (text && text !== '' && !confirmed) {
                Swal.fire({
                    icon: 'info',
                    showCancelButton: true,
                    title: 'Status Change Alert!',
                    text: text,
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK',
                    cancelButtonText: 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        setConfirmed(true);
                        put(properties.MASTER_API + "/config/update-status/", obj)
                            .then((resp) => {
                                if (resp.status === 200) {
                                    toast.success(resp.message);
                                } else {
                                    toast.error("Failed, Please try again");
                                }
                            })
                            .catch((error) => {
                                console.log(error);
                            })
                            .finally(() => {
                                setConfirmed(false);
                                window.location.reload();
                            });
                    } else {
                        setConfigList(originalConfigList);
                    }
                });
            } else if (!confirmed) {
                put(properties.MASTER_API + "/config/update-status/", obj)
                    .then((resp) => {
                        if (resp.status === 200) {
                            toast.success(resp.message);
                        } else {
                            toast.error("Failed, Please try again");
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                    })
                    .finally(() => {
                        setConfirmed(false);
                        window.location.reload();
                    });
            }
        }
    };
    

    const handleCellRender = (cell, row) => {

        if (cell.column.id === "status") {
            return (<>
                {
                    <Switch onChange={(e) =>                    
                        switchChange(row.original.configUuid, row.original)
                    } checked={row.original.status === 'AC'} />
                }
            </>)
        }
        else if (cell.column.id === "action") {
            return (
                <button disabled={row.original.status === 'AC' ? false : true} type="button"
                    onClick={() => history(`/system-parameters`, {state: {configUuid: row.original.configUuid}})}
                    className="skel-btn-submit" data-toggle="modal" data-target="#search-modal-editservice">
                    <span><i className="mdi mdi-file-document-edit-outline font20"></i></span>Edit</button >
            )
        }
        else if (cell.column.id === "createdAt" || cell.column.id === "updatedAt") {
            return (<span>{moment(cell.value).format('DD MMM YYYY hh:mm')}</span>)
        }
        else if (cell.column.id === "createdByName" || cell.column.id === "updatedByName") {
            return (<span>{`${row.original[cell.column.id]?.firstName || ''}  ${row.original[cell.column.id]?.lastName || ''}`}</span>)
        }
        return (<span>{cell.value}</span>)

    }

    // const handlePageSelect = (pageNo) => {
    //     setCurrentPage(pageNo)
    // }

    return (

        <div className="row" id="datatable">
            <div className="col-lg-12">
                <div className="cmmn-skeleton mt-2">
                    <div className="">
                        <div className="card-body" id="datatable">
                            {
                                !!configList.length &&
                                <DynamicTable
                                    listKey={`Configuration List`}
                                    row={configList}
                                    rowCount={totalCount}
                                    header={configColumns}
                                    itemsPerPage={perPage}
                                    columnFilter={false}
                                    backendPaging={false}
                                    handler={{
                                        handleCellRender: handleCellRender,
                                        // handlePageSelect: handlePageSelect,
                                        handleItemPerPage: setPerPage,
                                    }}
                                    customButtons={(
                                        <button 
                                            //disabled={enableNewBtn}
                                            onClick={() => history(`/system-parameters`)} className="skel-btn-submit"
                                          //  title={enableNewBtn ? "An active configuration is already available. Kindly make it inactive to add new configuration." : "Add new configuration"}
                                        >
                                            Add New Configuration
                                        </button>
                                    )}
                                />
                            }
                        </div>
                    </div>
                </div>
            </div >
        </div >

    );
};

export default SystemParametersList;

const configColumns = [
    {
        Header: "Action",
        accessor: "action",
        disableFilters: true,
        id: "action",
    },
    {
        Header: "Configuration Name",
        accessor: "configName",
        disableFilters: true,
        id: "configName",
    },
    {
        Header: "Status",
        accessor: "status",
        disableFilters: true,
        id: "status",
    },
    {
        Header: "Created By",
        accessor: "createdByName",
        disableFilters: true,
        id: "createdByName",
    },
    {
        Header: "Created Date",
        accessor: "createdAt",
        disableFilters: true,
        id: "createdAt",
    },
    {
        Header: "Updated By",
        accessor: "updatedByName",
        disableFilters: true,
        id: "updatedByName",
    },
    {
        Header: "Updated Date",
        accessor: "updatedAt",
        disableFilters: true,
        id: "updatedAt",
    },
]