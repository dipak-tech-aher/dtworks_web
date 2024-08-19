import React from 'react';
import ReactEcharts from 'echarts-for-react';
import { useEffect } from 'react';
import { useState } from 'react';

const StackedHorizontalBar = (props) => {
    let chartData = props.data.chartData;
    const [seriesData, setSeriesData] = useState([])
console.log('chartData ', chartData?.yAxis)
    useEffect(() => {
        const data = chartData?.service?.map((e) => ({
            name: e.name, type: 'bar',
            stack: 'total',
            label: { show: true },
            emphasis: { focus: 'series' },
            data: e?.data
        }))
        console.log('data ', data)
        setSeriesData(data)
    }, [chartData])

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        toolbar: {
            show: true,
            orient: "horizontal",
            feature: {
                dataView: { readOnly: false }
            }
        },
        legend: {
            show: true
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'value'
        },
        yAxis: {
            type: 'category',
            data: chartData?.yAxis || [],
            inverse: true,
        },
        series: seriesData        
    }

    return (
        <>
            <ReactEcharts option={option} style={{ height: '400px', width: '80%' }} />
        </>
    );

}

export default StackedHorizontalBar