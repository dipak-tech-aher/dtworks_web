import React from 'react';
import ReactECharts from 'echarts-for-react';

const DoughnutChart = ({ chartData }) => {

  const getOption = () => {
    return {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: chartData ? chartData.map(item => item.name) : []
      },
      series: [
        {
          name: 'Contract Value',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '30',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: chartData ? chartData : [],
          itemStyle: {
            color: (params) => {
              const colors = [
                'rgba(75, 192, 192, 0.6)',
                'rgba(255, 99, 132, 0.6)'
              ];
              return colors[params.dataIndex % colors.length];
            },
            borderColor: (params) => {
              const colors = [
                'rgba(75, 192, 192, 1)',
                'rgba(255, 99, 132, 1)'
              ];
              return colors[params.dataIndex % colors.length];
            },
            borderWidth: 1,
          },
        }
      ]
    };
  };

  return (
    <ReactECharts option={getOption()} style={{ height: '400px', width: '100%' }} />
  );
};

export default DoughnutChart;
