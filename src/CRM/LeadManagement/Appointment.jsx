import { properties } from "../../properties";
import { get, post } from "../../common/util/restUtil";
import React, { useEffect, useState, useContext } from "react";
import { AppContext } from "../../AppContext";

const Appointment = () => {
  const { data, handlers } = useContext(AppContext);
  const { leadData, error, userLookup, roleList } = data;

  const { setLeadData, handleOnchange, setError } = handlers;

  return (
    <div className="skel-role-base">
      <div className="row col-12 mt-2">
        <div className="col-6 px-3 mt-2">
          <h6>Created Appointments</h6>
        </div>
        <div className="col-6 text-right">
          <button onClick="addNewRow()" className="btn btn-primary btn-sm mb-2">
            Add New Appointment
          </button>
        </div>
      </div>

      <table id="employee-table" className="table table-bordered table-striped">
        <tr>
          <th>Date / Time</th>
          <th>Appointment Mode</th>
          <th>Description</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
        <tr>
          <td>
            <input
              className="form-control"
              id="appmntDate"
              placeholder=""
              type="date"
              onChange={handleOnchange}
              value={leadData.appmntDate || '2023-10-30'}
            />
          </td>
          <td>
            <select className="form-control" id="appmntMode" required="" value={leadData.appmntMode || "Direct"} onChange={handleOnchange}>
              <option selected="">Select Status</option>
              <option value={"Direct"}>Direct</option>
              <option value={"Video Conference"}>Video Conference</option>              
            </select>
          </td>
          <td>
            <input
              className="form-control"
              id="appmntName"
              placeholder=""
              type="text"
              onChange={handleOnchange}
              value={leadData.appmntName || "Meeting the stakeholder"}
            />
          </td>
          <td>
            <select className="form-control" id="appmntStatus" value={leadData.appmntStatus || "Schedule"} required="" onChange={handleOnchange}>        
              <option selected>Select Status</option>
              <option value={"Completed"}>Completed</option>
              <option value={"In-Progress"}>In-Progress</option>
              <option value={"Re-schedule"}>Re-schedule</option>
              <option value={"Schedule"}>Schedule</option>
            </select>
          </td>

          <td>
            <button onClick="deleteRow()" className="btn btn-danger btn-sm">
              Delete
            </button>
          </td>
        </tr>
      </table>
    </div>
  );
};

export default Appointment;
