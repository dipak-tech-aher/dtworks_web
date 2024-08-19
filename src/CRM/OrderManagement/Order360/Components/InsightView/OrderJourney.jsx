import React, { useState, useEffect } from 'react';
import ReactEcharts from 'echarts-for-react';
import _ from 'lodash';
import moment from 'moment';

const OrderJourney = ((props) => {
	const [dataPoints, setDataPoints] = useState([]);
	const { provision } = props;
	const { type = 'small' } = props;
	const [height, setHeight] = useState();
	const [width, setWidth] = useState();

	useEffect(() => {
		const { data, height = "600%", width = "100%" } = props;
		if (data?.details && data?.flow && data?.source && data?.flow.length > 0) {
			setDataPoints(data?.flow)
		}
		setWidth(width)
		setHeight(height)
	}, [props])

	const onChartClick = (params) => {
		// console.log('Chart clicked', params);
	};

	const onEvents = {
		'click': onChartClick
	}

	return (
		<div id="explanation-table">
			<ReactEcharts style={{ height, width }}
				option={{
					maintainAspectRatio: false,
					title: {
						show: !dataPoints,
						textStyle: {
							color: "#707070",
							fontSize: 15
						},
						text: "No order flow found",
						left: "center",
						top: "center"
					},
					series: [
						{
							type: 'tree',
							data: dataPoints,
							top: '0%',
							left: '5%',
							bottom: '0%',
							right: '20%',
							label: {
								position: 'outside',
								fontSize: 11,
								align: 'left',
								formatter: function ({ data }) {
									const { status, role, entity, flowDate, provisioning } = data
									const flwDate = flowDate ? moment(flowDate).format('DD-MM-YY') : 'Yet to start'
									if (type === 'small') {
										return ['Status: ' + status]
									}
									return ['Dept/Role: ' + (entity + '-' + (role || '')) + '\nStatus: ' + (status || '') + '\nFlow Created Date: ' + (flwDate || '') + '\nProvision Type: ' + (provisioning || provision || '')].join('') /*+'\nTasks:\n' + (tasksName.length > 0 ? tasksName : 'No tasks found')*/
								}
							},
							leaves: {
								label: {
									position: 'outside',
									fontSize: 11,
									align: 'left',
									formatter: function ({ data }) {
										const { status, role, entity, flowDate, provisioning } = data
										const flwDate = flowDate ? moment(flowDate).format('DD-MM-YY') : 'Yet to start'
										if (type === 'small') {
											return ['Status: ' + status]
										}
										return ['Dept/Role: ' + ((entity || '') + '-' + (role || '')) + '\nStatus: ' + (status || '') + '\nFlow Created Date: ' + (flwDate || '') + '\nProvision Type: ' + (provisioning ? provisioning : provision ? provision : '')].join('')  /*+'\nTasks:\n' + (tasksName.length > 0 ? tasksName : 'No tasks found')*/
									}
								}
							},
							emphasis: {
								focus: 'descendant'
							},
							expandAndCollapse: false,
							animationDuration: 550,
							animationDurationUpdate: 750
						}
					]
				}}
				onEvents={onEvents}
			/>
		</div>
	)
})
export default OrderJourney;




