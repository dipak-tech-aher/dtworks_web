import chroma from "chroma-js";
import * as echarts from 'echarts';

/**
 * @param {*} time 
 * @returns 
 */
export const formatTimeWithLabels = (time) => {
    if (!time) return time;
    const [hours = 0, minutes = 0, seconds = 0] = time.split(':');
    return `${hours}h:${minutes}m:${seconds}s`;
}

/**
 * Creates a linear gradient for use in ECharts.
 *
 * @param {string} baseColor - The base color for the gradient.
 * @returns {echarts.graphic.LinearGradient} - A linear gradient object for ECharts.
 *
 * @example
 * const gradient = createLinearGradient('rgba(0, 0, 255, 1)');
 * // gradient is now a linear gradient object that can be used as a color in ECharts.
 */
const createLinearGradient = (baseColor) => {
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: baseColor },
        { offset: 1, color: 'rgb(255, 255, 255)' }
    ])
}

/**
 * Creates a pie chart with a linear gradient background color.
 *
 * @param {echarts.ECharts} chart - The ECharts instance.
 * @param {string} baseColor - The base color for the gradient background.
 * */
const getChartColor = (color = {}, key) => {
    return color[key] || chroma.random().brighten().hex()
}

/**
 * Transforms a list of items into a bar chart data structure.
 *
 * @param {Array<Object>} items - The list of items to transform.
 * @param {string} chartType - The type of chart to create (e.g., "bar").
 * */
export const transformBarChart = ({ items, chartType, seriesFormat = "value", palette = {} }) => {
    if (!Array.isArray(items) || !chartType) return { legend: [], seriesData: [], xAxis: [] }
    const result = items.reduce((acc, curr) => {
        const existing = acc.find(item => item?.name === curr?.oType)
        if (existing) {
            if (seriesFormat === 'time') {
                if (curr?.oValue && curr?.oValue?.toString().includes(':')) {
                    const [hours, minutes, seconds] = curr?.oValue?.split(':').map(Number);
                    const formattedValue = hours * 3600 + minutes * 60 + seconds; // Convert to total seconds
                    existing.data.push(formattedValue);
                }
            } else {
                existing.data.push(curr?.oValue)
            }
        } else {

            if (seriesFormat === 'time') {
                if (curr?.oValue && curr?.oValue?.toString().includes(':')) {
                    const [hours, minutes, seconds] = curr?.oValue?.split(':').map(Number);
                    const formattedValue = hours * 3600 + minutes * 60 + seconds; // Convert to total seconds
                    acc.push({
                        name: curr?.oType,
                        type: chartType,
                        data: [formattedValue],
                        color: getChartColor(palette, curr?.oType),
                        label: {
                            show: true,
                            rotate: 0,
                            distance: 15,
                            position: "top",
                            formatter: function (params) {
                                const value = params.value;
                                if (typeof value === 'number') {
                                    const hours = Math.floor(value / 3600);
                                    const minutes = Math.floor((value % 3600) / 60);
                                    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
                                    return formattedTime;
                                } else {
                                    return value;
                                }
                            },
                        },
                    })
                }
            } else {
                acc.push({
                    name: curr?.oType,
                    type: chartType,
                    data: [curr?.oValue],
                    color: getChartColor(palette, curr?.oType)
                    // color: chroma.random().darken().hex()
                })
            }
        }
        return acc
    }, [])

    const legend = (result?.map(item => item?.name) || []).filter(name => name !== null);
    const xAxis = [...new Set(items?.map(item => item?.oName))]
    return { legend: legend || [], seriesData: result || [], xAxis: xAxis || [] }
}

