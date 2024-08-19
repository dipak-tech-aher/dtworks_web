import React from 'react';
import ReactECharts from 'echarts-for-react';

const AppoinmentCornerChart = (props) => {
  const { corner } = props.data;

  const data = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}',
    },
    xAxis: {
      type: 'category',
      data: corner.map(x => x?.type),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        label: {
          show: true,
          position: 'inside',
        },
        name: 'AppoinmentCorner',
        type: 'bar',
        data: corner.map(x => x?.counts),
        itemStyle: {
          color: 'rgb(84, 112, 198)',
        },
        barWidth: '20%',
      },
    ],
  };

  return (
    <>
      <ReactECharts option={data} style={{ height: '400px' }} />
    </>
  );
};

export default AppoinmentCornerChart;
