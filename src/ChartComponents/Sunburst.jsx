import React from 'react';
import ReactECharts from 'echarts-for-react';

const SunburstChart = ({ chartData }) => {
  const getOption = () => {
    const data = [
      {
        name: 'Grandpa',
        children: [
          {
            name: 'Uncle Leo',
            value: 15,
            children: [
              {
                name: 'Cousin Jack',
                value: 2
              },
              {
                name: 'Cousin Mary',
                value: 5,
                children: [
                  {
                    name: 'Jackson',
                    value: 2
                  }
                ]
              },
              {
                name: 'Cousin Ben',
                value: 4
              }
            ]
          },
          {
            name: 'Father',
            value: 10,
            children: [
              {
                name: 'Me',
                value: 5
              },
              {
                name: 'Brother Peter',
                value: 1
              }
            ]
          }
        ]
      }
    ];

    return {
      series: {
        type: 'sunburst',
        data: chartData.length ? chartData : [],
        radius: [0, '90%'],
        label: {
          rotate: 'radial'
        }
      }
    };
  };
  console.log('chartData ', chartData)

  const options = {
    tooltip: {
      valueFormatter: function (value) {
        return value + ' months';
      }
    },
    series: {
      type: 'sunburst',
      data: [chartData],
      emphasis: {
        focus: 'ancestor'
      },
      radius: [0, '100%'],
      label: {
        rotate: 'linear',
      }
    }
  };
  return (
    <>
      <ReactECharts option={options} style={{ height: '400px', width: '100%' }} />
    </>
  );
};

export default SunburstChart;
