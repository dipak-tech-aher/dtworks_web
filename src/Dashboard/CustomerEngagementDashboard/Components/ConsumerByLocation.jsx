import React, { useEffect, useState } from "react";
import { properties } from "../../../properties";
import { post } from "../../../common/util/restUtil";
import MapChart from "../../charts/mapChart";

const ConsumerByLocation = (props) => {

    const [data, setData] = useState([])
    const [axisData, setAxisData] = useState([]);
    const [seriesData, setSeriesData] = useState([]);
    useEffect(() => {
        const requestBody = {
            searchParams: {
                ...props?.data?.searchParams,
                type: 'CUSTOMER_LOCATION'
            }
        }
        post(`${properties.CUSTOMER_API}/get-top5-analytics`, requestBody)
            .then((resp) => {
                if (resp?.status === 200) {
                    setData(resp?.data);
                    const axis = resp?.data?.map(item => {
                        const entityTypeParts = item.oEntityType?.split(',');
                        const name = entityTypeParts?.[0] ?? '';
                        const latitude = parseFloat(entityTypeParts?.[1]);
                        const longitude = parseFloat(entityTypeParts?.[2]);

                        // Check if entityTypeParts has valid latitude and longitude values
                        if (
                            entityTypeParts?.length === 3 &&
                            !isNaN(latitude) &&
                            !isNaN(longitude)
                        ) {
                            return {
                                name: name,
                                coordinates: [latitude, longitude]
                            };
                        }

                        return null;
                    }).filter(item => item !== null);

                    // Group data by name and coordinates to calculate total counts
                    const groupedData = {};
                    resp?.data?.forEach(item => {
                        const entityTypeParts = item.oEntityType?.split(',');
                        const name = entityTypeParts?.[0];
                        const coordinates = [parseFloat(entityTypeParts?.[1]), parseFloat(entityTypeParts?.[2])];

                        if (name && coordinates?.length === 2 && !isNaN(coordinates[0]) && !isNaN(coordinates[1])) {
                            const key = name + '-' + coordinates.join(',');
                            if (groupedData[key]) {
                                groupedData[key].value += parseInt(item.oTotalCount, 10);
                            } else {
                                groupedData[key] = {
                                    value: parseInt(item.oTotalCount, 10),
                                    name: name,
                                    coordinates: coordinates
                                };
                            }
                        }
                    });
                    const cData = Object.values(groupedData);

                    setAxisData(axis);
                    setSeriesData(cData);
                }
            })
    }, [])
    return (
        <div className="col-md-4">
            <div className="cmmn-skeleton skel-cmmn-card-base">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Customers by Location</span>
                    <div className="skel-dashboards-icons">
                        <a href="#"><i className="material-icons">refresh</i></a>
                        <a href="#"><i className="material-icons">filter_alt</i></a>
                    </div>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect">
                    <MapChart data={{
                        seriesData,
                        axisData,
                        title: 'Customers by Location'
                    }} />
                </div>
            </div>
        </div>
    )
}

export default ConsumerByLocation;