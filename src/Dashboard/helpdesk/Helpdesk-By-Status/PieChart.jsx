import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const PieChart = (props) => {
  const chartRef = useRef(null);
  const { showDetails } = props?.handlers;
  var colorPalette = ['#00b04f', '#ffbf00', '#CCCCCC', '#ff0000'];

  const chartData = props?.data?.chartData || []
  // console.log('chartData------->', chartData)
  useEffect(() => {
    const chartDom = chartRef.current;
    const myChart = echarts.init(chartDom, null, {
      renderer: 'canvas',
      useDirtyRect: false
    });
    const option = {
      title: {
        show: chartData.length === 0,
        textStyle: {
          color: "grey",
          fontSize: 20
        },
        text: "No data available",
        left: "center",
        top: "center"
      },
      tooltip: {
        trigger: 'item',
        formatter: function (d) {
          return d.name + ": " + d.value;
        }
      },
      legend: {
        left: 'center',
        data: chartData.map(item => item.name)
      },
      series: [
        {
          // name: 'Nightingale Chart',
          // type: 'pie',
          // radius: [40, 100],
          // center: ['50%', '50%'],
          // data: chartData,

          type: 'pie',
          radius: '65%',
          center: ['50%', '50%'],
          selectedMode: 'single',
          data: chartData,
          labelLine: {
            show: false
          },
          label: {
            show: true,
            position: 'inside',
            formatter: function (d) {
              return d.value;
            }
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }

        }
      ]
    };

    if (option && typeof option === 'object') {
      myChart.setOption(option);
    }

    myChart.on('click', (params) => {
      showDetails(params?.data?.statusCode)
    });
    
    window.addEventListener('resize', myChart.resize);

    return () => {
      window.removeEventListener('resize', myChart.resize);
      myChart.dispose();
    };
  }, [props.data.chartData]);

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>;
};

export default PieChart;