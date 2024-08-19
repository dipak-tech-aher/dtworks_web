import React, { useContext } from 'react';
import { ManagementDashboardContext } from '../../../AppContext';
import IconCard from './IconCard';
import ImageTitleCard from './ImageTitleCard';
import StatisticCard from './StatisticCard';

import { isEmpty, snakeCase } from 'lodash';
import GroupedColumnChart from '../../../ChartComponents/groupedBar';
import LineChart from '../../../ChartComponents/lineChart';
import PieChart from '../../../ChartComponents/pieChart';
import { transformBarChart, transformLineChart, transformMultiLine, transformPieChart, transformSingleBarChart } from '../Utils/helper';
import ChartSkeletionCard from './ChartSkeletonCard';
import GridCard from './GridCard';
import GridComponent from './GridComponent';
import TableList from './TableList';

const CustomComponentRender = ({ skeleton }) => {
    const { data: contextData, handlers } = useContext(ManagementDashboardContext)
    const { getIcon } = handlers
    const { dashboardDetails } = contextData
    const skeletonDetails = skeleton?.[skeleton.title] ?? []

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
                    values={{ value: dashboardDetails[getChartKey(item)]?.oValue || 0 }} />

            case 'StatisticCard':
                return <StatisticCard
                    key={getChartKey(item)}
                    imageSrc={getIcon(item?.iconType)}
                    title={item.chartName}
                    iconColor={item.chartPayload.iconColor}
                    valueformat={item?.chartPayload?.valueFormat?.type ?? ''}
                    values={{ value: dashboardDetails[getChartKey(item)]?.oValue || 0 }} />

            case 'ImageTitleCard':
                return <ImageTitleCard
                    key={getChartKey(item)}
                    imageSrc={getIcon(item?.iconType)}
                    title={item.chartName}
                    iconColor={item.chartPayload.iconColor}
                    valueformat={item?.chartPayload?.valueFormat?.type ?? ''}
                    values={{ value: dashboardDetails[getChartKey(item)]?.oValue || 0 }} />

            case 'VerticalBar-Single':
                const { singleBarSeriesData, singleBarLegend, singleBarXAxis } =
                    transformSingleBarChart({
                        items: dashboardDetails[getChartKey(item)],
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
                        items: dashboardDetails[getChartKey(item)],
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
                        items: dashboardDetails[getChartKey(item)],
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
                        items: dashboardDetails[getChartKey(item)],
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
                        items: dashboardDetails[getChartKey(item)],
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
                        headerColumns={item?.chartPayload?.grid?.headers || []} title={item.chartName} rows={dashboardDetails[getChartKey(item)]} />
                </ChartSkeletionCard>

            case 'Grid Card':
                return <ChartSkeletionCard
                    key={getChartKey(item)}
                    title={item.chartName}
                    sizeCount={item.noOfChartsPerpage || 1}>
                    <GridCard
                        items={dashboardDetails[getChartKey(item)]} />
                </ChartSkeletionCard>

            case 'List':
                return <ChartSkeletionCard
                    key={getChartKey(item)}
                    title={item.chartName}
                    sizeCount={item.noOfChartsPerpage || 1}>
                    <TableList
                        items={dashboardDetails[getChartKey(item)]} />
                </ChartSkeletionCard>
            default:
                return false
        }
    }

    return (
        <div>
            {skeletonDetails?.map((tab, tabIndex) => {
                const sections = tab?.[tab.title];
                if (!sections) return null;
                return sections.map((section, sectionIndex) => (
                    Object.values(section)?.map((chats, chatsIndex) => (
                        <div key={`${tabIndex}-${sectionIndex}-${chatsIndex}`} className="row mx-lg-n1 common-tiles mt-2">
                            {chats && chats?.map((chat, chatIndex) => (
                                <React.Fragment key={`${tabIndex}-${sectionIndex}-${chatsIndex}-${chatIndex}`}>
                                    {getChartDetails(chat)}
                                </React.Fragment>
                            ))}
                        </div>
                    ))
                ));
            })}
        </div>
    )
}

export default CustomComponentRender;
