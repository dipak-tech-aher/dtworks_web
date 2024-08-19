import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../../AppContext';
import Filter from '../../Dashboard/filter';
import LeftBar from './LeftBar';
import ListItem from './ListItem';

import { map, unionBy } from "lodash";
import moment from 'moment';
import { unstable_batchedUpdates } from 'react-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { statusConstantCode } from '../../AppConstants';
import filterPng from '../../assets/images/filter-btn.png';
import { useHistory }from '../../common/util/history';
import { get, post, put } from '../../common/util/restUtil';
import { getReleventHelpdeskDetailedData } from '../../common/util/util';
import { properties } from '../../properties';
import DetailedView from './DetailedView';
import EditHelpdeskModal from './EditHelpdeskModal';
import HelpdeskFilter from './HelpdeskFilter';
import SimilarSearch from './Interactions/shared/SimilarSearch';
import ViewTicketDetailsModal from './ViewTicketDetailsModal/ViewTicketDetailsModal';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';

let clone = require('clone')

const Helpdesk = (props) => {
    const history = useHistory()
    let { auth, setAuth, appConfig } = useContext(AppContext);
    const [refresh, setRefresh] = useState(auth?.helpDeskData?.refresh || false);
    const [autoRefresh, setAutoRefresh] = useState(auth?.helpDeskData?.autoRefresh || false);
    const [timer, setTimer] = useState(auth?.helpDeskData?.timer || 1);
    const [searchInput, setSearchInput] = useState();
    const [dateRange, setDateRange] = useState({
        startDate: moment().startOf('month').format('DD-MM-YYYY'),
        // startDate: auth?.helpDeskData?.startDate || moment().startOf('year').format('DD-MM-YYYY'),
        endDate: moment().format('DD-MM-YYYY'),
        // endDate: auth?.helpDeskData?.endDate || moment().format('DD-MM-YYYY'),
    });
    const [helpdeskDetails, setHelpdeskDetails] = useState({})

    // const [callSelection, setCallSelection] = useState(true)
    const handleAutoRefresh = () => {
        setAutoRefresh(!autoRefresh)
    }
    const handleAuthChange = (helpDeskData) => {
        // console.log("helpDeskData ==> ", helpDeskData)
        setAuth({ ...auth, helpDeskData })
    }

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [allList, setAllList] = useState([]);
    const [detailedViewItem, setDetailedViewItem] = useState(undefined);
    const [queueList, setQueueList] = useState({
        items: [],
        itemsCount: 0,
        selectedCount: 0,
        selected: []
    });

    const [isViewTicketDetailsOpen, setIsViewTicketDetailsOpen] = useState(false);
    const [socket, setSocket] = useState();
    const [isQueueListLoading, setIsQueueListLoading] = useState(false);
    const [isAssignedQueueListLoading, setIsAssignedQueueListLoading] = useState(false);
    const isFirstRenderForQueue = useRef(true);
    const isFirstRenderForAssignedQueue = useRef(true);
    const [queueSort, setQueueSort] = useState('NEW');
    const [assignedQueueSort, setAssignedQueueSort] = useState('NEW');
    const [searchQueueFilter, setSearchQueueFilter] = useState("");
    const [searchAssignedQueueFilter, setSearchAssignedQueueFilter] = useState("");
    const [queueListBeforeFilter, setQueueListBeforeFilter] = useState({
        items: [],
        selected: []
    });

    const hasMoreQueueList = useRef(true);
    const mergeQueuePrevList = useRef(false);
    const hasMoreAssignedList = useRef(true);
    const mergeAssignedPrevList = useRef(false);

    const [queuePageCount, setQueuePageCount] = useState(0);
    const [assignedPageCount, setAssignedPageCount] = useState(0);

    const [helpdeskStatus, setHelpdeskStatus] = useState([])
    const [helpdeskTypes, setHelpdeskTypes] = useState([])
    const [severities, setSeverities] = useState([])
    const [projectTypes, setProjectTypes] = useState([])
    const [cancelReasonLookup, setCancelReasonLookup] = useState([])
    const [projectLookup, setProjectLookup] = useState([]);
    const [isCreateHelpdeskOpen, setIsCreateHelpdeskOpen] = useState(false);
    const [helpdeskID, setHelpdeskId] = useState()
    const [filterIsOpen, setFilterIsOpen] = useState(false)
    const [showFilter, setShowFilter] = useState(false);
    const [filter, setFilters] = useState()
    const [queueCount, setQueueCount] = useState({

    })

    const getLeftBarCounts = () => {
        let startDate = dateRange.startDate.split("-").reverse().join("-");
        let endDate = dateRange.endDate.split("-").reverse().join("-");
        const requestBody = {
            project: [
                statusConstantCode.common.ALL
            ],
            startDate: startDate,
            endDate: endDate,
            assign: statusConstantCode.common.AVAILABLE
        }
        post(`${properties.HELPDESK_API}/source-counts`, requestBody)
            .then((response) => {
                const { data } = response;
                if (data && data.length) {
                    setAllList([
                        {
                            source: { code: statusConstantCode.common.ALL, description: statusConstantCode.common.ALL },
                            count: data.reduce((total, obj) => (obj.count ?? 0) + total, 0)

                        },
                        ...data
                    ]);
                }
            })
            .catch(error => {
                console.error(error);
            })
            .finally()
    }

    const executeHelpdesk = () => {
        return new Promise((resolveHelpdesk, rejectHelpdesk) => {
            const queueStatus = getQueueList();
            queueStatus.then((resolve, reject) => {
                if (resolve?.status) {
                    const assignedStatus = getAssignedQueueList();
                    assignedStatus.then((assignResolved, assignRejected) => {
                        if (assignResolved) {
                            resolveHelpdesk(true);
                        }
                    }).catch(error => console.log(error))
                }
            }).catch((error) => {
                const assignedStatus = getAssignedQueueList();
                assignedStatus.then((assignResolved, assignRejected) => {
                    if (assignResolved) {
                        resolveHelpdesk(true);
                    }
                }).catch(error => console.log(error))
                console.log(error)
            })
        })
    }


    const search = (inputPayloadData) => {
        const inputPayload = inputPayloadData;
        getQueueList(inputPayload).catch(error => console.log(error));
    }

    const AssignedHelpdesksearch = (inputPayloadData) => {
        const inputPayload = { searchInput: inputPayloadData };
        getAssignedQueueList(inputPayload).catch(error => console.log(error));
    }

    const getQueueList = useCallback((searchInputPayload) => {
        setIsQueueListLoading(true);
        let startDate = dateRange.startDate.split("-").reverse().join("-");
        let endDate = dateRange.endDate.split("-").reverse().join("-");
        return new Promise((resolve, reject) => {
            let requestBody = {
                helpdeskSource: statusFilter,
                assigned: false,
                sort: queueSort,
                startDate: startDate,
                endDate: endDate,
                contain: ['CUSTOMER'],
                filter
            }
            if (searchInputPayload || searchInput) {
                requestBody.searchInput = searchInputPayload ?? searchInput;
                requestBody.searchInput.assigned = false
            }
            post(`${properties.HELPDESK_API}/search?limit=10&page=${queuePageCount}`, requestBody)
                .then((response) => {
                    const { status, data, message } = response;
                    if (status === 200 && data && !!Object.keys(data).length) {
                        data.rows.map((x) => {
                            x.source = x.helpdeskSource?.description
                            return x
                        })
                        resolve({ status: true, queueList: data.rows })
                        // console.log('mergeQueuePrevList.current-------->', mergeQueuePrevList.current)
                        setQueueList((list) => {
                            if (data.rows.length > 0) {
                                let updatedLength = mergeQueuePrevList.current ? list.items.length + data.rows.length : data.rows.length;
                                hasMoreQueueList.current = updatedLength < Number(data.count) ? true : false;
                                const uniqueMergedArray = Array.from(new Set([...list.items, ...data.rows].map(item => item.helpdeskNo))).map(helpdeskNo => [...list.items, ...data.rows].find(item => item.helpdeskNo === helpdeskNo));
                                return {
                                    selected: list.selected,
                                    itemsCount: data.count ?? queueList?.itemsCount ?? 0,
                                    selectedCount: queueList?.selectedCount ?? 0,
                                    items: mergeQueuePrevList.current ? uniqueMergedArray : data.rows
                                }
                            }
                            // else {
                            //     return {
                            //         items: [],
                            //         selected: []
                            //     }
                            // }
                            return {
                                selected: list.selected,
                                items: [...list.items, ...data.rows]
                            }
                        })
                        // mergeQueuePrevList.current = false;
                    } else {
                        // setQueueList({
                        //     items: [],
                        //     selected: []
                        // })
                        // console.log("message ==> ", message);
                    }
                }).catch((error) => {
                    console.error(error);
                    // toast.dismiss();
                    // toast.error(error?.message);
                    reject({ status: true, queueList: [] })
                })
                .finally(() => {
                    setIsQueueListLoading(false);
                })
        })
    }, [queuePageCount, dateRange, filter, queueSort])

    const getAssigneList = useCallback((assignedPageCounts, assignedQueueSort) => {
        console.log('assignedPageCount--------->', assignedPageCounts)
        console.log('assignedQueueSort--------->', assignedQueueSort)
        setIsAssignedQueueListLoading(true);
        let startDate = dateRange.startDate.split("-").reverse().join("-");
        let endDate = dateRange.endDate.split("-").reverse().join("-");
        return new Promise((resolve, reject) => {
            let requestBody = {
                helpdeskSource: statusFilter,
                assigned: true,
                sort: assignedQueueSort,
                startDate: startDate,
                endDate: endDate,
                contain: ['CUSTOMER'],
                filter
            }
            console.log('searchInput', searchInput)
            if (searchInput) {
                requestBody.searchInput = searchInput;
                requestBody.searchInput.assigned = true
            }

            post(`${properties.HELPDESK_API}/search?limit=10&page=${assignedPageCounts}`, requestBody)
                .then((response) => {
                    const { status, data, message } = response;
                    if (status === 200 && data && !!Object.keys(data).length) {
                        data.rows.map((x) => {
                            x.source = x.helpdeskSource?.description
                            return x
                        })
                        resolve({ status: true, queueList: data.rows })
                        // console.log('mergeQueuePrevList.current-------->', mergeQueuePrevList.current)
                        // setQueueList({})
                        setQueueList((list) => {
                            let resultData = {};
                            if (data.rows.length > 0) {
                                let updatedLength = mergeAssignedPrevList.current ? list.selected.length + data.rows.length : data.rows.length;
                                hasMoreAssignedList.current = updatedLength < Number(data.count) ? true : false;
                                const uniqueMergedArray = Array.from(new Set([...list.selected, ...data.rows].map(item => item.helpdeskNo))).map(helpdeskNo => [...list.selected, ...data.rows].find(item => item.helpdeskNo === helpdeskNo));
                                let selectedItems = mergeAssignedPrevList.current ? uniqueMergedArray : data.rows
                                if (assignedQueueSort == 'NEW') {
                                    selectedItems = selectedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                                } else {
                                    selectedItems = selectedItems.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                                }
                                return {
                                    items: list.items,
                                    itemsCount: queueList?.itemsCount ?? 0,
                                    selectedCount: data.count ?? queueList?.selectedCount ?? 0,
                                    selected: selectedItems
                                }
                            }
                            return {
                                items: list.items,
                                itemsCount: queueList?.itemsCount ?? 0,
                                selectedCount: queueList?.selectedCount ?? 0,
                                selected: [...list.selected, ...data.rows]
                            }
                        })
                    }
                }).catch((error) => {
                    console.error(error);
                    reject({ status: true, queueList: [] })
                })
                .finally(() => {
                    setIsAssignedQueueListLoading(false);
                })
        })
    }, [queuePageCount, dateRange, filter, assignedQueueSort])

    const getAssignedQueueList = useCallback((searchInputPayload) => {
        setIsAssignedQueueListLoading(true);
        let startDate = dateRange.startDate.split("-").reverse().join("-");
        let endDate = dateRange.endDate.split("-").reverse().join("-");
        return new Promise((resolve, reject) => {
            const requestBody = {
                helpdeskSource: statusFilter,
                assigned: true,
                sort: assignedQueueSort,
                startDate: startDate,
                endDate: endDate,
                contain: ['CUSTOMER'],
                filter
            }
            if (searchInputPayload || searchInput) {
                requestBody.searchInput = searchInputPayload?.searchInput ?? searchInput
            }

            post(`${properties.HELPDESK_API}/search?limit=10&page=${assignedPageCount}`, requestBody)
                .then((response) => {
                    const { status, data } = response;
                    if (status === 200 && data && !!Object.keys(data).length) {
                        data?.rows?.map((x) => {
                            x.source = x.helpdeskSource?.description
                            return x
                        })
                        if (statusFilter === 'ALL' && !!data?.rows?.length) {
                            new Promise((res, rej) => {
                                let results = data?.rows?.filter((ele) => ele?.chat?.length === 0);
                                new Promise((msgResolve, msgReject) => {
                                    const chatList = data?.rows?.filter((ele, idx) => ele?.source === 'LIVECHAT');
                                    if (!!chatList?.length) {
                                        chatList?.forEach((chatElem, chatIdx) => {
                                            let messages = [];
                                            get(`${properties.CHAT_API}/message?email=${chatElem?.chat[0]?.emailId}&id=${chatElem?.chat[0]?.chatId}`)
                                                .then((response) => {
                                                    if (response?.data) {
                                                        messages = response?.data
                                                        chatElem["chat"][0]["message"] = map(response?.data, 'msg');
                                                        chatElem["chat"][0]["messageColorAlign"] = messages.map((agentMsg) => { delete agentMsg?.msg; return agentMsg })
                                                    }
                                                    else {
                                                        if (chatElem['chat'].length != 0) {
                                                            chatElem["chat"][0]["message"] = [];
                                                            chatElem["chat"][0]["messageColorAlign"] = [];
                                                        }

                                                    }
                                                    if (chatList?.length === chatIdx + 1) {
                                                        msgResolve(chatList);
                                                    }
                                                })
                                                .catch((error) => {
                                                    console.error(error);
                                                    rej(true);
                                                    msgReject(true);
                                                })
                                        })
                                    }
                                    else {
                                        msgResolve(results);
                                    }
                                }).then((msgResolved, msgRejected) => {
                                    if (msgResolved) {
                                        results = unionBy(msgResolved, data?.rows, 'helpdeskId');
                                        res(results);
                                    }
                                }).catch((error) => {
                                    console.log(error)
                                })
                            }).then((resolvedChat, rejectedChat) => {
                                if (resolvedChat) {
                                    setIsAssignedQueueListLoading(false);
                                    resolve(resolvedChat);
                                    setQueueList((list) => {
                                        let updatedLength = mergeAssignedPrevList.current ? list.selected.length + data.rows.length : data.rows.length;
                                        hasMoreAssignedList.current = updatedLength < Number(data.count) ? true : false;
                                        return {
                                            items: list.items,
                                            itemsCount: queueList?.itemsCount ?? 0,
                                            selectedCount: data.count ?? queueList?.selectedCount ?? 0,
                                            selected: mergeAssignedPrevList.current ? [...list.selected, ...resolvedChat] : data.rows
                                        }
                                    })
                                    mergeAssignedPrevList.current = false;
                                }
                            }).catch((error) => {
                                console.log(error)
                            })
                        }
                        else {
                            setIsAssignedQueueListLoading(false);
                            resolve(data?.rows || []);
                            setQueueList((list) => {
                                /***Srini added for help desk scroll issue start***/
                                if (data.rows.length > 0) {
                                    let updatedLength = mergeAssignedPrevList.current ? list.selected.length + data.rows.length : data.rows.length;
                                    hasMoreAssignedList.current = updatedLength < Number(data.count) ? true : false;
                                    return {
                                        items: list.items,
                                        itemsCount: queueList?.itemsCount ?? 0,
                                        selectedCount: data.count ?? queueList?.selectedCount ?? 0,
                                        selected: mergeAssignedPrevList.current ? [...list.selected, ...data.rows] : data.rows
                                    }
                                } else {
                                    return {
                                        items: list.items,
                                        // selected: [...list?.selected, ...data?.rows]
                                        selected: [...data?.rows]

                                    }
                                }
                                /***Srini added for help desk scroll issue end***/

                            })
                            mergeAssignedPrevList.current = false;
                        }
                    } else {
                        if (helpdeskID) {
                            setQueueList((prevState) => ({ ...prevState, selected: prevState.selected.filter((e) => e?.helpdeskId !== helpdeskID) }))
                        }
                        else {
                            // setQueueList({
                            //     items: [],
                            //     selected: []
                            // })
                        }
                    }
                })
                .catch(error => {
                    console.error(error);
                    setIsAssignedQueueListLoading(false);
                    reject(error);
                })
                .finally(() => {
                    setIsAssignedQueueListLoading(false);
                })
        })
    }, [assignedPageCount, dateRange, filter])

    const assignHelpdesk = (helpdeskId) => {
        return new Promise((resolve, reject) => {
            put(`${properties.HELPDESK_API}/assign/${helpdeskId}`, { status: statusConstantCode.status.HELPDESK_ASSIGN })
                .then((response) => {
                    const { status, message } = response;
                    if (status === 200) {
                        toast.success(message);
                        resolve(true);
                        setQueueList({
                            ...queueList,
                            selectedCount: (queueList?.selectedCount ?? 0) + 1
                        })
                        decrementCount('ALL')
                        const helpdeskSrc = getHelpdeskById(helpdeskID)
                        console.log('helpdeskSrc', helpdeskSrc)
                        decrementCount(helpdeskSrc)
                        handleAutoRefresh()
                    }
                })
                .catch(error => {
                    console.error(error);
                    reject(false);
                })
                .finally()
        })
    }

    function decrementCount(sourceCode) {
        const updatedList = allList.map(item => {
            if (item.source.code === sourceCode) {
                return {
                    ...item,
                    count: item.count - 1
                };
            }
            return item;
        });
        setAllList(updatedList);
    }

    const getHelpdeskById = useCallback((helpdeskID) => {
        return new Promise((resolve, reject) => {
            if (helpdeskID) {
                const requestBody = {
                    helpdeskId: helpdeskID,
                    contain: ['CUSTOMER']
                }

                post(`${properties.HELPDESK_API}/search?limit=10&page=0`, requestBody)
                    .then((response) => {
                        if (response && response?.data && response?.data?.rows && response?.data?.rows.length > 0) {
                            const heldeskSrc = response?.data?.rows?.helpdeskSource?.code;
                            resolve(heldeskSrc)
                        }
                    })
                    .catch(error => {
                        console.log(error);
                    })
                    .finally()
            }
        })
    }, [])

    const executeChat = () => {
        // console.log('2gcq')
        const chatStatus = getChatQueue();
        chatStatus.then((resolve, reject) => {
            if (resolve.status) {
                getAssignedChatQueue().catch(error => console.log(error));
            }
        }).catch((error) => {
            console.log(error)
        })
    }

    const getChatQueue = () => {
        //load the new user's in queue-If status is "New"
        setIsQueueListLoading(true);
        return new Promise((resolve, reject) => {

            get(`${properties.CHAT_API}`)
                .then((resp) => {
                    if (resp.data) {
                        if (resp.status === 200) {
                            const { count, rows } = resp.data;
                            // console.log('3q', queueList.items, rows)
                            setQueueList((list) => {
                                let newItems = []
                                for (let l of list.items) {
                                    if (!l.chatId) {
                                        newItems.push(l)
                                    }
                                }
                                return {
                                    selected: list.selected,
                                    items: [...newItems, ...rows]
                                }
                            })
                            setIsQueueListLoading(false);
                            resolve({ status: true, queueList: rows });
                        } else {
                            toast.error("Failed to create - " + resp.status);
                        }
                    } else {
                        toast.error("Uexpected error ocurred " + resp.statusCode);
                    }
                })
                .catch(error => {
                    console.error(error);
                    setIsQueueListLoading(false);
                    resolve({ status: false, queueList: [] });
                })
                .finally(() => {
                    setIsQueueListLoading(false);

                });
        })
    }

    const getAssignedChatQueue = () => {
        setIsAssignedQueueListLoading(true);
        return new Promise((resolve, reject) => {

            get(`${properties.CHAT_API}/assigned`)
                .then((resp) => {
                    if (resp.data) {
                        if (resp.status === 200) {
                            new Promise((res, rej) => {
                                let results = [];
                                resp?.data?.forEach((element, idx) => {
                                    let messages = [];
                                    get(`${properties.CHAT_API}/message?email=${element?.emailId}&id=${element?.chatId}`)
                                        .then((response) => {
                                            if (response?.data) {
                                                messages = response?.data
                                                element["message"] = map(response?.data, 'msg');
                                                element["messageColorAlign"] = messages.map((agentMsg) => { delete agentMsg?.msg; return agentMsg })
                                            }
                                            else {
                                                element["message"] = [];
                                                element["messageColorAlign"] = [];
                                            }
                                            results = unionBy(results, resp.data, 'chatId');
                                            if (resp.data.length === idx + 1) {
                                                res({ status: true, finalAssignedData: results })
                                            }
                                        })
                                        .catch((error) => {
                                            console.error(error);
                                            rej(true);
                                        })
                                });
                            })
                                .then((resolvedChat, rejectedChat) => {
                                    if (resolvedChat) {
                                        setIsAssignedQueueListLoading(false);
                                        // console.log('resolvedChat.finalAssignedData', resolvedChat.finalAssignedData)
                                        // console.log('4q')
                                        setQueueList((list) => {
                                            return {
                                                selected: [...resolvedChat.finalAssignedData],
                                                items: list.items
                                            }
                                        })
                                        resolve({ status: true, queueList: resolvedChat.finalAssignedData });
                                    }
                                }).catch((error) => {
                                    console.log(error)
                                })
                        }
                        else {
                            toast.error("Failed to create - " + resp.status);
                            setIsAssignedQueueListLoading(false);
                            reject({ status: false, queueList: [] });
                        }
                    }
                    else {
                        toast.error("Uexpected error ocurred " + resp.statusCode);
                        setIsAssignedQueueListLoading(false);
                        reject({ status: false, queueList: [] });
                    }
                })
                .catch(error => {
                    console.error(error);
                    setIsAssignedQueueListLoading(false);
                    reject({ status: false, queueList: [] });
                })
                .finally();
        })
    }

    const assignChat = (chatId) => {

        return new Promise((resolve, reject) => {
            put(`${properties.CHAT_API}/assign/${chatId}`)
                .then((response) => {
                    if (response.status === 200) {
                        resolve(true);
                    } else {
                        toast.error("Failed to update - " + response.status);
                    }
                })
                .catch(error => {
                    console.error(error);
                    reject(false);
                })
                .finally();
        })
    }

    useEffect(() => {
        unstable_batchedUpdates(() => {
            // console.log('1', JSON.stringify(detailedViewItem))
            setDetailedViewItem(undefined);
            // console.log('4q')
            setQueueList({
                items: [],
                itemsCount: 0,
                selectedCount: 0,
                selected: []
            })
            setQueueSort("NEW");
            setAssignedQueueSort("NEW");
            setSearchQueueFilter("");
            setSearchAssignedQueueFilter("");
            // console.log('5q')
            setQueueListBeforeFilter({
                items: [],
                itemsCount: 0,
                selectedCount: 0,
                selected: []
            })
        })
    }, [statusFilter])

    useEffect(() => {
        getLeftBarCounts();
        executeHelpdesk().catch(error => console.log(error));
        getQueueList().catch(error => console.log(error));
    }, [refresh, dateRange, autoRefresh, statusFilter])

    useEffect(() => {
        getLeftBarCounts();
        getQueueList().catch(error => console.log(error));
        getAssignedQueueList().catch(error => console.log(error));
    }, [filter, dateRange])

    useEffect(() => {
        if (!isFirstRenderForQueue.current) {
            getQueueList().catch(error => console.log(error));
        }
        else {
            isFirstRenderForQueue.current = false;
        }
    }, [queueSort, dateRange, queuePageCount])

    useEffect(() => {
        console.log('assignedQueueSort val', assignedQueueSort)
        if (!isFirstRenderForAssignedQueue.current) {
            console.log('----useeffect no 5----', assignedPageCount)
            getAssigneList(assignedPageCount, assignedQueueSort).catch(error => {
                console.error(error);
            });
        }
        else {
            isFirstRenderForAssignedQueue.current = false;
        }
        // getAssignedQueueList().catch(error => {
        //     console.error(error);
        // });
    }, [assignedQueueSort, dateRange, assignedPageCount])

    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
    };

    const move = (source, destination, droppableSource, droppableDestination, draggableId) => {
        const draggableIdArray = draggableId?.split('-');
        const ticketSource = draggableId?.split('-')[0];
        const sourceClone = Array.from(source);
        const destClone = Array.from(destination);
        const [removed] = sourceClone.splice(droppableSource.index, 1);
        if (droppableSource.droppableId === 'queue' && droppableDestination.droppableId === 'assigned') {
            // console.log('draggableIdArray[1]', draggableIdArray[1])
            unstable_batchedUpdates(() => {
                setIsCreateHelpdeskOpen(true)
                setHelpdeskId(draggableIdArray[1])
            })

            //const status = ticketSource === 'LIVE' ? assignChat(draggableIdArray[2] || undefined) : assignHelpdesk(draggableIdArray[1] || undefined);
            // const status = assignHelpdesk(draggableIdArray[1] || undefined);
            // status.then((handleResolve, handleReject) => {
            //     setSearchAssignedQueueFilter("");
            //     doSoftRefresh();
            // }).catch(error => console.log(error))
        }
        else if (droppableSource.droppableId === 'assigned' && droppableDestination.droppableId === 'queue') {
            // Un-assigned functionality
        }

        destClone.splice(droppableDestination.index, 0, removed);

        const result = {};
        result[droppableSource.droppableId] = sourceClone;
        result[droppableDestination.droppableId] = destClone;

        return result;
    };

    const getItemStyle = (isDragging, draggableStyle) => ({
        userSelect: 'none',
        padding: 6,
        margin: `0 0 ${8}px 0`,
        background: '#FFFFFF',
        ...draggableStyle
    });

    const getListStyle = (isDraggingOver) => ({
        background: '#F3F4F6',
        padding: 8,
        width: 'inherit',
        height: '1001px',
        overflow: 'auto'
    });

    const id2List = {
        queue: 'items',
        assigned: 'selected'
    };

    const getList = id => queueList[id2List[id]];

    const onDragEnd = result => {
        setHelpdeskDetails({});
        setTimeout(() => {
            const { source, destination, draggableId } = result;
            if (source?.droppableId === "assigned") {
                toast.error("Ticket cant assigned back to queue!");
                return
            }
            if (!destination) {
                return;
            }
            if (source.droppableId === destination.droppableId) {
                const items = reorder(
                    getList(source.droppableId),
                    source.index,
                    destination.index
                );
                let finalState = { items };
                if (source.droppableId === 'assigned') {
                    finalState = {
                        items: queueList.items,
                        itemsCount: queueList?.itemsCount ?? 0,
                        selectedCount: (queueList?.selectedCount ?? 0) + 1,
                        selected: items
                    };
                }
                else {
                    finalState = {
                        items,
                        itemsCount: queueList?.itemsCount ?? 0,
                        selectedCount: queueList?.selectedCount ?? 0,
                        selected: queueList.selected
                    };
                }
                setQueueList(finalState);
            } else {
                const result = move(
                    getList(source.droppableId),
                    getList(destination.droppableId),
                    source,
                    destination,
                    draggableId
                );
                // console.log(result)
                setQueueList({
                    items: result.queue,
                    itemsCount: queueList?.itemsCount ?? 0,
                    selectedCount: queueList?.selectedCount ?? 0,
                    selected: result.assigned
                });
            }
        }, 800)
    };

    const getCustomerDetails = async (helpdeskId, laneSource, tktWithLoggedIn, from) => {
        // console.log('helpdeskId, laneSource, tktWithLoggedIn, from---->', helpdeskId, laneSource, tktWithLoggedIn, from)
        try {
            const requestBody = {
                helpdeskId: Number(helpdeskId),
                helpdeskSource: statusFilter,
                assigned: laneSource === 'ASSIGNED' ? true : false,
                contain: ['CUSTOMER', 'INTERACTION'],
                tktWithLoggedIn,
                from
            }

            const response = await post(`${properties.HELPDESK_API}/search?limit=10&page=0`, requestBody)
            // console.log('response',response)
            // const response = await get(`${properties.HELPDESK_API}/${helpdeskId}`)
            if (response && response?.data && response?.data?.rows && response?.data?.rows.length > 0) {
                return { ...response?.data?.rows[0], source: response?.data?.rows[0]?.helpdeskSource?.description };
            }
            else {
                return null;
            }
        }
        catch (error) {
            console.error(error);
        }
        finally {

        }
    }

    const formCustomerDetailsForChat = (detailedViewItem) => {
        // console.log('In formCustomerDetailsForChat', formCustomerDetailsForChat)
        if (detailedViewItem && detailedViewItem.contactDetails && detailedViewItem.contactDetails.length > 0) {

            const contactDetails = detailedViewItem.contactDetails[0];
            if (contactDetails && !!Object.keys(contactDetails).length) {
                let data = contactDetails?.customerDetails && !!contactDetails.customerDetails.length ? contactDetails.customerDetails[0] : {};
                return {
                    customer: {
                        crmCustomerNo: data?.crmCustomerNo,
                        customerId: data?.customerId,
                        contactId: contactDetails?.contactId,
                        fullName: `${data?.firstName} ${data?.lastName}`,
                        customerType: data?.custType,
                        contactNumber: contactDetails?.contactNo,
                        email: contactDetails?.email,
                        contactPreference: contactDetails?.contactPreferenceDesc?.description,
                        idType: data?.idTypeDesc?.description,
                        idValue: data?.idValue,
                        customerTypeCode: data?.custType,
                        contactPreferenceCode: contactDetails?.contactPreference,
                        idTypeCode: data?.idType
                    },
                    interaction: data.interactionDetails
                }
            }
            return undefined;
        } else {
            return undefined;
        }

    }

    const handleOnIdSelection = (detailedViewItem, laneSource, tktWithLoggedIn, from) => {
        // console.log('from------------>', from)
        // console.log('source------------>', laneSource)
        // console.log('tktWithLoggedIn------------>', tktWithLoggedIn)
        // console.log('detailedViewItem?.source------------>', detailedViewItem?.source)
        // console.log('detailedViewItem?.oHelpdeskSource------------>', detailedViewItem?.oHelpdeskSource)
        // console.log('detailedViewItem------>', JSON.stringify(detailedViewItem))
        unstable_batchedUpdates(async () => {
            if (detailedViewItem?.source !== undefined || detailedViewItem?.oHelpdeskSource !== undefined || detailedViewItem?.helpdeskSourceDesc?.description !== undefined) {
                const responseData = await getCustomerDetails(
                    detailedViewItem?.oHelpdeskId ?? detailedViewItem?.helpdeskId ?? detailedViewItem?.chatId,
                    laneSource,
                    tktWithLoggedIn,
                    from);
                // console.log('responseData------>', responseData)
                if (responseData?.customerDetails && !!Object.keys(responseData?.customerDetails).length) {
                    // console.log('2----------')
                    setDetailedViewItem({ ...detailedViewItem, laneSource, customerDetails: responseData.customerDetails, conversation: responseData.conversation, ...responseData })
                } else {
                    // console.log('3-----------')
                    setDetailedViewItem({ ...detailedViewItem, laneSource, conversation: responseData?.conversation, ...responseData })
                }
            }
            else {
                // console.log('formCustomerDetailsForChat', detailedViewItem.name, detailedViewItem.customerName)
                const customerDetails = formCustomerDetailsForChat(detailedViewItem);
                // console.log('formCustomerDetailsForChat', customerDetails)
                // console.log('4')
                setDetailedViewItem({ ...detailedViewItem, laneSource, customerDetails })
            }
            // console.log('laneSource', laneSource)
            if (['QUEUE'].includes(laneSource)) {
                setIsViewTicketDetailsOpen(true);
            }
        })
    }

    const doSoftRefresh = (stateTo, helpdeskId = undefined, source = undefined) => {
        // console.log('doSoftRefresh-------------->', stateTo)
        unstable_batchedUpdates(async () => {
            switch (stateTo) {
                case 'UPDATE_DETAILED_VIEW':

                    getLeftBarCounts();
                    const assignedList = getAssignedQueueList();
                    // console.log('assignedList----------->', assignedList)
                    assignedList.then(async (resolved, rejected) => {
                        // console.log('resolved---------->', resolved)
                        if (!!resolved.length) {
                            const view = resolved.find((assigned) => helpdeskId === assigned.helpdeskId);
                            if (view) {
                                const responseData = await getCustomerDetails(helpdeskId, 'ASSIGNED');
                                if (!!Object.keys(responseData?.customerDetails ?? {}).length) {
                                    // console.log('5')
                                    setDetailedViewItem({
                                        ...view,
                                        laneSource: 'ASSIGNED',
                                        customerDetails: responseData.customerDetails,
                                        conversation: responseData.conversation
                                    });
                                } else {
                                    // console.log('6')
                                    setDetailedViewItem({
                                        ...view,
                                        laneSource: 'ASSIGNED',
                                        conversation: responseData.conversation
                                    });
                                }
                            }
                            else {
                                // console.log('7')
                                setDetailedViewItem(undefined);
                            }
                        }
                        else {
                            // console.log('8----------->')
                            setDetailedViewItem(undefined);
                        }
                    }).catch(error => console.log(error)).finally()
                    break;
                case 'CANCEL_VIEW': setDetailedViewItem(undefined);
                    break;
                case 'UPDATE_CUSTOMER_DETAILS':
                    // console.log('queueList', queueList)

                    const responseData = await getCustomerDetails(helpdeskId, source);
                    if (!!Object.keys(responseData?.customerDetails ?? {}).length) {
                        let newQList = clone(queueList)

                        for (let q of newQList.selected) {
                            // console.log(q.helpdeskId, helpdeskId)
                            if (q.helpdeskId === helpdeskId) {
                                q.contactDetails = [{
                                    contactNo: responseData?.customerDetails?.customer?.contactNumber
                                }]
                            }
                        }
                        // console.log('newQList', newQList)
                        // console.log('8q')
                        setQueueList(newQList)
                        // console.log('10')
                        setDetailedViewItem({ ...detailedViewItem, customerDetails: responseData.customerDetails, conversation: responseData.conversation })

                    } else {
                        // console.log('11')
                        setDetailedViewItem({ ...detailedViewItem, conversation: responseData.conversation })
                    }

                    break;
                case 'UPDATE_CUSTOMER_DETAILS_CHAT':

                    const assignedChatList = getAssignedChatQueue();
                    assignedChatList.then((resolved, reject) => {
                        let customerDetails;
                        if (resolved.status && resolved?.queueList.length) {
                            let view = resolved?.queueList?.find((assigned) => helpdeskId === assigned.chatId);
                            if (view) {
                                customerDetails = formCustomerDetailsForChat(view);
                                // console.log('12')
                                setDetailedViewItem({
                                    ...view,
                                    customerDetails,
                                    laneSource: 'ASSIGNED',
                                })
                            }
                            else {
                                // console.log('13')
                                setDetailedViewItem(undefined);
                            }
                        }
                        else {
                            // console.log('14')
                            setDetailedViewItem(undefined);
                        }
                    }).catch(error => console.log(error)).finally()
                    break;
                case 'FULL_REFRESH':
                    getLeftBarCounts()
                    executeHelpdesk().catch(error => console.log(error))
                    getQueueList().catch(error => console.log(error))
                default:
                    setBothPageCountToZero();
                    //executeHelpdesk();
                    setDetailedViewItem(undefined);
            }
        })
    };

    const handleOnSearchQueueChange = (e) => {
        const { value, name, id } = e.target;
        setSearchInput(value)
        // console.log('value------->', value)
        // console.log('name------->', name)
        // console.log('id------->', id)
        unstable_batchedUpdates(() => {
            if (!value) {
                // console.log('1-------')
                setQueueList({
                    ...queueList,
                    [name]: queueListBeforeFilter[name]
                })
            }
            else if (value && value !== searchQueueFilter) {
                // console.log('2-------')
                if (queueListBeforeFilter[name].length) {
                    // console.log('10q')
                    setQueueList({
                        ...queueList,
                        [name]: queueListBeforeFilter[name]
                    })
                }
            }
            if (id === 'searchQueueFilter') {
                // console.log('3-------')
                setSearchQueueFilter(value);
            }
            else {
                // console.log('4-------')
                setSearchAssignedQueueFilter(value);
            }
        })
    }

    const handleOnSearchAssignedQueue = (e, type) => {
        e.preventDefault();
        unstable_batchedUpdates(() => {
            const searchInput = type === 'items' ? searchQueueFilter : searchAssignedQueueFilter;
            // console.log('searchInput---------->', searchInput)
            if (searchInput) {
                setSearchInput(searchInput);

                AssignedHelpdesksearch(searchInput)

                // console.log('queueList------>', queueList)
                // console.log('queueList[type]------>', queueList[type])

                // let list = queueList[type]?.filter((item) => {
                //     let isTrue = false;
                // console.log('item?.title------>', item)
                // console.log('searchInput------>', searchInput)
                //     if ((item?.source !== 'LIVECHAT' ? String(item?.helpdeskId)
                //         : !!item?.chat?.length ? String(item?.chat[0]?.chatId)
                //             : String(item?.helpdeskId)).includes(searchInput) || item?.email?.includes(searchInput) || item?.name?.toLowerCase()?.includes(searchInput?.toLowerCase()) || item?.emailId?.includes(searchInput) || item?.customerName?.toLowerCase()?.includes(searchInput?.toLowerCase())
                //         || item?.title?.toLowerCase()?.includes(searchInput?.toLowerCase())
                //         || item?.helpdeskSubject?.toLowerCase()?.includes(searchInput?.toLowerCase())
                //         || item?.helpdeskNo?.toLowerCase()?.includes(searchInput?.toLowerCase())
                //     ) {
                //         isTrue = true;
                //     }
                //     return isTrue;
                // })
                // setQueueListBeforeFilter({
                //     ...queueListBeforeFilter,
                //     [type]: queueList[type]
                // })
                // setQueueList({
                //     ...queueList,
                //     [type]: list
                // })
            } else {
                // console.log('13q')
                setSearchInput();
                setTimeout(() => {
                    AssignedHelpdesksearch(null);
                }, 1000)
                // setQueueList({
                //     ...queueList,
                //     [type]: queueListBeforeFilter.items
                // })
                // // console.log('14q')
                // setQueueListBeforeFilter({
                //     ...queueListBeforeFilter,
                //     [type]: []
                // })
            }
        })
    }

    const handleOnSearchQueue = (e, type) => {
        e.preventDefault();
        unstable_batchedUpdates(() => {
            const searchInput = type === 'items' ? searchQueueFilter : searchAssignedQueueFilter;
            // console.log('searchInput---------->', searchInput)
            if (searchInput) {
                setSearchInput(searchInput);
                // console.log('queueList------>', queueList)
                // console.log('queueList[type]------>', queueList[type])
                search(searchInput)
                // call search api


                // let list = queueList[type]?.filter((item) => {
                //     let isTrue = false;
                //     console.log('item?.title------>', item)
                //     console.log('searchInput------>', searchInput)
                //     if ((item?.source !== 'LIVECHAT' ? String(item?.helpdeskId)
                //         : !!item?.chat?.length ? String(item?.chat[0]?.chatId)
                //             : String(item?.helpdeskId)).includes(searchInput) || item?.email?.includes(searchInput) || item?.name?.toLowerCase()?.includes(searchInput?.toLowerCase()) || item?.emailId?.includes(searchInput) || item?.customerName?.toLowerCase()?.includes(searchInput?.toLowerCase())
                //         || item?.title?.toLowerCase()?.includes(searchInput?.toLowerCase())
                //         || item?.helpdeskSubject?.toLowerCase()?.includes(searchInput?.toLowerCase())
                //         || item?.helpdeskNo?.toLowerCase()?.includes(searchInput?.toLowerCase())
                //     ) {
                //         isTrue = true;
                //     }
                //     return isTrue;
                // })
                // setQueueListBeforeFilter({
                //     ...queueListBeforeFilter,
                //     [type]: queueList[type]
                // })
                // setQueueList({
                //     ...queueList,
                //     [type]: list
                // })
            } else {
                setSearchInput();
                setTimeout(() => {
                    search(null);
                }, 1000)

                // console.log('13q')
                // setQueueList({
                //     ...queueList,
                //     [type]: queueListBeforeFilter.items
                // })
                // // console.log('14q')
                // setQueueListBeforeFilter({
                //     ...queueListBeforeFilter,
                //     [type]: []
                // })
            }
        })
    }

    const handleOnSortChange = (e) => {
        const { value, id } = e.target;
        if (id === 'queueSort') {
            queuePageCountToZero();
            setQueueSort(value);
            setSearchQueueFilter("");
        }
        else {
            assignedPageCountToZero();
            setAssignedQueueSort(value);
            setSearchAssignedQueueFilter("");
        }
    }

    const queuePageCountToZero = () => {
        setQueuePageCount((pageCount) => {
            if (pageCount === '0') {
                return 0;
            }
            else {
                return '0'
            }
        })
    }

    const assignedPageCountToZero = () => {
        setAssignedPageCount((pageCount) => {
            if (pageCount === '0') {
                return 0;
            }
            else {
                return '0'
            }
        })
    }

    const setBothPageCountToZero = () => {
        queuePageCountToZero();
        assignedPageCountToZero();
    }

    const handleOnScroll = (e) => {
        const { scrollHeight, scrollTop, clientHeight, id } = e.target;
        const tolerance = 1;
        // Srini modified for help desk scroll issue
        // scrollHeight - Math.ceil(scrollTop) === clientHeight ||
        if ((scrollHeight - Math.ceil(scrollTop) === clientHeight || Math.abs(scrollHeight - Math.ceil(scrollTop) - clientHeight) <= tolerance) && (id === 'Queue' ? hasMoreQueueList.current : hasMoreAssignedList.current)) {
            if (id === 'Queue') {
                mergeQueuePrevList.current = true;
                setQueuePageCount(Number(queuePageCount) + 1);
            } else {
                mergeAssignedPrevList.current = true;
                setAssignedPageCount(Number(assignedPageCount) + 1);
            }
        }
    }

    const handleOnAssignedScroll = (e) => {
        // setCallSelection(false)
        // console.log('here-----assigned---->')
        const { scrollHeight, scrollTop, clientHeight, id } = e.target;
        const tolerance = 1;
        // console.log('id--------->', id)
        // console.log('clientHeight--------->', clientHeight)
        // console.log('Math.ceil(scrollTop)--------->', Math.ceil(scrollTop))
        // console.log('scrollHeight - Math.ceil(scrollTop)--------->', scrollHeight - Math.ceil(scrollTop))
        if ((scrollHeight - Math.ceil(scrollTop) === clientHeight || Math.abs(scrollHeight - Math.ceil(scrollTop) - clientHeight) <= tolerance) && (hasMoreAssignedList.current)) {
            if (id === 'Assigned') {
                console.log('---------im in assigned--------', Number(assignedPageCount) + 1)
                mergeAssignedPrevList.current = true;
                setAssignedPageCount(Number(assignedPageCount) + 1);
            }
        }
    }

    const handleOnQueueScroll = (e) => {
        // setCallSelection(true)
        // console.log('here-----quque---->')
        const { scrollHeight, scrollTop, clientHeight, id } = e.target;
        const tolerance = 1;
        // console.log('id--------->', id)
        // console.log('clientHeight--------->', clientHeight)
        // console.log('Math.ceil(scrollTop)--------->', Math.ceil(scrollTop))
        // console.log('scrollHeight - Math.ceil(scrollTop)--------->', scrollHeight - Math.ceil(scrollTop))
        if ((scrollHeight - Math.ceil(scrollTop) === clientHeight || Math.abs(scrollHeight - Math.ceil(scrollTop) - clientHeight) <= tolerance) && (hasMoreQueueList.current)) {
            if (id === 'Queue') {
                console.log('---------im in queue--------')
                mergeQueuePrevList.current = true;
                setQueuePageCount(Number(queuePageCount) + 1);
            }
        }
    }

    const handleOnAssignForMobile = (viewItem) => {
        Swal.fire({
            title: 'Confirm move to my helpdesk?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Confirm'
        }).then((result) => {
            if (result.isConfirmed) {
                let responseStatus;
                if (viewItem?.source === 'LIVECHAT') {
                    responseStatus = assignChat(viewItem?.chatId);
                }
                else {
                    responseStatus = assignHelpdesk(viewItem?.helpdeskId);
                }
                responseStatus.then((resolved, rejected) => {
                    setSearchAssignedQueueFilter("");
                    doSoftRefresh();
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Moved to My helpdesk!'
                    })
                }).catch(error => console.log(error))
            }
        }).catch(error => console.log(error))
    }

    useEffect(() => {
        // console.log('props--------->', props?.data?.props?.location?.state?.data?.payload)
        // console.log('props-----source---->', props?.data?.props?.location?.state?.data?.payload?.oStatus)
        // console.log('props-----source---->', props?.data?.props?.location)
        const queryParams = new URLSearchParams(props?.data?.props?.location?.search);
        const idFrom = queryParams.get('from');
        const payloadData = props?.data?.props?.location?.state?.data;
        const payload = payloadData?.payload;
        const payloadStatus = payload?.oStatus;
        const tktWithLoggedIn = payloadData?.tktWithLoggedIn;
        if (idFrom === "DASHBOARD") {
            if (payloadStatus === "New") {
                handleOnIdSelection(payload, "QUEUE", tktWithLoggedIn, "DASHBOARD")
            } else {
                handleOnIdSelection(payload, tktWithLoggedIn ? "ASSIGNED" : "QUEUE", tktWithLoggedIn, "DASHBOARD")
            }
            const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: newurl }, "", newurl);
        }
    }, [])

    useEffect(() => {
        if (auth?.currDeptId) {
            get(properties.MASTER_API + `/lookup?searchParam=code_type&valueParam=${statusConstantCode.businessEntity.HELPDESK_TYPE},${statusConstantCode.businessEntity.SEVERITY},${statusConstantCode.businessEntity.PROJECT},${statusConstantCode.businessEntity.HELPDESKSTATUS},${statusConstantCode.businessEntity.HELPDESKCANCELREASON}`).then((resp) => {
                if (resp?.data) {
                    const { PROJECT, HELPDESK_STATUS, HELPDESK_CANCEL_REASON, HELPDESK_TYPE, SEVERITY } = resp?.data
                    const helpdeskStatusList = HELPDESK_STATUS && HELPDESK_STATUS.filter((e) => {
                        if (e.code !== statusConstantCode?.status?.HELPDESK_NEW) {
                            return true
                        }
                        return false
                    })
                    console.log('helpdeskStatusList--------->', helpdeskStatusList)
                    unstable_batchedUpdates(() => {
                        setCancelReasonLookup(HELPDESK_CANCEL_REASON)
                        setProjectTypes(PROJECT)
                        setHelpdeskTypes(HELPDESK_TYPE)
                        setSeverities(SEVERITY)
                        setHelpdeskStatus(helpdeskStatusList)
                        let projects = []
                        if (!detailedViewItem?.customerDetails) {
                            projects = resp?.data?.PROJECT.filter((f) => f?.mapping && f?.mapping?.hasOwnProperty('department') && f?.mapping?.department?.includes(auth?.currDeptId))
                        } else {
                            resp?.data?.PROJECT.forEach(element => {
                                detailedViewItem?.customerDetails?.projectMapping.forEach((ele) => {
                                    // console.log('departments', element?.mapping.department, 'customer department', ele?.entity, 'customer project', ele?.project, 'project', element?.code)
                                    if (element?.mapping && element?.mapping?.hasOwnProperty('department') && element?.mapping?.department?.includes(auth?.currDeptId) && element?.mapping?.department?.includes(ele?.entity) && ele?.project?.includes(element?.code)) {
                                        projects.push(element)
                                    }
                                })
                            })
                        }
                        setProjectLookup(projects ?? []);
                        setProjectTypes(projects)
                    })
                }
            }).catch((error) => console.log(error))
                .finally()
        }
    }, [])


    return (
        <div className="row">
            <div className="bar-left pr-0 col-lg-1 col-md-12 col-xs-12">
                <LeftBar
                    data={{
                        allList
                    }}
                    handlers={{
                        setAllList,
                        setStatusFilter,
                        setBothPageCountToZero,
                    }}
                />
            </div>

            <div className="col-lg-11 col-md-12 col-xs-12">
                <fieldset className="scheduler-border" data-select2-id="7">
                    <div className="row channel-sel align-items-center">
                        {/* <div className="col-md-2 hd-tit">
                            <h4 className="page-title">Helpdesk 360</h4>
                        </div> */}
                        {/* <div className="col-lg-2 col-md-6 hd-tit text-right">
                            <Link to={`/agent-chat`}>
                                <span className="badge badge-primary badgefont p-1 font-12">
                                    <i className="mdi mdi-chat-outline text-white font-16 pr-2" />
                                    Live Chat
                                </span>
                            </Link>
                        </div> */}
                        <div className="skle-swtab-sect">
                            <div className="db-list mb-0 pl-0">
                                <SimilarSearch
                                    data={{
                                        screenType: "Helpdesk"
                                    }}
                                />
                            </div>
                            <form className="form-inline">

                                <div className="page-title-right">
                                    <Filter
                                        refresh={refresh}
                                        setRefresh={setRefresh}
                                        data={{
                                            selfDept: "",
                                            dateRange,
                                            autoRefresh,
                                            timer,
                                            hideTimer: true
                                        }}
                                        handlers={{
                                            setSelfDept: () => { },
                                            setDateRange,
                                            setTodoPageCount: () => { },
                                            setAutoRefresh,
                                            setTimer,
                                            handleAuthChange
                                        }}
                                    />
                                </div>
                                <span className="skel-fr-sel-cust" onClick={() => setFilterIsOpen(!filterIsOpen)}>
                                    <div className="list-dashboard db-list-active skel-self cursor-pointer skel-btn-submit">
                                        <span className="db-title" onClick={() => setShowFilter(!showFilter)}> Filter{" "} <img src={filterPng} alt='filter' className="img-fluid pl-1" />
                                        </span>
                                    </div>
                                </span>
                                {<div>
                                    <Dropdown variant="btn-group">
                                        <Dropdown.Toggle className='skel-btn-submit'>Create <i className='mdi mdi-menu-down font-16'></i></Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={() => { history(`/create-helpdesk`) }}>Helpdesk</Dropdown.Item>
                                            {/* <Dropdown.Item onClick={() => { history(`/ameyo/create-helpdesk`) }}>Helpdesk via IVR</Dropdown.Item> */}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                                }

                            </form>
                        </div>

                    </div>
                    <HelpdeskFilter
                        data={{
                            showFilter,
                            helpdeskSearchParams: filter,
                            refresh
                        }}
                        handler={{
                            setShowFilter,
                            setHelpdeskSearchParams: setFilters,
                            setRefresh
                        }}
                    />
                </fieldset>
                <div className="row pt-2 px-0">
                    <div className="col-lg-7 p-0">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <div className='row mb-3'>
                                <div className='col-lg-6 col-md-12 col-xs-12'>
                                    <div className='card-box border p-0'>
                                        <Droppable droppableId="queue">
                                            {(provided, snapshot) => (
                                                <ul className="skel-helpdesk-sortable-list sortable-list tasklist list-unstyled"
                                                    ref={provided.innerRef}
                                                    style={getListStyle(snapshot.isDraggingOver)}>
                                                    <h4 className='header-title bold text-center help-title'>
                                                        Queue
                                                        &nbsp;<span className="badge badge-danger rounded-circle noti-icon-badge">{queueList.items.length}</span>
                                                    </h4>
                                                    <form onSubmit={(e) => handleOnSearchQueue(e, 'items')}>
                                                        <div className="row help-filter">
                                                            <div className="col-md-6 col-xs-6">
                                                                <select className="form-control border" id="queueSort" value={queueSort} onChange={handleOnSortChange}>
                                                                    <option value="NEW">Newest</option>
                                                                    <option value="OLD">Oldest</option>
                                                                </select>
                                                            </div>
                                                            <div className="col-md-6 col-xs-6">
                                                                <div className="input-group mb-3">
                                                                    <input type="text" className="form-control input-sm border" id='searchQueueFilter' name='items' value={searchQueueFilter} onChange={(e) => {
                                                                        handleOnSearchQueueChange(e); setSearchInput(e.target.value);
                                                                    }} placeholder="Search" aria-label="Search" />
                                                                    <div className="input-group-append">
                                                                        <button className="btn btn-light btn-sm border " type="button" onClick={(e) => handleOnSearchQueue(e, 'items')}><i className="fe-search text-dark"></i></button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </form>
                                                    {/* <div className='drop-space'> */}
                                                    <div className='skel-helpdesk-draggable skel-helpdesk-mh' id="Queue"
                                                        onScroll={handleOnScroll}>
                                                        {
                                                            !!queueList.items.length ? queueList.items.map((item, index) => (
                                                                <Draggable
                                                                    key={`h-drg-${item.helpdeskId}`}
                                                                    draggableId={`${item?.source}-${item?.helpdeskId}`}
                                                                    index={index}>
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            style={getItemStyle(
                                                                                snapshot.isDragging,
                                                                                provided.draggableProps.style
                                                                            )}
                                                                            className="skel-helpdesk-draggable-content">
                                                                            <ListItem item={item} source={'QUEUE'} handleOnIdSelection={handleOnIdSelection} handleOnAssignForMobile={handleOnAssignForMobile} />
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))
                                                                :
                                                                isQueueListLoading ?
                                                                    <p className='text-center'>Loading..</p>
                                                                    :
                                                                    <p className="skel-widget-warning">No records found!!!</p>
                                                        }
                                                    </div>
                                                    {provided.placeholder}
                                                </ul>
                                            )}
                                        </Droppable>
                                    </div>
                                </div>
                                <div className='col-lg-6 col-md-12 col-xs-12  skel-resp-mt'>
                                    <div className='card-box border p-0'>
                                        <Droppable droppableId="assigned">
                                            {(provided, snapshot) => (
                                                <ul className="skel-helpdesk-sortable-list sortable-list tasklist list-unstyled"
                                                    ref={provided.innerRef}
                                                    style={getListStyle(snapshot.isDraggingOver)}>
                                                    <h4 className='header-title bold text-center help-title'>
                                                        My Helpdesk
                                                        &nbsp;<span className="badge badge-danger rounded-circle noti-icon-badge">{queueList.selectedCount ?? 0}</span>
                                                    </h4>
                                                    <form onSubmit={(e) => handleOnSearchQueue(e, 'selected')}>
                                                        <div className="row help-filter">
                                                            <div className="col-md-6 col-xs-6">
                                                                <select className="form-control border" id="assignedQueueSort" value={assignedQueueSort} onChange={handleOnSortChange}>
                                                                    <option value="NEW">Newest</option>
                                                                    <option value="OLD">Oldest</option>
                                                                </select>
                                                            </div>
                                                            <div className="col-md-6 col-xs-6">
                                                                <div className="input-group mb-3">
                                                                    {/*  handleOnSearchQueueChange(e); */}
                                                                    <input type="text" className="form-control input-sm border" id="searchAssignQueueFilter" name='selected' value={searchAssignedQueueFilter} onChange={(e) => {
                                                                        setSearchInput(e.target.value);
                                                                    }} placeholder="Search" aria-label="Search" />
                                                                    <div className="input-group-append">
                                                                        <button className="btn btn-light btn-sm border " type="button" onClick={(e) => handleOnSearchAssignedQueue(e, 'selected')}><i className="fe-search text-dark"></i></button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </form>
                                                    <div className='skel-helpdesk-draggable skel-helpdesk-mh' id="Assigned"
                                                        onScroll={handleOnScroll}>
                                                        {
                                                            !!queueList.selected.length ? queueList.selected.map((item, index) => (
                                                                <Draggable
                                                                    key={item?.source !== 'LIVECHAT' ? `h-drg-${item.helpdeskId}` : item?.source === 'LIVECHAT' ? `c-drg-${item?.chat[0]?.chatId}` : 'id-drg-notknown'}
                                                                    draggableId={String(item?.source !== 'LIVECHAT' ? `${item?.source}-${item?.helpdeskId}` : `${item?.source}-${item?.chat[0]?.chatId}`)}
                                                                    index={index}
                                                                >
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            style={getItemStyle(
                                                                                snapshot.isDragging,
                                                                                provided.draggableProps.style
                                                                            )}
                                                                            className="skel-helpdesk-draggable-content"
                                                                        >
                                                                            <ListItem item={item} source={'ASSIGNED'} handleOnIdSelection={handleOnIdSelection} />
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))
                                                                :
                                                                isAssignedQueueListLoading ?
                                                                    <p className='text-center'>Loading..</p>
                                                                    :
                                                                    <p className="skel-widget-warning">No records found!!!</p>
                                                        }
                                                    </div>
                                                    {provided.placeholder}
                                                </ul>
                                            )}
                                        </Droppable>
                                    </div>
                                </div>
                            </div>
                        </DragDropContext>
                    </div>
                    <div className="col-lg-5">
                        {
                            detailedViewItem && detailedViewItem.laneSource === 'ASSIGNED' ? (
                                <DetailedView
                                    data={{
                                        detailedViewItem: getReleventHelpdeskDetailedData(detailedViewItem?.source, detailedViewItem),
                                        socket: socket,
                                        helpdeskDetails
                                    }}
                                    handlers={{
                                        doSoftRefresh,
                                        handleAutoRefresh,
                                        setHelpdeskDetails
                                    }}
                                />
                            )
                                : (
                                    <div className="bg-helpdesk-img" />
                                )
                        }
                    </div>
                    {isViewTicketDetailsOpen &&
                        <ViewTicketDetailsModal
                            data={{
                                isViewTicketDetailsOpen,
                                detailedViewItem: getReleventHelpdeskDetailedData(detailedViewItem?.source ?? detailedViewItem?.helpdeskSource?.description, detailedViewItem)
                            }}
                            handlers={{
                                setIsViewTicketDetailsOpen
                            }}
                        />
                    }
                    {
                        isCreateHelpdeskOpen &&
                        <EditHelpdeskModal
                            data={{
                                isCreateHelpdeskOpen,
                                detailedViewItem,
                                projectTypes,
                                helpdeskStatus,
                                helpdeskTypes,
                                severities,
                                cancelReasonLookup,
                                projectLookup,
                                helpdeskID,
                                source: 'Assign',
                                helpdeskDetails
                            }}
                            handlers={{
                                doSoftRefresh,
                                setProjectLookup,
                                setProjectTypes,
                                setIsCreateHelpdeskOpen,
                                assignHelpdesk,
                                getCustomerDetails,
                                handleAutoRefresh,
                                setHelpdeskDetails
                            }}
                        />
                    }
                </div>
            </div>
        </div>
    )
}

export default Helpdesk;