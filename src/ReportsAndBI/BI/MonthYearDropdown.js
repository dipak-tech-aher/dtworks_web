import React from "react";

const MonthYearDropdown = (props) => {
  const currentYear = new Date().getFullYear();

  const handleLookupOrStateChange= props.handleLookupOrStateChange
  const data= props.data
  // Generate an array of 10 years
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const monthAbbreviations = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <>
      <div className="col-md-3">
        <label htmlFor="mbrYear" className="control-label">
          Year
        </label>
        <select
          className="form-control"
          id="mbrYear"
          value={data?.mbrYear}
          onChange={e=> {
            handleLookupOrStateChange(e)          
          }}
        >
          <option value="">Select Year</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-3">
        <label htmlFor="mbrMonth" className="control-label">
          Month<span>*</span>
        </label>
        <select
          className="form-control"
          id="mbrMonth"
          value={data?.mbrMonth}
          onChange={ e=> {
            handleLookupOrStateChange(e)          
          }}
        >
          <option value="">Select Month</option>
          {monthAbbreviations.map((month, index) => (
            <option key={index} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

export default MonthYearDropdown;
