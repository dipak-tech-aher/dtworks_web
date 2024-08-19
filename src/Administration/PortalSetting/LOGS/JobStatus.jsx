import React, { useContext, useState, useEffect, useRef } from 'react'
import { toast } from "react-toastify";
import { post, get } from "../../../common/util/restUtil";
import { properties } from "../../../properties";
import { unstable_batchedUpdates } from 'react-dom';

const JobStatus = (props) => {

    const initialValues = {
        "Domain": "UNN_GW_TEST_DOMAIN",
        "Application": "all"
    }
    const [searchInputs, setSearchInputs] = useState(initialValues);
    const [data, setData] = useState([]);
    const [api, setApi] = useState({})
    const [operation, setOperation] = useState({})
    let hitAgain = false;

    useEffect(() => {
        getStatusData();
    }, [])

    const getStatusData = (Inputs) => {
        // console.log('Inputs===>', Inputs)
        
        const requestBody = {
            ...searchInputs,
            ...Inputs
        }
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        };
        let apiUrl
        //apiUrl = `http://172.17.20.126:4000/api/tibco/applicationStatus`
        apiUrl = properties.PORTAL_SETTING_API+'/job'
       
        get(apiUrl)
            .then((resp) => {              
                    if (resp.data) {
                        if (resp.status === 200) {
                            // const responsedata = resolve(resp.json());
                            const rows = resp.data;
                            // console.log('..........', rows)
                            if (rows.length > 0) {
                                unstable_batchedUpdates(() => {
                                    setData(rows);
                                })
                            }
                            else {
                                toast.error("Records Not found");
                            }
                        } else {
                            setData([]);
                            toast.error("Records Not Found");
                        }
                    } else {
                        setData([]);
                        toast.error("Records Not Found");
                    }
                }).catch((error) => {
                    console.log(error)
                })
                  
          
    }

    const updateStatusData = (Inputs) => {
        // console.log('Inputs===>', Inputs)
        
        const requestBody = {
            ...searchInputs,
            ...Inputs
        } 
     
        post(`${properties.PORTAL_SETTING_API}/job/${Inputs.jobId}`, requestBody)
            .then((resp) => {              
                // console.log('.....resp.....', resp.status)
                if (resp) {
                    if (resp.status === 200) {
                    getStatusData(Inputs);

                    toast.success('Job Updated')
                    }
                }
            }).catch((error) => {
                console.log(error)
            }).finally(() => {
                
            });
    }

    return (             
            <div className="p-0 cmmn-skeleton mt-2" cx="">
                <div className="card-body p-2" cx="">
                    <div className="mt-3">
                        <h5 className="mb-2">Application Jobs Status</h5>

                        <div className="row pb-1">
                            {
                                data.map((e) => (

                                    <div className="col-xl-3 col-lg-6" >
                                        <div className="card m-1 shadow-none border">
                                            <div className="p-2">
                                                <div className="row align-items-center">
                                                    <div className="col-auto">
                                                        {
                                                            ['Stopped', 'STOP', 'stop'].includes(e.Status || e.jobStatus) ? <svg height="40" width="40" className="blinking">
                                                                <circle cx="15" cy="15" r="12" fill="red" />
                                                                Sorry, your browser does not support inline SVG.
                                                            </svg> : <svg height="40" width="40" className="blinking"><circle cx="15" cy="15" r="12" fill="green" /></svg>
                                                        }
                                                    </div>
                                                    <div className="col pt-2" style={{ width: "10px" }}>
                                                        <a  className="text-muted font-weight-bold">{e.Name || e.name}</a>
                                                        {
                                                            ['Stopped', 'STOP', 'stop'].includes(e.Status || e.jobStatus) ? <p className="mb-0 font-13 text-danger" >{e.Status || e.jobStatus}ped</p> : <p className="text-success" >{e.Status || e.jobStatus}ed</p>
                                                        }
                                                    </div>

                                                    <div className="col pl-0">
                                                        <div className="form-group">
                                                            <div className="custom-control custom-switch">
                                                                <input type="checkbox" id={e.id} className="custom-control-input" value={e.api} checked={["Running", "START", "start"].includes(e.Status || e.jobStatus) ? true : false} onChange={(x) => {
                                                                    if (x.target.checked === true) {
                                                                        hitAgain = true
                                                                        const data = { Operation: 'start', Application: e.Name || e.name, AppSpace: e.AppSpace, api: e.api ? e.api : null, jobId: e.id }
                                                                        setSearchInputs({ ...searchInputs }, data)
                                                                        updateStatusData(data)

                                                                    }
                                                                    else if (x.target.checked === false) {
                                                                        hitAgain = true
                                                                        const data = { Operation: 'stop', Application: e.Name || e.name, AppSpace: e.AppSpace, api: e.api ? e.api : null, jobId: e.id }
                                                                        setSearchInputs({ ...searchInputs }, data)
                                                                        updateStatusData(data)

                                                                    }
                                                                }}
                                                                />
                                                                <label htmlFor={e.id} className="custom-control-label mt-1">{searchInputs.Operation === 'Y' || ['Stopped', 'STOP', 'stop'].includes(e.Status || e.jobStatus) ? 'start' : 'stop'}</label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>))
                            }
                        </div>                                    
                    </div>
                </div>
            </div>
    )
}
export default JobStatus;