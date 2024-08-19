import React from "react";
import ReactEcharts from 'echarts-for-react';
import * as echarts from 'echarts';

const ColumnChart = (props) => {
  let { axisData, seriesData, title, chartType, chartProps } = props.data;

  if (!Array.isArray(seriesData) || seriesData.length === 0) {
    return <div>No data to display</div>;
  }

  const option = {
    title: {
      text: ''
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {},
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: axisData
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: title, 
        type: chartType || 'bar',
        data: seriesData,
        label: {
          show: true,
          position: 'insideRight'
        },
        ...(chartType === 'line' && chartProps ? { 
          smooth: chartProps.smooth || false, 
          areaStyle: { 
            normal: { 
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: chartProps.color || '#2378f7' }, 
                { offset: 1, color: 'rgba(23, 120, 247, 0)' },
              ]),
            },
          },
        } : {})
      }
    ]
  };
  
  return (
    <ReactEcharts option={option} style={{ height: '400px' }}/>
  );
};

export default ColumnChart;