/**
  * Transforms a list of items into a multi Line chart data structure.
 *
 * @param {Array<Object>} items - The list of items to transform.
 * @param {string} chartType - The type of chart to create (e.g., "line").
*/
export const transformMultiLine = (items, chartType, seriesFormat = "value") => {
    if (!Array.isArray(items) || !chartType) return { multiLegend: [], multiSeriesData: [], multiXAxis: [] }
    const result = items.reduce((acc, curr) => {
        const existing = acc.find(item => item?.name === curr?.oType)
        if (existing) {
            existing.data.push(curr?.oValue);
        } else {

            acc.push({
                name: curr?.oType,
                type: chartType,
                data: [curr?.oValue],
                // areaStyle: {
                //     color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                //         offset: 0,
                //         color: 'rgb(46, 176, 249)'
                //     }, {
                //         offset: 1,
                //         color: 'rgb(255, 255, 255)'
                //     }])
                // }
            })
        }
        return acc
    }, [])

    const legend = [] // result.map(item => item.name)
    const xAxis = [...new Set(items?.map(item => item?.oName))]
    return { multiLegend: legend || [], multiSeriesData: result || [], multiXAxis: xAxis || [] }
}

/**
 * Transforms a list of items into a pie chart data structure.
 *
 * @param {Array<Object>} items - The list of items to transform.
 * @param {string} chartType - The type of chart to create (e.g., "bar").
 * */
export const transformSingleBarChart = ({ items = [], chartType, seriesFormat = "value", palette = {} }) => {
    if (!Array.isArray(items) || !chartType) {
        return { legend: [], seriesData: [], xAxis: [] };
    }

    const data = items.map(item => {
        if (seriesFormat === 'time' && item?.oValue?.toString().includes(':')) {
            const [hours, minutes, seconds] = item.oValue.split(':').map(Number);
            return minutes * 60 + seconds; // Convert to total seconds
        } else {
            return item.oValue;
        }
    });

    const xAxis = Array.from(new Set(items.map(item => item.oName)));

    const result = [{
        type: 'bar',
        data,
        color: getChartColor(palette, 'default'),
        label: {
            show: true,
            rotate: 0,
            distance: 15,
            position: "top",
            formatter: function (params) {
                const value = params.value;
                if (seriesFormat === 'time') {
                    const minutes = Math.floor((value % 3600) / 60);
                    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
                    return formattedTime;
                } else {
                    return value
                }
            },
        }
    }];

    const legend = []

    return {
        singleBarLegend: legend,
        singleBarSeriesData: data.length ? result : [],
        singleBarXAxis: xAxis
    };
}

/**
  * Transforms a list of items into a pie line data structure.
 *
 * @param {Array<Object>} items - The list of items to transform.
 * @param {string} chartType - The type of chart to create (e.g., "line").
 */
export const transformLineChart = ({ items = [], chartType, seriesFormat = "value", palette = {} }) => {
    if (!Array.isArray(items) || !chartType) {
        return { lineLegend: [], lineSeriesData: [], lineXAxis: [] }
    }

    const data = items.map(ele => ele.oValue)
    const xAxis = Array.from(new Set(items.map(item => item.oName)))

    const result = [{
        data,
        type: 'line',
        color: getChartColor(palette, 'default'),
        areaStyle: { color: createLinearGradient(getChartColor(palette, 'default')) }
    }];

    const legend = []

    return {
        lineLegend: legend,
        lineSeriesData: data.length ? result : [],
        lineXAxis: xAxis
    }
}

/**
 * Transforms a list of items into a pie chart data structure.
 *
 * @param {Array<Object>} items - The list of items to transform.
 * @param {string} chartType - The type of chart to create (e.g., "pie").
 * */
export const transformPieChart = ({ items = [], chartType, seriesFormat = "value", palette = {} }) => {
    if (!Array.isArray(items) || !chartType) {
        return { pieLegend: [], pieSeriesData: [], pieXAxis: [] };
    }

    const data = items.map(ele => ({ name: ele.oName, value: ele.oValue }));
    const xAxis = Array.from(new Set(items.map(item => item.oName)));

    const result = [{
        data,
        type: 'pie',
        avoidLabelOverlap: false,
        radius: ['40%', '70%'],
        label: {
            show: true,
            formatter: "{b} ({c})",
        },
        labelLine: {
            show: true
        }
    }]

    const legend = []

    return {
        pieLegend: legend,
        pieSeriesData: data.length ? result : [],
        pieXAxis: xAxis
    };
}
