import { useEffect, useState, useRef } from "react";
import BubbleChart from "./MovingBubbleChart";
import { properties } from "../../../properties";
import { get, post } from "../../../common/util/restUtil";
import chroma from 'chroma-js';
import { io } from "socket.io-client";

const LiveCustomerInsights = (props) => {
    const [chartData, setChartData] = useState([])
    const [labels, setLabels] = useState([]);
    const positionsRef = useRef(null)
    const chartDataRef = useRef(null)
    const statusRef = useRef(null)
    // Generate random color for each status
    const getColorForStatus = (() => {
        const colorMap = {};
        return (status) => {
            if (!colorMap[status]) {
                colorMap[status] = chroma.random().hex();
            }
            return colorMap[status];
        };
    })();

    const width = 860
    const height = 600
    const center = { x: width / 2, y: height / 2 }; // Center coordinates of the canvas
    const radius = Math.min(width, height) / 3; // Radius based on canvas size


    function getPosition(data, statusList) {
        const angleStep = (2 * Math.PI) / statusList.length; // Angle between each status

        const positions = statusList.map((status, index) => {
            let count = data.filter(item => item.statusDesc?.code === status.code).length;
            return {
                status: status.description,
                cnt: count ?? 0,
                statusCode: status.code,
                color: getColorForStatus(status.description),
                x: center.x + radius * Math.cos(angleStep * index),
                y: center.y + radius * Math.sin(angleStep * index),
            }
        });

        // const positions = [
        //     { status: "New", x: width/6, y: height/4, color: "#c9c9c9", cnt: 0 },
        //     { status: "Assigned", x: 3*width/6, y: height/4, color: "#BEE5AA", cnt: 0 },
        //     { status: "Closed", x: width/6, y: 3*height/4, color: "#93D1BA", cnt: 0 },
        //     { status: "Abandoned", x: 3*width/6, y: 3*height/4, color: "#a579ce", cnt: 0 },
        // ];

        return positions
    }
    const initialChartData = async (data, statusList) => {

        const positions = getPosition(data, statusList)

        positionsRef.current = positions
        setLabels(positions);

        const statusCounts = {};

        statusList.forEach(status => {
            statusCounts[status.description] = 0;
        });

        statusList.forEach(status => {
            data.forEach(obj => {
                const istatus = obj.statusDesc?.description;
                if (istatus === status.description) {
                    statusCounts[status.description]++;
                }
            });
        });

        const weights = {};
        statusList.forEach(status => {
            weights[status.description] = statusCounts[status.description] / Object.values(statusCounts).reduce((acc, count) => acc + count, 0);
        });

        const maxBubbles = {};
        const minBubbleCount = 10;

        Object.entries(statusCounts).forEach(([status, count], index) => {
            if (count >= minBubbleCount) {
                maxBubbles[status] = Math.round(weights[status] * 100);
            } else {
                maxBubbles[status] = count;
            }
        });

        const newData = [];

        positions.forEach((pos, index) => {
            data.forEach((value, i) => {
                if (pos?.status === value?.statusDesc?.description) {
                    const x = pos?.x
                    const y = pos?.y
                    const status = pos.status
                    const chatId = value?.chatId;
                    newData.push({
                        index: newData.length + 1,
                        focus: {
                            status,
                            index: index + 1,
                            color: pos.color,
                            x: x + Math.random(),
                            y: y + Math.random(),
                        },
                        x: x + Math.random(),
                        y: y + Math.random(),
                        r: 5,
                        chatId
                    });
                }
            })
        })
        chartDataRef.current = newData
        setChartData(newData);
    }

    const updateChartData = async (updatedData) => {
        // Extract relevant information from updatedData       
        console.log('inside the update chart data')
        if (Array.isArray(updatedData)) {
            let updatedChartData = [], updatedLabels = []

            updatedData.forEach(data => {
                const { fromStatus, toStatus, chatId } = data;
                // const {statusList, data} = await callApi()
                // const positions = getPosition(data, statusList)
                const isChatExist = chartDataRef.current.some(item => Number(item.chatId) === Number(chatId))
                console.log('isChatExist ', isChatExist)
                if (isChatExist) {
                    updatedLabels = positionsRef.current && positionsRef.current?.map(label => {
                        if (label.status.includes(fromStatus)) {
                            return {
                                ...label,
                                cnt: label.cnt - 1,
                            };
                        } else if (label.status.includes(toStatus)) {
                            return {
                                ...label,
                                cnt: label.cnt + 1,
                            };
                        }
                        return label;
                    });
                    // console.log('updatedLabels ', updatedLabels)
                    // setUpdatedLabels(updatedLabels);
                    positionsRef.current = updatedLabels
                    setLabels(updatedLabels);

                    updatedChartData = chartDataRef.current.map(item => {
                        let matchingBubble;
                        if (Number(item.chatId) === Number(chatId)) {
                            matchingBubble = chartDataRef.current.find(bubble => bubble.focus.status === toStatus);
                            console.log('matchingBubble ', matchingBubble)
                            if (matchingBubble) {
                                item.focus = { ...matchingBubble.focus };
                                item.focus.x = matchingBubble.focus.x;
                                item.focus.y = matchingBubble.focus.y;
                            } else {
                                matchingBubble = positionsRef.current.find(pos => pos.status === toStatus);
                                item.focus = { ...matchingBubble };
                                item.focus.x = matchingBubble.x;
                                item.focus.y = matchingBubble.y;
                            }
                        }

                        return item;
                    });
                } else {
                    updatedLabels = positionsRef.current && positionsRef.current?.map(label => {
                        if (label.status.includes(toStatus)) {
                            return {
                                ...label,
                                cnt: label.cnt + 1,
                            };
                        }
                        return label;
                    });
                    positionsRef.current = updatedLabels
                    setLabels(updatedLabels);
                    const pos = positionsRef.current.find(label => label.status.includes(toStatus))
                    const x = pos?.x
                    const y = pos?.y
                    const status = pos.status
                    const obj = {
                        index: chartDataRef.current.length + 1,
                        focus: {
                            status,
                            index: chartDataRef.current.length + 1,
                            color: pos.color,
                            x: x + Math.random(),
                            y: y + Math.random(),
                        },
                        x: x + Math.random(),
                        y: y + Math.random(),
                        r: 5,
                        chatId
                    }
                    updatedChartData = [...chartDataRef.current, obj];
                }
                chartDataRef.current = updatedChartData
                setChartData(updatedChartData);
            })
        }

    }

    const callApi = async () => {
        let statusList, data
        try {
            const resp1 = await get(`${properties.MASTER_API}/lookup?searchParam=code_type&valueParam=CHAT_STATUS`);
            statusList = resp1?.data?.CHAT_STATUS;
            statusRef.current = statusList
            const resp2 = await post(`${properties.CHAT_API}/chat-details?limit=0&page=0`, {});
            if (resp2.data) {
                data = resp2?.data?.rows
                initialChartData(data, statusList);
            }
        } catch (error) {
            console.error(error);
        }

        return { statusList, data }
    }

    useEffect(() => {
        // if (chartData.length) {
        //     const nedata = {
        //         "chatId": "85",
        //         "fromStatus": "New",
        //         "toStatus": "Assigned"
        //     }
        //     setInterval(() => {
        //         updateChartData(nedata)
        //     }, 10000)
        // }        
        const { statusList, data } = callApi()
        const socket = io(`${properties.CHAT_SOCKET_ENDPOINT}`, {
            transports: ['websocket'],
            extraHeaders: {
                'x-tenant-id': properties.REACT_APP_TENANT_ID
            }
        });
        // WebSocket event listeners and cleanup
        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });

        socket.on('dataUpdated', (updatedData) => {
            console.log('Received updated data:', updatedData);
            updateChartData(updatedData)
        });


        return () => socket.disconnect();

    }, [])

    return (
        <div className="col-md-8">
            <div className="cmmn-skeleton">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Live Customer Insights</span>
                </div>
                <hr className="cmmn-hline" />
                <BubbleChart data={{ chartData, labels }} />
            </div>
        </div>
    )
}

export default LiveCustomerInsights;