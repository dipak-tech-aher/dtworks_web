import React from 'react';
import MailEditor from '../MailEditor';
import ChatDetailsTab from '../shared/ChatDetailsTab';
import ChatEditorSocial from '../ChatEditorSocial';

const HelpdeskInfoTab = (props) => {
    const { detailedViewItem } = props.data;
    const doSoftRefresh = props?.handlers?.doSoftRefresh

    return (
        <div className="full-width-bg mt-0">
            <section className="">
                {/* {console.log('detailedViewItem?.helpdeskSource?.code---------->', detailedViewItem?.helpdeskSource?.code)} */}
                <h5 id="list-item-1">Details</h5>

                {
                    detailedViewItem?.helpdeskSource?.code === 'LIVECHAT' ? (
                        <ChatDetailsTab
                            data={{
                                detailedViewItem: !!detailedViewItem?.chat?.length ? detailedViewItem?.chat[0] : detailedViewItem,
                                readOnly: true
                            }}
                        />
                    ) :
                        (detailedViewItem?.helpdeskSource?.code === 'WHATS-APP' || detailedViewItem?.helpdeskSource?.code === 'FACEBOOK') ? <ChatEditorSocial
                            data={{
                                isVerified: true,
                                detailedViewItem,
                                channelSource: detailedViewItem?.helpdeskSource?.code,
                                fbId: detailedViewItem?.phoneNo
                            }}
                            handlers={{
                                doSoftRefresh
                            }}
                        />
                            : (
                                <MailEditor
                                    data={{
                                        isDisabled: detailedViewItem?.status?.code !== 'HS_ESCALATED',
                                        isVerified: true,
                                        detailedViewItem,
                                    }}
                                    handlers={{
                                        doSoftRefresh: doSoftRefresh
                                    }}
                                />
                            )
                }
            </section>
        </div>
    )
}

export default HelpdeskInfoTab;