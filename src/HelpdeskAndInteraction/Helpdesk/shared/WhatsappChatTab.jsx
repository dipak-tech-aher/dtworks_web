import React, { useRef, useState, useEffect, memo } from 'react';

import { properties } from '../../../properties';
import { post, put } from '../../../common/util/restUtil';
import socketClient, { } from "socket.io-client";
import boopSfx from '../../../assets/audio/AiosMsgSound.mp3';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');


const WhatsappChatTab = memo((props) => {

    const { detailedViewItem, readOnly = false } = props.data;

    const [socket, setSocket] = useState();
    const [message, setMessage] = useState('');
    const [messageArr, setMessageArr] = useState([]);
    let colorAlign;
    const chatRef = useRef(null)


    dayjs.extend(utc);
    dayjs.extend(timezone);
    let date = dayjs();
    let time = `${date.hour()}:${date.minute()}`;
    let AMPM = date.hour() > 12 ? ' PM' : ' AM';

    useEffect(() => {
        const socketIO = socketClient(properties.API_ENDPOINT, { //removed properties.API_ENDPOINT and add '' for UAT & PROD
            //path: properties.SOCKET_PATH,
            //port: properties.API_SERVICE_PORT          
        });
        socketIO.on('connect', () => {
            put(`${properties.HELPDESK_API}/update-socket/${detailedViewItem?.chatId}`, { "socketId": socketIO.id }).catch((err) => {
                console.error(err);
            })
        });
        setSocket(socketIO)
    }, [detailedViewItem])

    useEffect(() => {
        if (readOnly === false) {
            if (socket !== undefined) {
                let colorAlign = {
                    from: "User",
                    textAlign: "left",
                    bgColor: "#F5F6F7",
                };

                socket.on('receiveFromWhatsApp', (msg) => {
                    if (!detailedViewItem?.message?.includes(msg)) {
                        // console.log('detailedViewItem', detailedViewItem)
                        detailedViewItem?.messageColorAlign.push(colorAlign);
                        detailedViewItem?.message.push(msg);
                        let array = [];
                        detailedViewItem?.message.map((userMsg, index) => {
                            array.push({ ...detailedViewItem?.messageColorAlign[index], msg: userMsg })
                        })
                        let body = {
                            chatId: detailedViewItem?.chatId,
                            email: detailedViewItem?.emailId,
                            message: array
                        }
                        
                        post(`${properties.CHAT_API}/message`, body)
                            .then((resp) => {
                                playSound();
                                scrollToBottom();
                                // console.log("Response :", resp?.message)
                            })
                            .catch((error) => {
                                console.error(error);
                            })
                            .finally()
                        setMessageArr([...messageArr, message]);
                    }
                });
            }
        }
    }, [socket])

    const handleOnMessageChange = (e) => {
        const { value } = e.target;
        setMessage(value);
    }

    const handleSendMessage = () => {
        let body
        colorAlign = {
            from: 'Agent',
            textAlign: 'right',
            bgColor: '#48B0F7',
        }
        detailedViewItem?.messageColorAlign.push(colorAlign)
        detailedViewItem?.message.push(message + '\n' + time + AMPM)
        let array = []
        detailedViewItem?.message.map((agentMsg, index) => {
            array.push({ ...detailedViewItem?.messageColorAlign[index], msg: agentMsg })
        })

        

        body = {
            message,
            from: detailedViewItem?.contactNo
        }
        // console.log(properties.INTEGRATION_API + "/whatsapp/send-message")
        post(properties.INTEGRATION_API + "/whatsapp/send-message", body)

        body = {
            chatId: detailedViewItem?.chatId,
            email: detailedViewItem?.emailId,
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

        setMessage('');//Do not remove it    
    }

    const scrollToBottom = () => {
        chatRef.current.scrollIntoView({ behavior: 'smooth' })
    }

    const playSound = () => {
        const demo = document.getElementsByClassName('message-notification')[0]
        demo.play()
    }

    // console.log('detailedViewItem--->', detailedViewItem)

    return (
        <div className="card-body">
            <div className="col-12">
                <div className="card border">
                    <div className="card-body py-2 px-3 border-bottom bg-light">
                        <div className="media py-1">
                            <div className="media-body">
                                <h5 className="mt-0 mb-0 font-15">
                                    <div className="text-primary cursor-pointer">{detailedViewItem?.customerName}</div>
                                </h5>
                            </div>
                        </div>
                    </div>
                    <audio className="message-notification">
                        <source src={boopSfx} type="audio/mpeg" >
                        </source>
                    </audio>
                    <div className="card-body p-0">
                        <div className="card card-bordered chat-page">
                            <div className="ps-container ps-theme-default ps-active-y pb-4" id="chat-content" style={{ height: "400px !important" }}>
                                <div className="media media-chat">
                                    <div className="media-body" style={{ whiteSpace: "pre-line", width: "100%" }}>
                                        {
                                            detailedViewItem?.message?.map((value, index) => {
                                                return (
                                                    <div style={{ width: "100%", display: "inline-block" }} key={index}>
                                                        <div style={{ float: !!detailedViewItem?.messageColorAlign?.length ? detailedViewItem?.messageColorAlign[index].textAlign : value?.textAlign }}>
                                                            <li
                                                                style={{
                                                                    listStyleType: "none",
                                                                    backgroundColor: !!detailedViewItem?.messageColorAlign?.length ? detailedViewItem?.messageColorAlign[index].bgColor : value?.bgColor,
                                                                    textAlign: "left",
                                                                    borderRadius: "50px",
                                                                    padding: "12px 38px"
                                                                }}
                                                                className="chat-box">
                                                                {typeof (value) === 'object' ? value.msg : value}
                                                            </li>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        }
                                        <div ref={chatRef} />
                                    </div>
                                </div>
                                <div className="ps-scrollbar-x-rail" style={{ left: "0px", bottom: "0px" }}>
                                    <div className="ps-scrollbar-x" tabIndex="0" style={{ left: "0px", bottom: "0px" }}></div>
                                </div>
                                <div className="ps-scrollbar-y-rail" style={{ top: "0px", height: "0px", right: "2px" }}>
                                    <div className="ps-scrollbar-y" tabIndex="0" style={{ top: "0px", height: "0px", right: "2px" }}></div>
                                </div>
                            </div>
                            <div className={`publisher bt-1 border-grey ${readOnly ? 'd-none' : ''}`} style={{ position: "relative", width: "100%" }}>
                                <img className="avatar-icon avatar-icon-icon-xs" src="https://img.icons8.com/color/36/000000/administrator-male.png" alt="..." />
                                <textarea cols="50" rows="1" className="publisher-input" placeholder="Write something" value={message || ''} onChange={handleOnMessageChange} />
                                <div className="chat-buttons clearfix">
                                    <button type="button" className="btn btn-primary btn-sm waves-effect waves-light" onClick={handleSendMessage}><i className="fa fa-paper-plane"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
})

export default WhatsappChatTab;