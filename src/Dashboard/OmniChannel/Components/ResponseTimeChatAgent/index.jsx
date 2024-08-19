import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
export default function ResponseTimeChatAgent() {
  const chartRef = useRef(null);

  useEffect(() => {
    const chartDom = chartRef.current;
    const myChart = echarts.init(chartDom, null, {
      renderer: 'canvas',
      useDirtyRect: false
    });
    const option = {
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
        //   dataView: { show: true, readOnly: false },
        //   magicType: { show: true, type: ['line', 'bar'] },
        //   restore: { show: true },
        //   saveAsImage: { show: true },
        top: '3%',
        orient: 'vertical'
        }
      },
      legend: {
        data: ['Inbound Calls', 'Outbound Calls'],
        top: '4%',
        show: false
      },
      xAxis: [
        {
          type: 'category',
          data: ['Jan', 'Feb', 'Mar'],
          axisPointer: {
            type: 'shadow'
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '',
          min: 0,
          max: 2.5,
          interval: 0.5,
        //   axisLabel: {
        //     formatter: '${value}'
        //   },
        name: 'Seconds',
        nameLocation: 'middle',
        nameGap: 30
        },
      ],
      series: [
        {
          name: 'Average Response Time - Agent',
          type: 'bar',
          data: [
                {
                    value: 1.5,
                    itemStyle: {color: '#CFF0BB'},
                },
                {
                    value: 2,
                    itemStyle: {color: '#7FC654'},
                },
                {
                    value: 1.5,
                    itemStyle: {color: '#CFF0BB'},
                }
            ],
        },
      ],
      label: {
            show: true,
            position: 'top'
        },
    };

    if (option && typeof option === 'object') {
      myChart.setOption(option);
    }

    // myChart.on('click', (params) => {
    //     countClicked(params?.data?.metaData?.code)
    // });

    window.addEventListener('resize', myChart.resize);

    return () => {
      window.removeEventListener('resize', myChart.resize);
      myChart.dispose();
    };
  }, []);
  return (
    <div className="col-6 px-lg-1">
      <div className="cmmn-skeleton mh-480">
        <div className="skel-dashboard-title-base">
          <span className="skel-header-title">
            Average Response Time - Agent
          </span>
        </div>
        <hr className="cmmn-hline" />
        <div className="skel-graph-sect mt-0">
          <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>;
        </div>
      </div>
    </div>
  )
}