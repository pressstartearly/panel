import React, { useEffect, useState } from 'react';
import Modal from '@/components/elements/Modal';
import { ServerContext } from '@/state/server';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { join } from 'path';
import { object, string } from 'yup';
import PostDownloadUrl from '@/api/server/files/postDownloadUrl';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import { FileObject } from '@/api/server/files/loadDirectory';
import useFlash from '@/plugins/useFlash';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { WithClassname } from '@/components/types';
import FlashMessageRender from '@/components/FlashMessageRender';

interface Values {
    url: string;
}

const schema = object().shape({
    url: string().required('A valid URL must be provided.'),
});

const generateDirectoryData = (name: string): FileObject => ({
    key: `dir_${name.split('/', 1)[0] ?? name}`,
    name: name.split('/').pop() ?? name,
    mode: '0644',
    size: 0,
    isFile: true,
    isSymlink: false,
    mimetype: '',
    createdAt: new Date(),
    modifiedAt: new Date(),
    isArchiveType: () => false,
    isEditable: () => false,
});

export default ({ className }: WithClassname) => {
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [ visible, setVisible ] = useState(false);

    const { mutate } = useFileManagerSwr();
    const directory = ServerContext.useStoreState(state => state.files.directory);

    useEffect(() => {
        if (!visible) return;

        return () => {
            clearFlashes('files:directory-modal');
        };
    }, [ visible ]);

    const submit = ({ url }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        PostDownloadUrl(uuid, directory, url)
            .then(() => mutate(data => [ ...data, generateDirectoryData(url) ], false))
            .then(() => setVisible(false))
            .catch(error => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ key: 'files:directory-modal', error });
            });
    };

    return (
        <>
            <Formik
                onSubmit={submit}
                validationSchema={schema}
                initialValues={{ url: '' }}
            >
                {({ resetForm, isSubmitting, values }) => (
                    <Modal
                        visible={visible}
                        dismissable={!isSubmitting}
                        showSpinnerOverlay={isSubmitting}
                        onDismissed={() => {
                            setVisible(false);
                            resetForm();
                        }}
                    >
                        <FlashMessageRender key={'files:directory-modal'}/>
                        <Form css={tw`m-0`}>
                            <Field
                                autoFocus
                                id={'url'}
                                name={'url'}
                                label={'URL'}
                            />
                            <p css={tw`text-xs mt-2 text-neutral-400 break-all`}>
                                <span css={tw`text-neutral-200`}>This file will be downloaded as</span>
                                &nbsp;/home/container/
                                <span css={tw`text-cyan-200`}>
                                    {join(directory, values.url.split('/').pop() ?? values.url).replace(/^(\.\.\/|\/)+/, '')}
                                </span>
                            </p>
                            <div css={tw`flex justify-end`}>
                                <Button css={tw`mt-8`}>
                                    Download from URL
                                </Button>
                            </div>
                        </Form>
                    </Modal>
                )}
            </Formik>
            <Button isSecondary onClick={() => setVisible(true)} className={className}>
                Download from URL
            </Button>
        </>
    );
};
