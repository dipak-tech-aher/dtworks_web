import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';


const OpenvscloseInvoiceChart = (props) => {

  const chartRef = useRef(null);

  const chartData = props?.data?.chartData
  useEffect(() => {
    if (chartData?.length > 0) {
      const allDates = [...chartData?.map(item => item?.oOpenMonthYear), ...chartData?.map(item => item?.oClosedMonthYear)];
      const setArrary = [...new Set(allDates)];
      const xAxisLabels = setArrary.filter(item => item !== null);

      const closedInvoiceData = xAxisLabels?.map(date => {
        const matchingData = chartData?.find(item => item?.oClosedMonthYear === date);
        return matchingData ? parseInt(matchingData?.oMonthlyClosedInvCnt) : 0;
      });
      const openInvoiceData = xAxisLabels?.map(date => {
        const matchingData = chartData?.find(item => item?.oOpenMonthYear === date);
        return matchingData ? parseInt(matchingData?.oMonthlyOpenInvCnt) : 0;
      });
      const chartDom = chartRef.current;
      const myChart = echarts.init(chartDom, null, {
        renderer: 'canvas',
        useDirtyRect: false
      });

      const option = {
        title: {
          show: chartData?.length > 0 ? false : true,
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
          data: ['Open Invoice', 'Closed Invoice'],
          left: '2%'
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
            name: 'Open Invoice',
            type: 'line',
            stack: 'Total',
            data: openInvoiceData,
            smooth: true,
            itemStyle: {
              color: '#ffc107'
            }
          },
          {
            name: 'Closed Invoice',
            type: 'line',
            stack: 'Total',
            data: closedInvoiceData,
            smooth: true,
            itemStyle: {
              color: '#7D0849'
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
    }

  }, [props.data.chartData]);

  return <div ref={chartRef} style={{ width: '100%', height: '300px' }}></div>;

};

export default OpenvscloseInvoiceChart;