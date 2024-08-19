import { properties } from "../../properties";
import { get, post } from "../../common/util/restUtil";
import React, { useEffect, useState, useContext } from "react";
import { AppContext } from "../../AppContext";

const Proposal = () => {
  const { data, handlers } = useContext(AppContext);

  return (
    <div className="skel-role-base">
      <div className="skel-tabs-role-config p-2">
        <div className="col-12">
          <div className="p-0">
            <div className="row col-12 mt-2 mb-2 p-0">
              <div className="col-6 px-3"></div>
              <div className="col-6 text-right p-0">
                <button
                  onClick="addNewRow()"
                  className="btn btn-primary btn-sm"
                >
                  Add New Proposal
                </button>
              </div>
            </div>

            <table
              id="employee-table"
              className="table table-bordered table-striped"
            >
              <tr>
                <th>Document Name</th>
                <th>Version</th>
                <th>Created Date</th>
                <th>Expiry Date</th>

                <th colspan="2" align="center" className="text-center">
                  Action
                </th>
              </tr>

              <tr>
                <td>
                  <input
                    className="form-control"
                    id="Interactioncat"
                    placeholder=""
                    type="text"
                    value=""
                  />
                </td>
                <td>
                  <input
                    className="form-control"
                    id="Interactioncat"
                    placeholder=""
                    type="text"
                    value=""
                  />
                </td>
                <td>
                  <input
                    className="form-control"
                    id="Interactioncat"
                    placeholder=""
                    type="date"
                    value=""
                  />
                </td>
                <td>
                  <input
                    className="form-control"
                    id="Interactioncat"
                    placeholder=""
                    type="date"
                    value=""
                  />
                </td>

                <td>
                  <input
                    className="form-control"
                    id="Interactioncat"
                    placeholder=""
                    type="File"
                    value=""
                  />
                </td>
                <td>
                  <button
                    onClick="deleteRow()"
                    className="btn btn-success btn-sm ml-2"
                  >
                    Upload
                  </button>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Proposal;
