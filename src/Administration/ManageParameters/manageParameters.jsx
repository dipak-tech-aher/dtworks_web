import React, { useState, useEffect } from "react";
import DynamicTable from "../../common/table/DynamicTable";
import { ManageParametersCols } from "./manageParaCol"
import { properties } from "../../properties";
import { useHistory } from '../../common/util/history';
import { get } from "../../common/util/restUtil";
import AddParameter from "./addParameter";
import Modal from 'react-modal';
import EditParameter from "./editParameter";
import { RegularModalCustomStyles } from "../../common/util/util";
import ParametersMapping from "./ParametersMapping";
import { unstable_batchedUpdates } from "react-dom";
import ReactSelect from 'react-select';
import { Tooltip } from 'react-tooltip';


const ManageParameters = (props) => {
    // console.log('Props ----------------------->', props?.props?.screenName)
    const history = useHistory()
    const screenName = props?.props?.screenName
    const [data, setData] = useState([])
    const [adminMenu, setAdminMenu] = useState([]);
    const [isActive, setIsActive] = useState()
    const [display, setDisplay] = useState(false);
    const [update, setUpdate] = useState(false);
    const [exportBtn, setExportBtn] = useState(true);
    const [isOpen, setIsOpen] = useState(false)
    const [listSearch, setListSearch] = useState([]);
    const showtab = (selectedMenuId) => { setIsActive(selectedMenuId) }
    const [codeType, setCodeType] = useState("")
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [tooltip, setTooltip] = useState('')

    let type
    if (screenName === 'Business Parameter Management') {
        type = 'management'
    } else if (screenName === 'Business Parameter Mapping') {
        type = 'mapping'
    }

    useEffect(() => {

        get(properties.MASTER_API + "/code-types")
            .then(resp => {
                if (resp.data) {
                    setAdminMenu(resp.data)
                    handleRender(resp.data?.[0].codeType)
                    setIsActive(resp.data?.[0].codeType)
                    setCodeType(resp.data?.[0].codeType)
                }
            }).catch((error) => {
                console.log(error)
            })
            .finally()
    }, [])

    useEffect(() => {
        if (display === false && update === false && isOpen === false) {
            handleRender(isActive)
        }
    }, [display, update, isOpen])

    useEffect(() => {
        handleRender(isActive)
    }, [currentPage, perPage]);


    const handleRender = (e) => {
        if (e) {
            setListSearch({ codeType: e })
            // get(properties.MASTER_API + "/list/" + e)
            get(`${properties.MASTER_API}/list/${e}?limit=${Number(perPage)}&page=${currentPage}`)
                .then(resp => {
                    if (resp.data && resp?.status === 200 && Array.isArray(resp?.data?.rows) && resp?.data?.rows.length > 0) {
                        const { count, rows } = resp?.data;
                        // let value = Object.keys(resp.data).map((key) => resp.data[key]);
                        // let merged = [].concat.apply([], value);
                        // console.log('merged', merged)
                        unstable_batchedUpdates(() => {
                            setTotalCount(count);
                            setData(rows);
                        });
                    } else {
                        unstable_batchedUpdates(() => {
                            setTotalCount(0);
                            setData([]);
                        });
                    }
                }).catch((error) => {
                    console.log(error)
                })
        }
    }

    const handleSubmit = (data, code) => {
        setData(data);
        setUpdate(true)
    }


    const handleParameterMapping = (data) => {
        setData(data);
        setIsOpen(true)
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Edit") {
            return (
                <button type="button" className="skel-btn-submit" onClick={() => handleSubmit(row.original, row.original.code)}><span><i className="mdi mdi-file-document-edit-outline font20"></i></span> Edit</button>
            )
        }
        else if (cell.column.Header === "Mapping") {
            return (
                <button type="button" className="map-btn skel-btn-submit" onClick={() => handleParameterMapping(row.original)}><span><i className="ti-arrow-circle-right font20"></i></span>Map</button >
            )
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }
    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo);
    };

    return (
        <>
            {
                (display) &&
                <Modal style={RegularModalCustomStyles} isOpen={display}>
                    <AddParameter Code={{
                        adminMenu,
                        codeType
                    }}
                        setDisplay={setDisplay} />
                </Modal>
            }
            <hr className="cmmn-hline" />
            <div className="row mt-1">
                <div className="skel-config-base">
                    <div className="col-lg-12">
                        <div className="m-t-30">
                            <form className="col-12 d-flex justify-content-left ml-1" >
                                <div className="col-lg-3 col-md-3 col-sm-12 align-items-left">
                                    <label><h5>Business Parameter:</h5></label>
                                    <ReactSelect
                                        className=""
                                        id="example-select"
                                        placeholder="Select Business Parameter"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999999 }) }}
                                        options={adminMenu.map((x) => {
                                            return { label: x.description, value: x.code }
                                        })}
                                        isMulti={false}
                                        onChange={(selected) => {
                                            unstable_batchedUpdates(() => {
                                                setCodeType(selected?.value);
                                                handleRender(selected?.value);
                                                showtab(selected?.value);
                                                setCurrentPage(0)
                                                setTotalCount(0)

                                                const Tooltip = adminMenu.find(f => f.codeType === selected.value)?.helpTips
                                                setTooltip(Tooltip)
                                            })
                                        }}
                                        value={adminMenu?.filter(x => x?.code === codeType)?.map((x) => {
                                            return { label: x.description, value: x.code }
                                        })}
                                    />                                  
                                    {/* <select className="form-control" id="example-select" required
                                        style={{ width: "400px" }}
                                        autoFocus
                                        onChange={(e) => { 
                                            unstable_batchedUpdates(()=>{
                                                setCodeType(e.target.value); 
                                                handleRender(e.target.value); 
                                                showtab(e.target.value);
                                                setCurrentPage(0)
                                                setTotalCount(0)
                                            })
                                        }}
                                    >
                                        {
                                            adminMenu.map((e) => (
                                                <option key={e.codeType} value={e.codeType}>{e.description}</option>
                                            ))
                                        }
                                    </select> */}
                                </div>
                                  {/* Tool Tips */}
                                  <div className="col-lg-3 col-md-3 col-sm-12 align-items-left">
                                  <label></label>
                                        <span className="txt-lnk txt-underline pl-2" data-tip id="businessParameter" data-htmlFor="businessParameter">Need More Help?</span>
                                        <Tooltip data-tooltip-id="businessParameter" place="right" effect="float" textColor="white">
                                            {tooltip ? tooltip : 'Help not available'}
                                        </Tooltip>
                                    </div>
                                    {/* Tool Tips Ends */}
                            </form>
                            <div className="tab-content p-0">
                                <div className="tab-pane  show active" id="naturecode">
                                    <div className="row mt-2" id="datatable">
                                        <div className="col-lg-12 p-0">
                                            <div className="card-body">
                                                {
                                                    data.length > 0 &&
                                                    <div className="">
                                                        <div className="card-body">
                                                            <div style={{ width: "100%", overflowX: "auto", overflowY: "hidden", whiteSpace: "nowrap" }}>
                                                                <DynamicTable
                                                                    listSearch={listSearch}
                                                                    listKey={"Manage Parameters"}
                                                                    row={data}
                                                                    header={type === 'mapping'
                                                                        ? ManageParametersCols.filter((e) => e.Header !== 'Edit')
                                                                        : type === 'management'
                                                                            ? ManageParametersCols.filter((e) => e.Header !== 'Mapping')
                                                                            : ManageParametersCols}
                                                                    itemsPerPage={perPage}
                                                                    rowCount={totalCount}
                                                                    exportBtn={exportBtn}
                                                                    backendPaging={true}
                                                                    backendCurrentPage={currentPage}
                                                                    handler={{
                                                                        handleCellRender: handleCellRender,
                                                                        handleExportButton: setExportBtn,
                                                                        handleItemPerPage: setPerPage,
                                                                        handlePageSelect: handlePageSelect,
                                                                        handleCurrentPage: setCurrentPage,
                                                                    }}
                                                                    customButtons={(
                                                                        <button onClick={() => setDisplay(true)} type="button" hidden={(type === 'mapping')} className="skel-btn-submit">
                                                                            Add New Parameters
                                                                        </button>
                                                                    )}
                                                                    bulkUpload={(
                                                                        <button className="skel-btn-orange mr-0" hidden={(type === 'mapping')}
                                                                            onClick={() => history("/create-bulk-upload")}>
                                                                            Bulk Upload
                                                                        </button>
                                                                    )}
                                                                />
                                                            </div>
                                                            <br />
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                        {
                                            (update === true) &&
                                            <EditParameter Code={adminMenu} Data={data} tooltip={tooltip} setUpdate={setUpdate} isOpen={update} style={{ height: "50%" }} />
                                        }
                                        {
                                            (isOpen === true) &&
                                            <ParametersMapping
                                                data={{ isOpen, data }}
                                                handler={{ setIsOpen }}
                                                style={{ height: "50%" }}
                                            />
                                        }
                                    </div>
                                </div>
                            </div>
                        </div >
                    </div>
                </div>
            </div >
        </>
    )
}
export default ManageParameters;
