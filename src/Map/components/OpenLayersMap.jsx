import Feature from 'ol/Feature';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import View from 'ol/View';
import { toStringHDMS } from 'ol/coordinate';
import Point from 'ol/geom/Point';
import { Vector as VectorLayer } from 'ol/layer';
import TileLayer from 'ol/layer/Tile';
import 'ol/ol.css';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Vector as VectorSource } from 'ol/source';
import OSM from 'ol/source/OSM';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import React, { useEffect, useRef, useState } from 'react';
import { CloseButton, Modal } from 'react-bootstrap';
import { post, get } from "../../common/util/restUtil";
import { properties } from '../../properties';
import moment from 'moment';
import DynamicTable from '../../common/table/DynamicTable';
import RegularShape from 'ol/style/RegularShape';
import { useHistory }from "../../common/util/history";


function OpenLayersMap({ circles }) {
    const history = useHistory()

    const mapRef = useRef(null);
    const popupRef = useRef(null);
    const popupOverlayRef = useRef(null);
    const [modalDetailsOpen, setModalDetailsOpen] = useState(false)
    const [counts, setCounts] = useState({})
    const [countsData, setCountsData] = useState({})
    const [dataList, setDataList] = useState([]);
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [type, setType] = useState("");
    const [metaData, setMetaData] = useState({});
    const [openPopUp, setOpenPopUp] = useState(false);
    let [visibleTags, setVisibleTags] = useState({});
    const [showAll, setShowAll] = useState(false);
    const [missionColumns, setMissionColums] = useState([
        {
            Header: "Stakeholder name",
            accessor: "leadDesc.leadName",
            disableFilters: true,
            id: "missionLeadName"
        },
        {
            Header: "Mission name",
            accessor: "missionName",
            disableFilters: true,
            id: "missionName"
        },
        {
            Header: "Mission category",
            accessor: "missionCategoryDesc.description",
            disableFilters: true,
            id: "oMissionCategoryDesc"
        },
        {
            Header: "Mission type",
            accessor: "missionTypeDesc.description",
            disableFilters: true,
            id: "oMissionTypeDesc"
        },
        {
            Header: "Country",
            accessor: "missionAddressDetails[0].countryDesc.description",
            disableFilters: true,
            id: "Country"
        },
        {
            Header: "City",
            accessor: "missionAddressDetails[0].city",
            disableFilters: true,
            id: "City"
        },
        {
            Header: "Created By",
            accessor: "createdByName",
            disableFilters: true,
            id: "createdByName"
        },
        {
            Header: "Created at",
            accessor: "createdAt",
            disableFilters: true,
            id: "createdAt"
        },
        {
            Header: "Tags",
            accessor: "missionTags",
            disableFilters: true,
            id: "tags"
        }
    ]);

    const [leadColumns, setLeadColums] = useState([
        {
            Header: "Stakeholder name",
            accessor: "leadName",
            disableFilters: true,
            id: "leadName"
        },
        {
            Header: "Stakeholder category",
            accessor: "leadCatDesc.description",
            disableFilters: true,
            id: "leadCatDesc.description"
        },
        {
            Header: "Stakeholder type",
            accessor: "leadTypeDesc.description",
            disableFilters: true,
            id: "leadTypeDesc.description"
        },
        {
            Header: "Country",
            accessor: "leadAddress[0].countryDesc.description",
            disableFilters: true,
            id: "Country"
        },
        {
            Header: "City",
            accessor: "leadAddress[0].city",
            disableFilters: true,
            id: "City"
        },
        {
            Header: "Created By",
            accessor: "createdByName",
            disableFilters: true,
            id: "createdByName"
        },
        {
            Header: "Created at",
            accessor: "createdAt",
            disableFilters: true,
            id: "createdAt"
        },
        {
            Header: "Tags",
            accessor: "tags",
            disableFilters: true,
            id: "tags"
        }
    ]);

    const [engagementColumns, setEngagementColums] = useState([
        {
            Header: "Stakeholder name",
            accessor: "leadEngagementDetails.leadName",
            disableFilters: true,
            id: "engagementLeadName"
        },
        {
            Header: "Mission name",
            accessor: "missionEngagementDetails.missionName",
            disableFilters: true,
            id: "engagementMissionName"
        },
        {
            Header: "Engagement Name",
            accessor: "engagementName",
            disableFilters: true,
            id: "engagementName"
        },
        {
            Header: "Engagement Description",
            accessor: "engagementDescription",
            disableFilters: true,
            id: "engagementDescription"
        },
        {
            Header: "Contact Person",
            accessor: "contactPerson",
            disableFilters: true,
            id: "contactPerson"
        },
        {
            Header: "Date & Time",
            accessor: "dateTime",
            disableFilters: true,
            id: "createdAt"
        },
        {
            Header: "Assign To",
            accessor: "assignedToDetails",
            disableFilters: true,
            id: "assignedToDetails"
        },
        {
            Header: "Status",
            accessor: "statusDesc.description",
            disableFilters: true,
            id: "oStatusDesc"
        }
    ]);

    const showPopup = (metaData) => {
        setMetaData(metaData);
        setOpenPopUp(true);
        post(properties.LEAD_API + "/country-wise-stakeholders-missions-details", {
            "country": metaData?.country, state: metaData?.state
        }).then((response) => {
            if (response?.status == 200) {
                const { data } = response;
                setCountsData(data?.counts);
            }
        }).catch((error) => console.log(error));
    }

    useEffect(() => {
        if (!mapRef.current) return;

        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM()
                })
            ],
            view: new View({
                center: [0, 0],
                zoom: 2
            })
        });

        const vectorSource = new VectorSource();
        const vectorLayer = new VectorLayer({
            source: vectorSource
        });

        map.addLayer(vectorLayer);

        const popup = new Overlay({
            element: popupRef.current,
            positioning: 'bottom-center',
            stopEvent: false,
            offset: [0, -10]
        });

        map.addOverlay(popup);
        popupOverlayRef.current = popup;

        circles.forEach(circle => {
            const circleFeature = new Feature({
                geometry: new Point(fromLonLat([circle.longitude, circle.latitude])),
                name: circle.name
            });

            // const style = new Style({
            //     image: new CircleStyle({
            //         radius: circle.radius,
            //         fill: new Fill({ color: 'rgba(255, 0, 0, 0.5)' }),
            //         stroke: new Stroke({ color: 'red', width: 1 })
            //     })
            // });

            const style = new Style({
                image: new RegularShape({
                    radius: 5, // Assuming you want a radius of 5 pixels
                    points: 5, // Number of points for the star
                    angle: Math.PI / 5, // Angle between the points to create a star
                    fill: new Fill({ color: 'rgba(255, 0, 0, 0.5)' }), // Golden color (RGB: 255, 215, 0)
                    stroke: new Stroke({ color: 'red', width: 1 })
                })
            });



            circleFeature.setStyle(style);
            vectorSource.addFeature(circleFeature);

            // No need to add the popup to the map here

            map.on('pointermove', function (evt) {
                const coordinate = evt.coordinate;

                const isFeatureClicked = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
                    return feature === circleFeature;
                });

                if (isFeatureClicked) {
                    showPopup(circle?.metaData)
                    popup.setPosition(coordinate);
                } else {
                    console.log('No Clicked');
                }
            });
        });
        map.on('postcompose', function (e) {
            document.querySelector('canvas').style.filter = "invert(90%)";
        });
        return () => map.dispose();
    }, [circles]);

    const handleViewMore = (cell, index) => {
        console.log('cell-------->', cell)
        setVisibleTags({ data: cell, index, showAll: true });
        setShowAll(true);
    };

    const handleCellRender = (cell, row) => {
        console.log('row-------->', row)
        if (cell.column.id === "missionName") {
            return (
                <span style={{ color: '#1675e0' }} className="cursor-pointer" onClick={() => {
                    history("/mission-edit?missionUuid=" + row?.original?.missionUuid, { state: {data: row.original} })
                }}>{row.original.missionName}</span>
            );
        }
        if (cell.column.id === "leadName") {
            return (
                <span style={{ color: '#1675e0' }} className="cursor-pointer" onClick={() => {
                    history("/leads-edit?leadUuid=" + row?.original?.leadUuid)
                }}>{row.original.leadName}</span>
            );
        }
        if (cell.column.id === "missionLeadName") {
            return (
                <span style={{ color: '#1675e0' }} className="cursor-pointer" onClick={() => {
                    history("/leads-edit?leadUuid=" + row?.original?.leadDesc?.leadUuid)
                }}>{row.original?.leadDesc?.leadName}</span>
            );
        }
        if (cell.column.id === "oCurrUser") {
            return (<span>{cell.value ?? "Others"}</span>);
        }
        if (cell.column.id === "engagementLeadName") {
            return (
                <>
                    {(() => {
                        const leadUuid =
                            (row?.original?.leadEngagementDetails?.leadUuid === null || !row?.original?.leadEngagementDetails?.leadUuid)
                                ? row?.original?.missionEngagementDetails?.leadDesc?.leadUuid
                                : row?.original?.leadEngagementDetails?.leadUuid;

                        const leadName =
                            row?.original?.leadEngagementDetails?.leadName ??
                            row?.original?.missionEngagementDetails?.leadDesc?.leadName;

                        return (
                            <span
                                style={{ color: '#1675e0' }}
                                className="cursor-pointer"
                                onClick={() => {
                                    history(`/leads-edit?leadUuid=${leadUuid}`);
                                }}
                            >
                                {leadName}
                            </span>
                        );
                    })()}
                </>
            );

        }
        if (cell.column.id === "engagementMissionName") {

            return (
                <span style={{ color: '#1675e0' }} className="cursor-pointer" onClick={() => {
                    history("/mission-edit?missionUuid=" + row?.original?.missionEngagementDetails?.missionUuid)
                }}>{row?.original?.missionEngagementDetails?.missionName}</span>
            );

        }
        if (cell.column.id === "assignedToDetails") {
            return (<span>{(cell.value?.firstName ?? '') + ' ' + (cell.value?.lastName ?? '')}</span>);
        }
        if (cell.column.id === "createdByName") {
            return (<span>{(cell.value?.firstName ?? '') + ' ' + (cell.value?.lastName ?? '')}</span>);
        }
        if (cell.column.id === "tags") {
            return (<div>
                <div>
                    {row?.index === visibleTags?.index ? visibleTags?.data?.join(', ') : cell.value.slice(0, 3)?.join(', ')}
                </div>
                {cell.value.length > 3 && (
                    <button onClick={() => handleViewMore(cell.value, row?.index)}>View More</button>
                )}
            </div>);
        }
        if (cell.column.id === "Country") {
            return (<span>{cell.value ?? ''}</span>);
        }
        if (cell.column.id === "City") {
            return (<span>{cell.value ?? ''}</span>);
        }
        if (cell.column.id === "createdAt") {
            return (<span>{cell.value ? moment(cell.value).format("DD-MM-YYYY hh:mm:ss") : '-'}</span>);
        }
        return (<span>{cell.value}</span>);
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const getList = (type) => {
        setType(type);
        if (metaData?.state && metaData?.country) {
            post(properties.LEAD_API + "/country-wise-stakeholders-missions-details", {
                "country": metaData?.country, state: metaData?.state, type, limit: Number(perPage), page: Number(currentPage)
            }).then((response) => {
                if (response?.status == 200) {
                    const { data } = response;
                    setCountsData(data?.counts);

                    if (['LEAD', 'MISSION']?.includes(type)) {
                        setCounts(data?.counts);
                        setDataList(data?.rows)
                    }
                    else if (type === "UPCOMING_LEAD_ENGAGEMENTS") {
                        setCounts(data?.counts?.leadEngagementCounts?.upcoming);
                        setDataList(data?.engagementDetails?.leads?.upcoming)
                    }
                    else if (type === "UPCOMING_MISSION_ENGAGEMENTS") {
                        setCounts(data?.counts?.missionEngagementCounts?.upcoming);
                        setDataList(data?.engagementDetails?.missions?.upcoming)
                    }
                    else if (type === "CURRENT_LEAD_ENGAGEMENTS") {
                        setCounts(data?.counts?.leadEngagementCounts?.current);
                        setDataList(data?.engagementDetails?.leads?.current)
                    }
                    else if (type === "CURRENT_MISSION_ENGAGEMENTS") {
                        setCounts(data?.counts?.missionEngagementCounts?.current);
                        setDataList(data?.engagementDetails?.missions?.current)
                    }
                    else if (type === "PAST_LEAD_ENGAGEMENTS") {
                        setCounts(data?.counts?.leadEngagementCounts?.past);
                        setDataList(data?.engagementDetails?.leads?.past)
                    }
                    else if (type === "PAST_MISSION_ENGAGEMENTS") {
                        setCounts(data?.counts?.missionEngagementCounts?.past);
                        setDataList(data?.engagementDetails?.missions?.past)
                    }

                    setModalDetailsOpen(true);
                }
            }).catch((error) => console.log(error));
        }
    }

    useEffect(() => {
        getList(type);
    }, [currentPage, perPage, filters])

    const countClicked = (type) => {
        getList(type);
        setModalDetailsOpen(true);
    }

    const closePopup = () => {
        const popupOverlay = popupOverlayRef.current;
        if (popupOverlay) {
            popupOverlay.setPosition(undefined);
        }
    };


    return (
        <>
            <div ref={mapRef} className="map" />
            {<div ref={popupRef} className="popup">
                <div className="global-map">
                    <a href="javascript:void(0)" id="popup-closer" className="ol-popup-closer" onClick={() => {
                        closePopup()
                    }}>X</a>
                    <p style={{ fontSize: "20px" }}>{metaData?.country}</p>

                    <div className="spilt-data">
                        <div className="spilt-row">
                            <p className="skel-spilt-field skel-title-spilt"><strong>Stakeholders</strong> <a
                                onClick={() => { countClicked("LEAD") }} href="javascript:void(0)" className="skel-upcoming-task" data-target="#stakeholders" data-toggle="modal"><span>{countsData?.leadCount ?? 0}</span></a></p>
                        </div>
                        <div className="spilt-row">
                            <p className="skel-spilt-field skel-title-spilt"><strong>Mission</strong> <a href="javascript:void(0)" className="skel-past-task" data-target="#mission" data-toggle="modal" onClick={() => { countClicked("MISSION") }}><span>{countsData?.missionCount ?? 0}</span></a></p>
                        </div>
                    </div>
                    <hr className="cmmn-hline mt-1 mb-1" />
                    <div className="skel-map-events mt-0">
                        <strong className="mb-1 d-flex">Engagements</strong>
                        <div className="skel-spilt-events">
                            <div className="skel-spilt-field">Upcoming
                                <a href="javascript:void(0)" className="skel-upcoming-task mr-1 ml-1" onClick={() => { countClicked("UPCOMING_LEAD_ENGAGEMENTS") }}>{countsData?.leadEngagementCounts?.upcoming}</a>

                                <a href="javascript:void(0)" className="skel-past-task mr-1" onClick={() => { countClicked("UPCOMING_MISSION_ENGAGEMENTS") }}>{countsData?.missionEngagementCounts?.upcoming}</a>
                            </div>

                            <div className="skel-spilt-field">Current
                                <a href="javascript:void(0)" className="skel-upcoming-task mr-1 ml-1" onClick={() => { countClicked("CURRENT_LEAD_ENGAGEMENTS") }}>{countsData?.leadEngagementCounts?.current}</a>

                                <a href="javascript:void(0)" className="skel-past-task mr-1" onClick={() => { countClicked("CURRENT_MISSION_ENGAGEMENTS") }}>{countsData?.missionEngagementCounts?.current}</a>
                            </div>

                            <div className="skel-spilt-field">Past
                                <a href="javascript:void(0)" className="skel-upcoming-task mr-1 ml-1" onClick={() => { countClicked("PAST_LEAD_ENGAGEMENTS") }}>{countsData?.leadEngagementCounts?.past}</a>

                                <a href="javascript:void(0)" className="skel-past-task mr-1" onClick={() => { countClicked("PAST_MISSION_ENGAGEMENTS") }}>{countsData?.missionEngagementCounts?.past}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div >}

            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={modalDetailsOpen} onHide={() => setModalDetailsOpen(false)} dialogClassName="wsc-cust-mdl-temp-prev">
                <Modal.Header>
                    <Modal.Title><h5 className="modal-title">{type?.includes('MISSION') ? 'Mission' : 'Stakeholder'} list</h5></Modal.Title>
                    <CloseButton onClick={() => setModalDetailsOpen(false)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}></CloseButton>
                </Modal.Header>
                <Modal.Body>
                    <div className="col-lg-12 col-md-12 col-xs-12">
                        <DynamicTable
                            row={dataList ?? []}
                            rowCount={type === "LEAD" ? counts?.leadCount : type === "MISSION" ? counts?.missionCount : counts}
                            itemsPerPage={perPage}
                            header={type === "LEAD" ? leadColumns : type === "MISSION" ? missionColumns : engagementColumns}
                            backendPaging={true}
                            isScroll={true}
                            isTableFirstRender={isTableFirstRender}
                            hasExternalSearch={hasExternalSearch}
                            backendCurrentPage={currentPage}
                            columnFilter={true}
                            handler={{
                                handleCellRender: handleCellRender,
                                handlePageSelect: handlePageSelect,
                                handleItemPerPage: setPerPage,
                                handleCurrentPage: setCurrentPage,
                                handleFilters: setFilters
                            }}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ display: 'block' }}>
                    <div className="skel-btn-center-cmmn">
                        <button type="button" className="skel-btn-cancel" onClick={() => setModalDetailsOpen(false)}>Close</button>
                    </div>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default OpenLayersMap;
