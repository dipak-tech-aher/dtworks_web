

const DashboardFilteredContent = (props) => {
    const searchParams = props?.searchParams
    const setSearchParams = props?.setSearchParams

    const clearFilter = (param, value) => {
        if (param) {
            searchParams[param] = searchParams[param].filter(x => x.value != value);
        } else {
            searchParams[param] = null;
        }

        setSearchParams({
            ...searchParams
        })
    }

    const FilterItem = ({ label, values, clearFilter }) => (
        <li style={{ fontSize: '15px', marginLeft: '5px' }}>
            {label}: {values.map((x, i) => (
                <span className={`dash-filter-badge ml-2`}>{x.label}
                    <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter(x.value)}><i className="fas fa-times"></i></span>
                </span>
            ))}
        </li>
    );

    const getSelectedFilters = () => {
        const filters = [
            { key: 'dateRange', label: 'Date Range', values: searchParams?.fromDate && searchParams?.toDate ? [searchParams?.fromDate + ' - ' + searchParams?.toDate] : [] },
            { key: 'project', label: 'Projects', values: searchParams?.project || [] },
            { key: 'channel', label: 'Channels', values: searchParams?.channel || [] },
            { key: 'priority', label: 'Priority', values: searchParams?.priority || [] },
            { key: 'status', label: 'Status', values: searchParams?.status || [] },
            { key: 'intxnCat', label: 'Interaction Category', values: searchParams?.intxnCat || [] },
            { key: 'intxnType', label: 'Interaction Type', values: searchParams?.intxnType || [] },
            { key: 'serviceCat', label: 'Service Category', values: searchParams?.serviceCat || [] },
            { key: 'serviceType', label: 'Service Type', values: searchParams?.serviceType || [] },
            { key: 'ageing', label: 'Ageing', values: searchParams?.ageing ? [searchParams?.ageing.label] : [] },
            { key: 'currentUser', label: 'Current User', values: searchParams?.currentUser ? [searchParams?.currentUser.label] : [] },
            { key: 'helpdeskType', label: 'Helpdesk Type', values: searchParams?.helpdeskType || [] },
            { key: 'severity', label: 'Severity', values: searchParams?.severity || [] },
        ];

        return (
            <>
                {filters.map(filter => (
                    filter.values.length > 0 && (
                        <FilterItem
                            key={filter.key}
                            label={filter.label}
                            values={filter.values}
                            clearFilter={(value) => clearFilter(filter.key, value)}
                        />
                    )
                ))}
            </>
        );
    };


    return (
        <div className="skle-swtab-sect mt-0 mb-0">
            <ul className="skel-top-inter mt-1 mb-0">
                {/* <div className="d-flex"> */}
                {getSelectedFilters()}
                {/* </div> */}
            </ul>
        </div>
    )

}

export default DashboardFilteredContent