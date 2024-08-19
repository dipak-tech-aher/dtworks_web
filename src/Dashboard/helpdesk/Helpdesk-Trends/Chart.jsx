import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const Chart = (props) => {
  const chartRef = useRef(null);

  const chartData = props?.data?.chartData || []

  useEffect(() => {
    const chartDom = chartRef.current;
  const myChart = echarts.init(chartDom, null, {
    renderer: 'canvas',
    useDirtyRect: false
  });

  // Convert date strings to Date objects for proper sorting
  chartData.sort((a, b) => new Date(a.oDayMonth) - new Date(b.oDayMonth));

  const wipData = chartData.filter(item => item.oStatus === 'WIP').map(item => parseInt(item.oCnt));


  // const closedData = chartData.filter(item => item.oStatus === 'CLOSED').map(item => parseInt(item.oCnt));
  const allDates = chartData.map(item => item.oDayMonth);
  const xAxisLabels = [...new Set(allDates)];

  const closedData = xAxisLabels.map(date => {
    const matchingData = chartData.find(item => item.oDayMonth === date && item.oStatus === 'CLOSED');
    return matchingData ? parseInt(matchingData.oCnt) : null;
  });

    const option = {
      title: {
        show: !closedData?.length && !wipData.length,
        textStyle: {
          color: "grey",
          fontSize: 20
        },
        text: "No data available",
        left: "center",
        top: "center"
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['WIP', 'CLOSED']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisLabels

      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: 'CLOSED',
          type: 'line',
          stack: 'Total',
          data: closedData,
          lineStyle: {
            color: '#5470C6',
            width: 9
          }
        },
        {
          name: 'WIP',
          type: 'line',
          stack: 'Total',
          data: wipData,
          lineStyle: {
            color: 'rgb(0, 229, 150)',
            width: 9,
            type: 'dashed'
          },
          itemStyle: {
            borderWidth: 3,
            borderColor: 'rgb(0, 227, 150)',
            color: 'rgb(0, 227, 150)'
          }
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
  }, [props.data.chartData]);

  // useEffect(() => {
  //   const chartDom = chartRef.current;
  //   const myChart = echarts.init(chartDom, null, {
  //     renderer: 'canvas',
  //     useDirtyRect: false
  //   });

  //   chartData.sort(function (a, b) {
  //     return new Date(`${a.oDayMonth}`) - new Date(`${b.oDayMonth}`);
  //   });

  //   const wipData = chartData.filter(item => item.oStatus === 'WIP').map(item => parseInt(item.oCnt));
  //   const closedData = chartData.filter(item => item.oStatus === 'CLOSED').map(item => parseInt(item.oCnt));
  //   const xAxisLabels = [...new Set(chartData.map(item => item.oDayMonth))]
  //   const option = {
  //     title: {
  //       show: !closedData?.length && !wipData.length,
  //       textStyle: {
  //         color: "grey",
  //         fontSize: 20
  //       },
  //       text: "No data available",
  //       left: "center",
  //       top: "center"
  //     },
  //     tooltip: {
  //       trigger: 'axis'
  //     },
  //     legend: {
  //       data: ['WIP', 'CLOSED']
  //     },
  //     grid: {
  //       left: '3%',
  //       right: '4%',
  //       bottom: '3%',
  //       containLabel: true
  //     },
  //     xAxis: {
  //       type: 'category',
  //       boundaryGap: false,
  //       data: xAxisLabels

  //     },
  //     yAxis: {
  //       type: 'value'
  //     },
  //     series: [
  //       {
  //         name: 'CLOSED',
  //         type: 'line',
  //         stack: 'Total',
  //         data: closedData,
  //         lineStyle: {
  //           color: '#5470C6',
  //           width: 9
  //         }
  //       },
  //       {
  //         name: 'WIP',
  //         type: 'line',
  //         stack: 'Total',
  //         data: wipData,
  //         lineStyle: {
  //           color: 'rgb(0, 229, 150)',
  //           width: 9,
  //           type: 'dashed'
  //         },
  //         itemStyle: {
  //           borderWidth: 3,
  //           borderColor: 'rgb(0, 227, 150)',
  //           color: 'rgb(0, 227, 150)'
  //         }
  //       }
  //     ]
  //   };

  //   if (option && typeof option === 'object') {
  //     myChart.setOption(option);
  //   }

  //   window.addEventListener('resize', myChart.resize);

  //   return () => {
  //     window.removeEventListener('resize', myChart.resize);
  //     myChart.dispose();
  //   };
  // }, [props.data.chartData]);

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>;
};

export default Chart;