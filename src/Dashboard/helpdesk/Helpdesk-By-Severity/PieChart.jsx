import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const PieChart = (props) => {
  const chartRef = useRef(null);
  const { severityCounts } = props?.data;
  const { showDetails } = props?.handlers;

  useEffect(() => {
    const chartDom = chartRef.current;
    const myChart = echarts.init(chartDom, null, {
      renderer: 'canvas',
      useDirtyRect: false
    });

    const seriesData = {};
    severityCounts.forEach(x => {
      if (!seriesData[x.oSeverityCode]) seriesData[x.oSeverityCode] = 0;
      seriesData[x.oSeverityCode] += x.oCnt ?? 0;
    })

    const option = {
      title: {
        show: Object.keys(seriesData).length === 0,
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
        formatter: function (d) {
          return d.name + ": " + d.value;
        }
      },
      legend: {
        left: 'center',
        data: Object.keys(seriesData).map(x => severityCounts.find(y => y.oSeverityCode == x)?.oStatus ?? "In Queue")
      },
      series: [
        {
          type: 'pie',
          radius: '65%',
          center: ['50%', '50%'],
          selectedMode: 'single',
          data: Object.keys(seriesData).map(x => {
            return ({ name: severityCounts.find(y => y.oSeverityCode == x)?.oStatus ?? "In Queue", value: seriesData[x], oSeverityCode: x !== 'null' ? x : '' })
          }),
          labelLine: {
            show: false
          },
          label: {
            show: true,
            position: 'inside',
            formatter: function (d) {
              return d.value;
            }
          },
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

    myChart.on('click', (params) => {
      console.log('params--------->', params)
      showDetails(params?.data?.oSeverityCode)
    });

    window.addEventListener('resize', myChart.resize);

    return () => {
      window.removeEventListener('resize', myChart.resize);
      myChart.dispose();
    };
  }, [props.data.severityCounts]);

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>;
};

export default PieChart;