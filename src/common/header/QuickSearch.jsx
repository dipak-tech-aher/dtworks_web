import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import Card from 'react-bootstrap/Card';
import { AppContext } from '../../AppContext';
import '../../assets/css/AutoExpandingTextbox.css';
import { useHistory }from '../../common/util/history';
import { get } from '../../common/util/restUtil';

const QuickSearch = (props) => {
    const history = useHistory()
    const { appsConfig } = props
    const { auth } = useContext(AppContext)
    const [showSearchCat, setShowSearchCat] = useState(false)
    const [searching, setSearching] = useState(false)
    const [categories, setCategories] = useState([])
    const [searchResults, setSearchResults] = useState([])
    const [searchError, setSearchError] = useState('No results found');
    const [selectedCategory, setSelectedCategory] = useState()
    const [customerQuickSearchInput, setCustomerQuickSearchInput] = useState("");
    useEffect(() => {
        let tempCategories = [];
        auth?.permissions?.forEach(x => {
            x?.moduleScreenMap?.forEach(y => {
                if (y?.accessType === 'allow' && y?.props?.globalSearch) {
                    tempCategories.push(y?.props?.globalSearch)
                }
            })
        })
        setCategories([...tempCategories]);
        setSelectedCategory(tempCategories?.[0]?.flag);
    }, [auth])

    useEffect(() => {
        setSearching(true);
        setSearchResults([]);
        const delayDebounceFn = setTimeout(() => {
            if (customerQuickSearchInput && customerQuickSearchInput !== "") {
                if (customerQuickSearchInput.length >= 3 && customerQuickSearchInput.length <=50 ) {
                    const categoryDetail = categories.find(x => x.flag === selectedCategory);
                    if (categoryDetail) {
                        get(`${categoryDetail.endpoint}/search?q=${customerQuickSearchInput.trim()}&flag=${JSON.stringify(categoryDetail?.thirdPartyCall)}`).then((resp) => {
                            if (resp.status === 200) {
                                if (resp?.data?.length > 0) {
                                    setSearchResults([
                                        ...resp.data
                                    ])
                                }
                                else {
                                    setSearchError("No matching record found");
                                }
                            } else {
                                setSearchResults([]);
                                setSearchError("No results found");
                            }
                        }).catch(error => {
                            console.log(error)
                            setSearchResults([]);
                            setSearchError("No results found");
                        }).finally(() => setSearching(false));
                    } else {
                        setSearchResults([]);
                        setSearchError("Please select a category");
                        setSearching(false);
                    }
                } else {
                    setSearchResults([]);
                    setSearchError("Please enter minimum 3 to 50 characters");
                    setSearching(false);
                }
            } else {
                setSearchResults([]);
                setSearchError("No results found");
                setSearching(false);
            }
        }, 2000)

        return () => clearTimeout(delayDebounceFn)

    }, [customerQuickSearchInput, categories, selectedCategory])

    const handleCustomerQuickSearch = (e) => e.preventDefault();

    const redirectToRespectivePages = (category, response) => {
        const categoryDetail = categories.find(x => x?.flag === category);
        if ((categoryDetail?.module?.toLowerCase() === 'mission' || categoryDetail?.module?.toLowerCase() === 'stakeholder' || categoryDetail?.module?.toLowerCase() === 'task')) {
            const data = {
                ...response,
                sourceName: categoryDetail?.flag
            }
            setShowSearchCat(false);
            setCustomerQuickSearchInput('')
            history(`/${categoryDetail.redirectUrl}${response?.missionUuid ?? response?.leadUuid ?? response?.taskUuid}`, { state: {data} })
        } else {
            const data = {
                ...response,
                sourceName: 'customer360'
            }
            if (response?.customerUuid) {
                localStorage.setItem("customerUuid", response.customerUuid);
                localStorage.setItem("customerIds", response.customerId)
            } else if (response?.profileUuid) {
                localStorage.setItem("profileUuid", response.profileUuid)
                localStorage.setItem("profileIds", response.profileId)
                localStorage.setItem("profileNo", response.profileNo)
            }
            setShowSearchCat(false);
            setCustomerQuickSearchInput('')
            history(`/${categoryDetail.redirectUrl}`, { state: {data} })
        }
    }

    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target) && event.target.id !== 'search-input-box') {
                setShowSearchCat(false);
                setCustomerQuickSearchInput("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const categoryClicked = (e) => {
        if (e.target.id !== "") {
            setSearchResults([]);
            setSelectedCategory(e.target.id);
            setTimeout(() => {
                setCustomerQuickSearchInput(document.getElementById('search-input-box').value);
            }, 100);
        }
    }

    const inputRef = useRef(null);

    return (
        <React.Fragment>
            {categories?.length ? <div className="search-box2">
                <div className="box-srh">
                    <form onSubmit={handleCustomerQuickSearch} autoComplete="off">
                        <input type="text"
                            id='search-input-box'
                            ref={inputRef}
                            className={`expandable-input`}
                            value={customerQuickSearchInput}
                            onClick={(e) => {
                                setShowSearchCat(true)
                            }}
                            onChange={(e) => {
                                setCustomerQuickSearchInput(e.target.value)
                            }}
                            placeholder="Search..."
                            maxLength={50}
                        />
                    </form>
                    <i className="fas fa-search" onClick={handleCustomerQuickSearch}></i>
                </div>

                <div ref={wrapperRef} className={`skel-fulldetail-sr-view ${showSearchCat ? '' : 'display-none'}`} >
                    <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                        {searchResults.length > 0 ? (
                            searchResults.map((searchResult, index) => (
                                <Card bsPrefix='card border-primary search-list' key={index+searchResult} border="primary" onClick={() => redirectToRespectivePages(selectedCategory, searchResult)} style={{ marginBottom: '10px', cursor: 'pointer' }}>
                                    <Card.Body>
                                        <Card.Text>
                                            {(selectedCategory === "Customer") ? (
                                                <React.Fragment>
                                                    <strong>ID:</strong> {searchResult?.customerNo}&nbsp;<br />
                                                    <strong>Name:</strong> {searchResult?.firstName} {searchResult?.lastName ? searchResult?.lastName : ''}&nbsp;
                                                    <strong>Status:</strong> {searchResult?.statusDesc?.description}
                                                </React.Fragment>
                                            ) : (selectedCategory === "Interaction") ? (
                                                <React.Fragment>
                                                    <strong>ID:</strong> {searchResult?.intxnNo}&nbsp;<br />
                                                    <strong>{appsConfig?.clientFacingName?.customer ?? "Customer"} Name:</strong> {searchResult?.customerDetails?.firstName} {searchResult?.customerDetails?.lastName ? searchResult?.customerDetails?.lastName : ''}&nbsp;
                                                </React.Fragment>
                                            ) : (selectedCategory === "Helpdesk") ? (
                                                <React.Fragment>
                                                    <strong>ID:</strong> {searchResult?.helpdeskNo}&nbsp;<br />
                                                    <strong>{appsConfig?.clientFacingName?.customer ?? "Customer"} Name:</strong> {searchResult?.userName}&nbsp;
                                                </React.Fragment>
                                            ) : (selectedCategory === "Order") ? (
                                                <React.Fragment>
                                                    <strong>ID:</strong> {searchResult?.orderNo}&nbsp;<br />
                                                    <strong>{appsConfig?.clientFacingName?.customer ?? "Customer"} Name:</strong> {searchResult?.customerDetails?.firstName} {searchResult?.customerDetails?.lastName ? searchResult?.customerDetails?.lastName : ''}&nbsp;
                                                </React.Fragment>
                                            )
                                            : (selectedCategory === "Profile") ? (
                                                <React.Fragment>
                                                    <strong>ID:</strong> {searchResult?.profileNo}&nbsp;<br />
                                                    <strong>Profile Name:</strong> {searchResult?.firstName} {searchResult?.lastName ? searchResult?.lastName : ''}&nbsp;
                                                </React.Fragment>
                                            )
                                            : (selectedCategory === "Mission") ? (
                                                <React.Fragment>

                                                    <strong>Mission Name:</strong> {searchResult?.missionName ?? ''}&nbsp;<br />
                                                    <strong>Mission Category:</strong> {searchResult?.missionCategoryDesc?.description}&nbsp;<br />
                                                    <strong>Mission Type:</strong> {searchResult?.missionTypeDesc?.description}&nbsp;
                                                </React.Fragment>
                                            )
                                            : (selectedCategory === "Stakeholder") ? (
                                                <React.Fragment>
                                                    <strong>Stakeholder Name:</strong> {searchResult?.leadName ?? ''}&nbsp;<br />
                                                    <strong>Stakeholder Category:</strong> {searchResult?.leadCatDesc?.description}&nbsp;<br />
                                                    <strong>Stakeholder Type:</strong> {searchResult?.leadTypeDesc?.description}&nbsp;<br />
                                                </React.Fragment>
                                            )
                                            : (selectedCategory === "Task") ? (
                                                <React.Fragment>
                                                    <strong>Task Name:</strong> {searchResult?.taskName ?? ''}&nbsp;<br />
                                                    <strong>Task Status:</strong> {searchResult?.statusDesc?.description ?? ''}&nbsp;
                                                </React.Fragment>
                                            )
                                            : (selectedCategory === "Subscription") ? (
                                                <React.Fragment>
                                                    <strong>ID:</strong> {searchResult?.serviceNo}&nbsp;<br />
                                                    <strong>Subscription Name:</strong> {searchResult?.serviceName}

                                                </React.Fragment>
                                            ) : null}
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            ))) : (
                            <ul className='skel-sr-result-data' style={{ pointerEvents: 'none' }}>
                                <li className='text-center'>
                                    {searching ? (
                                        <div className="spinner-box">
                                            <div className="three-quarter-spinner"></div>
                                        </div>
                                    ) : (searchError)}
                                </li>
                            </ul>
                        )}
                    </div>
                    <ul className='skel-fixed-sr-result' onClick={categoryClicked}>
                        {categories?.map((category, i) => (
                            <li key={i+category.flag} id={category.flag} className={`${selectedCategory === category.flag ? "b-shadow" : ""}`}>{category.flag}</li>
                        ))}
                    </ul>
                </div>
            </div> : null}
        </React.Fragment>
    )
}

export default QuickSearch;