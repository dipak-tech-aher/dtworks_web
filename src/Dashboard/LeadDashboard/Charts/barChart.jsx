import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const Chart = (props) => {
  const chartRef = useRef(null);

  const { countClicked } = props?.handler;

  const chartData = props?.data?.chartData || []

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
      legend: {
        top: 'bottom'
      },
      xAxis: {
        type: 'category',
        data: chartData?.length > 0 ? chartData?.map(x => x?.type) : [],
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
          data: chartData.length > 0 ? chartData?.map(x => ({ value: x?.count, name: x?.type, metaData: x })) : []
        }
      ]
    };

    if (option && typeof option === 'object') {
      myChart.setOption(option);
    }

    myChart.on('click', (params) => {
      countClicked(params?.data?.metaData?.code)
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