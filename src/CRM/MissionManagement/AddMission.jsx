import { properties } from "../../properties";
import { get, post, put } from "../../common/util/restUtil";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import MappingList from '../../common/components/MappingList';
import UnmappingList from '../../common/components/UnmappingList';

const AddMission = (props) => {
  const data = props?.location?.state ? props?.location?.state?.data : null;

  const [countryLookup, setCountryLookup] = useState([]);
  const [missionData, setMissionData] = useState(data ? data : {});
  const [leadList, setLeadList] = useState([]);
  const [perPage, setPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(0);
  const [mappedItems, setMappedItems] = useState([]);

  useEffect(() => {
    get(
      properties.MASTER_API +
        "/lookup?searchParam=code_type&valueParam=COUNTRY"
    ).then((resp) => {
      if (resp.data) {
        setCountryLookup(resp.data.COUNTRY);
      }
    });

    const reqBody={}
    post(`${properties.LEAD_API}/search?limit=${perPage}&offset=${currentPage}`, reqBody).then((resp) => {
      if (resp.status === 200) {
        setLeadList(resp.data.map(m=> {
          return {
            id: m.leadId,
            name: m.leadName,
          }
        }));

        // console.log(missionData)

        const mappedItem = resp.data?.filter(m => m.missionList && m.missionList.missionId == missionData.missionId).map(m=> (
             {
              id: m.leadId,
              name: m.leadName,
            }                 
        )) || []

        // console.log('mappedItem ', mappedItem)
        // console.log('leadList ', resp.data)
      //  if(mappedItem.length >0){
        const finalUnmapList = resp.data?.filter(m => m.missionList === null).map(m=> (
            {
            id: m.leadId,
            name: m.leadName,
          }                 
      ));
        // console.log('finalUnmapList ', finalUnmapList)

          setLeadList(finalUnmapList)
           
          setMappedItems(prevMappedItems => [...prevMappedItems, ...mappedItem]);
       // }
      }
    })

  }, []);
  
  const handleOnchange = (e) => {
    const { id, value } = e.target;
    setMissionData({
      ...missionData,
      [id]: value,
    });
  };

  const saveItem = () => {
    const reqBody = {
      ...missionData,
      mappedLead: mappedItems,
      unmappedLead: leadList,
    };

    // console.log("reqBody ", reqBody);

    if (!reqBody.missionUuid) {
      post(`${properties.LEAD_API}/mission/create`, reqBody).then((resp) => {
        if (resp.status === 200) { 
          setMissionData({
            ...missionData,
            ...resp.data,
          });
          toast.success(resp.message);
        }
      });
    } else {
      put(`${properties.LEAD_API}/mission/update/${reqBody.missionUuid}`, reqBody).then(
        (resp) => {
          if (resp.status === 200) {          
            setMissionData({
              ...missionData,
              ...resp.data,
            });
            toast.success(resp.message);
          }
        }
      );
    }
  };

  const handleMap = item => {
    setLeadList(prevItems => prevItems.filter(i => i.id !== item.id));
    setMappedItems(prevMappedItems => [...prevMappedItems, item]);
  };

  const handleUnmap = item => {
    setMappedItems(prevMappedItems => prevMappedItems.filter(i => i.id !== item.id));
    setLeadList(prevItems => [...prevItems, item]);
  };

  return (
    <div className="cnt-wrapper">
      <div className="cmmn-skeleton">
        <div className="skel-role-base">
          <div className="skel-tabs-role-config p-2">
            <div className="col-12">
              <div className="row">
                <div className="col-md-3">
                  <div className="form-group">
                    <label htmlFor="missionName" className="control-label">
                      Mission Name
                      <span className="text-danger font-20 pl-1 fld-imp">*</span>
                    </label>
                    <input
                      className="form-control"
                      id="missionName"
                      placeholder=""
                      type="text"
                      value={missionData.missionName}
                      onChange={handleOnchange}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="form-group">
                    <label htmlFor="country" className="control-label">
                      Mission Country
                      <span className="text-danger font-20 pl-1 fld-imp">*</span>
                    </label>
                    <div className="custselect">
                      <select
                        className="form-control"
                        id="country"
                        required=""
                        onChange={handleOnchange}
                        value={missionData.country}
                      >
                        <option selected="">Choose Country</option>
                        {countryLookup.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="col-md-12" style={{display: "flex", justifyContent: "space-around", padding: "20px"}}>
                <MappingList items={leadList} onMap={handleMap} />
                <UnmappingList mappedItems={mappedItems} onUnmap={handleUnmap} />
                </div>
                <div className="col-md-12 text-center my-2">
                  <button
                    type="button"
                    className="skel-btn-submit"
                    onClick={saveItem}
                  >
                    Submit
                  </button>{" "}
                </div>       
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMission;
