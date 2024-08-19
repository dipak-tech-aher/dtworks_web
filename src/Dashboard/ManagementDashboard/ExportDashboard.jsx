import { isEmpty, snakeCase } from 'lodash'
import React, { useContext } from 'react'
import { AppContext, ManagementDashboardContext } from '../../AppContext'
import GroupedColumnChart from '../../ChartComponents/groupedBar'
import LineChart from '../../ChartComponents/lineChart'
import PieChart from '../../ChartComponents/pieChart'
import ChartSkeletionCard from './Components/ChartSkeletonCard'
import GridCard from './Components/GridCard'
import GridComponent from './Components/GridComponent'
import IconCard from './Components/IconCard'
import ImageTitleCard from './Components/ImageTitleCard'
import StatisticCard from './Components/StatisticCard'
import TableList from './Components/TableList'
import { transformBarChart, transformLineChart, transformMultiLine, transformPieChart, transformSingleBarChart } from './Utils/helper'

const ExportDashboard = React.forwardRef((props, ref) => {

    const { appConfig } = useContext(AppContext), { pdf = false, data = {}, skeleton } = props
    const { handlers } = useContext(ManagementDashboardContext)
    const { getIcon } = handlers

    const getChartKey = (item) => {
        if (item && !isEmpty(item)) return `${snakeCase(item.chartName)}_${item.chartOrder}`
        return
    }

    const getChartDetails = (item) => {
        switch (item.chartType) {

            case 'IconCard':
                return <IconCard
                    key={getChartKey(item)}
                    imageSrc={getIcon(item?.iconType)}
                    title={item.chartName}
                    valueformat={item?.chartPayload?.valueFormat?.type ?? ''}
                    values={{ value: data[getChartKey(item)]?.oValue || 0 }} />

            case 'StatisticCard':
                return <StatisticCard
                    key={getChartKey(item)}
                    imageSrc={getIcon(item?.iconType)}
                    title={item.chartName}
                    iconColor={item.chartPayload.iconColor}
                    valueformat={item?.chartPayload?.valueFormat?.type ?? ''}
                    values={{ value: data[getChartKey(item)]?.oValue || 0 }} />

            case 'ImageTitleCard':
                return <ImageTitleCard
                    key={getChartKey(item)}
                    imageSrc={getIcon(item?.iconType)}
                    title={item.chartName}
                    iconColor={item.chartPayload.iconColor}
                    valueformat={item?.chartPayload?.valueFormat?.type ?? ''}
                    values={{ value: data[getChartKey(item)]?.oValue || 0 }} />

            case 'VerticalBar-Single':
                const { singleBarSeriesData, singleBarLegend, singleBarXAxis } =
                    transformSingleBarChart({
                        items: data[getChartKey(item)],
                        chartType: item?.chartPayload?.baseChartType || 'bar',
                        seriesFormat: item?.chartPayload?.seriesFormat,
                        palette: item?.chartPayload?.color || {}
                    }) || {}

                return <ChartSkeletionCard
                    key={getChartKey(item)}
                    title={item.chartName}
                    sizeCount={item.noOfChartsPerpage || 2}>
                    <GroupedColumnChart
                        seriesData={singleBarSeriesData} legend={singleBarLegend} xAxis={singleBarXAxis} />
                </ChartSkeletionCard>

            case 'VerticalBar-Group':
                const { seriesData, legend, xAxis } =
                    transformBarChart({
                        items: data[getChartKey(item)],
                        chartType: item?.chartPayload?.baseChartType || 'bar',
                        seriesFormat: item?.chartPayload?.seriesFormat,
                        palette: item?.chartPayload?.color || {}
                    }) || {}

                return <ChartSkeletionCard
                    key={getChartKey(item)}
                    title={item.chartName}
                    sizeCount={item.noOfChartsPerpage || 2}>
                    <GroupedColumnChart
                        seriesData={seriesData} legend={legend} xAxis={xAxis} />
                </ChartSkeletionCard>

            case 'Line':
                const { lineSeriesData, lineLegend, lineXAxis } =
                    transformLineChart({
                        items: data[getChartKey(item)],
                        chartType: item?.chartPayload?.baseChartType || 'line',
                        palette: item?.chartPayload?.color || {}
                    }) || {}

                return <ChartSkeletionCard
                    key={getChartKey(item)}
                    title={item.chartName}
                    sizeCount={item.noOfChartsPerpage || 2}>
                    <LineChart
                        seriesData={lineSeriesData} legend={lineLegend} xAxis={lineXAxis} />
                </ChartSkeletionCard>

            case 'Multi-Line':
                const { multiLegend, multiSeriesData, multiXAxis } =
                    transformMultiLine({
                        items: data[getChartKey(item)],
                        chartType: item?.chartPayload?.baseChartType || 'line',
                        palette: item?.chartPayload?.color || {}
                    }) || []
                return <ChartSkeletionCard
                    key={getChartKey(item)}
                    title={item.chartName}
                    sizeCount={item.noOfChartsPerpage || 2}>
                    <LineChart
                        seriesData={multiSeriesData} legend={multiLegend} xAxis={multiXAxis} />
                </ChartSkeletionCard>

            case 'Pie':
                const { pieLegend, pieSeriesData, pieXAxis } =
                    transformPieChart({
                        items: data[getChartKey(item)],
                        chartType: item?.chartPayload?.baseChartType || 'pie',
                        palette: item?.chartPayload?.color || {}
                    }) || []

                return <ChartSkeletionCard
                    key={getChartKey(item)}
                    title={item.chartName}
                    sizeCount={item.noOfChartsPerpage || 2}>
                    <PieChart
                        seriesData={pieSeriesData} legend={pieLegend} xAxis={pieXAxis} legendPostion={item?.chartPayload?.legendPostion} />
                </ChartSkeletionCard>

            case 'Grid':
                return <ChartSkeletionCard
                    key={getChartKey(item)}
                    title={item.chartName}
                    sizeCount={item.noOfChartsPerpage || 1}>
                    <GridComponent
                        headerColumns={item?.chartPayload?.grid?.headers || []} title={item.chartName} rows={data[getChartKey(item)]} />
                </ChartSkeletionCard>

            case 'Grid Card':
                return <ChartSkeletionCard
                    key={getChartKey(item)}
                    title={item.chartName}
                    sizeCount={item.noOfChartsPerpage || 1}>
                    <GridCard
                        items={data[getChartKey(item)]} />
                </ChartSkeletionCard>

            case 'List':
                return <ChartSkeletionCard
                    key={getChartKey(item)}
                    title={item.chartName}
                    sizeCount={item.noOfChartsPerpage || 1}>
                    <TableList
                        items={data[getChartKey(item)]} />
                </ChartSkeletionCard>
            default:
                return false
        }
    }

    return (
        <div className="visible-print-export" id='teszz' ref={ref}>
            <div className="page-header">
                <div className=''>
                    <div className="row col-12 p-0 m-0">
                        <table width='100%' className='pr-5'>
                            <tr>
                                <td width='100%' className='pl-2'>
                                    <div className="logo logo-light">
                                        <span className="logo-lg">
                                            <img src={appConfig?.appLogo} alt="" height="60px" />
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <td>
                            <div className="page-header-space"></div>
                        </td>
                    </tr>
                </thead>
                {pdf && (
                    <div className="row mx-lg-n1 common-tiles mt-2">
                        {skeleton &&
                            skeleton.map((item, index) => (
                                item.pageName !== 'KPI' ? (
                                    getChartDetails(item)
                                ) : null
                            ))}
                    </div>
                )}
            </table >
        </div >
    )
})

export default ExportDashboard