import React, { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import { slowGet, slowPost } from "../../common/util/restUtil";
import { properties } from "../../properties";
import LastRefreshTime from "./LastRefreshTime";
import moment from "moment";
import { CloseButton, Modal } from "react-bootstrap";
import DynamicTable from "../../common/table/DynamicTable";
import { useHistory }from "../../common/util/history";
import { unstable_batchedUpdates } from "react-dom";

const StatementWise = (props) => {
  const history = useHistory()
  const { searchParams, isParentRefresh, apiCall = false, exportData } = props?.data;
  // console.log('searchParams------->', searchParams)
  const [chartData, setChartData] = useState([]);
  const [responseData, setResponseData] = useState([]);
  const [isRefresh, setIsRefresh] = useState(false);
  const chartRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [chartDataList, setChartDataList] = useState([]);
  const Loader = props.loader;
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('STATEMENT');
  const [columns, setColums] = useState([
    {
      Header: "Interaction No",
      accessor: "oIntxnNo",
      disableFilters: true,
      id: "oIntxnNo",
    },
    {
      Header: "Interaction Category",
      accessor: "oInteractionCategory",
      disableFilters: true,
    },
    {
      Header: "Interaction Type",
      accessor: "oInteractionType",
      disableFilters: true,
    },
    {
      Header: "Service Category",
      accessor: "oServiceCategory",
      disableFilters: true,
    },
    {
      Header: "Service Type",
      accessor: "oServiceType",
      disableFilters: true,
    },
    {
      Header: "Priority",
      accessor: "oPriority",
      disableFilters: true,
    },
    {
      Header: "Project",
      accessor: "oProject",
      disableFilters: true,
    },
    {
      Header: "Status",
      accessor: "oStatusDesc",
      disableFilters: true,
    },
    {
      Header: "Channel",
      accessor: "oChannel",
      disableFilters: true,
    },
    {
      Header: "Current User",
      accessor: "oCurrUser",
      id: "oCurrUser",
      disableFilters: true,
    },
    {
      Header: "Created User",
      accessor: "oCreatedUser",
      disableFilters: true,
    },
    {
      Header: "Created At",
      accessor: "oCreatedAt",
      disableFilters: true,
      id: "oCreatedAt",
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        searchParams['category'] = category;
        slowPost(properties.INTERACTION_API + "/statement-wise", { searchParams }).then((resp) => {
          if (resp?.status == 200) {
            const respData = resp?.data?.rows;
            setResponseData(respData);

            let data = [];
            respData?.map((ele) => {
              return data.push({
                name: ele?.oCategoryValue,
                value: ele?.oIntxnCnt,
              });
            });
            const oIntxnCntValues = respData.map((item) =>
              parseInt(item.oIntxnCnt)
            );
            const totalValue = oIntxnCntValues.reduce(
              (acc, value) => acc + value,
              0
            );
            setTotal(totalValue);
            data.push({
              value: totalValue,
              itemStyle: {
                color: "none",
                decal: {
                  symbol: "none",
                },
              },
              label: {
                show: false,
              },
            });
            setChartData(data ?? []);
            let dataObject = {}
            dataObject['total'] = totalValue
            dataObject['responseData'] = respData
            dataObject['chartData'] = data ?? []
            props?.setExportData?.(`statementWiseData`, dataObject)
          }
        }).catch((error) => console.log(error));
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    if (apiCall) fetchData(); setLoading(false);
  }, [isRefresh, searchParams, isParentRefresh, category]);
  useEffect(() => {
    let { total, chartData,responseData } = exportData ?? {};
    unstable_batchedUpdates(() => {
        setLoading(false)
        if (total) setTotal(total);
        if (chartData) setChartData(chartData);
        if (responseData) setResponseData(responseData);
    })
}, [exportData])

  useEffect(() => {
    if (!loading && chartRef.current) {
      const chartDom = chartRef.current;
      const myChart = echarts.init(chartDom, null, {
        renderer: "canvas",
        useDirtyRect: false,
      });

      const option = {
        title: {
          show: !responseData?.length > 0 ? true : false,
          textStyle: {
            color: "grey",
            fontSize: 20,
          },
          text: "No data available",
          left: "center",
          top: "center",
        },
        tooltip: {
          trigger: "item",
        },
        // toolbox: {
        //     show: true,
        //     feature: {
        //         dataView: { show: false, readOnly: false },
        //         magicType: { show: false, type: ['line', 'bar'] },
        //         restore: { show: false },
        //         saveAsImage: { show: true, name: 'Top 5 Interactions by Statements' }
        //     },
        //     top: "0%",
        // },
        legend: {
          top: "5%",
          left: "center",
          // doesn't perfectly work with our tricks, disable it
          selectedMode: false,
          width: "85%",
          left: "0",
        },
        series: [
          {
            name: "Interaction Statement",
            type: "pie",
            radius: ["40%", "70%"],
            center: ["50%", "70%"],
            // adjust the start angle
            startAngle: 180,
            label: {
              show: true,
              formatter(param) {
                // correct the percentage
                return param.name + " (" + param.value + ")";
              },
            },
            data: chartData,
          },
        ],
      };

      if (option && typeof option === "object") {
        myChart.setOption(option);
      }

      myChart.on("click", (params) => {
        console.log('params ---------->', params?.data);
        getDetailsList(params?.data?.name);
      });

      window.addEventListener("resize", myChart.resize);

      return () => {
        window.removeEventListener("resize", myChart.resize);
        myChart.dispose();
      };
    }
  }, [chartData]);

  const getDetailsList = (value) => {
    setLoading(true);
    searchParams['statement'] = value;
    searchParams['category'] = category;
    slowPost(properties.INTERACTION_API + "/statement-wise-list", { searchParams }).then((resp) => {
      if (resp?.status == 200) {
        const data = resp?.data?.rows.sort((a, b) => {
          return b.oIntxnId - a.oIntxnId;
        });
        setChartDataList(data);
        setModalOpen(true);
      }
    }).catch((error) => console.log(error)).finally(() => {
      setIsRefresh(!isRefresh);
      setLoading(false);
    });
  };

  const fetchInteractionDetail = (intxnNo) => {
    setLoading(true);
    slowGet(`${properties.INTERACTION_API}/search?q=${intxnNo}`)
      .then((resp) => {
        if (resp.status === 200) {
          const response = resp.data?.[0];
          const data = {
            ...response,
            sourceName: "customer360",
          };
          if (response.customerUuid) {
            localStorage.setItem("customerUuid", response.customerUuid);
            localStorage.setItem("customerIds", response.customerId);
          }
          history(`/interaction360`, {
            state: {data}
          });
        } else {
          //
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => setLoading(false));
  };

  const handleCellRender = (cell, row) => {
    if (cell.column.id === "oIntxnNo") {
      return (
        <span
          onClick={() => fetchInteractionDetail(cell.value)}
          style={{ cursor: "pointer", color: "rgb(80, 154, 222)" }}
        >
          {cell.value}
        </span>
      );
    }
    if (cell.column.id === "oCurrUser") {
      return <span>{cell.value ?? "Others"}</span>;
    } else if (cell.column.id === "oCreatedAt") {
      return (
        <span>
          {cell.value ? moment(cell.value).format("DD-MM-YYYY hh:mm:ss") : "-"}
        </span>
      );
    }
    return <span>{cell.value}</span>;
  };


  return (
    <>
      {" "}
      {loading ? (
        <Loader />
      ) : (
        <div className="cmmn-skeleton cmmn-skeleton-new">
          <div className="row h-100">
            <div className="col-12 px-2">
              <div className="skel-dashboard-title-base">
                <span className="skel-header-title">
                  {" "}
                  Top 5 Interactions by Statement ({total}){" "}
                </span>
                <div className="skel-dashboards-icons">
                  <a href="javascript:void(null)">
                    <i
                      className="material-icons"
                      onClick={() => setIsRefresh(!isRefresh)}
                    >
                      refresh
                    </i>
                  </a>
                  {/* <a href="#">
                    <i className="material-icons">filter_alt</i>
                  </a> */}
                </div>
              </div>
              <hr className="cmmn-hline" />
              <div className="skel-perf-sect">
                <div className="row">
                  <div className="col-12 px-2 text-right mt-2">
                    <div
                      className="btn-group btn-group-tab btn-group-sm"
                      role="group"
                      aria-label=""
                    >
                      <button
                        type="button"
                        className={`btn btn-light ${category === 'STATEMENT' ? "active" : undefined
                          }`}
                        key={'STATEMENT'}
                        id={'STATEMENT'}
                        onClick={e => setCategory(e.target.id)}
                      >
                        With Statement
                      </button>
                      <button
                        type="button"
                        className={`btn btn-light ${category === 'PROBLEM_CODE' ? "active" : undefined
                          }`}
                        key={'PROBLEM_CODE'}
                        id={'PROBLEM_CODE'}
                        onClick={e => setCategory(e.target.id)}
                      >
                        Without Statement
                      </button>
                    </div>
                  </div>
                </div>
                <div className="skel-perf-graph">
                  <div ref={chartRef} style={{ height: "450px" }}></div>
                </div>
              </div>
            </div>
            <div className="col-12 px-2 align-self-end">
              <hr className="cmmn-hline" />
              <div className="skel-refresh-info">
                <LastRefreshTime
                  data={{ isRefresh, componentName: "StatementWise" }}
                />
              </div>
            </div>
          </div>

          <Modal
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            show={modalOpen}
            onHide={() => setModalOpen(!modalOpen)}
            dialogClassName="wsc-cust-mdl-temp-prev"
          >
            <Modal.Header>
              <Modal.Title>
                <h5 className="modal-title">Interaction by Top 5 Statements</h5>
              </Modal.Title>
              <CloseButton
                onClick={() => setModalOpen(!modalOpen)}
                style={{
                  backgroundColor: "transparent",
                  fontWeight: 700,
                  color: "#373737",
                  fontSize: "1.5rem",
                }}
              >
                {/* <span>×</span> */}
              </CloseButton>
            </Modal.Header>
            <Modal.Body>
              <div className="col-lg-12 col-md-12 col-xs-12">
                <DynamicTable
                  row={chartDataList ?? []}
                  itemsPerPage={10}
                  header={columns}
                  columnFilter={true}
                  handler={{
                    handleCellRender: handleCellRender,
                  }}
                />
              </div>
            </Modal.Body>
            <Modal.Footer style={{ display: "block" }}>
              <div className="skel-btn-center-cmmn">
                <button
                  type="button"
                  className="skel-btn-cancel"
                  onClick={() => setModalOpen(!modalOpen)}
                >
                  Close
                </button>
              </div>
            </Modal.Footer>
          </Modal>
        </div>
      )}
    </>
  );
};

export default StatementWise;
