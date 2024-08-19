import React, { useState } from "react";

let showLoader;
let hideLoader;
const LazyLoader = () => {
  const [spinnerCount, setSpinnerCount] = useState(0);

  showLoader = () => {
    setSpinnerCount((prevState) => {
     return prevState + 1;
    });
  };
  hideLoader = () => {
    setSpinnerCount((prevState) => {
      if (prevState > 0) return prevState - 1;
      else return 0;
    });
  };
  return (
    <div className="spinner-container" style={{display: spinnerCount <= 0 ? "none" : "block"}}>
      <div className="spinner"></div>
    </div>
  );
};

export default LazyLoader;
export { showLoader, hideLoader };
