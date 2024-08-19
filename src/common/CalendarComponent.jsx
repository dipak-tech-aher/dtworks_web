import React, { useState, useRef, useMemo, useContext } from 'react';
import { Modal } from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { useEffect } from 'react';
import { statusConstantCode } from '../AppConstants';
import { AppContext } from '../AppContext';
import moment from 'moment';

const CalendarComponent = ({ data, handlers }) => {
    const { appConfig } = useContext(AppContext);
    const { show, events } = data;
    const { setShow } = handlers;
    const calendarRef = useRef();

    const [weekends] = useState(true)
    const [initialView] = useState("dayGridMonth")
    const [displayedEvents, setDisplayedEvents] = useState([]);
    const [eventLimit, setEventLimit] = useState(3);
    const [chosenEvent, setChosenEvent] = useState({});
    const [popUp, setPopUp] = useState(false);
    // console.log(displayedEvents)
    const memoizedEventsFn = useMemo(() => {
        return displayedEvents.map(x => ({
            ...x,
            start: new Date(moment.utc(x.start).format('YYYY-MM-DD HH:mm:ss')),
            end: new Date(moment.utc(x.end).format('YYYY-MM-DD HH:mm:ss')),
            allDay: true,
            extendedProps: {
                ...x.extendedProps,
                joinable: true, // Add a joinable property to each event
            }
        }));
    }, [displayedEvents]);

    useEffect(() => {
        setDisplayedEvents(events);
    }, [events, eventLimit]);

    const handleLoadMore = () => {
        setEventLimit(eventLimit + 3);
    };

    const formatTime = (date) => {
        const options = {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    };

    const handleClose = () => {
        setPopUp(false);
        setChosenEvent({});
    };

    const openInNewTab = (url) => {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
        if (newWindow) newWindow.opener = null
    }

    const onClickUrl = (url) => {
        return () => openInNewTab(url)
    }

    const handleJoinMeeting = (eventClickInfo) => {
        const event = eventClickInfo.event;
        setChosenEvent(event)
        setPopUp(true)
    };

    useEffect(() => {
        if (!show) {
            handleClose();
        }
    }, [show])

    return (
        <>
            <Modal show={show} backdrop="static" onHide={() => { setShow(false); }} dialogClassName="wsc-cust-mdl-temp-prev">
                <Modal.Header>
                    <Modal.Title>{appConfig?.clientFacingName?.customer ?? 'Customer'} events</Modal.Title>
                    <button type="button" className="close mr-2 mt" variant="secondary" onClick={() => handlers.setShow(false)}><span aria-hidden="true">×</span></button>
                </Modal.Header>
                <Modal.Body>
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                        initialView={initialView}
                        dayMaxEventRows={eventLimit}
                        headerToolbar={{
                            start: "prev,next today",
                            center: "title",
                            end: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                        }}
                        eventClick={handleJoinMeeting}
                        weekends={weekends}
                        events={memoizedEventsFn}
                        eventContent={(eventInfo) => (
                            <>
                                {(eventInfo.event.start && eventInfo.event.end) && (
                                    <div>{formatTime(eventInfo.event.start)} - {formatTime(eventInfo.event.end)}</div>
                                )}
                                <div>{eventInfo.event.title !== 'null' ? eventInfo.event.title : ''}</div>

                            </>
                        )}
                    />
                </Modal.Body>
            </Modal>


            <Modal show={popUp} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="wsc-cust-mdl-temp-prev cust-sm-modal skel-cal-popup-details">
                <Modal.Header closeButton>
                    <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                        {/* <span aria-hidden="true">×</span> */}
                    </button>
                </Modal.Header>
                <Modal.Body>
                <div className='fc-event-time fc-event-title' style={{ width: '400px', alignContent: 'center' }}>
                        <ul>
                            {chosenEvent?.title && (
                                <li>
                                    <b>
                                        {chosenEvent.title}
                                        {chosenEvent.extendedProps?.customerName ? ` - ${chosenEvent.extendedProps.customerName}` : ''}
                                    </b>
                                </li>
                            )}
                            {chosenEvent?.start && chosenEvent?.end && (
                                <li>
                                    <strong>Duration: </strong>{formatTime(chosenEvent.start)} - {formatTime(chosenEvent.end)}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.appointCategory && (
                                <li>
                                    <strong>Appointment category: </strong>{chosenEvent.extendedProps.appointCategory}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.appoinmentMode && (
                                <li>
                                    <strong>Appointment mode: </strong>{chosenEvent.extendedProps.appoinmentMode}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.serviceName && (
                                <li>
                                    <strong>Service name: </strong>{chosenEvent.extendedProps.serviceName}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.contractName && (
                                <li>
                                    <strong>Contract name: </strong>{chosenEvent.extendedProps.contractName}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.intxnCategory?.description && (
                                <li>
                                    <strong>Interaction category: </strong>{chosenEvent.extendedProps.intxnCategory.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.intxnType?.description && (
                                <li>
                                    <strong>Interaction type: </strong>{chosenEvent.extendedProps.intxnType.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.intxnStatus?.description && (
                                <li>
                                    <strong>Interaction status: </strong>{chosenEvent.extendedProps.intxnStatus.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.orderCategory?.description && (
                                <li>
                                    <strong>Order category: </strong>{chosenEvent.extendedProps.orderCategory.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.orderType?.description && (
                                <li>
                                    <strong>Order type: </strong>{chosenEvent.extendedProps.orderType.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.orderStatus?.description && (
                                <li>
                                    <strong>Order status: </strong>{chosenEvent.extendedProps.orderStatus.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.status?.description && (
                                <li>
                                    <strong>Status: </strong>{chosenEvent.extendedProps.status.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.serviceCategory?.description && (
                                <li>
                                    <strong>Service category: </strong>{chosenEvent.extendedProps.serviceCategory.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.serviceType?.description && (
                                <li>
                                    <strong>Service type: </strong>{chosenEvent.extendedProps.serviceType.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.serviceClass?.description && (
                                <li>
                                    <strong>Service class: </strong>{chosenEvent.extendedProps.serviceClass.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.rcAmount && (
                                <li>
                                    <strong>RC amount: </strong>{chosenEvent.extendedProps.rcAmount}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.otcAmount && (
                                <li>
                                    {chosenEvent.extendedProps.otcAmount}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.requestStatement && (
                                <li>
                                    <strong>Request statement: </strong>{chosenEvent.extendedProps.requestStatement}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.intxnPriority?.description && (
                                <li>
                                    <strong>Interaction priority: </strong>{chosenEvent.extendedProps.intxnPriority.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.orderPriority?.description && (
                                <li>
                                    <strong>Order priority: </strong>{chosenEvent.extendedProps.orderPriority.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.intxnChannel?.description && (
                                <li>
                                    <strong>Interaction channel: </strong>{chosenEvent.extendedProps.intxnChannel.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.orderChannel?.description && (
                                <li>
                                    <strong>Order channel: </strong>{chosenEvent.extendedProps.orderChannel.description}
                                </li>
                            )}
                            {chosenEvent?.extendedProps?.appointMode && (
                                <li>
                                    <strong>Appointment mode: </strong>
                                    {(chosenEvent.extendedProps.appointMode === statusConstantCode?.businessEntity?.AUDIOCONF
                                        || chosenEvent.extendedProps.appointMode === statusConstantCode?.businessEntity?.VIDEOCONF) ? (
                                        <a target='_new' className='btn btn-primary' style={{ color: 'white' }} onClick={() => onClickUrl(chosenEvent.extendedProps.url ?? '')}>Join</a>
                                    ) : ''}
                                </li>
                            )}
                        </ul>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );

}

export default CalendarComponent;