import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { convertToIntlCurrency } from '../../../common/util/util';

const OverdueChart = (props) => {
  const chartRef = useRef(null);

  const chartData = props?.data?.chartData || [], defaultCurrency = props?.data?.defaultCurrency || '';
  console.log('chartData-----xxx---->', chartData)
  useEffect(() => {
    if (chartData) {
      const chartDom = chartRef.current;
      const myChart = echarts.init(chartDom, null, {
        renderer: 'canvas',
        useDirtyRect: false
      });

      const option = {
        title: {
          show: Object.keys(chartData)?.length > 0 ? false : true,
          textStyle: {
            color: "grey",
            fontSize: 20
          },
          text: "No data available",
          left: "center",
          top: "center"
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            crossStyle: {
              color: '#999'
            }
          }
        },
        toolbox: {
          feature: {
            dataView: { show: false, readOnly: false },
            magicType: { show: false, type: ['line', 'bar'] },
            restore: { show: false },
            saveAsImage: { show: false }
          }
        },
        legend: {
          data: ['Invoice', 'Receipt'],
          left: 'center'
        },
        grid: {
          left: '20%',
          right: '3%'
        },
        xAxis: [
          {
            type: 'category',
            data: ['Amount'],
            axisPointer: {
              type: 'shadow'
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '',
            axisLabel: {
              formatter: '{value}'
            }
          },
          {
            type: 'value',
            name: '',
            axisLabel: {
              formatter: ''
            }
          }
        ],
        label: {
          show: true,
          //color: '#fff'
        },
        series: [
          {
            name: 'Invoice',
            type: 'bar',

            tooltip: {
              valueFormatter: function (value) {
                return `${defaultCurrency} `+ convertToIntlCurrency(value);
              }
            },
            label: {
              show: true,
              position: 'inside',
              formatter: function (row) {
                return `${defaultCurrency} `+ convertToIntlCurrency(row?.data ?? 0);
              }
            },
            data: [chartData.oTotalInvAmount],
            itemStyle: {
              color: '#ffc107'
            }
          },
          {
            name: 'Receipt',
            type: 'bar',
            label: {
              show: true,
              position: 'inside',
              formatter: function (row) {
                return `${defaultCurrency} `+ convertToIntlCurrency(row?.data ?? 0);
              }
            },
            tooltip: {
              valueFormatter: function (value) {
                return `${defaultCurrency} `+ convertToIntlCurrency(value);
              }
            },
            data: [chartData.oTotalReceiptAmount],
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
  }, [props.data.chartData, defaultCurrency]);

  return <div ref={chartRef} style={{ width: '100%', height: '320px' }}></div>;
};

export default OverdueChart;