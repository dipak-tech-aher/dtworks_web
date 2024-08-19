import React, { useEffect, useRef, useState } from 'react'
import new_dt_works_logo_symbol from '../../../assets/images/dt-works-icon.png'
import socketClient from "socket.io-client";
import { properties } from '../../../properties';
import { toast } from 'react-toastify';
import { get, post, put } from '../../util/restUtil';
import moment from 'moment'
import ChatBox from '../../../Chat/AgentChat/ChatBox';
import _ from "lodash";
import notificationTone from '../../../assets/audio/notification_tone.mp3'
export default function CommonLiveChat(props) {
    const [state, setState] = useState({});
    const [socket, setSocket] = useState();
    const [showChatBox, setShowChatBox] = useState(false)
    const [message, setMessage] = useState('');
    const chatRef = useRef(null)
    const [msgObject, setMsgObject] = useState({});
    const [messageArr, setMessageArr] = useState([]);
    let colorAlign;
    const [connectedCustomer, setConnectedCustomer] = useState([]);
    let localObj = localStorage.getItem('GLOBALCHATOBJ')
    const [notification, setNotification] = useState(false);
    const notiRef = useRef(notification);
    useEffect(() => {
        notiRef.current = notification;
    }, [notification]);
    useEffect(() => {
        if (localObj) {
            setState(JSON.parse(localStorage.getItem('GLOBALCHATOBJ')))
        }
    }, [localObj])

    let { selectedCustomer } = state
    // Default selected customer while loading the page
    useEffect(() => {
        let socketIO
        // console.log('socket in useeffect', socket)
        if (!socket) {
            // Local server Only - Port -> API chat port
            // socketIO = socketClient('http://localhost:4037', { //removed properties.API_ENDPOINT and add '' for UAT & PROD
            //     // path: properties.SOCKET_PATH, //Enable it for UAT & PROD
            //     // port: properties.API_SERVICE_PORT, //Enable it for UAT & PROD
            //     // closeOnBeforeunload: false
            // });
            // UAT & PROD Only 
            socketIO = socketClient('', { //removed properties.API_ENDPOINT and add '' for UAT & PROD
                path: properties.SOCKET_PATH, //Enable it for UAT & PROD
                port: properties.API_SERVICE_PORT, //Enable it for UAT & PROD
                closeOnBeforeunload: false
            });
            setSocket(socketIO)
        }

    }, []);
    useEffect(() => {

        // if (socket !== undefined) {    
        connectedCustomerByAgent();

    }, [socket]);
    const scrollToBottom = () => {
        chatRef?.current?.scrollIntoView?.({ behavior: 'smooth' })
    }
    const endChat = (chatId, message, style, call) => {
        if (chatId && !call) {
            const msgType = msgObject.type === 'media' ? 'media' : 'text';
            socket.emit("CLIENT-2", msgType + '@@@' + 'ChatEnded' + '^^' + selectedCustomer.socketId);
            socket.emit("disconnection", `text@@@${message}^^${selectedCustomer.socketId}`);
        }
        put(`${properties.CHAT_API}/end`, { chatId: chatId, message: message.toString(), messageFrom: "Chat" })
            .then((resp) => {
                if (resp.status === 200) {
                    _.remove(connectedCustomer, { 'chatId': chatId })
                    socket.disconnect();
                    connectedCustomerByAgent();
                    // Remove Global Chat
                    localStorage.removeItem('GLOBALCHATOBJ')
                    localStorage.removeItem('GLOBALCHAT')
                    props?.setGlobalChatEnable?.(false)
                } else {
                    toast.error("Failed to endChat - " + resp.status);
                }
            }).catch((error) => {
                console.log(error)
            }).finally();

        // // Send the DT survey link to customer to fill the survey
        // try {
        //     post(properties.COMMON_API + '/dropthought/chat/survey-link', { chatId },
        //         { headers: { 'Content-Type': 'application/json' } }
        //     ).then((resp) => {
        //         if (resp && resp?.data) {
        //             handleSendMessage(resp?.data)
        //         }
        //     }).catch(e => console.log('error', e));
        // } catch (e) {
        //     console.log('error', e)
        // }

    }

    // console.log('socket',socket)
    const handleSendMessage = (surveyLink) => {
        if (surveyLink) {

            msgObject.message = surveyLink

        }

        const time = moment(new Date()).format('hh:mm:ss A')
        console.log('selectedCustomer in method ', selectedCustomer)
        colorAlign = {
            from: 'Agent',
            textAlign: 'right',
            bgColor: '#afcfeb',
            cssClass: 'chats chats-right'
        }
        // const msg = msgObject.type === 'media' ? msgObject.message : message
        const msg = msgObject.type === 'media' ? msgObject.message : message + '\n' + time
        const msgType = msgObject.type === 'media' ? 'media' : 'text';
        connectedCustomer.forEach(element => {
            // console.log('msg-----xx--->', msg)
            // console.log('msgType---xx----->', msgType)
            if (element.chatId === selectedCustomer.chatId) {
                element.messageColorAlign.push(colorAlign)
                element.message.push(msgType + '@@@' + msg)
                let array = []
                element.message.map((agentMsg, index) => {
                    array.push({ ...element.messageColorAlign[index], msg: agentMsg, socketId: element.socketId })
                })
                let body = {
                    chatId: element?.chatId,
                    email: element?.emailId,
                    message: array
                }

                post(properties.CHAT_API + "/message", body)
                    .then((resp) => {
                        scrollToBottom()
                        // console.log("Response :", resp?.message)
                    })
                    .catch((error) => {
                        console.log("error : ", error)
                    })
                    .finally()
                setMessageArr([...messageArr, message]);
                //   selectCustomer(element.chatId);
            }
        });
        //Send Message to Server 

        if (selectedCustomer.source === 'WHATSAPP') {
            const body = {
                message: msg,
                msgType,
                from: selectedCustomer.contactNo
            }
            // console.log(properties.INTEGRATION_API + "/whatsapp/send-message")
            post(properties.INTEGRATION_API + "/whatsapp/send-message", body)
        } else {
            // console.log('here in socket connetion-------->', msg)
            socket.emit("CLIENT-2", msgType + '@@@' + msg + '^^' + selectedCustomer.socketId);
        }
        setMessage('');//Do not remove it  
        // document.getElementById('chooseFile').value = null; //Do not remove it
        setMsgObject({})
    }
    const connectedCustomerByAgent = () => {

        //customerQueue();
        get(`${properties.CHAT_API}/assigned?source=`)
            .then((resp) => {
                if (resp.data) {
                    if (resp.status === 200) {
                        resp.data.forEach(element => {
                            let messages = []
                            get(`${properties.CHAT_API}/message?email=${element?.emailId}&id=${element?.chatId}`)
                                .then((response) => {
                                    // console.log('response  ', response)
                                    if (response?.data) {
                                        messages = response?.data
                                        element["message"] = _.map(response?.data, 'msg');
                                        element["messageColorAlign"] = messages.map((agentMsg) => { delete agentMsg?.msg; return agentMsg })
                                    }
                                    else {
                                        element["message"] = [];
                                        element["messageColorAlign"] = [];
                                    }
                                    let result = _.unionBy(connectedCustomer, resp.data, 'chatId');
                                    //result = _.filter(result, { 'status': 'Assigned' });
                                    setConnectedCustomer(result);
                                    //  setAssignedCustomerCount(result.length)
                                }).catch((error) => {
                                    console.log(error)
                                })
                            // console.log('socket inside connected ', socket)
                            // element.socketId.on('connect', () => { })
                            //  put(`${properties.HELPDESK_API}/update-socket/${element?.chatId}`, { "socketId": socket.id })
                        }
                        );
                    }
                    else {
                        toast.error("Failed to create - " + resp.status);
                    }
                }
                else {
                    toast.error("Uexpected error ocurred " + resp.statusCode);
                }
            }).catch((error) => {
                console.log(error)
            }).finally();
    }
    //Receive Message from Agent

    selectedCustomer && connectedCustomer.forEach((element) => {
        colorAlign = {
            from: "User",
            textAlign: "left",
            bgColor: "#a8acf7",
            cssClass: 'chats'
        };
        socket && socket.off(element.socketId).on(element.socketId + "-CLIENT-2", (msg) => {
            // console.log('inside receive livechat message ', msg)
            // console.log('element---------> ', element)
            // console.log('selectedCustomer---------> ', selectedCustomer)
            if (element.chatId === selectedCustomer.chatId) {
                if (!element.message.includes(msg)) {
                    playAudio(notiRef.current);
                    element.messageColorAlign.push(colorAlign);
                    element.message.push(msg);
                    let array = []
                    element.message.map((userMsg, index) => {
                        array.push({ ...element.messageColorAlign[index], msg: userMsg, socketId: element.socketId })
                    })
                    let body = {
                        chatId: element?.chatId,
                        email: element?.emailId,
                        message: array
                    }

                    post(properties.CHAT_API + "/message", body)
                        .then((resp) => {
                            // playSound()
                            scrollToBottom()
                            // console.log("Response :", resp?.message)
                        })
                        .catch((error) => {
                            console.log("error : ", error)
                        })
                        .finally()
                    setMessageArr([...messageArr, message]);
                    // This logic only apply customer when click on end chat (Chat connection was disconnected)
                    if (msg && msg.split('@@@')[1] === 'ChatEnded') {
                        setMessageArr([...messageArr, `Thank you for connecting. The connection was closed by Customer`]);
                        element.messageColorAlign.push(colorAlign);
                        const time = moment(new Date()).format('hh:mm:ss A')
                        element.message.push(`text@@@Thank you for connecting. The connection was closed by Customer.\n${time}`);
                        let array = []
                        element.message.map((userMsg, index) => {
                            array.push({ ...element.messageColorAlign[index], msg: userMsg, socketId: element.socketId })
                        })
                        setTimeout(() => {
                            endChat(selectedCustomer?.chatId, selectedCustomer?.message, null, true)
                        }, 3000)
                        return
                    }
                }
            }
        });

        socket && socket.on('receiveFromWhatsApp', (msg) => {
            // console.log('inside receive whatsapp message ', msg)
            if (element.chatId === selectedCustomer.chatId) {
                if (!element.message.includes(msg)) {
                    playAudio(notiRef.current);
                    element.messageColorAlign.push(colorAlign);
                    element.message.push(msg);
                    let array = []
                    element.message.map((userMsg, index) => {
                        array.push({ ...element.messageColorAlign[index], msg: userMsg, socketId: element.socketId })
                    })
                    let body = {
                        chatId: element?.chatId,
                        email: element?.emailId,
                        message: array
                    }

                    post(properties.CHAT_API + "/message", body)
                        .then((resp) => {
                            // playSound()
                            scrollToBottom()
                            // console.log("Response :", resp?.message)
                        })
                        .catch((error) => {
                            console.log("error : ", error)
                        })
                        .finally()
                    setMessageArr([...messageArr, message]);
                }
            }
        });
    });
    
    const playAudio = async (enabled) => {
        const AudioPlay = new Audio(notificationTone);
        try {
            if (enabled) {
                await AudioPlay.play();
            }
        } catch (error) {
            console.error("Autoplay failed:", error);
        }
    };

    return (
        <div className="consumer-live-chat-sect">
            <label htmlFor="click" >
                <div className="skel-cons-chat-bubble ml-1" id="chat-bubble-start" onClick={() => { setShowChatBox(true) }}>
                    <img src={new_dt_works_logo_symbol} alt="chat-bcae-logo" className="img-fluid"></img>
                </div>
            </label>
            {showChatBox && <div>
                {/* <div className="chat-box">
                        <div className="chat-screen"> */}
                <div className="chat skel-consumer-live-chat-base" id="chat-open-consumer">
                    <div className="skel-consumer-message-container">
                        {/* <div className="skel-consumer-chat-top-sect skel-consumer-chat-top-info">

                            {/* <div className="skel-consumer-chat-title" onClick={() => { setShowChatBox(false) }}>
                                <span className="mt-0" ><i className="fa fa-minus">                                        </i>
                                </span>
                            </div> 

                        </div> */}
                        <ChatBox data={{ chatRef, message, selectedCustomer, connectedCustomer, showCustomer: showChatBox, from: 'Chat', notification }} handlers={{ handleSendMessage, setMessage, endChat, setShowCustomer: setShowChatBox, setNotification }} />
                    </div>

                </div>
            </div>}
        </div>
    )
}
