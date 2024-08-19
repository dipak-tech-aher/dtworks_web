import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const EngagementByStatusChart = (props) => {
	const chartRef = useRef(null);
	const { chartData = [], height } = props.data;
	const { setShow, setListFilter } = props.handlers

	useEffect(() => {
		const chartDom = chartRef.current;
		const myChart = echarts.init(chartDom, null, {
			renderer: 'canvas',
			useDirtyRect: false
		});
		const option = {
			title: {
				show: !chartData.length ? true : false,
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
			grid: { containLabel: true },
			xAxis: {
				type: 'category',
				rotate: 90,
				data: chartData?.length > 0 ? chartData?.map(ele => ele.oTypeDesc) : [],
				show: !chartData?.length ? false : true,
				axisLabel: {
					interval: 0,
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
					data: chartData?.length > 0 ? chartData?.map(ele => ele.oCnt) : []
				}
			]
		};

		if (option && typeof option === 'object') {
			myChart.setOption(option);
		}

		window.addEventListener('resize', myChart.resize);

		myChart.on('click', (params) => {
			const selectedGraph = chartData.filter((ele) => ele.oTypeDesc === params.name)?.map((e) => ({ label: e.oTypeDesc, value: e.oTypeCode })) ?? []
			if (selectedGraph) {
				setListFilter({ ...selectedGraph?.[0] })
				setShow(true)
			}
		})

		return () => {
			window.removeEventListener('resize', myChart.resize);
			myChart.dispose();
		};
	}, [props.data.chartData]);

	return <div ref={chartRef} style={{ width: '100%', height: height }}></div>;
}

export default EngagementByStatusChart