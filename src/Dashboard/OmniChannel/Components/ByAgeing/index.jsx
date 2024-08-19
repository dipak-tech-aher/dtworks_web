import React, { useRef, useEffect, useContext, useState } from 'react';
import * as echarts from 'echarts';
import { properties } from '../../../../properties';
import { post } from '../../../../common/util/restUtil';
import { OmniChannelContext } from '../../../../AppContext';
import { nanoid } from 'nanoid';
import { replace } from 'lodash';
import Modal from 'react-modal';
import PopupListModal from '../../ModalPopups/PopupListModal';
import { RegularModalCustomStyles } from '../../../../common/util/util';
import { unstable_batchedUpdates } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
const barColors = ['#B5EDF0', '#00B2BD', "#B5EDF0", '#CFADFB', "#ff7f0e", "#2ca02c", '#54C1EE', '#4E33B0', '#654743', '#184636', 'RoyalBlue', 'green', 'yellow', 'orange', 'purple', 'red', 'grey', 'indigo', 'voilet', 'white', 'Pink', 'Cyan', '#E881F0', '#C876B5', '#E4DB07', '#914C83', '#7C37D3', '#867A5B', '#C29AE1', '#7C8B5B', '#EA4330']

export default function AverageResolutionTimeAgent() {
  const { data, Loader } = useContext(OmniChannelContext);
  const { channel, entity, searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, sla, currentRole, createRole, user, createdDepartment, currentDepartment } = searchParams;
  const [chartData, SetChartData] = useState();
  const chartRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const apiDetails = {
    Helpdesk: {
      endpoint: `${properties.HELPDESK_API}/omni-dashboard`
    },
    Interaction: {
      endpoint: `${properties.INTERACTION_API}/omni-dashboard`
    }
  }

  const getChartData = (entity) => {
    try {
      let requestObj = { ...searchParams }
      if (channel !== 'ALL') requestObj.channel = channel
      setIsLoading(true)
      post(apiDetails[entity].endpoint + '/by-aging', { searchParams: requestObj })
        .then((response) => {
          if (response?.data?.length) SetChartData(response?.data); else SetChartData([]);
        }).catch(error => {
          console.log(error)
          SetChartData([])
        }).finally(() => {
          loaderClose()
        })
    } catch (e) {
      console.log('error', e)
    }
  }
  const loaderClose = () => setIsLoading(false)

  useEffect(() => {
    if (fromDate && toDate) getChartData(entity);
  }, [channel, entity, channel, fromDate, toDate, category, type, status, sla, currentRole, createRole, user, createdDepartment, currentDepartment, isPageRefresh])

  useEffect(() => {
    const chartDom = chartRef.current;

    if (chartDom) {
      const myChart = echarts.init(chartDom, null, {
        renderer: 'canvas',
        useDirtyRect: false
      });
      const option = {
        title: {
          show: chartData?.length > 0 ? false : true,
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
          axisPointer: {
            type: 'cross',
            crossStyle: {
              color: '#999'
            }
          }
        },
        xAxis: [
          {
            type: 'category',
            data: chartData?.map((val) => {
              let agingText = val?.oAgeing ? replace(val?.oAgeing, new RegExp("_", "g"), " ") : "";
              return `${agingText ? replace(agingText, new RegExp("m t ", "g"), ">") : ''} Days`
            }),
            axisPointer: {
              type: 'shadow'
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '',
            min: 0,
            max: 100,
            interval: 20,
            axisLabel: {
              formatter: '{value}%'
            },
            nameLocation: 'middle',
            nameGap: 30,
          },
        ],
        series: [
          {
            name: 'By Ageing',
            type: 'bar',
            data: chartData?.map((val, i) => {
              return { value: val.oCount, itemStyle: { color: barColors[i] } }
            }),
            tooltip: {
              valueFormatter: function (value) {
                return value + '%';
              }
            },
          },
        ],
        label: {
          show: true,
          position: 'top'
        },
      };

      if (option && typeof option === 'object') {
        myChart.setOption(option);
      }

      window.addEventListener('resize', myChart.resize);
      return () => {
        window.removeEventListener('resize', myChart.resize);
        myChart.dispose();
      };
    }
  }, [chartData]);
  const onToggle = async (value) => {
    try {
      let requestObj = { ...searchParams, [entity === 'Helpdesk' ? 'category' : 'category_type']: value }
      let response = await post(apiDetails[entity].endpoint + '/by-aging-list', { searchParams: requestObj });;
      unstable_batchedUpdates(() => {
        setList(response?.data ?? []);
        setIsOpen(true)
      })
    } catch (e) {
      console.log('error', e)
    }

  }
  const handlePageSelect = (pageNo) => {
    setChannelCurrentPage(pageNo)
  }
  const [channelListPerPage, setChannelListPerPage] = useState(10)
  const [channelCurrentPage, setChannelCurrentPage] = useState(0)
  const [isOpen, setIsOpen] = useState(false);
  const [channelListCount, setChannelListCount] = useState(0)
  const [List, setList] = useState([]);

  return (
    <div className="col-6 px-lg-1">
      <div className="cmmn-skeleton mh-480">
        <div className="skel-dashboard-title-base">
          <span className="skel-header-title">
            By Ageing
          </span>
        </div>
        <hr className="cmmn-hline" />
        <div className="row mt-0">
          {chartData && chartData.length > 0 && chartData.map((aging) => {
            let agingText = aging?.oAgeing ? replace(aging?.oAgeing, new RegExp("_", "g"), " ") : "";
            return (
              <div className="col" key={nanoid()}>
                <div className="text-center" onClick={() => onToggle(aging.oAgeing)}>
                  <span className="text-center text-truncate d-block mb-0 mt-2" >
                    {/* 0 to 3 Days */}
                    {agingText ? replace(agingText, new RegExp("m t ", "g"), ">") : ''} Days
                  </span>
                  <h4
                    className="font-bold cursor-pointer m-0"
                    data-target="#detailsmodal"
                    data-toggle="modal"
                  >
                    {aging?.oCount}
                  </h4>
                </div>
              </div>
            )
          })}
        </div>
        {isLoading ? (
          <Loader />
        ) : (
          <div className="skel-graph-sect mt-0">
            <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>
          </div>
        )}
      </div>
      <Modal isOpen={isOpen} style={RegularModalCustomStyles} ariaHideApp={false}>
        <div className="modal-content">
          <div className="">
            <PopupListModal
              data={{
                isTableFirstRender: false,
                hasExternalSearch: false,
                list: List,
                entityType: `By Aging - ${entity}`,
                headerColumn: entity === 'Helpdesk' ? HelpdeskColumns : InteractionColumns,
                count: channelListCount,
                fixedHeader: true,
                itemsPerPage: channelListPerPage,
                isScroll: true,
                backendCurrentPage: channelCurrentPage,
                backendPaging: false,
                isPopupOpen: isOpen
              }}
              handlers={{
                handlePageSelect: handlePageSelect,
                setPerPage: setChannelListPerPage,
                setCurrentPage: setChannelCurrentPage,
                setIsPopupOpen: setIsOpen
              }} />
          </div>
        </div>
      </Modal>
    </div>
  )
}

const InteractionColumns = [
  {
    Header: "Interaction No",
    accessor: "oIntxnNo",
    disableFilters: true,
    id: "oIntxnNo"
  },
  {
    Header: "Interaction Category",
    accessor: "oIntxnCategory",
    disableFilters: true,
  },
  {
    Header: "Interaction Type",
    accessor: "oIntxnType",
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
    accessor: "oIntxnPriority",
    disableFilters: true,
  },
  {
    Header: "Project",
    accessor: "oProject",
    disableFilters: true,
  },
  {
    Header: "Status",
    accessor: "oIntxnStatus",
    disableFilters: true,
  },
  {
    Header: "Channel",
    accessor: "oIntxnChannel",
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
    accessor: "oCreatedBy",
    disableFilters: true,
  },
  {
    Header: "Created At",
    accessor: "oCreatedAt",
    disableFilters: true,
    id: "oCreatedAt"
  }
]

const HelpdeskColumns = [
  {
    Header: "Helpdesk No",
    accessor: "oHelpdeskNo",
    disableFilters: true,
    id: "helpdeskNo",
    uid: uuidv4(),

  },
  {
    Header: "Email",
    accessor: "oMailId",
    disableFilters: true,
    id: "mailId",
    uid: uuidv4(),

  },
  {
    Header: "Source",
    accessor: "oHelpdeskSource",
    disableFilters: true,
    id: "helpdeskSourceDesc",
    uid: uuidv4(),

  },
  {
    Header: "Project",
    accessor: "oProject",
    disableFilters: true,
    id: "projectDesc",
    uid: uuidv4(),
  },
  {
    Header: "Severity",
    accessor: "oSeverity",
    disableFilters: true,
    id: "severityDesc",
    uid: uuidv4(),
  },
  {
    Header: "Current User",
    accessor: "oCurrUser",
    disableFilters: true,
    id: "currUser",
    uid: uuidv4()
  },
  {
    Header: "Status",
    accessor: "oStatus",
    disableFilters: true,
    id: "statusDesc",
    uid: uuidv4()
  },
  {
    Header: "Actioned Date",
    accessor: "oCreatedAt",
    disableFilters: true,
    id: "createdAt",
    uid: uuidv4()
  },
  {
    Header: "Completion Date",
    accessor: "oCompletionDate",
    disableFilters: true,
    id: "oCompletionDate",
    uid: uuidv4()
  }
];