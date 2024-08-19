import React from 'react';
import ReactEcharts from 'echarts-for-react';

const StackedBar = (props) => {
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
            data: seriesData.map(item => item.name),
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            boundaryGap: [0, 0.01],
            data: axisData,
        },
        yAxis: {
            type: 'value',
        },
        series: seriesData
    };

    return <ReactEcharts option={option} style={{ height: '350px' }} />;
};

export default StackedBar;
