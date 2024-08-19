import React from "react";
import MBRBackgroudImage from "../../assets/images/MBR Deck Backgroud.png";
import MBRBackgroudFooter from "../../assets/images/MBR Deck Footer.png";
import { PieChart, Pie, Legend, Cell } from "recharts";
import VerticalBarChart from "../../Dashboard/components/VerticalBarChart";
const MBRDashboardPDF = React.forwardRef((props, ref) => {
  const dataSets = props.dataSets;
  const data = props.data;
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
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
// console.log('data ', data)
  const page1 = () => {
    return (
      <div className="row" style={{ position: "relative", marginTop: -50 }}>
        <img src={MBRBackgroudImage} style={{ width: "100%" }} alt=""/>
        <label className="mbr-slide-label" style={{ top: "50%" }}>
          TALIAN DARUSSALAM 123
        </label>
        <label className="mbr-slide-label" style={{ top: "55%" }}>
          {data.ouDesc || ''} MBR Deck
        </label>
        <label className="mbr-slide-label" style={{ top: "60%" }}>
          EOM {data.mbrMonth} {data.mbrYear}
        </label>
      </div>
    );
  };

  const generateChart = (chartType, data) => {
    switch (chartType) {
      case "VerticalBar-Group":
        return (
          <VerticalBarChart
            data={{
              height: "550px",
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
                      //return value.replace(/\s/g, '\n');
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
                      if(value && value?.toString().includes(':')){
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
                        const minutes = Math.floor((value % 3600) / 60);
                        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
                        return formattedTime;
                      } else {
                        return value;
                      }
                    },
                  },
                  data: data[data.dmObjectName]?.map(timeString => {
                    if(timeString.value && timeString.value?.toString().includes(':')){
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
            width={data?.noOfChartsPerpage === 1 ? 800 : 550}
            height={550}
          >
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
          </PieChart>
        );
      case "TitleCard": 
        return(
          <div className="row" style={{ position: "relative" }}>
            <img src={MBRBackgroudImage} width={"100%"} />
            <label className="mbr-slide-label" style={{ top: "60%" }}>
              {data.pageName}
            </label>
          </div>
        )        
      default:
        return null;
    }
  };
  const renderCharts = () => {
    const sortedDataSets = Object.keys(dataSets).sort((a, b) => {
      return dataSets[a].pageOrder - dataSets[b].pageOrder;
    });

    const rows = [];
    let currentRow = [];
    rows.push(page1())
    sortedDataSets.forEach((key, index) => {
      const chartData = dataSets[key];
      const {
        chartName,
        chartType,
        noOfChartsPerpage,
        showMtd,
        showYtd,
        dmObjectName,
      } = chartData;

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
                )
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
          const groupedData = Object.values(ouData.reduce((acc, { name, ou_name, value }) => {
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
              };
            }
            
            acc[key][dmObjectName].push({
              name,
              value,
              ou_name: null
            });
          
            return acc;
          }, {}));
          
          // console.log(groupedData);
          
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
               {chartType !== "TitleCard" &&  <h4 className="pl-2">
                  {ouChartData.ou_name} - {chartName} - {data?.mbrMonth}{" "}
                  {data?.mbrYear}
                </h4>}
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
              {chartType !== "TitleCard" && <h4 className="pl-2">
                {chartName} - {data?.mbrMonth} {data?.mbrYear}
              </h4>}
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
      <>
        <div className="row pr-0 pt-2 mt-2 mr-2 ml-2 page-break" key={index}>
          {row}
        </div>
        <div style={{ position: "relative" }}>
          <img src={MBRBackgroudFooter} style={{ width: "100%" }} />
          <label className="mbr-slide-label" style={{ color: "white" }}>
            {" "}
            Page No: {index + 1}
          </label>
        </div>
      </>
    ));
  };
  // const renderCharts = () => {
  //   const sortedDataSets = Object.keys(dataSets).sort((a, b) => {
  //     return dataSets[a].pageOrder - dataSets[b].pageOrder;
  //   });

  //   const rows = [];
  //   let currentRow = [];

  //   sortedDataSets.forEach((key, index) => {
  //     const chartData = dataSets[key];
  //     const { chartName, chartType, noOfChartsPerpage, showMtd, showYtd } =
  //       chartData;
  //     const showMtdDefined = typeof showMtd !== "undefined";
  //     const showYtdDefined = typeof showYtd !== "undefined";

  //     const shouldRenderChart =
  //       (showMtdDefined && showMtd && data.mbrMonth !== "") ||
  //       (showYtdDefined && showYtd && data.mbrMonth === "");

  //     console.log("shouldRenderChart ", shouldRenderChart);
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
  //       if (index === 0) {
  //         rows.push(page1());
  //       }
  //       if (index === 1) {
  //         rows.push(InteractionTitle());
  //       }
  //       if (index === 27) {
  //         rows.push(OpenInteractionTitle());
  //       }
  //       if (index === 29) {
  //         rows.push(CSATTitle());
  //       }
  //       if (index === 32) {
  //         rows.push(FCRTitle());
  //       }

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
  //       if (index === sortedDataSets.length - 1) {
  //         rows.push(ThankYouTitle());
  //       }
  //     }
  //   });

  //   return rows.map((row, index) => (
  //     <>
  //       <div className="row pr-0 pt-2 mt-2 mr-2 ml-2 page-break" key={index}>
  //         {row}
  //       </div>
  //       <div style={{ position: "relative" }}>
  //         <img src={MBRBackgroudFooter} style={{ width: "100%" }} />
  //         <label className="mbr-slide-label" style={{ color: "white" }}>
  //           {" "}
  //           Page No: {index + 1}
  //         </label>
  //       </div>
  //     </>
  //   ));
  // };

  return (
    <>
      <div ref={ref}>
        <div className="content-page pr-0">
          <div className="content">
            <div className="row p-0">
              <div className="tab-content p-0 col-12">
                <div className="tab-pane show active" id="home1">
                  <div className="mt-1">
                    <div className="col-12">
                      <div className="search-result-box  p-0">
                        <div className="autoheight p-1">{renderCharts()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
export default MBRDashboardPDF;
