import { __ } from '@wordpress/i18n';
import { MediaUpload } from '@wordpress/block-editor';
import { Button, Spinner, Notice, BaseControl, useBaseControlProps, ExternalLink, Dashicon } from '@wordpress/components';
import { useEffect, useCallback, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import PropTypes from 'prop-types';

export default function CollectionMetaUploadField( { metaKey, meta, updateMeta, lockPostSaving, unlockPostSaving, ...baseProps } ) {
	const { baseControlProps, controlProps } = useBaseControlProps( baseProps );
	const [ attachment, setAttachment ] = useState( null );
	const [ isUploading, setIsUploading ] = useState( false );
	const [ isInitialLoading, setIsInitialLoading ] = useState( true );
	const [ uploadError, setUploadError ] = useState( null );

	const handleFileRemoval = useCallback( () => {
		setAttachment( null );
		setUploadError( null );
		updateMeta( metaKey, null );
	}, [ updateMeta, metaKey, setUploadError ] );

	const handleMediaSelect = useCallback(
		media => {
			if ( media && media.mime === 'application/pdf' ) {
				setUploadError( null );
				if ( attachment && media.id === attachment.id ) {
					setIsUploading( false );
					return;
				}
				setIsUploading( true );
				setAttachment( media );
				updateMeta( metaKey, media.id );
				setIsUploading( false );
			} else {
				setUploadError( __( 'Please upload a PDF file.', 'newspack-plugin' ) );
				setIsUploading( false );
			}
		},
		[ attachment, metaKey, setIsUploading, setUploadError, updateMeta ]
	);

	useEffect( () => {
		if ( meta[ metaKey ] ) {
			setIsInitialLoading( true );
			lockPostSaving();
			apiFetch( {
				path: `/wp/v2/media/${ meta[ metaKey ] }`,
			} )
				.then( media => {
					setAttachment( media );
					setUploadError( null );
					unlockPostSaving();
				} )
				.catch( () => {
					setAttachment( null );
					setUploadError( __( 'Error loading file. Please try uploading again.', 'newspack-plugin' ) );
					updateMeta( metaKey, '' );
					unlockPostSaving();
				} )
				.finally( () => {
					setIsInitialLoading( false );
					setIsUploading( false );
				} );
		} else {
			setIsInitialLoading( false );
		}
	}, [ meta[ metaKey ], updateMeta, metaKey, lockPostSaving, unlockPostSaving ] );

	return (
		<BaseControl { ...baseControlProps } className={ `upload-controls ${ attachment ? 'has-uploaded-file' : '' }` }>
			{ uploadError && (
				<Notice status="error" isDismissible={ false } className="upload-error">
					{ uploadError }
				</Notice>
			) }
			{ ( isUploading || isInitialLoading ) && <Spinner /> }
			{ attachment && ! isInitialLoading && (
				<div className="uploaded-file">
					<Dashicon icon="pdf" />
					<ExternalLink href={ attachment.source_url } target="_blank">
						{ attachment.title?.rendered || attachment.source_url }
					</ExternalLink>
				</div>
			) }
			<div className="upload-actions">
				<MediaUpload
					onSelect={ handleMediaSelect }
					allowedTypes={ [ 'application/pdf' ] }
					value={ attachment ? attachment.id : null }
					render={ ( { open } ) => (
						<Button
							isSecondary
							onClick={ open }
							disabled={ isUploading || isInitialLoading }
							aria-label={ attachment ? __( 'Replace file', 'newspack-plugin' ) : __( 'Upload file', 'newspack-plugin' ) }
							{ ...controlProps }
						>
							{ attachment ? __( 'Replace file', 'newspack-plugin' ) : __( 'Upload file', 'newspack-plugin' ) }
						</Button>
					) }
				/>
				{ attachment && (
					<Button
						isDestructive
						isSecondary
						onClick={ handleFileRemoval }
						disabled={ isUploading || isInitialLoading }
						aria-label={ __( 'Remove file', 'newspack-plugin' ) }
					>
						{ __( 'Remove file', 'newspack-plugin' ) }
					</Button>
				) }
			</div>
		</BaseControl>
	);
}

CollectionMetaUploadField.propTypes = {
	metaKey: PropTypes.string.isRequired,
	meta: PropTypes.object.isRequired,
	updateMeta: PropTypes.func.isRequired,
	lockPostSaving: PropTypes.func.isRequired,
	unlockPostSaving: PropTypes.func.isRequired,
	label: PropTypes.string.isRequired,
};
