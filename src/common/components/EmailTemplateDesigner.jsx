import React, { useEffect, useMemo, useState } from 'react';
import {
    Button,
    PageHeader,
    Space
} from "@arco-design/web-react";
import {
    EmailEditor,
    EmailEditorProvider,
    Stack,
} from 'easy-email-editor';
import 'easy-email-editor/lib/style.css';
import { AdvancedType, BasicType, BlockManager } from 'easy-email-core';
import { StandardLayout } from 'easy-email-extensions';

import 'easy-email-editor/lib/style.css';
import 'easy-email-extensions/lib/style.css';
import "@arco-themes/react-easy-email-theme/css/arco.css";
import { useWindowSize } from 'react-use'


const fontList = [
    'Arial',
    'Tahoma',
    'Verdana',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Lato',
    'Montserrat'
].map(item => ({ value: item, label: item }));

const categories = [
    {
        label: 'Content',
        active: true,
        blocks: [
            { type: AdvancedType.TEXT },
            { type: AdvancedType.IMAGE, payload: { attributes: { padding: '0px 0px 0px 0px' } } },
            { type: AdvancedType.BUTTON },
            { type: AdvancedType.SOCIAL },
            { type: AdvancedType.DIVIDER },
            { type: AdvancedType.SPACER },
            { type: AdvancedType.HERO },
            { type: AdvancedType.WRAPPER },
        ],
    },
    {
        label: 'Layout',
        active: true,
        displayType: 'column',
        blocks: [
            { title: '2 columns', payload: [['50%', '50%'], ['33%', '67%'], ['67%', '33%'], ['25%', '75%'], ['75%', '25%']] },
            { title: '3 columns', payload: [['33.33%', '33.33%', '33.33%'], ['25%', '25%', '50%'], ['50%', '25%', '25%']] },
            { title: '4 columns', payload: [[['25%', '25%', '25%', '25%']]] },
        ],
    },
];

const pageBlock = BlockManager.getBlockByType(BasicType.PAGE) || null;

export default function EmailTemplateDesigner({ onSubmit, mergeTags, editorHtml, editorJson }) {
    const [template, setTemplate] = useState(editorJson ?? pageBlock.create({}));
    const [tags, setTags] = useState();
    const { width } = useWindowSize();
    const smallScene = width < 1400;
    useEffect(() => {
        if(mergeTags && Object.keys(mergeTags).length > 0) {
            let tags={}
            for(const key in mergeTags) {
                const mergeTag = mergeTags[key].mergeTags;
                for(const tag of Object.keys(mergeTag)){                 
                    tags[tag]= tag
                }               
                // const formattedMergeTags = Object.values(mergeTag).map(({ name, value }) => ({ name, value }));        
            }
            setTags(tags)      
        }
 
        },[mergeTags])

    const initialValues = useMemo(() => {

        return {
            subject: 'Welcome to Easy-email',
            subTitle: 'Nice to meet you!',
            content: editorJson ?? pageBlock.create({}),
        };
    }, [editorJson]);

    if (!initialValues) return null;

// console.log('mergeTags ', tags)
    return (
        <div>
            <EmailEditorProvider
                dashed={false}
                data={initialValues}
                height={'calc(100vh - 85px)'}
                autoComplete
                mergeTags={tags}
                fontList={fontList}
                onSubmit={onSubmit}
            >
                {({ values }, { submit }) => {
                    return (
                        <>
                            <PageHeader
                                title='Edit'
                                extra={
                                    <Stack alignment="center">
                                        <Button type='primary' onClick={() => submit()}>
                                            Save
                                        </Button>
                                    </Stack>
                                }
                            />

                            <StandardLayout
                                compact={!smallScene}
                                categories={categories}
                                showSourceCode={true}
                            >
                                <EmailEditor />
                            </StandardLayout>
                        </>
                    );
                }}
            </EmailEditorProvider>
        </div>
    );
}
