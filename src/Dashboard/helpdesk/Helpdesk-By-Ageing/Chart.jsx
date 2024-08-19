import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const Chart = (props) => {
  const chartRef = useRef(null);

  const { showDetails } = props?.handlers;

  const chartData = props?.data?.chartData || []
  // console.log('chartData-----xxxxxxx-->', chartData)
  useEffect(() => {
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
      colorBy: 'data',
      tooltip: {
        trigger: 'item'
      },
      // toolbox: {
      //   show: !chartData?.[0]?.xAxisData ? false : true,
      //   feature: {
      //     saveAsImage: { show: true, name: 'Open_Helpdesk_By_Ageing' },
      //     magicType: { show: true, type: ['line', 'bar'] },
      //   }
      // },
      legend: {
        top: 'bottom'
      },
      // grid: { containLabel: true },
      xAxis: {
        type: 'category',
        data: chartData.length > 0 ? chartData?.map(x => x.description) : [],
        // show: !chartData?.[0]?.xAxisData ? false : true,
        axisLabel: {
          interval: 0,
          width: "90",
          overflow: "break",
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 100,
          emphasis: {
            label: {
              show: true,
              fontSize: '15',
              fontWeight: 'bold'
            }
          },
          label: {
            show: true
          },
          data: chartData.length > 0 ? chartData?.map(x => ({ value: x.count, name: /*x?.value*/ x?.description, metaData: x?.value })) : []
        }
      ]
    };

    if (option && typeof option === 'object') {
      myChart.setOption(option);
    }

    myChart.on('click', (params) => {
      showDetails(params?.data?.key ?? params?.data?.metaData)
      // showDetails(params?.data?.key ?? params?.data?.name)
      // console.log('params.data.metaData--------->', params)
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