import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import chroma from "chroma-js";
const ChannelPerformanceChart = (props) => {
  const chartRef = useRef(null);
  const [filteredType, setFilteredType] = useState('currStatusDesc')
  const [filteredValue, setFilteredValue] = useState('Status')
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

  const chartData = props?.data?.chartData || []
  const entityTypes = [{
    label: "Status",
    value: "currStatusDesc"
  },
  // {
  //   label: "Service Category",
  //   value: "categoryDescription"
  // },
  // {
  //   label: 'Interaction/Order Category',
  //   value: "tranCategoryDesc"
  // },
  // {
  //   label: 'Interaction/Order Type',
  //   value: "tranTypeDesc"
  // },
  {
    label: 'Service Type',
    value: 'serviceTypeDesc'
  }, {
    label: 'Priority',
    value: 'priorityDesc'
  }]

  useEffect(() => {

    const chartDataModified = chartData.map(x => ({
      ...x,
      tranTypeDesc: x.srType?.description ? x.srType?.description : x.helpdeskTypeDesc?.description || '',

      tranCategoryDesc: x.intxnCategoryDesc?.description || '',

      categoryDescription: x.categoryDescription?.description || '',

      serviceTypeDesc: x.serviceTypeDesc?.description || '',

      currStatusDesc: x.currStatusDesc?.description ? x.currStatusDesc?.description : x.statusDesc?.description || '',

      priorityDesc: x.priorityDescription?.description || x?.severityDesc?.description,

      channelDescription: x.channleDescription?.description ? x.channleDescription?.description : x.helpdeskSourceDesc?.description || ''
    }))

    let yAxisData, groupBymode

    groupBymode = groupBy(chartDataModified, filteredType)
    yAxisData = Object.keys(groupBymode);
    const seriesData = new Set();
    const xAxisData = new Set()
    chartDataModified.map(x => xAxisData.add(x.channelDescription))
    const obj = {
      name: filteredValue
    }
    let data = []
    for (const y of Array.from(yAxisData)) {
      const child = {
        name: y
      }
      let filteredData = [], childData = []
      for (const x of Array.from(xAxisData)) {
        filteredData = chartDataModified.filter(ch => ch.channelDescription === x && ch[filteredType] === y)
        childData.push({
          name: x === '' ? 'Empty' : x, value: filteredData.length
        })
      }
      child.children = childData
      child.itemStyle = {
        color: chroma.random().darken().hex()
      }
      data.push(child)
    }
    obj.children = data

    seriesData.add(obj)

    const getLevelOption = () => {
      return [
        {
          itemStyle: {
            borderColor: '#777',
            borderWidth: 0,
            gapWidth: 1
          },
          upperLabel: {
            show: false
          }
        },
        {
          itemStyle: {
            borderColor: '#555',
            borderWidth: 5,
            gapWidth: 1
          },
          emphasis: {
            itemStyle: {
              borderColor: '#ddd'
            }
          }
        },
        {
          colorSaturation: [0.35, 0.5],
          itemStyle: {
            borderWidth: 5,
            gapWidth: 1,
            borderColorSaturation: 0.6
          }
        }
      ];
    }
    const option = {
      height: "400px",
      title: {
      },
      tooltip: {
      },
      label: {
        position: 'insideTopLeft',
        formatter: function (params) {
          let arr = [
            params.name, params.value
          ];
          return arr.join(' ');
        }
      },
      series: [
        {
          name: '',
          type: 'treemap',
          visibleMin: 300,
          roam: 'move',
          label: {
            show: true,
          },
          upperLabel: {
            show: true,
            height: 30
          },
          itemStyle: {
            borderColor: '#fff'
          },
          levels: getLevelOption(),
          data: Array.from(seriesData)
        }
      ]
    };

    const chartDom = chartRef.current;
    const myChart = echarts.init(chartDom, null, {
      renderer: 'canvas',
      useDirtyRect: false
    });

    if (option && typeof option === 'object') {
      myChart.setOption(option);
    }

    window.addEventListener('resize', myChart.resize);

    return () => {
      window.removeEventListener('resize', myChart.resize);
      myChart.dispose();
    };
  }, [chartData, filteredType]);

  return (
    <>
      <div className='col-md-4' style={{ float: 'right', position: 'relative', display: 'inline-block', top: '-20px' }}>
        <div className="" style={{ zIndex: '1', position: 'absolute' }}>
          <select className='form-control' value={filteredType} onChange={(e) => {
            setFilteredType(e.target.value);
            setFilteredValue(e.target.options[e.target.selectedIndex].label)
          }}>
            {
              entityTypes.map(k => (
                <option value={k.value}>{k.label}</option>
              ))
            }
          </select>
        </div>
      </div>
      <div ref={chartRef} style={{ width: '100%', height: '350px' }}></div>
    </>
  );
};

export default ChannelPerformanceChart;