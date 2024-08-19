import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { properties } from '../../properties';

const ApplicationDataConfigurationMenu = ({ totalCount, steps }) => {
    // console.log('props ', props)
    // const { totalCount, steps } = props
    const history = useNavigate();
    return (
        <>            
            <div className="skel-appl-config mb-4">
                <div className="row">
                    {
                        steps && steps.map((step, index) => (
                            <div className="col-lg-4 col-md-4 col-xs-12 skel-res-m" key={index}>
                                <div className="skel-config-steps" onClick={() => history(`${step.path}`, { state: {data: { sourceName: step.sourceName }} })}>
                                    <span className="material-icons"><img src={step.image} alt="" className="img-fluid" /></span>
                                    <div className="skel-config-details">
                                        <span className="skel-step-styl">Step-: {index + 1}</span>
                                        <span className="skel-app-heading">
                                            {step.label}
                                        </span>
                                        <p>{step.description}</p>
                                        <span className="skel-step-styl mt-1">est. 5 minutes <span className={totalCount && totalCount[step?.key] > 0 ? "material-icons skel-config-active-tick" : 'material-icons'}>check_circle</span></span>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </>
    )
}

export default ApplicationDataConfigurationMenu