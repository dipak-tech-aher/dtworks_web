import React, { useRef, useEffect, useContext, useState } from 'react';
import * as echarts from 'echarts';
import { properties } from '../../../../properties';
import { post } from '../../../../common/util/restUtil';
import { OmniChannelContext } from '../../../../AppContext';
const barColors = ['#DECEA9', '#D0A02E', '#DECEA9', "#1f77b4", "#ff7f0e", "#2ca02c", '#54C1EE', '#4E33B0', '#654743', '#184636', 'RoyalBlue', 'green', 'yellow', 'orange', 'purple', 'red', 'grey', 'indigo', 'voilet', 'white', 'Pink', 'Cyan', '#E881F0', '#C876B5', '#E4DB07', '#914C83', '#7C37D3', '#867A5B', '#C29AE1', '#7C8B5B', '#EA4330']
export default function AbandonedHelpdeskRate() {
  const { data, Loader } = useContext(OmniChannelContext);
  const { channel, entity, searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, sla, currentRole, createRole, user, createdDepartment, currentDepartment } = searchParams;;
  const [chartData, SetChartData] = useState();
  const chartRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const apiDetails = {
    Helpdesk: {
      endpoint: `${properties.HELPDESK_API}/omni-dashboard`
    },
    Interaction: {
      endpoint: `${properties.INTERACTION_API}/omni-dashboard`
    }
  }

  const getChartData = (entity) => {
    try {
      let requestObj = { ...searchParams }
      if (channel !== 'ALL') requestObj.channel = channel
      setIsLoading(true)
      post(apiDetails[entity].endpoint + '/abandoned-rate', { searchParams: requestObj })
        .then((response) => {
          if (response?.data?.length) SetChartData(response?.data); else SetChartData([]);
        }).catch(error => {
          console.log(error)
          SetChartData([])
        }).finally(() => {
          loaderClose()
        })
    } catch (e) {
      console.log('error', e)
    }
  }
  const loaderClose = () => setIsLoading(false)

  useEffect(() => {
    if (fromDate && toDate) getChartData(entity);
  }, [channel, entity, channel, fromDate, toDate, category, type, status, sla, currentRole, createRole, user, createdDepartment, currentDepartment, isPageRefresh])

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
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999'
          }
        }
      },
      xAxis: [
        {
          type: 'category',
          data: chartData?.map((val) => val.oInterval),
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
          max: 100,
          interval: 20,
          axisLabel: {
            formatter: '{value}%'
          },
          nameLocation: 'middle',
          nameGap: 30,
        },
      ],
      series: [
        {
          name: `Abandoned ${entity} Rate`,
          type: 'bar',
          data: chartData?.map((val, i) => {
            return { value: val.oCount, itemStyle: { color: barColors[i] } }
          }),
          tooltip: {
            valueFormatter: function (value) {
              return value + '%';
            }
          },
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

    window.addEventListener('resize', myChart.resize);
    return () => {
      window.removeEventListener('resize', myChart.resize);
      myChart.dispose();
    };
  }, [chartData]);

  return (
    <div className="col-6 px-lg-1">
      <div className="cmmn-skeleton mh-480">
        <div className="skel-dashboard-title-base">
          <span className="skel-header-title">
            Abandoned {entity} Rate
          </span>
        </div>
        <hr className="cmmn-hline" />
        {isLoading ? (
          <Loader />
        ) : (
          <div className="skel-graph-sect mt-0">
            <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>
          </div>
        )}
      </div>
    </div>
  )
}