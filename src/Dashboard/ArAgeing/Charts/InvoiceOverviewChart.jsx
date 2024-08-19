import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { convertToIntlCurrency } from '../../../common/util/util';

const InvoiceOverviewChart = (props) => {
  const chartRef = useRef(null);

  const chartData = props?.data?.chartData || [],defaultCurrency = props?.data?.defaultCurrency || '';
  console.log('chartData!!!!-->', chartData)
  useEffect(() => {
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
        trigger: 'item'
      },
      label: {
        show: true,
        position: 'middle',
        formatter: '{b}: {c}'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: '3%'
      },
      series: [
        {
          name: 'Invoice Overview',
          type: 'pie',
          radius: '60%',
          tooltip: {
            valueFormatter: function (value) {
              return `${defaultCurrency} ` + convertToIntlCurrency(value);
            }
          },
          label: {
            show: true,
            color: '#fff',
            position: 'inside',
            formatter: function (row) {
              return `${defaultCurrency} ` + (row?.data?.value ? (convertToIntlCurrency(row?.data?.value ?? 0)) : 0);
            }
          },
          data: [

            {
              value: chartData?.totalOSAmount != null ? Number(chartData?.totalOSAmount)?.toFixed(2) : '', name: 'Total Due Outstanding', itemStyle: {
                color: '#7D0849'
              }
            },
            {
              value: chartData?.invoiceAmount != null ? Number(chartData?.invoiceAmount)?.toFixed(2) : '', name: 'Total Current Outstanding', itemStyle: {
                color: '#ffc107'
              }
            }
          ],
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

    window.addEventListener('resize', myChart.resize);

    return () => {
      window.removeEventListener('resize', myChart.resize);
      myChart.dispose();
    };
  }, [props.data.chartData, defaultCurrency]);

  return <div ref={chartRef} style={{ width: '100%', height: '360px' }}></div>;
};

export default InvoiceOverviewChart;