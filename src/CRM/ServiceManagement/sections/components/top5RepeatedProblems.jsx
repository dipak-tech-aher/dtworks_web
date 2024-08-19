import React, { useContext, useEffect, useState } from 'react';
import { Service360Context } from '../../../../AppContext';
import { post } from '../../../../common/util/restUtil';
import { properties } from '../../../../properties';
import moment from 'moment';

const Top5RepeatedProblems = (props) => {
    const { data } = useContext(Service360Context);
    const { subscriptionDetails, masterDataLookup } = data;
    const negativeEmojis = ["ANGRY", "SAD"];
    const entities = [
        {
            code: "HELPDESK_TYPE", description: "Helpdesk",
            groupByKey: "helpdeskSubject", typeKey: "helpdeskType",
            negativeTypes: masterDataLookup['HELPDESK_TYPE'].filter(x => negativeEmojis.includes(x.mapping?.emoji?.[0])).map(x => x.code)
        },
        {
            code: "INTXN_TYPE", description: "Interaction",
            groupByKey: "requestStatement", typeKey: "intxnType",
            negativeTypes: masterDataLookup['INTXN_TYPE'].filter(x => negativeEmojis.includes(x.mapping?.emoji?.[0])).map(x => x.code)
        }
    ]
    const [selectedEntity, setSelectedEntity] = useState(entities[0]);
    const [selectedType, setSelectedType] = useState('SELECT');
    const [statements, setStatements] = useState(entities.reduce((result, item) => result[item['code']] = [], {}));
    const [rows, setRows] = useState({});

    useEffect(() => {
        post(`${properties.HELPDESK_API}/search?limit=5`, { serviceUuid: subscriptionDetails?.serviceUuid }).then((response) => {
            if (response?.data?.rows?.length) {
                statements['HELPDESK_TYPE'] = response.data.rows.filter(x => entities[0].negativeTypes.includes(x.helpdeskType.code)) ?? [];
                setStatements({ ...statements });
            }
        }).catch(error => {
            console.error(error);
        });
        post(`${properties.INTERACTION_API}/search`, { page: null, limit: 5, searchParams: { serviceUuid: subscriptionDetails?.serviceUuid } }).then((response) => {
            if (response?.data?.rows?.length) {
                statements['INTXN_TYPE'] = response.data.rows.filter(x => entities[1].negativeTypes.includes(x.intxnType.code)) ?? [];
                setStatements({ ...statements });
            }
        }).catch(error => {
            console.error(error);
        });
    }, [])

    const groupBy = (items, key) => items.reduce(
        (result, item) => ({
            ...result,
            [item[key]]: [
                ...(result[item[key]] || []),
                item,
            ],
        }),
        {},
    );

    useEffect(() => {
        if (statements[selectedEntity.code]?.length) {
            let groupedStatements = groupBy(statements[selectedEntity.code], selectedEntity.groupByKey);
            let tempRows = {};
            for (const key in groupedStatements) {
                groupedStatements[key] = selectedType === "SELECT" ? groupedStatements[key] : groupedStatements[key]?.filter(x => x[selectedEntity.typeKey]?.code === selectedType);
                if (groupedStatements[key].length > 1) {
                    tempRows[key] = groupedStatements[key];
                }
            }
            setRows({ ...tempRows })
        } else {
            setRows({});
        }
    }, [selectedEntity, selectedType, statements])

    const onChangeEntity = (e) => {
        const { value } = e.target;
        setSelectedType('SELECT');
        setSelectedEntity(entities.find(x => x.code === value));
    }

    return (
        <div className="col-md-6 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Top 5 repeated problems</span>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect mt-2">
                    <div className="row mb-0">
                        <div className="col-md-auto ml-auto">
                            <form className="form-inline">
                                <div className="form-group">
                                    <label htmlFor="">By</label>
                                    <select onChange={onChangeEntity} className="form-control form-control-sm w-auto px-1 ml-2">
                                        {entities?.map((entity) => (
                                            <option key={entity.code} value={entity.code}>{entity.description}</option>
                                        ))}
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="col-md-auto">
                            <form className="form-inline">
                                <div className="form-group">
                                    <label htmlFor="">Type</label>
                                    <select onChange={(e) => setSelectedType(e.target.value)} className="form-control form-control-sm w-auto px-1 ml-2">
                                        <option value={'SELECT'}>Select</option>
                                        {masterDataLookup[selectedEntity.code]?.map((type) => (
                                            negativeEmojis.includes(type?.mapping?.emoji?.[0]) && <option key={type.code} value={type.code}>{type.description}</option>
                                        ))}
                                    </select>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="cust-table">
                        <table role="table" className="table table-responsive table-striped dt-responsive nowrap w-100" style={{ textAlign: "center", marginLeft: 0 }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left" }} className="font-weight-bold">Statement</th>
                                    <th className="font-weight-bold">Count</th>
                                    <th className="font-weight-bold">Created Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(rows)?.length ? Object.keys(rows).map((key) => (
                                    <tr key={key}>
                                        <td style={{ textAlign: "left" }}>{key}</td>
                                        <td>{rows[key]?.length}</td>
                                        <td>{moment(rows[key][0]['createdAt']).format('DD-MM-YYYY')}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3}>No repeated problem statements</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Top5RepeatedProblems;