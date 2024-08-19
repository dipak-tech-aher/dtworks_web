import React, { useEffect } from "react";
import ReactEcharts from 'echarts-for-react';


const VerticalBar = (props) => {
  let { axisData, seriesData, title, width ='100%', height= '400px' } = props.data;
  // Extract unique channel descriptions 
  // console.log(axisData);
  // console.log(seriesData);

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
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01]
    },
    yAxis: {
      type: 'category',
      data: axisData,
      axisLabel: {
        fontSize: 16,
        formatter: (value) => {          
          return value; 
        }
      }
    },
    series: [
      {
        name: title,
        type: 'bar',
        data: seriesData,
        label: {
          show: true,
          position: 'insideRight'
        }
      }
    ]
  };
  
  return (
    <>
      <ReactEcharts option={option} style={{ height, width}}/>
    </>
  );
};

export default VerticalBar;