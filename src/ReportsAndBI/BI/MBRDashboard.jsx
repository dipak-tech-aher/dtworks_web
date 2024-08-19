import moment from "moment";
import React, {
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { hideSpinner, showSpinner } from "../../common/spinner";
import { properties } from "../../properties";
// import PieChart from "../../dashboard/components/PieChart";
import axios from "axios";
import { unstable_batchedUpdates } from "react-dom";
import Modal from "react-modal";
import Select from "react-select";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-toastify";
import { Cell, Legend, Pie, PieChart, Text } from "recharts";
import { AppContext } from '../../AppContext';
import VerticalBarChart from "../../Dashboard/components/VerticalBarChart";
import { get } from "../../common/util/restUtil";
import MBRDashboardPDF from "./MBRDashboardPDF";
import MonthYearDropdown from "./MonthYearDropdown";

const MBRDashboard = () => {
  const { auth } = useContext(AppContext)
  const { appConfig } = useContext(AppContext)
  const initialValues = {
    dataForCurrentYear: [],
    dataForCurrentMonth: [],
    totalInteractionMonthlyTrend: [],
    complaintInteractionMonthlyTrend: [],
    enquiryInteractionMonthlyTrend: [],
    followupInteractionMonthlyTrend: [],
    interactionDistributionWeeklyTrend: [],
    interactionDistributionDailyTrend: [],
    totalInteractionDailyTrend: [],
    complaintInteractionDailyTrend: [],
    enquiryInteractionDailyTrend: [],
    followupInteractionDailyTrend: [],
    complaintInteractionStatisticsMonthlyTrend: [],
    complaintInteractionStatisticsWeeklyTrend: [],
    complaintInteractionStatisticsDailyTrend: [],
    channelDistribution: [],
    complaintDistrictDistribution: [],
    complaintPriorityDistribution: [],
    complaintVsEnquiryDistribution: [],
    complaintVsEnquiryDistributionWeek1: [],
    complaintVsEnquiryDistributionWeek2: [],
    complaintVsEnquiryDistributionWeek3: [],
    complaintVsEnquiryDistributionWeek4: [],
    complaintVsEnquiryDistributionWeek5: [],
    complaintCreatedVsClosedDistribution: [],
    complaintCreatedVsClosedDistributionWeek1: [],
    complaintCreatedVsClosedDistributionWeek2: [],
    complaintCreatedVsClosedDistributionWeek3: [],
    complaintCreatedVsClosedDistributionWeek4: [],
    complaintCreatedVsClosedDistributionWeek5: [],
    complaintServiceType: [],
    inquiryServiceType: [],
    complaintOpenInteractionDepartmentDistribution: [],
    complaintOpenInteractionRoleDistribution: [],
    complaintOpenInteraction: [],
    csatQuestionIdYearly: [],
    csatQuestionMetricYearly: [],
    csatQuestionIdMonthly: [],
    csatQuestionMetricMonthly: [],
    fcrYearly: [],
    tatWeekly: [],
  }
  const [departments, setDepartments] = useState([])
  const [operationUnit, setOperationUnit] = useState([])
  // const [orgSLAStatistics, setOrgSLAStatistics] = useState([]);
  const [displayForm, setDisplayForm] = useState(true)
  const [data, setData] = useState({
    ouId: "",
    department: "",
    mbrMonth: "",
    mbrYear: moment().format("YYYY"),
  });
  const [generatePdf, setGeneratePdf] = useState(false);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint: () => {
      setGeneratePdf(false);
    },
  });
  const componentRef = useRef()
  const departmentRef = useRef()
  const [dataSets, setDataSets] = useState(initialValues)

  useEffect(() => {
    get(`${properties.ORGANIZATION}/search`).then((resp) => {
      if (resp && resp.data && resp.data.length > 0) {
        const org = resp.data.filter((e) => e.unitType === "OU");
        const dept = resp.data.filter((e) => e.unitType === "DEPT");

        departmentRef.current = dept;

        unstable_batchedUpdates(() => {
          let ouList = [{ label: "All", value: "" }];
          org &&
            org.map((opt) => {
              ouList.push({ label: opt.unitDesc, value: opt.unitId });
              ouList.sort((a, b) => {
                if (a.label.toLowerCase() === "all") return -1; // Keep "All" at the beginning
                if (b.label.toLowerCase() === "all") return 1;
                return a.label
                  .toLowerCase()
                  .localeCompare(b.label.toLowerCase());
              });
            });

          setOperationUnit(ouList);
        });
      }
    }).catch((error) => {
      console.log(error)
    });
  }, []);

  const handleLookupOrStateChange = (e) => {
    let target = e.target;

    let deptList = [{ label: "All", value: "" }];

    if (target.id === "ouId") {
      const dept = departmentRef.current.filter(
        (d) => d.unitType === "DEPT" && d.parentUnit === target.value
      );

      if (dept && dept?.length > 0) {
        deptList = dept.map((opt) => ({ label: opt.unitDesc, value: opt.unitId }))
      }
      // dept &&
      //   dept.map((opt) => {
      //     deptList.push({ label: opt.unitDesc, value: opt.unitId });
      //   });

      deptList.sort((a, b) => {
        if (a.label.toLowerCase() === "all") return -1; // Keep "All" at the beginning
        if (b.label.toLowerCase() === "all") return 1;
        return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
      });

      setDepartments(deptList);
      // console.log("target=================", target);
      setData({
        ...data,
        ouId: target.value,
        department: null,
        ouDesc: target.label,
      });
    } else if (target.id === "department") {
      setData({
        ...data,
        department: target.value,
        departmentDesc: target.label,
      });
    } else {
      setData({ ...data, [target.id]: target.value });
    }
  };



  const groupDataStackedChart = (data) => {
    const groupedData =
      data &&
      data.reduce((acc, item) => {
        const existingItem = acc.find((i) => i.name === item.name);
        if (existingItem) {
          existingItem[item.type] = Number(item.value);
        } else {
          const newItem = { name: item.name, [item.type]: Number(item.value) };
          acc.push(newItem);
        }
        return acc;
      }, []);
    const xAxis = groupedData && groupedData.map((item) => item.name);

    const allTypes =
      new Set(
        groupedData &&
        groupedData
          .flatMap((item) => Object.keys(item))
          .filter((key) => key !== "name")
      ) || [];

    const value = Array.from(allTypes).map((type) => {
      const dataForType = groupedData.map((item) => item[type] || 0);
      return {
        name: type,
        type: "bar",
        label: {
          show: true,
          position: "top",
        },
        data: dataForType || [],
        itemStyle: {
          barBorderRadius: 3,
          borderWidth: 1,
        },
        barCategoryGap: "50%",
      };
    });

    return {
      xAxis,
      value,
    };
  };

  const getDashBoardData = (e) => {
    e.preventDefault()
    const filter = {
      filter: data
    }
    if (!!!data?.mbrMonth) {
      toast.error('Please select Month')
      return false
    }
    showSpinner();
    if (data?.ouId !== "") {
      axios.post(`${properties.API_ENDPOINT}${properties.REPORTS_API}/interaction-statistics`, filter, {
        headers: {
          "x-tenant-id": appConfig.biTenantId,
          Authorization: auth?.accessToken
        },
      }).then((resp) => {
        if (resp?.data?.status === 200) {
          const { data } = resp?.data
          const sets = {}
          for (const obj of data) {
            const dmObjectName = obj.dmObjectName
            const chartData = {
              chartType: obj.chartType,
              chartPosition: obj.chartPosition,
              chartName: obj.chartName,
              noOfChartsPerpage: obj.noOfChartsPerpage,
              dmObjectName,
              pageOrder: obj.pageOrder,
              showMtd: obj.showMtd,
              showYtd: obj.showYtd,
              pageName: obj.pageName
            };

            if (obj.chartType === "Pie") {
              obj[obj.dmObjectName]?.forEach((item) => {
                item.value = parseInt(item.value);
              })
            }
            if (obj.chartType === "VerticalBar-Group") {
              const groupData = groupDataStackedChart(obj[obj.dmObjectName]);

              chartData[`${obj.dmObjectName}Value`] = groupData.value;
              chartData[`${obj.dmObjectName}Xaxis`] = groupData.xAxis;
            } else {
              chartData[obj.dmObjectName] = obj[obj.dmObjectName];
            }
            sets[dmObjectName] = chartData;
          }

          // console.log("sets========", sets);
          setDataSets({
            //   ...dataSets,
            ...sets,
          });
        }
      }).catch((error) => {
        console.log(error)
      })
        .finally(hideSpinner);
    } else {
      axios.post(`${properties.API_ENDPOINT}${properties.REPORTS_API}/interaction-statistics-org`, filter, {
        headers: {
          "x-tenant-id": appConfig.biTenantId,
          Authorization: auth?.accessToken
        },
      }).then((resp) => {
        if (resp?.data?.status === 200) {
          const { data } = resp?.data
          if (data && Array.isArray(data) && data?.length > 0) {
            const sets = {}
            for (const obj of data) {
              const dmObjectName = obj.dmObjectName
              const chartData = {
                chartType: obj.chartType,
                chartPosition: obj.chartPosition,
                chartName: obj.chartName,
                noOfChartsPerpage: obj.noOfChartsPerpage,
                dmObjectName,
                pageOrder: obj.pageOrder,
                showMtd: obj.showMtd,
                showYtd: obj.showYtd,
                pageName: obj.pageName
              };

              if (obj.chartType === "Pie") {
                obj[obj.dmObjectName]?.forEach((item) => {
                  item.value = parseInt(item.value);
                })
              }
              if (obj.chartType === "VerticalBar-Group") {
                const groupData = groupDataStackedChart(obj[obj.dmObjectName]);

                chartData[`${obj.dmObjectName}Value`] = groupData.value;
                chartData[`${obj.dmObjectName}Xaxis`] = groupData.xAxis;
              } else {
                chartData[obj.dmObjectName] = obj[obj.dmObjectName];
              }

              sets[dmObjectName] = chartData;
            }

            setDataSets({
              //    ...dataSets,
              ...sets,
            })
          } else {
            toast.error('No data found')
          }
        }
      }).catch((error) => {
        console.log(error)
      }).finally(hideSpinner);
    }
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    name,
    fontSize,
    index,
  }) => {
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(RADIAN * midAngle);
    const cos = Math.cos(RADIAN * midAngle);
    const startX = cx + outerRadius * cos;
    const startY = cy + outerRadius * -sin;
    const middleY = cy + (outerRadius + 50 * Math.abs(sin)) * -sin;
    let endX = startX + (cos >= 0 ? 1 : -1) * 10;
    let textAnchor = cos >= 0 ? "start" : "end";
    const mirrorNeeded =
      midAngle > -270 && midAngle < -210 && percent < 0.04 && index % 2 === 1;
    if (mirrorNeeded) {
      endX = startX + outerRadius * -cos * 2 + 100;
      textAnchor = "start";
    }

    return (
      <g>
        <path
          d={`M${startX},${startY}L${startX},${middleY}L${endX},${middleY}`}
          fill="none"
          stroke="#000"
          strokeWidth={1}
        />
        <text
          x={endX + (cos >= 0 || mirrorNeeded ? 1 : -1) * 12}
          y={middleY + fontSize / 2}
          textAnchor={textAnchor}
          fontSize={fontSize}
        >{`${name || ""} ${(percent * 100).toFixed(2)}%`}</text>
      </g>
    );
  };

  const handleGeneratePdf = () => {
    setGeneratePdf(true);
    setTimeout(() => {
      handlePrint();
      // setGeneratePdf(false)
    }, 5000);
  };

  const generateChart = (chartType, data) => {
    // console.log('chartType====', chartType)
    // console.log('data====', data)
    // console.log(data[data.dmObjectName]?.map((m) => m.value))
    switch (chartType) {
      case "VerticalBar-Group":
        return (
          <VerticalBarChart
            data={{
              height: "340px",
              xAxisData: [
                {
                  type: "category",
                  data: data[`${data.dmObjectName}Xaxis`] || [],
                  axisPointer: {
                    type: "shadow",
                  },
                  axisLabel: {
                    rotate: 45,
                    fontSize: 10,
                    formatter: function (value) {
                      const maxLength = 30;
                      return value.length > maxLength ? value.substring(0, maxLength) + "..." : value;
                      //return value.replace(/\s/g, "\n");
                    },
                  },
                },
              ],
              yAxisData: [
                {
                  type: "value",
                  name: "",
                  min: 0,
                  axisLabel: {
                    formatter: function (value) {
                      return value;
                    },
                  },
                },
              ],
              seriesData:
                data[`${data.dmObjectName}Value`].length > 0
                  ? data[`${data.dmObjectName}Value`]
                  : [
                    {
                      name: "",
                      type: "bar",
                      label: {
                        show: true,
                        position: "top",
                      },
                      data: [],
                      barCategoryGap: "50%",
                    },
                  ],
              title: {
                show: data[`${data.dmObjectName}Value`]?.length === 0,
                textStyle: {
                  color: "grey",
                  fontSize: 20,
                },
                text: "No details are available",
                left: "center",
                top: "center",
              },
            }}
          />
        );
      case "VerticalBar-Single":
        return (
          <VerticalBarChart
            data={{
              height: "340px",
              xAxisData: [
                {
                  type: "category",
                  data: data[data.dmObjectName]?.map((m) => m.name) || [],
                  axisPointer: {
                    type: "shadow",
                  },
                  axisLabel: {
                    rotate: 45,
                    fontSize: 10,
                    formatter: function (value) {
                      const maxLength = 30;
                      return value.length > maxLength ? value.substring(0, maxLength) + "..." : value;
                      // return value.replace(/\s/g, "\n");
                    },
                    position: "bottom",
                  },
                },
              ],
              yAxisData: [
                {
                  type: "value",
                  name: "",
                  min: 0,
                  axisLabel: {
                    formatter: function (value) {
                      if (value && value?.toString().includes(':')) {
                        // const hours = Math.floor(value / 3600);
                        const minutes = Math.floor((value % 3600) / 60);
                        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
                        return formattedTime;
                      } else {
                        return value;
                      }
                    },
                  },
                },
              ],
              seriesData: [
                {
                  name: "",
                  type: "bar",
                  label: {
                    show: true,
                    position: "top",
                    formatter: function (params) {
                      const value = params.value;
                      if (typeof value === 'number') {
                        // const hours = Math.floor(value / 3600);
                        const minutes = Math.floor((value % 3600) / 60);
                        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
                        return formattedTime;
                      } else {
                        return value;
                      }
                    },
                  },
                  data: data[data.dmObjectName]?.map(timeString => {
                    if (timeString.value && timeString.value?.toString().includes(':')) {
                      // hours,
                      const [minutes, seconds] = timeString.value.split(':').map(Number);
                      return minutes * 60 + seconds; // Convert to total seconds

                    } else {
                      return timeString.value
                    }

                  }) || [],
                  itemStyle: {
                    barBorderRadius: 3,
                    borderWidth: 1,
                  },
                },
              ],
              title: {
                show: data[data.dmObjectName]?.length === 0,
                textStyle: {
                  color: "grey",
                  fontSize: 20,
                },
                text: "No details are available",
                left: "center",
                top: "center",
              },
            }}
          />
        );
      case "Pie":
        return (
          <PieChart
            width={data.noOfChartsPerpage === 1 ? 800 : 550}
            height={340}
          >
            {data[data.dmObjectName] && data[data.dmObjectName].length > 0 ? (
              <>
                <Pie
                  dataKey="value"
                  isAnimationActive={false}
                  data={data[data.dmObjectName]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  startAngle={90}
                  endAngle={-270}
                  labelLine={false}
                  paddingAngle={5}
                  fontSize={10}
                  fill="#8884d8"
                  label={renderCustomizedLabel}
                >
                  {data[data.dmObjectName]?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  payload={data[data.dmObjectName]?.map((entry) => ({
                    value: `${entry.name} (${entry.value})`,
                    type: "circle",
                    color:
                      COLORS[
                      data[data.dmObjectName]?.indexOf(entry) % COLORS.length
                      ],
                  }))}
                />
              </>
            ) : (
              <>
                <Text x={200} y={200} text="No details are available" />
              </>
            )}
          </PieChart>
        );
      case "TitleCard":
        return (
          <div className="row">
            <h3 className="pl-2">{data.pageName}</h3>
          </div>
        )
      default:
        return null;
    }
  };

  // Assuming dataSets is an object containing the chart data
  // const renderCharts = () => {
  //   const sortedDataSets = Object.keys(dataSets).sort((a, b) => {
  //     return dataSets[a].pageOrder - dataSets[b].pageOrder;
  //   });

  //   const rows = [];
  //   let currentRow = [];

  //   sortedDataSets.forEach((key, index) => {
  //     const chartData = dataSets[key];
  //     const {
  //       chartName,
  //       chartType,
  //       chartPosition,
  //       noOfChartsPerpage,
  //       showMtd,
  //       showYtd,
  //     } = chartData;
  //     // console.log(showMtd, showYtd, 'data.mbrMonth', data.mbrMonth)
  //     const showMtdDefined = typeof showMtd !== 'undefined';
  //     const showYtdDefined = typeof showYtd !== 'undefined';

  //     const shouldRenderChart =
  //       (showMtdDefined && showMtd && data.mbrMonth !== "") ||
  //       (showYtdDefined && showYtd && data.mbrMonth === "");

  //       // console.log('shouldRenderChart ', shouldRenderChart)
  //     if (shouldRenderChart) {
  //       const chartComponent = (
  //         <div
  //           className="col td-column-chart-flex"
  //           style={{
  //             height: "50%",
  //             width: noOfChartsPerpage >= 2 ? "48%" : "100%",
  //           }}
  //           key={index}
  //         >
  //           <h4 className="pl-2">
  //             {chartName} - {data?.mbrMonth} {data?.mbrYear}
  //           </h4>
  //           {generateChart(chartType, chartData)}
  //         </div>
  //       );

  //       if (noOfChartsPerpage === 1) {
  //         rows.push([chartComponent]); // Use the entire row for single chart
  //       } else {
  //         if (currentRow.length < 2) {
  //           // Add chart to the current row
  //           currentRow.push(chartComponent);
  //         }

  //         if (currentRow.length === 2 || index === sortedDataSets.length - 1) {
  //           // Start a new row if it's the second chart or the last chart
  //           rows.push(currentRow);
  //           currentRow = [];
  //         }
  //       }
  //     }
  //   });

  //   return rows.map((row, index) => (
  //     <div className="row pr-0 pt-2 mt-2 mr-2 ml-2" key={index}>
  //       {row}
  //     </div>
  //   ));
  // };
  const renderCharts = () => {
    // console.log('dataSets ', dataSets)
    const sortedDataSets = Object.keys(dataSets).sort((a, b) => {
      return dataSets[a].pageOrder - dataSets[b].pageOrder;
    });
    // console.log('sortedDataSets', sortedDataSets)
    const rows = [];
    let currentRow = [],
      pageNames = [];
    const pageOrdersPushed = {};
    let currentPageOrder = null;
    const dynamicPageOrderLimit = {};

    sortedDataSets.forEach((key, index) => {
      const chartData = dataSets[key];
      const {
        chartName,
        chartType,
        // chartPosition,
        noOfChartsPerpage,
        showMtd,
        showYtd,
        dmObjectName,
        pageName,
        pageOrder,
      } = chartData;

      if (!dynamicPageOrderLimit[pageName]) {
        dynamicPageOrderLimit[pageName] = 1;
      }

      if (pageOrder !== currentPageOrder) {
        if (currentRow.length > 0) {
          rows.push([...currentRow]);
          currentRow = [];
        }
        currentPageOrder = pageOrder;
      }

      const uniqueKey = `${pageName}_${pageOrder}`;

      if (pageOrdersPushed[uniqueKey] >= dynamicPageOrderLimit[uniqueKey]) {
        return;
      }

      pageNames.push(pageName);
      pageOrdersPushed[uniqueKey] = (pageOrdersPushed[uniqueKey] || 0) + 1;

      const showMtdDefined = typeof showMtd !== "undefined";
      const showYtdDefined = typeof showYtd !== "undefined";

      const shouldRenderChart =
        (showMtdDefined && showMtd && data.mbrMonth !== "") ||
        (showYtdDefined && showYtd && data.mbrMonth === "");

      if (shouldRenderChart) {
        const hasOu = chartData[dmObjectName]?.some((e) => e.ou_name);

        if (hasOu) {
          const ouData = chartData[dmObjectName].reduce((acc, entry) => {
            if (entry.ou_name && entry.ou_name !== "" && entry.name) {
              const existingEntry = acc.find((item) => {
                return (
                  item.ou_name.toLowerCase() === entry.ou_name.toLowerCase() &&
                  item.name.toLowerCase() === entry.name.toLowerCase()
                );
              });
              if (existingEntry) {
                existingEntry.value += entry.value;
              } else {
                acc.push({
                  name: entry.name,
                  value: entry.value,
                  ou_name: entry.ou_name,
                });
              }
            }
            return acc;
          }, []);
          const groupedData = Object.values(
            ouData.reduce((acc, { name, ou_name, value }) => {
              const key = ou_name;
              if (!acc[key]) {
                acc[key] = {
                  [dmObjectName]: [],
                  ou_name: key,
                  dmObjectName,
                  chartName,
                  chartType,
                  noOfChartsPerpage,
                  showMtd,
                  showYtd,
                  pageName,
                };
              }

              acc[key][dmObjectName].push({
                name,
                value,
                ou_name: null,
              });

              return acc;
            }, {})
          );

          const ouChartDataArray = Object.values(groupedData);
          ouChartDataArray.forEach((ouChartData, i) => {
            const ouChartComponent = (
              <div
                className="col td-column-chart-flex"
                style={{
                  height: "50%",
                  width: noOfChartsPerpage >= 2 ? "48%" : "100%",
                }}
                key={`${index}_${i}`}
              >
                {chartType !== "TitleCard" && (
                  <h4 className="pl-2">
                    {ouChartData.ou_name} - {chartName} - {data?.mbrMonth}{" "}
                    {data?.mbrYear}
                  </h4>
                )}
                {generateChart(chartType, ouChartData)}
              </div>
            );

            if (noOfChartsPerpage === 1) {
              rows.push([ouChartComponent]);
            } else {
              if (currentRow.length < 2) {
                currentRow.push(ouChartComponent);
              }

              if (
                currentRow.length === 2 ||
                index === sortedDataSets.length - 1
              ) {
                rows.push(currentRow);
                currentRow = [];
              }
            }
          });
        } else {
          const chartComponent = (
            <div
              className="col td-column-chart-flex"
              style={{
                height: "50%",
                width: noOfChartsPerpage >= 2 ? "48%" : "100%",
              }}
              key={index}
            >
              {chartType !== "TitleCard" && (
                <h4 className="pl-2">
                  {chartName} - {data?.mbrMonth} {data?.mbrYear}
                </h4>
              )}
              {generateChart(chartType, chartData)}
            </div>
          );

          if (noOfChartsPerpage === 1) {
            rows.push([chartComponent]); // Use the entire row for single chart
          } else {
            if (currentRow.length < 2) {
              // Add chart to the current row
              currentRow.push(chartComponent);
            }

            if (
              currentRow.length === 2 ||
              index === sortedDataSets.length - 1
            ) {
              // Start a new row if it's the second chart or the last chart
              rows.push(currentRow);
              currentRow = [];
            }
          }
        }
      }
    });

    return rows.map((row, index) => (
      <div key={index}>
        {/* <h3 className="pl-2">{pageNames[index]}</h3> */}
        <div className="row pr-0 pt-2 mt-2 mr-2 ml-2">{row}</div>
      </div>
    ));
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const handleOnClear = () => {
    unstable_batchedUpdates(() => {
      setData({
        ouId: "",
        department: "",
        mbrMonth: "",
        mbrYear: moment().format("YYYY"),
      })
      setGeneratePdf(false)
      setDisplayForm(true)
      setDataSets(initialValues)
      componentRef.current = ''
    })
  }

  return (
    <div>
      <div className="container-fluid">
        <div className="row mt-1">
          <div className="col-lg-12">
            <div className="search-result-box m-t-30 card-box">
              <div className="d-flex justify-content-end">
                <h6 className="text-primary cursor-pointer" onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</h6>
              </div>
              <div id="searchBlock" className="modal-body p-2 d-block">
                {displayForm && (<form onSubmit={getDashBoardData}>
                  <div className="row">
                    <div className="col-md-3">
                      <label htmlFor="ouId" className="col-form-label">Operational Unit<span>*</span></label>
                      <Select
                        options={operationUnit}
                        name="ouId"
                        closeMenuOnSelect={true}
                        styles={{ menuPortal: base => ({ ...base, position: 'absolute !important' }) }}
                        placeholder={""}
                        value={data?.ouId ? operationUnit.filter((f) => f?.value === data?.ouId) : [{ label: "All", value: "" }]}
                        onChange={(e, meta) => {
                          meta.target = {};
                          meta.target.label = e.label;
                          meta.target.id = meta.name;
                          meta.target.value = e.value;
                          handleLookupOrStateChange(meta);
                        }}></Select>
                    </div>
                    <div className="col-md-3">
                      <label htmlFor="department" className="col-form-label">Department<span>*</span>
                      </label>
                      <Select
                        value={data?.department ? departments.filter((f) => f?.value === data?.department) : [{ label: "All", value: "" }]}
                        placeholder={"Please Select Department"}
                        name="department"
                        options={departments}
                        onChange={(e, meta) => {
                          meta.target = {};
                          meta.target.label = e.label;
                          meta.target.id = meta.name;
                          meta.target.value = e.value;
                          handleLookupOrStateChange(meta);
                        }}>
                      </Select>
                    </div>
                    <MonthYearDropdown handleLookupOrStateChange={handleLookupOrStateChange} data={data} />
                    <div className="col-md-12 text-center mt-2">
                      <button type="button" className="skel-btn-cancel" onClick={handleOnClear}>Clear</button>
                      <button type="submit" className="skel-btn-submit">Search</button>
                      <button type="button" className="skel-btn-submit" onClick={handleGeneratePdf}>Export as PDF</button>
                    </div>
                  </div>
                </form>)
                }
              </div>
              {/* style={{ backgroundColor: "#fafafa" }} */}
              <div className="mt-1" >
                <div className="col-12">
                  <div className="search-result-box  p-0">
                    <div className="autoheight p-1">
                      <div className="">{renderCharts()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {generatePdf && (
        <Modal isOpen={generatePdf}>
          <MBRDashboardPDF
            dataSets={dataSets}
            data={data}
            ref={componentRef}
            handler={{
              handlePreviewCancel: false,
              handlePrint: false,
              renderCustomizedLabel,
            }}
          />
        </Modal>
      )}
    </div>
  )
}
export default MBRDashboard;
