import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const SmileyChart = (props) => {
  const chartRef = useRef(null);
  const { axisData, seriesData } = props?.data;

  useEffect(() => {
    var maxData = 2000;
    var dom = chartRef.current;
    var myChart = echarts.init(dom, null, {
      renderer: 'svg',
      useDirtyRect: false
    });

    const option = {
      tooltip: {},
      xAxis: {
        type: 'category',
        data: axisData, // Your x-axis categories
        axisLine: {
          lineStyle: {
            color: '#000'
          }
        },
        axisLabel: {
          margin: 10
        }
      },
      yAxis: {
        type: 'value',
        max: maxData,
        axisLine: {
          lineStyle: {
            color: '#000'
          }
        },
        axisLabel: {
          margin: 10,
          color: '#737373',
          fontSize: 16
        }
      },
      grid: {
        top: 'center',
        height: 200,
        left: 70,
        right: 100
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 100,
          barGap: 0,
          emphasis: {
            focus: 'series'
          },
          label: {
            show: true,
            formatter: function (params) {
              return ((params.value / maxData) * 100).toFixed(1) + ' %';
            },
            position: 'top',
            color: '#000',
            fontSize: 14
          },
          animationDuration: 0,
          data: seriesData,
          z: 5
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
  }, [axisData, seriesData]);

  return (
    <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>
  );
};

export default SmileyChart;
