const GridCard = ({ items = [] }) => {

    const getValue = (key) => {
        const data = items?.find(item => item.oName === key)
        return data?.oValue ?? 0
    }

    return (
        <div class="col-md-11 mx-auto">
            <div class="row mt-0 border-bottom">
                <div class="col px-2 py-2 border-right mb-3">
                    <h3 class="text-left m-0 font-weight-bold">{getValue('Survey Sent')}</h3>
                    <p class="color-light">Surveys sent</p>
                </div>
                <div class="col px-2 py-2 border-right mb-3">
                    <h3 class="text-left m-0 font-weight-bold">{getValue('Survey Opened')}</h3>
                    <p class="color-light">Surveys opened</p>
                </div>
                <div class="col px-2 py-2 mb-3">
                    <h3 class="text-left m-0 font-weight-bold">{getValue('Responses Received')}</h3>
                    <p class="color-light">Response received</p>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col px-2 border-right py-4">
                    <h3 class="text-left m-0 font-weight-bold">{getValue('Responses Rate')}% <span class="font-14 font-weight-normal color-light">Responses Rate</span></h3>
                </div>
                <div class="col px-2 py-4">
                    <h3 class="text-left m-0 font-weight-bold">{getValue('Completion Rate')}% <span class="font-14 font-weight-normal color-light">Completion Rate</span></h3>
                </div>
            </div>
        </div>
    )
}

export default GridCard