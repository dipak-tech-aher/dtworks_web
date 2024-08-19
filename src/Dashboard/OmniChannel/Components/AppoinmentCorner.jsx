import React, { useEffect, useState } from 'react'
import ReactSelect from 'react-select'
import { post } from '../../../common/util/restUtil'
import { properties } from '../../../properties'
import AppoinmentCornerChart from '../../charts/AppoinmentCorner'
const OptionList = [
    {
        label: 'Weekly',
        value: '1W'
    },
    {
        label: 'Monthly',
        value: '1M'
    },
    {
        label: 'Yearly',
        value: '1Y'
    }
]
export default function AppoinmentCorner(props) {
    const { searchParams = {}, viewType } = props.data;
    const [category, setCategory] = useState({
        label: 'Weekly',
        value: '1W'
    })
    const [corner, setCorner] = useState([])
    useEffect(() => {
        getAppoinmentData()
    }, [searchParams, category]);

    const getAppoinmentData = () => {
        try {
            const requestBody = {
                searchParams: {
                    ...searchParams.searchParams,
                    category: category?.value,
                    channel: viewType
                }
            }
            post(properties.APPOINTMENT_API + "/corner", requestBody)
                .then((response) => {
                    if (response?.data?.length > 0) {
                        let formatedData = response.data.map((val) => {
                            return (
                                { ...val, type: val.interval_, entity_type: val.interval_ }
                            )
                        })
                        console.log('formatedData', formatedData)
                        setCorner(formatedData);
                    }
                })
                .catch((error) => {
                    console.error("error", error);
                })
                .finally();
        } catch (e) {
            console.log('error', e)
        }
    }
    return (
        <div className="col-md-6">
            <div className="cmmn-skeleton h-100">
                <div className="row">
                    <div className="col-md-6">
                        <span className="skel-header-title">
                            Appoinment Corner
                        </span>
                    </div>

                    <div className="form-group col-md-5">
                        <ReactSelect
                            placeholder='Interaction Type'
                            className="w-80"
                            isMulti={false}
                            options={OptionList}
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            value={category}
                            onChange={(val) => setCategory(val)}
                        />
                    </div>
                    <div className="form-group col-md-1">
                        <a>
                            <i className="material-icons" onClick={() => getAppoinmentData(true)}>refresh</i>
                        </a>
                    </div>
                </div>

                <hr className="cmmn-hline" />
                <div className="skel-perf-sect">
                    <div className="skel-perf-graph">
                        {corner.length === 0 ? (
                            <div className="noRecord">
                                <p>NO RECORDS FOUND</p>
                            </div>
                        ) : (
                            <AppoinmentCornerChart
                                data={{
                                    corner: corner,
                                }}
                            />)}
                    </div>
                </div>

                <hr className="cmmn-hline" />

                <div className="skel-refresh-info">
                    <span>
                        <i className="material-icons">refresh</i>{" "}
                        Updated a few seconds ago
                    </span>
                </div>
            </div>
        </div>
    )
}
