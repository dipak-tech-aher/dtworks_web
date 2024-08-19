import React from 'react';
import ReactECharts from 'echarts-for-react';

const GroupedColumnChart = (props) => {
    // console.log('props -------------->', props)
    // const [chartData, setChartData] = useState(props.data);

    // useEffect(() => {
    //     getData(chartData);
    // }, [chartData]);

    const getOption = () => {
        return {
            title: {
                show: props?.seriesData?.length === 0 ? true : false,
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
                axisPointer: { type: 'shadow' },
            },
            label: {
                show: true,
                position: 'top'
            },
            legend: {
                data: props?.legend ?? [],
                top: '4%'
            },
            grid: {
              //  left: '3%',
               // right: '4%',
              //  bottom: '3%',
                containLabel: true
            },
            xAxis: [
                {
                    show: props?.seriesData?.length > 0 ? true : false,
                    type: 'category',
                    data: props?.xAxis ?? [],
                    axisPointer: {
                        type: 'shadow'
                    }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    nameGap: 45
                }
            ],
            series: props?.seriesData ?? [],
            itemStyle: {
                barBorderRadius: 3,
                borderWidth: 1,
                // color: barColor
            },
            barCategoryGap: "50%"
        }
    };

    return (
        <ReactECharts option={getOption()} style={{ height: '400px', width: '100%' }} />
    );
};

export default GroupedColumnChart;
