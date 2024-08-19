import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { convertToIntlCurrency } from '../../../common/util/util';

const AgeingChart = (props) => {
  const chartRef = useRef(null);

  const chartData = props?.data?.chartData || [],defaultCurrency = props?.data?.defaultCurrency || '';
  useEffect(() => {
    const chartDom = chartRef.current;
    const myChart = echarts.init(chartDom, null, {
      renderer: 'canvas',
      useDirtyRect: false
    });
    const option = {
      title: {
        show: chartData?.[0]?.xAxisData?.length > 0 ? false : true,
        textStyle: {
          color: "grey",
          fontSize: 20
        },
        text: "No data available",
        left: "center",
        top: "center"
      },
      colorBy: 'data',
      tooltip: {
        trigger: 'item'
      },
      legend: {
        top: 'bottom'
      },
      xAxis: {
        type: 'category',
        data: chartData.length > 0 ? chartData?.[0]?.xAxisData : [],
        show: !chartData?.[0]?.xAxisData ? false : true,
        axisLabel: {
          interval: 0,
          width: "100",
          overflow: "break",
        }
      },
      yAxis: {
        type: 'value'
      },
      grid: {
        left: '20%',
        right: '3%'
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 100,
          tooltip: {
            valueFormatter: function (value) {
              return `${defaultCurrency} `+ (value != 0 ? (convertToIntlCurrency(value)) : 0);
            }
          },
          emphasis: {
            // label: {
            //   show: true,
            //   fontSize: '15',
            //   fontWeight: 'bold',
            // }
            label: {
              show: true,
              position: 'top',
              formatter: function (row) {
                console.log('row-->', row)
                return row?.data?.value != 0 ? convertToIntlCurrency(row?.data?.value ?? 0) : 0;
              }
            }
          },
          // label: {
          //   show: true,
          //   rotate: 90,
          //   align: 'left',
          //   verticalAlign: 'middle',
          //   position: 'insideBottom'
          // },
          label: {
            show: true,
            position: 'top',
            formatter: function (row) {
              //return 0
              return row?.data?.value != 0 ? convertToIntlCurrency(row?.data?.value ?? 0) : 0;
            }
          },
          data: chartData?.length > 0 ? chartData?.[0]?.yAxisData : []
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
  }, [props.data.chartData, defaultCurrency]);

  return <div ref={chartRef} style={{ width: '100%', height: '335px' }}></div>;
};

export default AgeingChart;