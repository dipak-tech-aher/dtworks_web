import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { statusConstantCode } from '../../AppConstants.js'

const NegativeScatterChart = (props) => {
  const chartRef = useRef(null);
  const [emojiList, setEmojiList] = useState([]);
  const groupBy = (items, key) => items.reduce(
    (result, item) => ({
      ...result,
      [item[key]]: [
        ...(result[item[key]] || []),
        item,
      ],
    }),
    {},
  );

  const chartDatas = props?.data?.chartData || [];
  const emojis = chartDatas[0]?.emojiList || [];

  useEffect(() => {
    setEmojiList(emojis);
    let filteredChartData = [];
    const data2 = [], finalData = [];

    const groupByStatement = groupBy(chartDatas, 'statement');

    for (const statement in groupByStatement) {
      const statementData = groupByStatement[statement];
      const emoji = emojis.find(emoji => emoji.mapping.symbol === statementData[0].emotion);
      if (emoji && emoji.mapping.rating <= 3) {
        filteredChartData.push(statementData);
        const rating = emoji.mapping.rating;
        const length = statementData.length;
        const percentage = Number(rating * 100);
        data2.push([rating, length, percentage, statement]);
      }
    }
    finalData.push(data2);

    const chartDom = chartRef.current;
    const myChart = echarts.init(chartDom, null, {
      renderer: 'canvas',
      useDirtyRect: false
    });
    // const option = {
    //   title: {
    //     show: finalData[0].length === 0,
    //     textStyle: {
    //       color: "grey",
    //       fontSize: 20
    //     },
    //     text: "No details are available",
    //     left: "center",
    //     top: "center"
    //   },
    //   xAxis: {
    //     name: 'Percentage',
    //     nameLocation: 'middle',
    //     show: finalData[0].length > 0,
    //     nameGap: 40,
    //     splitLine: { show: false },
    //     type: 'category',
    //     axisLabel: {
    //       interval: 0,
    //       rotate: 30
    //     },
    //     min: 0
    //   },
    //   yAxis: {
    //     name: 'Count',
    //     splitLine: { show: false },
    //     show: finalData[0].length > 0,
    //     scale: true,
    //     min: 0,
    //     nameLocation: 'middle',
    //     nameGap: 30
    //   },
    //   grid: {
    //     left: 40,
    //     right: 100
    //   },
    //   tooltip: {
    //     trigger: 'item',
    //     formatter: function (param) {
    //       return param.data[3];
    //     }
    //   },
    //   series: [
    //     {
    //       type: 'scatter',
    //       symbolSize: function (data) {
    //         return Math.sqrt(data[2]);
    //       },
    //       itemStyle: {
    //         color: function (params) {
    //           if (params.data[1] > 3.5) {
    //             return 'green';
    //           } else if (params.data[1] < 2) {
    //             return 'red';
    //           } else if (params.data[1] > 2 && params.data[1] < 3.5) {
    //             return 'blue';
    //           } else {
    //             return 'blue';
    //           }
    //         },
    //       },
    //       data: finalData[0],
    //       emphasis: {
    //         focus: 'self',
    //       },
    //       labelLayout: function () {
    //         return {
    //           x: myChart.getWidth() - 200,
    //           moveOverlap: 'shiftY'
    //         };
    //       },
    //       labelLine: {
    //         show: true,
    //         length2: 2,
    //         lineStyle: {
    //           color: '#bbb'
    //         }
    //       },
    //       label: {
    //         show: true,
    //         formatter: function (param) {
    //           const label = param.data[3];
    //           const maxLabelLength = 20;

    //           if (label.length > maxLabelLength) {
    //             // const formattedLabel = label.replace(new RegExp(`(.{1,${maxLabelLength}}\\s)`, 'g'), '$1\n');
    //             // return formattedLabel;
    //             const truncatedLabel = label.slice(0, maxLabelLength) + '...';
    //             return truncatedLabel;
    //           }

    //           return label;
    //         },
    //         position: 'right',
    //         minMargin: 2,
    //         rich: {
    //           fontSize: 8,
    //           fontWeight: 'bold',
    //           color: 'black',
    //         },
    //       }
    //     },
    //   ],
    // };

    const option = {
      title: {
        show: finalData[0].length === 0,
        textStyle: {
          color: "grey",
          fontSize: 20
        },
        text: "No details are available",
        left: "center",
        top: "center"
      },
      xAxis: {
        name: 'Percentage',
        nameLocation: 'middle',
        show: finalData[0].length > 0,
        nameGap: 40,
        splitLine: { show: false },
        type: 'category',
        min: 0
      },
      yAxis: {
        name: 'Count',
        splitLine: { show: false },
        show: finalData[0].length > 0,
        scale: true,
        min: 0,
        nameLocation: 'middle',
        nameGap: 25
      },
      // grid: {
      //   left: 40,
      //   right: 100
      // },
      tooltip: {
        trigger: 'item',
        formatter: function (param) {
          return param.data[3];
        }
      },
      series: [
        {
          type: 'scatter',
          symbolSize: function (data) {
            // return Math.sqrt(data[2]);
            return 10
          },
          itemStyle: {
            color: function (params) {
              if (params.data[1] > 3.5) {
                return 'green';
              } else if (params.data[1] < 2) {
                return 'red';
              } else if (params.data[1] > 2 && params.data[1] < 3.5) {
                return 'blue';
              } else {
                return 'blue';
              }
            },
          },
          data: finalData[0],
          emphasis: {
            focus: 'self',
          },
          labelLayout: function () {
            return {
              x: myChart.getWidth() - 200,
              moveOverlap: 'shiftY'
            };
          },
          labelLine: {
            show: true,
            length2: 1,
            lineStyle: {
              color: '#bbb'
            }
          },
          label: {
            show: true,
            formatter: function (param) {
              const label = param.data[3];
              const maxLabelLength = 20; // Adjust this value as needed

              if (label.length > maxLabelLength) {
                const truncatedLabel = label.slice(0, maxLabelLength) + '...';
                return truncatedLabel;
              }

              return label;
            },
            position: 'right',
            minMargin: 5,
            rich: {
              fontSize: 8,
              fontWeight: 'bold',
              color: 'black',
            },
          }
        },
      ],
    };

    if (option && typeof option === 'object') {
      myChart.setOption(option);
    }

    window.addEventListener('resize', myChart.resize);

    return () => {
      window.removeEventListener('resize', myChart.resize);
      myChart.dispose();
    };
  }, [chartDatas]);

  return (
    <>
      <div className='row'>
        {
          emojiList.length > 0 && emojiList.map((val, idx) => (
            <div key={idx} className='col-md-3'>
              <h3>{val.symbol}</h3>
              <h3>{val.name}</h3>
            </div>
          ))

        }
      </div>
      <div ref={chartRef} style={{ width: '100%', height: '300px' }}></div>
    </>);
};


export default NegativeScatterChart;