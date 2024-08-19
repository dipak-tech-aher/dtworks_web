import React, { useEffect, useRef, useState } from "react";
import moment from "moment";
import { DatalistInput, useComboboxControls } from "react-datalist-input";
import { unstable_batchedUpdates } from "react-dom";
import { slowPost } from "../../common/util/restUtil";
import { properties } from "../../properties";
import { statusConstantCode } from "../../AppConstants";

const ComplaintOrServiceRequestDetailsForm = (props) => {
	const { customerData, helpdeskData } = props.data;
	const { setHelpdeskData, handleClear } = props.stateHandler;

	const formRef = useRef();

	const [items, setItems] = useState([]);
	const [error, setError] = useState({});
	const { isExpanded, setIsExpanded, setValue, value } = useComboboxControls({
		isExpanded: false,
	});

	useEffect(() => {
		// console.log("helpdeskData", helpdeskData)
		if (!helpdeskData.helpdeskSubject || helpdeskData.helpdeskSubject == "") {
			formRef.current.reset(); setValue();
		}
	}, [helpdeskData])

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
		let customerName = `${customerData?.firstName} ${customerData?.lastName ?? ''}`?.trim();
		let contact = customerData.customerContact?.find(x => x.isPrimary);
		// console.log("contact ===> ", contact);
		let payload = {
			helpdeskSubject: item.helpdeskStatement,
			helpdeskType: item.helpdeskType,
			helpdeskSource: statusConstantCode.businessEntity.HPD_SOURCE.IVR,
			mailId: contact?.emailId,
			phoneNo: contact?.mobileNo,
			contactId: contact?.contactId ?? null,
			userCategory: contact?.contactCategory ?? null,
			userCategoryValue: contact?.contactCategoryValue ?? null,
			content: item.helpdeskStatement,
			userName: customerName,
			project: item.project ?? null,
			severity: item.sevearity ?? null
		}

		setHelpdeskData({ ...payload });
	}

	Object.byString = function (o, s) {
		s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
		s = s.replace(/^\./, '');           // strip a leading dot
		var a = s.split('.');
		for (var i = 0, n = a.length; i < n; ++i) {
			var k = a[i];
			if (k in o) {
				o = o[k];
			} else {
				return;
			}
		}
		return o;
	}

	const getValue = (valuePath) => {
		let item = items.find(x => x.helpdeskStatement == helpdeskData.helpdeskSubject);
		return item ? Object.byString(item, valuePath) : '';
	}

	return (
		<div className="block-section">
			<form ref={formRef}>
				<fieldset className="scheduler-border">
					<div className="form-row">
						<div className="cmmn-skeleton mt-2">
							<div className="skel-inter-search-st">
								<i className="fa fa-search"></i>
								<DatalistInput
									className=""
									ref={formRef}
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
									onChange={(e) => {
										// console.log("e.target.value", e.target.value)
										if (e.target.value == "") {
											handleClear();
										}
									}}
									label={false}
									items={items}
									placeholder="Type to search..."
								/>
							</div>
						</div>
						<div className="cmmn-skeleton mt-2">
							<div className="row">
								<div className="col-md-4">
									<div className="form-group">
										<label htmlFor="helpdeskType" className="control-label">
											Type
											<span className="text-danger font-20 pl-1 fld-imp">*</span>
										</label>
										<div className="custselect">
											<input id="helpdeskType" className="form-control" value={
												getValue('helpdeskTypeDesc.description')
											} disabled={true} type="text" />
										</div>
										<span className="errormsg">
											{error.helpdeskType ? error.helpdeskType : ""}
										</span>
									</div>
								</div>
								<div className="col-md-4">
									<div className="form-group">
										<label htmlFor="severity" className="control-label">
											Severity
											<span className="text-danger font-20 pl-1 fld-imp">*</span>
										</label>
										<div className="custselect">
											<input id="severity" className="form-control" value={
												getValue('sevearityDesc.description')
											} disabled={true} type="text" />
										</div>
										<span className="errormsg">
											{error.severity ? error.severity : ""}
										</span>
									</div>
								</div>
								<div className="col-md-4">
									<div className="form-group">
										<label htmlFor="project" className="control-label">
											Project
											<span className="text-danger font-20 pl-1 fld-imp">*</span>
										</label>
										<input id="project" className="form-control" value={
											getValue('projectDesc.description')
										} disabled={true} type="text" />
										<span className="errormsg">
											{error.project ? error.project : ""}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</fieldset>
			</form>
		</div>
	);
};

export default ComplaintOrServiceRequestDetailsForm;
