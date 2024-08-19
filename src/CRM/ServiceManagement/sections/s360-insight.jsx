import React, { useState } from 'react';
import OverallExperience from './components/overallExperience';
import BenefitsVsUsage from './components/benefitsVsUsage';
import Top5RepeatedProblems from './components/top5RepeatedProblems';
import OpenVsClose from './components/openVsClose';
import OverallServiceLevel from './components/overallServiceLevel';
import CustomerChurnPossibility from './components/customerChurnPossibility';
import ScheduledVsPaid from './components/scheduledVsPaid';
import Last3MonthsInsights from './components/last3MonthsInsights';
import CustomerVoice from './components/customerVoice';

const Service360Insight = (props) => {
    return (
        <div className="skel-informative-data mt-2 mb-2">
            <div className="row mx-lg-n1">
                <OverallExperience />

                <BenefitsVsUsage />

                <Top5RepeatedProblems />

                <OpenVsClose />

                <OverallServiceLevel />

                <CustomerChurnPossibility />

                <ScheduledVsPaid />

                <Last3MonthsInsights />

                <CustomerVoice />
            </div>
        </div>
    )
}

export default Service360Insight;