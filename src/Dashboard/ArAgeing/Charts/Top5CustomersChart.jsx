import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { convertToIntlCurrency } from '../../../common/util/util';

const Top5CustomersChart = (props) => {
  const chartRef = useRef(null);
  const chartData = props?.data?.chartData || [] , defaultCurrency = props?.data?.defaultCurrency || ''
  // const chartData = [['359', 'Selvaraj', '862.48'], ['360', 'Selvaraj', '818.73']]
  console.log('Top 5 customers----->>', chartData)
  useEffect(() => {
    const chartDom = chartRef.current;
    const myChart = echarts.init(chartDom, null, {
      renderer: 'canvas',
      useDirtyRect: false
    });

    const source = [
      ['score', 'product', 'amount'],
      ...chartData
    ]
    let counts = {};
    source?.forEach(item => {
      let value = item[1];
      if (counts[value]) {
        counts[value]++;
        item[1] = `${value} `
      } else {
        counts[value] = 1;
      }
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
        valueFormatter: function (value) {
          return `${defaultCurrency} ` + convertToIntlCurrency(value);
        }
      },
      dataset: {
        source
      },
      grid: { containLabel: true },
      xAxis: {
        name: '', axisLabel: {
          rotate: 30,
        }
      },
      yAxis: {
        type: 'category',
        axisLabel: {
          interval: 0,
          formatter: function (value) {
            let customerName = value.substring(0, 15)
            if (value.length === customerName.length) {
              customerName = value
            } else {
              customerName = customerName + '...'
            }
            return customerName;
          }
        },
      },
      visualMap: {
        orient: 'horizontal',
        left: 'center',
        show: false,
        min: 10,
        max: 100,
        text: [],
        dimension: 0,
        inRange: {
          color: ['#ffc107']
        }
      },
      label: {
        color: '#373737',
        show: true,
        position: 'right',
        formatter: function (row) {
          console.log('row?.data[2]-------->', row?.data)
          return `${defaultCurrency} ` + row?.data ? (row?.data ? (convertToIntlCurrency(Number(row?.data[2]) ?? 0)) : 0) : 0;
        }
      },
      series: [
        {
          type: 'bar',
          encode: {
            x: 'amount',
            y: 'product'
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

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>;
};

export default Top5CustomersChart;