import React, { useRef, useEffect, useContext, useState } from 'react';
import * as echarts from 'echarts';
import { properties } from '../../../../properties';
import { post } from '../../../../common/util/restUtil';
import { OmniChannelContext } from '../../../../AppContext';
import { groupBy } from 'lodash';
export default function CustomerSatisfactionScoresAgent() {
  const { data, Loader } = useContext(OmniChannelContext);
  const { channel, entity, searchParams = {} } = data, { fromDate, toDate, category, type, status, sla, currentRole, createRole, user, createdDepartment, currentDepartment, isPageRefresh } = searchParams;;
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
      post(apiDetails[entity].endpoint + '/customer-statis-score-aget', { searchParams: requestObj })
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
    let channels = [], seriesData = [], XAixs = [];
    if (chartData?.length) {
      // Extract unique channels and intervals
      channels = [...new Set(chartData.map(item => item.catType))];
      XAixs = [...new Set(chartData.map(item => item.oInterval))];

      // Group data by channel
      const groupedData = groupBy(chartData, 'catType');

      // Prepare series data
      channels.forEach(channel => {
        const dataItem = {
          name: channel,
          type: 'bar',
          stack: 'total',
          data: XAixs.map(interval => {
            const filteredItem = groupedData[channel].find(val => val.oInterval === interval);
            return filteredItem ? parseInt(filteredItem.oCount) : 0;
          }),
          tooltip: {
            valueFormatter: function (value) {
              return value + '%';
            }
          },
          label: {
            color: "black",
            fontSize: 12,
            formatter: '{@score}%'
          }

        };
        seriesData.push(dataItem);
      });
    }
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
      legend: {
        data: channels
      },
      xAxis: {
        type: 'category',
        data: XAixs
      },
      yAxis: {
        type: 'value'
      },
      series: seriesData,
      label: {
        show: true,
        position: 'inside',
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
          Customer Satisfaction Scores - Agent
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