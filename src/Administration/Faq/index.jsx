import React, { useEffect, useState } from 'react'
import { get, post, remove } from '../../common/util/restUtil'
import { properties } from '../../properties'
import DynamicTable from '../../common/table/DynamicTable';
import { useHistory } from '../../common/util/history';
import Swal from 'sweetalert2';
import moment from 'moment';
import { toast } from 'react-toastify';
import { unstable_batchedUpdates } from 'react-dom';
export default function Faq() {
    const history = useHistory()
    const [faqList, setFaqList] = useState([]);
    const [totalCount, setTotalCount] = useState(0)
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(true);
    useEffect(() => {
        getFAQs()
    }, [])
    const getFAQs = () => {
        get(properties.MASTER_API + '/faqs').then((res) => {
            if (res.status === 200) {
                unstable_batchedUpdates(() => {
                    setFaqList(res.data ?? [])
                    setTotalCount(res?.data?.length ?? 0)
                })

            }
        }).catch(error => {
            console.error(error)
        }).finally()
    }
    const handleEditOrDelete = (data, page) => {
        if (page === 'edit') {
            history('/edit-faq', { state: data })
        } else {
            Swal.fire({
                icon: 'info',
                showCancelButton: true,
                title: 'Conformation',
                text: 'Are you sure you want to delete the FAQ?',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Yes',
                cancelButtonText: 'No'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await remove(`${properties.MASTER_API}/faqs/${data?.faqId}`);
                        if (response?.status === 200) {
                            toast.success(response?.message);
                            getFAQs()
                        }
                    } catch (e) {
                        console.log('error', e)
                    }

                }
            });
        }

    }
    const handleOnAnnouncementStatus = async (status, data) => {
        try {
            data.status = (status === 'AC') ? 'IN' : 'AC';
            const response = await post(properties.MASTER_API + '/faqs', data);

            if (response.status === 200) {
                console.log("Faqs ===> ", response);
                toast.success('Status Updated Successfully');
                getFAQs()
            }
        } catch (error) {
            console.error(error);
        }
    };
    const handleCellRender = (cell, row) => {
        if (["Action"].includes(cell.column.Header)) {
            return (
                <React.Fragment>
                    <div className="skel-btn-center-cmmn">
                        <button className="skel-btn-submit skel-min-width" onClick={() => handleEditOrDelete(row.original, 'edit')}>
                            <i className="mdi mdi-file-document-edit-outline font20" />
                        </button>
                        <button className="ml-2 skel-btn-delete skel-min-width" onClick={() => handleEditOrDelete(row.original, 'delete')}>
                            <i className="mdi mdi-delete font20" />
                        </button>

                    </div>
                </React.Fragment>
            )
        } else if (cell.column.Header === "S.No") {
            return (
                <span>{row.id++}</span>
            )
        } else if (cell.column.Header === "Created On") {
            return (
                <span>{moment(cell.value).format('DD MMM YYYY')}</span>
            )
        } else if (cell.column.Header === "Answer") {
            return (
                <span className='skel-faq-dyn-cnt' dangerouslySetInnerHTML={{ __html: cell.value }}></span>
            )
        } else if (["Status"].includes(cell.column.Header)) {
            return (<button type="button" className={`btn btn-sm btn-toggle inter-toggle ${cell.value == "AC" ? 'active' : ''} ml-0`} data-toggle="button" aria-pressed={cell.value} autoComplete="off" onClick={(e) => handleOnAnnouncementStatus(cell.value, row?.original)} ><div className="handle"></div> </button>);
        } else if (cell.column.Header == 'Created By') {
            return <span> {cell?.value?.firstName || ''} {cell?.value?.lastName || '-' || ''}</span>
        } else if (cell.column.Header == 'Channel') {
            return <span>{row?.original?.channelDes?.map((item) => item?.description)?.toString() ?? '-'}</span>
        }
        return (<span>{cell.value}</span>)
    }
    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    return (
        <>
            <div className="container-fluid pr-1">
                <div className="cnt-wrapper">
                    <div className="customer-skel">
                        <div className="cmmn-skeleton">
                            <div className="row">
                                <div className="skel-configuration-settings">
                                    <div className="col-md-8">
                                        <div className="skel-config-top-sect">
                                            <h2>Frequently Asked Questions</h2>
                                            <p>
                                                FAQs are especially useful for addressing recurring
                                                inquiries and helping users find solutions without
                                                needing to contact support.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="col-md-4 skel-btn-center-cmmn">
                                        <img
                                            src="./assets/images/interaction.svg"
                                            alt=""
                                            className="img-fluid"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="skel-config-base mt-4">
                                {/* <div className="skel-btn-row mb-3">
                                    <button className="skel-btn-orange">Bulk Upload</button>
                                </div> */}
                                <DynamicTable
                                    listKey={"FAQ"}
                                    url={properties.MASTER_API + '/faqs'}
                                    method='GET'
                                    row={faqList}
                                    header={Faqcolumns}
                                    rowCount={totalCount}
                                    itemsPerPage={perPage}
                                    backendPaging={false}
                                    columnFilter={false}
                                    backendCurrentPage={currentPage}
                                    exportBtn={exportBtn}
                                    handler={{
                                        handleCellRender: handleCellRender,
                                        handlePageSelect: handlePageSelect,
                                        handleItemPerPage: setPerPage,
                                        handleCurrentPage: setCurrentPage,
                                        handleFilters: setFilters,
                                        handleExportButton: setExportBtn,
                                    }}
                                    customButtons={(
                                        <button className="skel-btn-submit" onClick={() => history('/add-faq')}
                                        >Add FAQ </button>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>

    )
}

export const Faqcolumns = [
    {
        Header: "Action",
        accessor: "action",
        disableFilters: true,
    },
    {
        Header: "S.No",
        accessor: "SNo",
        disableFilters: true,
        id: "SNo",
    },
    {
        Header: "Question",
        accessor: "question",
        disableFilters: true,
    },
    // {
    //     Header: "Answer",
    //     accessor: "answer",
    //     disableFilters: true,
    //     class: 'skel-txt-ellips'
    // },
    {
        Header: "Channel",
        accessor: "Channel",
        disableFilters: true,
    },
    {
        Header: "Created By",
        accessor: "createdByDetails",
        disableFilters: true,
    },
    {
        Header: "Created On",
        accessor: "createdAt",
        disableFilters: true,
    },
    {
        Header: "Status",
        accessor: "status",
        disableFilters: true,
    },

]
