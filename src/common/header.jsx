import React, { useContext, useEffect } from "react";
import { AppContext } from "../AppContext";
import Notification from "./header/notification";
import ProfileNav from "./header/profileNav";
import UserRole from "./header/userRole";
import { Link } from "react-router-dom";
import QuickSearch from "./header/QuickSearch";
import MainMenu from "./mainMenu";
// import Swal from "sweetalert2";
// import { slowPost } from "../common/util/restUtil";
// import moment from "moment";
// import { properties } from "../properties";


const Header = (props) => {
  const { appsConfig } = props.data;
  const { auth } = useContext(AppContext);
  const menuCollapse = props?.data?.menuCollapse

  // useEffect(() => {
  //   const isPopUpAlreadyClosed = localStorage.getItem("isAgeingPopUpClosed")
  //   const today = moment();
  //   const startDate = today.clone().startOf('month').format('YYYY-MM-DD');
  //   const endDate = today.clone().endOf('month').format('YYYY-MM-DD');
  //   slowPost(properties.HELPDESK_API + '/open-helpdesk-by-aging', {
  //     fromDate: startDate,
  //     toDate: endDate
  //   }).then((resp) => {
  //     if (resp?.status == 200) {
  //       const moreThan8Days = resp?.data?.filter((ele) => ele?.agingCategory === "8 - 10 days")
  //       slowPost(properties.INTERACTION_API + "/by-ageing", {
  //         searchParams: {
  //           fromDate: startDate,
  //           toDate: endDate
  //         }
  //       }).then((resp) => {
  //         if (resp?.status == 200) {
  //           if (isPopUpAlreadyClosed==="N") {
  //             Swal.fire({
  //               title: 'ALERT MESSAGE',
  //               html: `<p><strong>${moreThan8Days?.length} </strong> HELPDESK TICKETS IN 5 DAYS-AGEING</p><br/><p><strong>${resp?.data?.rows?.[0]?.oIntxnMoreThan5DayCnt} </strong>INTERACTION TICKETS MORE THAN 5 DAYS-AGEING</p>`,
  //               icon: 'warning',
  //               showCancelButton: false,
  //               confirmButtonColor: '#d33',
  //               cancelButtonColor: '#d33',
  //               confirmButtonText: 'Close',
  //               allowOutsideClick: false,
  //             }).then((result) => {
  //               if (result.isConfirmed) {
  //                 localStorage.setItem("isAgeingPopUpClosed", "Y");
  //               }
  //             });
  //           }
  //         }
  //       }).catch((error) => console.log(error));
  //     }
  //   }).catch((error) => console.log(error));
  // })

  useEffect(() => {
    localStorage.setItem("appConfig", JSON.stringify(appsConfig));
  }, [appsConfig])

  return (
    <div>
      {auth && auth.user ? (
        <>
          <div className="navbar navbar-expand-lg navbar-custom skel-custom-nav-bar navbar-dt"> 
            <Link to={`/${auth?.defaultScreen && auth?.defaultScreen !== 'null' ? auth?.defaultScreen : '/'}` ?? '/'} className="navbar-brand mr-0 mr-md-2">
              {/* <span className="logo-lg skel-login-sect"> */}
              {appsConfig?.appLogo ? <>{menuCollapse === false ? <img src={appsConfig?.appLogo} alt="Logo" height="35" /> :
                <img src={appsConfig?.appLogo} alt="Logo" height="35" />}</> : ''}
            </Link>
            <button className="navbar-toggler mr-auto" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="navbar-collapse offcanvas-collapse navbar-mainmenu" id="navbarNav">
              <MainMenu appsConfig={appsConfig} />
            </div>
            <ul className="nav justify-content-around justify-content-md-end mb-0 nav-topright align-items-center">
              <li className="nav-search d-none d-md-block"><QuickSearch appsConfig={appsConfig} /></li>
              <UserRole></UserRole>
              <Notification></Notification>
              <ProfileNav></ProfileNav>
            </ul>
            <div className="d-md-none mobile-search"><QuickSearch appsConfig={appsConfig} /></div>
          </div>
        </>
      ) : (
        ""
      )}

    </div>
  );
};

export default Header;
