import React from 'react';
import { Pie } from 'react-chartjs-2';


const PieChart = (props) => (
 <>
   <Pie data={props.chartData} />
    </>
);

export default PieChart;