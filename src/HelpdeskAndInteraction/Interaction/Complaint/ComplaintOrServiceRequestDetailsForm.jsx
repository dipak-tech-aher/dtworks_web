import React, { useEffect, useState } from "react";
import Select from "react-select";
import moment from "moment";
import FileUpload from "../../../common/uploadAttachment/fileUpload";
import CustomerAddressForm from "../../../CRM/Address/CustomerAddressForm";
import { DatalistInput, useComboboxControls } from "react-datalist-input";
import { unstable_batchedUpdates } from "react-dom";
import { get, post, slowPost } from "../../../common/util/restUtil";
import { properties } from "../../../properties";

const ComplaintOrServiceRequestDetailsForm = (props) => {
	const { customerDetails } = props.data;
	// console.log("customerDetails", customerDetails);
	const [helpdeskData, setHelpdeskData] = useState({});
	const [items, setItems] = useState([]);
	const [error, setError] = useState({});
	const { isExpanded, setIsExpanded, setValue, value } = useComboboxControls({
		isExpanded: false,
	});
	useEffect(() => {
		slowPost(`${properties.WADASHBOARD_API}/get-helpdesk-statements`).then((resp) => {
			if (resp?.data?.rows) {
				const arr = resp?.data?.rows?.map((i) => ({
					id: i.helpdeskStatementId, value: i.helpdeskStatement, ...i,
				}))
				unstable_batchedUpdates(() => {
					setItems(arr);
				})
			}
		}).catch((error) => {
			console.error(error);
		});
	}, [])
	const handleKnowledgeSelect = (item) => {
		setHelpdeskData({ ...item });

		let payload = {
			userName: `${customerDetails?.firstName} ${customerDetails?.lastName}`,
			helpdeskCreationSource: "IVR",
			helpdeskSource: "IVR",
			content: item.helpdeskStatement,
			helpdeskSubject: item.helpdeskStatement,
			status: "HS_NEW",
			helpdeskType: item.helpdeskType,
			severity: item.severity,
			project: item.project,
			contactId: customerDetails?.contactDetails?.contactId,
			phoneNo: customerDetails?.contactDetails?.mobileNo,
			ivrNo: "",
		}
	}
	return (
		<div className="block-section">
			<fieldset className="scheduler-border">
				<div className="form-row">
					<div className="cmmn-skeleton mt-2">
						<div className="skel-inter-search-st">
							<i className="fa fa-search"></i>
							<DatalistInput
								className=""
								isExpanded={isExpanded}
								setIsExpanded={setIsExpanded}
								value={value}
								setValue={setValue}
								inputProps={{
									'auto-complete': "new-password",
									id: "knowledgeBase",
									name: "knowledgeBase",
								}}
								onSelect={(item) => {
									setValue(item.value);
									handleKnowledgeSelect(item);
								}}
								label={false}
								items={items}
								placeholder="Type to search..."
							/>
						</div>
					</div>
					<div className="cmmn-skeleton mt-2">
						<div className="row">
							<div className="col-md-6">
								<div className="form-group">
									<label htmlFor="helpdeskType" className="control-label">
										Type
										<span className="text-danger font-20 pl-1 fld-imp">*</span>
									</label>
									<div className="custselect">
										<input id="helpdeskType" className="form-control" value={
											helpdeskData?.helpdeskTypeDesc?.description
										} disabled={true} type="text" />
									</div>
									<span className="errormsg">
										{error.helpdeskType ? error.helpdeskType : ""}
									</span>
								</div>
							</div>
							<div className="col-md-6">
								<div className="form-group">
									<label htmlFor="severity" className="control-label">
										Severity
										<span className="text-danger font-20 pl-1 fld-imp">*</span>
									</label>
									<div className="custselect">
										<input id="severity" className="form-control" value={
											helpdeskData?.sevearityDesc?.description
										} disabled={true} type="text" />
									</div>
									<span className="errormsg">
										{error.severity ? error.severity : ""}
									</span>
								</div>
							</div>
							<div className="col-md-6">
								<div className="form-group">
									<label htmlFor="project" className="control-label">
										Project
										<span className="text-danger font-20 pl-1 fld-imp">*</span>
									</label>
									<input id="project" className="form-control" value={
										helpdeskData?.projectDesc?.description
									} disabled={true} type="text" />
									<span className="errormsg">
										{error.project ? error.project : ""}
									</span>
								</div>
							</div>
							<div className="col-md-6">
								<div className="form-group">
									<label htmlFor="completionDate" className="control-label">
										Completion Date
										<span className="text-danger font-20 pl-1 fld-imp">*</span>
									</label>
									<input id="completionDate" className="form-control" onChange={(e) => {
										// console.log(e);
									}} type="date" />
									<span className="errormsg">
										{error.completionDate ? error.completionDate : ""}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</fieldset>
		</div>
	);
};

export default ComplaintOrServiceRequestDetailsForm;
