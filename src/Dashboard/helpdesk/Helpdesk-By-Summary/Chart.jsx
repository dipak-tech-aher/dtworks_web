import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const Chart = (props) => {
  const chartRef = useRef(null);
  const { showDetails } = props?.handlers
  const chartData = props?.data?.chartData || []
  // console.log('chartData-----x summary-->', chartData);

  useEffect(() => {
    const chartDom = chartRef.current;
    const myChart = echarts.init(chartDom, null, {
      renderer: 'canvas',
      useDirtyRect: false
    });
    const xAxisData = [...new Set(chartData.map(item => item?.oPriority))];

    const priorities = [...new Set(chartData.map(item => JSON.stringify({ oSeverityCode: item?.oSeverityCode, oPriority: item?.oPriority })))].map(str => JSON.parse(str));

    const statuses = [...new Set(chartData.map(item => item?.oStatus))];

    // Create a dictionary to store the sum of counts for each combination of status and priority
    const counts = {};

    chartData.forEach(item => {
      const key = JSON.stringify({ status: item.oStatus, priority: item.oPriority, severityCode: item.oSeverityCode });
      if (!counts[key]) {
        counts[key] = { value: 0, key: item.oSeverityCode, status: item.oStatusCode };
      }
      counts[key].value += item.oCnt;
    });


    const series = statuses.map(status => {
      const data = priorities.map(priority => {
        const key = JSON.stringify({ status: status, priority: priority?.oPriority, severityCode: priority?.oSeverityCode });
        return counts[key] ? counts[key] : { value: 0, key: priority?.oSeverityCode, status: null };
      });
      // console.log('data-------->', data);
      return {
        name: status,
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: data
      };
    });


    const option = {
      title: {
        show: series.length === 0,
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
        formatter: '{b}<br/>{a}: {c}'
      },
      // toolbox: {
      //   show: !chartData?.[0]?.xAxisData ? false : true,
      //   feature: {
      //     saveAsImage: { show: true },
      //     magicType: { show: true, type: ['line', 'bar'] },
      //   }
      // },
      legend: {},
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData.map(x => x ? x : 'In Queue')
      },
      yAxis: {
        type: 'value'
      },
      series: series
    };

    if (option && typeof option === 'object') {
      myChart.setOption(option);
    }


    myChart.on('click', (params) => {
      console.log(params);
      showDetails({ severityCode: params?.data?.key, status: params?.data?.status }, 'severityDetails')
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