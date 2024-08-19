import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const PieChart = (props) => {

  const chartRef = useRef(null)
  const option = {
    title: {
      show: props?.seriesData?.length === 0 ? true : false,
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
    legend: {
      ...props?.legendPostion,
      // top: '5%',
      left: 'center'
    },
    color: ['#FF8B3F', '#7CED47', '#FEC53D', '#d48265', '#91c7ae',
      '#749f83', '#ca8622', '#bda29a', '#6e7074', '#546570', '#c4ccd3'],
    series: props?.seriesData ?? []
  }

  useEffect(() => {
    const chartDom = chartRef.current
    const myChart = echarts.init(chartDom, null, {
      renderer: 'canvas',
      useDirtyRect: false
    })

    if (option && typeof option === 'object') {
      myChart.setOption(option);
    }

    window.addEventListener('resize', myChart.resize)
    return () => {
      window.removeEventListener('resize', myChart.resize)
      myChart.dispose()
    }
  }, [props])


  return <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>;

}
export default PieChart;