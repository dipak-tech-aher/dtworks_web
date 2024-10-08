import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const Chart = (props) => {
	const chartRef = useRef(null);
	const chartData = [...props?.data?.chartData, ...props?.data?.chartData, ...props?.data?.chartData] || []

	useEffect(() => {
		const chartDom = chartRef.current;
		const myChart = echarts.init(chartDom, null, {
			renderer: 'canvas',
			useDirtyRect: false
		});
		const option = {
			title: {
				show: !chartData?.[0]?.xAxisData ? true : false,
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
			// 	show: !chartData?.[0]?.xAxisData ? false : true,
			// 	feature: {
			// 		saveAsImage: { show: true },
			// 		magicType: { show: true, type: ['line', 'bar'] },
			// 	}
			// },
			legend: {
				top: 'bottom'
			},
			grid: { containLabel: true },
			xAxis: {
				type: 'category',
				// rotate: 90,
				data: chartData.length > 0 ? chartData?.[0]?.xAxisData?.map((ele)=>ele) : [],
				show: !chartData?.[0]?.xAxisData ? false : true,
				axisLabel: {
					interval: 0,
					rotate: 45,
					width: "90",
					overflow: "break",
					hideOverlap: true
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
					data: chartData?.length > 0 ? chartData?.[0]?.yAxisData : []
				}
			]
		};

		if (option && typeof option === 'object') {
			myChart.setOption(option);
		}

		window.addEventListener('resize', myChart.resize);
		myChart.on('click', (params) => {
			props?.handlers?.OnClick?.(params)
			// showDetails({ severityCode: params?.data?.key, status: params?.data?.status }, 'severityDetails')
		  });
		return () => {
			window.removeEventListener('resize', myChart.resize);
			myChart.dispose();
		};
	}, [props.data.chartData]);

	return <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>;
};

export default Chart;