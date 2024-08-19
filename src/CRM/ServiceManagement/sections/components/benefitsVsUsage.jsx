import React, { useContext, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Service360Context } from '../../../../AppContext';

const BenefitsVsUsage = (props) => {
    const { data } = useContext(Service360Context);
    const { subscriptionDetails, masterDataLookup } = data;
    const chartRef = useRef(null);
    const { actualProductBenefit, serviceUsage } = subscriptionDetails;

    const getMasterDescription = (code, entity) => {
        return masterDataLookup?.[entity]?.find(x => x.code === code)?.description;
    }

    const getLeftoutBenefit = (benefitCode, benefitTotalLimit) => {
        const usageRecord = serviceUsage?.benefits?.find(x => x.name === benefitCode);
        return benefitTotalLimit - (usageRecord?.value ?? 0);
    }

    const getNum = (val) => {
        if (isNaN(val)) {
            return 0;
        }
        return val;
    }

    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });

        let usedBenefitsPercentage = 0;
        actualProductBenefit?.benefits?.forEach((benefit) => {
            let benefitTotalLimit = benefit.value;
            let leftoutBenefit = getLeftoutBenefit(benefit.name, benefit.value);
            usedBenefitsPercentage += (100 * leftoutBenefit) / benefitTotalLimit;
        })
        let totalLength = actualProductBenefit?.benefits?.length ?? 0;
        usedBenefitsPercentage = getNum(Math.round(usedBenefitsPercentage / totalLength));

        const option = {
            series: [
                {
                    type: 'gauge',
                    min: 0,
                    max: 100,
                    pointer: {
                        show: false
                    },
                    progress: {
                        show: true,
                        overlap: false,
                        roundCap: true,
                        clip: false,
                        itemStyle: {
                            borderWidth: 1,
                            borderColor: '#5470c6'
                        }
                    },
                    splitLine: {
                        show: false,
                        distance: 0,
                        length: 10
                    },
                    axisLine: {
                        lineStyle: {
                            width: 15
                        }
                    },
                    axisTick: {
                        show: false
                    },
                    axisLabel: {
                        show: true,
                        distance: -30,
                        formatter: (value) => {
                            if (value === 0 || value === 100) {
                                return `${value}%`
                            }
                        }
                    },
                    data: [
                        {
                            value: (isNaN(usedBenefitsPercentage) ? 0 : usedBenefitsPercentage) || 0,
                            name: 'of benefits used',
                            title: {
                                offsetCenter: ['0%', '15%']
                            },
                            detail: {
                                valueAnimation: true,
                                offsetCenter: [0, '-5%'],
                                fontSize: 24,
                                color: '#464646'
                            }
                        }
                    ],
                    title: {
                        fontSize: 14
                    },
                    detail: {
                        fontSize: 20,
                        formatter: '{value}%'
                    }
                }
            ]
        };

        if (option && typeof option === 'object') {
            myChart.setOption(option);
        }

        window.addEventListener('resize', myChart.resize);

        return () => {
            window.removeEventListener('resize', myChart.resize);
            myChart.dispose();
        };
    }, [])
    return (
        <div className="col-md-6 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Benefits vs Usage</span>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect mt-4">
                    <div className="row">
                        <div className="col-md">
                            <div ref={chartRef} style={{ width: '100%', height: '380px' }}></div>
                        </div>
                        <div className="col-md-4">
                            {actualProductBenefit?.benefits?.map((benefit) => (
                                <React.Fragment key={benefit.name}>
                                    <p className="mt-0 mb-0">{getMasterDescription(benefit.name, 'PRODUCT_BENEFIT')}</p>
                                    <p className="mt-0 mb-0 font-weight-bold">{benefit.value} {benefit.unit}</p>
                                    <p className="mt-0 mb-4 font-12 color-light">left of {getLeftoutBenefit(benefit.name, benefit.value)} {benefit.unit}</p>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BenefitsVsUsage;