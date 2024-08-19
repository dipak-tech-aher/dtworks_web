import React from 'react';
import ReactEcharts from 'echarts-for-react';

const StackedHorizontalBar = (props) => {
    const { axisData, seriesData, title } = props.data;

    const option = {
        title: {
            text: '',
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
            },
        },
        legend: {
            data: seriesData.map(item => item?.name),
            show: true
        },
        grid: {
            left: '10%',
            right: '10%',
            bottom: '3%',
            containLabel: true,
        },
        yAxis: {
            type: 'category',
            data: axisData,
        },
        xAxis: {
            type: 'value',
        },
        series: seriesData
    };

    return <ReactEcharts option={option} style={{ height: '350px' }} />;
};

export default StackedHorizontalBar;
