import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const Chart = (props) => {
  const chartRef = useRef(null);

  const chartData = props?.data?.chartData || []
  const { showDetails, getProjectCode } = props?.handlers;

  // console.log('chartData----xxzzz--->', chartData)
  useEffect(() => {
    const seriesData = Object.entries(chartData).map(([name, value]) => {
      return {
        value, name: name == 'null' ? "In Queue" : name?.toUpperCase() === "DTWORKS" ? 'dtWorks' : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(), chartKey: name == 'null' ? undefined : name?.toUpperCase()
      }
    });
    const chartDom = chartRef.current;
    const myChart = echarts.init(chartDom, null, {
      renderer: 'canvas',
      useDirtyRect: false
    });
    const option = {
      title: {
        show: seriesData.length === 0,
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
        data: seriesData.map(item => item.name)
      },
      series: [
        {
          type: 'pie',
          radius: '65%',
          center: ['50%', '50%'],
          selectedMode: 'single',
          data: seriesData,
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
      // console.log('params?.data?.chartKey------->', params?.data?.chartKey)
      showDetails(params?.data?.chartKey)
    });

    window.addEventListener('resize', myChart.resize);

    return () => {
      window.removeEventListener('resize', myChart.resize);
      myChart.dispose();
    };
  }, [props.data.chartData]);

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>;
};

export default Chart;