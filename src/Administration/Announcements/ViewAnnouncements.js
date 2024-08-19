import react, { useState, useEffect, useContext, useRef } from 'react';
import DynamicTable from '../../common/table/DynamicTable';
import { properties } from '../../properties';
import { get, remove, post, put } from '../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';
import { AnnouncementsColunmsLists } from './AnnouncementsColunmsList';
import { AppContext } from '../../AppContext';
import { useNavigate } from 'react-router-dom';
import moment from 'moment'
import Modal from 'react-modal';
import { hideSpinner, showSpinner } from '../../common/spinner';
import * as XLSX from "xlsx";
import Announcement_Template from './Announcement_Template.xlsx'


const customStyles = {
    content: {
        width: '50%',
        maxWidth: '500px',
        margin: 'auto',
        height: '30%',
    },
};

const FileUploadCustomStyles = {
    content: {
        width: '70%',
        maxWidth: '500px',
        margin: 'auto',
        height: '60%',
    },
}

function ViewAnnouncements() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tableRowData, setTableRowData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [exportBtn, setExportBtn] = useState(true)
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [removeAnnouncement, setRemoveAnnouncement] = useState({});
    const [refresh, setRefresh] = useState(false);
    const [bulkUpload, setBulkUpload] = useState(false);
    const [bulkUploadFile, setBulkUploadFile] = useState([])
    const [announcementStatus, setAnnouncementStatus] = useState(false)

    const navigate = useNavigate();

    useEffect(() => {
        get(properties.COMMON_API + `/get-announcement?limit=${perPage}&page=${Number(currentPage)}`)
            .then((response) => {
                const { status, message, data } = response;
                if (status === 200) {
                    unstable_batchedUpdates(() => {
                        setTableRowData(data.rows)
                        setTotalCount(data.count)
                    })
                }
            })
            .catch(error => {
                console.error(error);
            })
            .finally(setRefresh(false))
    }, [refresh])

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleOnAction = (data, action) => {
        if (action == 'edit') {
            navigate('/edit-announcement', { state: { data } });
        } else {
            setIsModalOpen(true)
            setRemoveAnnouncement(data)
        }
    }

    const handleOnAnnouncementStatus = (value,row)=>{
        let status = value == "IN" ? "AC" : "IN";
        let tranId = row?.tranId
        put(properties.COMMON_API + '/announcement-status-update', { status, tranId })
        .then((response) => {
            const { status, message } = response;
            if (status === 200) {
            }
        })
        .catch(error => {
            console.error(error);
        })
        .finally()
    }

    const handleOnRemoveAnnouncement = () => {
        setIsModalOpen(false)
        remove(properties.COMMON_API + '/remove-announcement/' + removeAnnouncement.tranId)
            .then((response) => {
                const { status, message } = response;
                if (status == 200) {
                    toast.success(`${message}`);
                    setRefresh(true)
                }
            })
            .catch(error => {
                console.error(error);
            })
            .finally()
    }

    const handleOnBulkUpload = () => {
        showSpinner()
        readExcel(bulkUploadFile)
    }

    const trimObjValues = (obj) => {
        return Object.keys(obj).reduce((acc, curr) => {
            let value = obj[curr];
            curr = curr.trim();
            acc[curr] = typeof value == 'string' ? value.trim() : value;
            return acc;
        }, {});
    }

    function isValidDateFormat(dateString) {
        if (dateString) {
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            return regex.test(dateString);
        } else {
            return true;
        }
    }

    const isValid = (value) => {
        if (value !== '') {
            return true
        }
        return false;
    }

    const handleFileUpload = (list) => {
        let tempAnnouncementList = []
        let error = false;
        list.map((task) => {
            let announcementObject = {}

            if (isValidDateFormat(task["Effective From"]) &&
                isValidDateFormat(task["Effective To"]) &&
                isValid(task["Title"]) &&
                isValid(task["Summary"])
            ) {
                announcementObject = {
                    announName: task["Title"] || null,
                    announMsg: task["Summary"] || null,
                    markAsImp: task["Mark as Important"],
                    effectiveFrm: task["Effective From"] || null,
                    effectiveTo: task["Effective To"] || null,
                    announCategory: task["Category"] || null,
                    announChannel: task["Channel"] || null,
                    status: task["Status"] || null,
                }
                tempAnnouncementList.push(announcementObject)
            } else {
                error = true;
                return
            }
        })

        if (error) {
            toast.error(`Please Fill all mandatory fields and check date format`);
            hideSpinner();
        } else {
            post(properties.COMMON_API + '/create-announcement', tempAnnouncementList)
                .then((response) => {
                    const { status, message } = response;
                    if (status === 200) {
                        toast.success(`${message}`);
                    }
                    setBulkUpload(false)
                })
                .catch(error => {
                    console.error(error);
                })
                .finally(hideSpinner)
        }
    }


    const readExcel = (file) => {
        let error = false
        var extension = file.name.substr(file.name.lastIndexOf('.'));
        if ((extension.toLowerCase() === ".xls") || (extension.toLowerCase() === ".xlsx")) {
            error = false
        }
        else {
            error = true
            toast.error(file.name + ' is not a excel file, Please try again');
            hideSpinner()
            return false;
        }
        if (file?.size > 5242880) {
            error = true
            toast.error("File too Big, Please Select a File less than 4mb");

        }
        if (error) {
            console.error(error)
            hideSpinner()
            return;
        }
        else {
            const promise = new Promise((resolve, reject) => {
                const fileReader = new FileReader();
                fileReader.readAsArrayBuffer(file);
                fileReader.onload = (e) => {
                    const bufferArray = e.target.result;
                    const wb = XLSX.read(bufferArray, { type: "buffer" });
                    const ws = wb.Sheets['Sheet1'];
                    const range = { s: { r: 7, c: 0 }, e: { r: ws['!ref'].split(':')[1], c: 0 } };
                    const rangeA1 = XLSX.utils.encode_range(range);
                    const data = XLSX.utils.sheet_to_json(ws, { range: rangeA1 })
                    let result = data.map(el => {
                        return trimObjValues(el)
                    })
                    resolve(result);
                };
                fileReader.onerror = (error) => {
                    hideSpinner()
                    reject(error);
                };
            });
            promise.then((d) => {
                handleFileUpload(d);
            }).catch((error) => {
                console.log(error)
            });
        }
    };
    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "S.No") {
            return (
                <span>{row.id++}</span>
            )
        }
        else if (['Created On'].includes(cell.column.Header)) {
            return (<span>{cell.value ? moment(cell.value).format('DD MMM YYYY hh:mm:ss A') : '-'}</span>);
        }
        else if (['Created By'].includes(cell.column.Header)) {
            let name = (row?.original?.createdBy?.firstName || "") + " " + (row?.original?.createdBy?.lastName || "")
            return (<span>{name}</span>);
        }
        else if (cell.column.Header == 'Status') {
            return (<button
                type="button"
                className={`btn btn-sm btn-toggle inter-toggle ${cell.value == "AC" ? 'active' : ''} ml-0`}
                data-toggle="button"
                aria-pressed={cell.value}
                autoComplete="off" 
                onClick={(e) => handleOnAnnouncementStatus(cell.value,row?.original)}
            >
                <div className="handle"></div>
            </button>);
        }
        else if (cell.column.Header === "Action") {
            return (
                <div className="skel-btn-center-cmmn">
                    {/* <button className="skel-btn-delete skel-min-width"
                        onClick={() => handleOnAction(row.original, 'delete')}
                        data-target="#deletemodal" data-toggle="modal"><i
                            className="mdi mdi-delete font20"></i>
                    </button> */}
                    <button className="skel-btn-submit skel-min-width"
                        onClick={() => handleOnAction(row.original, 'edit')}><i
                            className="mdi mdi-file-document-edit-outline font20"></i>
                    </button>
                </div>
            )
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    return (
        <div>
            <div className="customer-skel">
                <div className="cmmn-skeleton">
                    <div className="row">
                        <div className="skel-configuration-settings">
                            <div className="col-md-8">
                                <div className="skel-config-top-sect">
                                    <h2>Announcement</h2>
                                    <p>Announcements are typically communicated through various channels
                                        depending on the audience and the nature of the
                                        information.</p>
                                </div>
                            </div>
                            <div className="col-md-4 skel-btn-center-cmmn">
                                <img src="./assets/images/store.svg" alt="" className="img-fluid" />
                            </div>
                        </div>
                    </div>
                    <div className="card-body" id="datatable">
                        <DynamicTable
                            listKey={"Announcments List"}
                            row={tableRowData}
                            header={AnnouncementsColunmsLists}
                            rowCount={totalCount}
                            itemsPerPage={perPage}
                            backendPaging={true}
                            columnFilter={false}
                            backendCurrentPage={currentPage}
                            isTableFirstRender={isTableFirstRender}
                            hasExternalSearch={hasExternalSearch}
                            exportBtn={exportBtn}
                            handler={{
                                handleCellRender: handleCellRender,
                                handlePageSelect: handlePageSelect,
                                handleItemPerPage: setPerPage,
                                handleCurrentPage: setCurrentPage,
                                handleExportButton: setExportBtn
                            }}
                            customButtons={(
                                <button type="button" onClick={() => navigate(`/add-announcement`)} className="skel-btn-submit">
                                    Add Announcement
                                </button>
                            )}
                            bulkUpload={(
                                <button
                                    className="skel-btn-orange mr-0"
                                    onClick={() => setBulkUpload(true)}
                                >
                                    Bulk Upload
                                </button>

                            )}
                        />
                    </div>
                </div>
            </div>
            <Modal isOpen={isModalOpen} contentLabel="Workflow History Modal" style={customStyles}>
                <div className="modal-dialog modal-sm">
                    <div className="modal-content">
                        <div className="modal-body">
                            <div className="row">
                                <div className="modal-body overflow-auto cus-srch">
                                    <p className="justify-content-center d-flex mb-0">Are you sure you want to delete the Announcement?</p>
                                </div>
                                <br />
                            </div>
                            <div className="skel-btn-center-cmmn">
                                <button className="skel-btn-cancel" type="button" onClick={() => setIsModalOpen(false)}>No</button>
                                <button className="skel-btn-submit" type="button" onClick={() => handleOnRemoveAnnouncement()}>Yes</button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={bulkUpload} contentLabel="Workflow History Modal" style={FileUploadCustomStyles}>
                <div className="modal-dialog modal-sm">
                    <div className="modal-content">
                        <div className="modal-body">
                            <div className="col-12">
                                <label htmlFor="downloadTemplate" className="col-md-7 col-form-label text-md-left">
                                    Download Template
                                </label>
                                <div className="skel-migration-template" >
                                    <div className="skel-template-excl">

                                        <a className='cursor-pointer' download={Announcement_Template} href={Announcement_Template}>
                                            <span className="avatar-title bg-primary rounded">
                                                <i className="mdi mdi-microsoft-excel font-22"></i>
                                            </span>
                                        </a>

                                    </div>
                                    <div className="skel-template-excl">
                                        <a className="cursor-pointer text-black font-weight-bold" download={Announcement_Template} href={Announcement_Template}>Announcement_Template.xlsx</a>
                                    </div>
                                    <div className="skel-template-excl">
                                        <a className="cursor-pointer btn btn-link btn-lg text-muted" download={Announcement_Template} href={Announcement_Template}>
                                            <i className="dripicons-download"></i>
                                        </a>
                                    </div>
                                </div>
                                <div className="form-group col-12">
                                    <label htmlFor="email_address" className="pl-2 col-form-label text-md-left">Choose the file to Upload</label>
                                </div>
                                <div className="">
                                    <div className="">
                                        <fieldset className="">
                                            <div className="file-upload" >
                                                <div className="file-select" >
                                                    <div className="file-select-button skel-btn-submit" id="fileName" >Choose File</div>
                                                    <input
                                                        type="file"
                                                        accept=".xlsx, .xls"
                                                        id="file"
                                                        onChange={(e) => { setBulkUploadFile(e.target.files[0]) }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="ml-3 d-flex">
                                                <div className="file-select">
                                                    <div className="file-select-name" id="noFile">{ }</div>
                                                </div>
                                            </div>
                                        </fieldset>
                                    </div>
                                </div>
                                <br /><br />
                                <hr className="cmmn-hline" />
                            </div>
                            <div className="skel-btn-center-cmmn mb-3 mt-3">
                                <button className="skel-btn-cancel" type="button" onClick={() => setBulkUpload(false)}>Close</button>
                                <button className="skel-btn-submit" type="button" onClick={() => handleOnBulkUpload()}>Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default ViewAnnouncements;