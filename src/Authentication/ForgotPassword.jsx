import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { properties } from "../properties";
import { get, post } from "../common/util/restUtil";
import { AppContext } from "../AppContext";
import { string, object } from "yup";
import { useTranslation } from "react-i18next";
import logoLight from '../assets/images/logo-light.png';
import forgotpasswordImage from '../assets/images/forgot_password_image.jpg'
import { toast } from "react-toastify";

const validationSchema = object().shape({

    oldPassword: string().required("Please enter password"),
    password: string().required("Please enter password"),
    confirmPassword: string().required("Please enter password again"),

});


const ForgotPassword = (props) => {
    let { auth, setAuth } = useContext(AppContext);
    const { t } = useTranslation();
    const history = useNavigate();
    const [error, setError] = useState({});
    const [apiMessage, setApiMessage] = useState();
    const [user, setUser] = useState()
    const [form, setForm] = useState({
        oldPassword: "",
        password: "",
        email: "",
        confirmPassword: "",
    })
    const [showPassword3, setShowPassword3] = useState(false)
    const [showPassword1, setShowPassword1] = useState(false)
    const [showPassword2, setShowPassword2] = useState(false)

    useEffect(() => {

        
        get(properties.USER_API + "/token/" + props.match.params.forgotpasswordtoken).then(resp => {
            if (resp.data) {
                setForm({ ...form, email: resp.data.email })
                setUser(resp.data)
            }
        }).catch((error) => {
            setTimeout(() => {
                history(`/user/login`)
            }, 3000);
        }).finally()

    }, []);

    const validate = () => {
        try {
            validationSchema.validateSync(form, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                setError((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    };



    const handleSubmit = () => {
        setApiMessage("");
        const error = validate(validationSchema, form);
        if (error) return;


        let reg = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})"); //Minimum eight characters, at least one letter, one number and one special character:
        let test = reg.test(form.password);
        let test1 = reg.test(form.confirmPassword);

        if (test === false) {
            toast.error("Please Enter Password in correct format")
            return false;
        }
        if (test1 === false) {
            toast.error("Please Enter Confirm Password in correct  format")
            return false;
        }
        if (form.password !== form.confirmPassword) {
            toast.error("Password and Confirm Password must be same");
            return false;
        }

        
       
        post(properties.USER_API + "/reset-password", form)
            .then((resp) => {
                if (resp.status === 200) {
                    toast.success("You have successfully changed password, Redirecting you to login page", { autoclose: 3000 })
                    setTimeout(() => {
                        history(`/user/login`)
                    }, 3000);


                } else {
                    toast.error("Error while changing Password", { autoclose: 3000 })
                    setTimeout(() => {
                        history(`/user/login`)
                    }, 3000);
                }
            }).catch((error) => {
                console.log(error)
            })
            .finally();


    }

    const handelcancel = () => {
        setForm({ ...form, oldPassword: '', password: '', confirmPassword: '' })
    }


    return (
        <div className="login-layout-main authentication-bg authentication-bg-pattern">
            <div className="bg-layer account-pages mt-2 pt-2 col-md-10 offset-md-1">
            {/*old css for the below div loginboxshadow bg-white */}
                <div className="header-main container"> 
                    <div className="row">
                        <div className="col-md-6 pd-0 text-right">
                            <img alt="" style={{ height: "80%", width: "100%", marginTop: "4px", paddingTop: "6px" }} src={forgotpasswordImage} />
                        </div>
                        <div className="col-md-6 login-form p-0">
                            <div className="card">

                                <div className="card-body p-3">

                                    <div className="text-center m-auto">
                                        <div className="auth-logo">
                                            <Link to="#" className="logo text-center">
                                                <span className="logo-lg skel-login-sect">
                                                    <img src={logoLight} alt="" height="50" />
                                                </span>
                                            </Link>
                                        </div>
                                        <hr className="mt-2" />


                                    </div>
                                    <div className="col-12 mt-2 p-0 border ">
                                        <h4 className="text-center p-0">Change Password</h4>

                                    </div>

                                    {/* <div className="col-12 mt-3 p-2 border ">

                                        <div action="#"> */}
                                    <fieldset className="scheduler-border">

                                        <div className="form-group mb-3">
                                            {
                                                user && user.firstName && user.lastName ?
                                                    <><span className="col-form-label">Name : </span><span>{user.firstName + " " + user.lastName}</span></>
                                                    :
                                                    <></>
                                            }


                                        </div>
                                        <div className="form-group mb-3">
                                            <label className="col-form-label" htmlFor="password">Current Password</label>
                                            <div className="input-group input-group-merge">
                                                <input className={`form-control ${(error.oldPassword ? "input-error" : "")}`} id="new" placeholder="Enter Current Password"
                                                    type={showPassword3 === false ? "password" : "text"}
                                                    onChange={(e) => {
                                                        setForm({
                                                            ...form,
                                                            oldPassword: e.target.value,
                                                        });
                                                        setError({ ...error, oldPassword: "" })
                                                    }} />

                                                <div className="input-group-append" data-password="false">
                                                    <div className="input-group-text" style={showPassword3 === false ? { cursor: "pointer" } : { backgroundColor: "lightgrey", cursor: "pointer" }}>
                                                        <span className="password-eye font-12" onClick={() => setShowPassword3(!showPassword3)}></span>
                                                    </div>
                                                </div>
                                                {error.oldPassword ? <span className="errormsg">{error.oldPassword}</span> : ""}
                                            </div>
                                        </div>
                                        <div className="form-group mb-3">
                                            <label className="col-form-label" htmlFor="password">New Password</label>
                                            <div className="input-group input-group-merge">
                                                <input className={`form-control ${(error.password ? "input-error" : "")}`} id="new" placeholder="Enter New Password"
                                                    type={showPassword1 === false ? "password" : "text"}
                                                    onChange={(e) => {
                                                        setForm({
                                                            ...form,
                                                            password: e.target.value,
                                                        });
                                                        setError({ ...error, password: "" })
                                                    }} />

                                                <div className="input-group-append" data-password="false">
                                                    <div className="input-group-text" style={showPassword1 === false ? { cursor: "pointer" } : { backgroundColor: "lightgrey", cursor: "pointer" }}>
                                                        <span className="password-eye font-12" onClick={() => setShowPassword1(!showPassword1)}></span>
                                                    </div>
                                                </div>
                                                {error.password ? <span className="errormsg">{error.password}</span> : ""}
                                            </div>
                                        </div>
                                        <div className="form-group mb-3">
                                            <label className="col-form-label" htmlFor="password">Confirm New Password</label>
                                            <div className="input-group input-group-merge">
                                                <input className={`form-control ${(error.confirmPassword ? "input-error" : "")}`} id="new" placeholder="Confirm New Password"
                                                    type={showPassword2 === false ? "password" : "text"}
                                                    onChange={(e) => {
                                                        setForm({
                                                            ...form,
                                                            confirmPassword: e.target.value,
                                                        });
                                                        setError({ ...error, confirmPassword: "" })

                                                    }}
                                                    onKeyPress={(e) => {
                                                        if (e.key === "Enter") handleSubmit();
                                                    }} />

                                                <div className="input-group-append" data-password="false">
                                                    <div className="input-group-text" style={showPassword2 === false ? { cursor: "pointer" } : { backgroundColor: "lightgrey", cursor: "pointer" }}>
                                                        <span className="password-eye font-12" onClick={() => setShowPassword2(!showPassword2)}></span>
                                                    </div>
                                                </div>
                                                {error.confirmPassword ? <span className="errormsg">{error.confirmPassword}</span> : ""}
                                            </div>
                                        </div>

                                        {/*col-12 row pt-2 pr-0 */}    
                                        <div className="d-flex justify-content-center mt-2">
                                            <div className="col-6 text-center">
                                                <button className="skel-btn-submit" onClick={handleSubmit}>Submit</button>
                                            </div>
                                            {/*<div className="col-6 text-center"><button className="btn btn-secondary waves-effect waves-light btn-block" onClick={handelcancel}>Reset</button>

                                            </div>*/}

                                        </div>

                                        {apiMessage !== "" ? <p className="error-msg">{apiMessage}</p> : ""}
                                    </fieldset>
                                    <div className="form-group mb-0 text-center ml-10 pl-10">
                                        <h5 className="nav-item">
                                            <a to="`{/user/login}`">Back to Login</a>
                                        </h5>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        //     </div>
        // </div>

    );
};

export default ForgotPassword;
