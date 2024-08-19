const ChartSkeletionCard = ({ title, children, sizeCount = 2 }) => {
    return (
        <div class={`col-${12 / sizeCount} px-lg-1 mt-2`}>
            <div class="cmmn-skeleton mh-480">
                <div class="skel-dashboard-title-base">
                    <span class="skel-header-title">{title ?? ''}</span>
                </div>
                <hr class="cmmn-hline" />
                <div class="skel-graph-sect mt-0">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default ChartSkeletionCard