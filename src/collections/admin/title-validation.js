/**
 * Collection title validation functionality for Gutenberg editor.
 * Provides real-time feedback in the editor.
 */

import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';
import { registerPlugin } from '@wordpress/plugins';

const NOTICE_ID = 'newspack-title-validation';
const ERROR_MESSAGE = __(
	'This collection was not published because a collection with the same title already exists. Please choose a different title and try again.',
	'newspack-plugin'
);

/**
 * Validate title uniqueness via AJAX.
 */
const validateTitleAsync = async ( title, postId ) => {
	const { titleValidation } = window.newspackCollections || {};
	if ( ! titleValidation ) {
		return { exists: false };
	}

	const formData = new FormData();
	formData.append( 'action', 'newspack_validate_collection_title' );
	formData.append( 'title', title );
	formData.append( 'post_id', postId );
	formData.append( 'nonce', titleValidation.nonce );

	try {
		const response = await fetch( titleValidation.ajaxUrl, {
			method: 'POST',
			body: formData,
		} );
		const result = await response.json();
		return result.data || { exists: false };
	} catch {
		return { exists: false };
	}
};

/**
 * Title validation component.
 */
const TitleValidation = () => {
	const { postId, postType } = useSelect( select => {
		const editor = select( editorStore );
		return {
			postId: editor.getCurrentPostId(),
			postType: editor.getCurrentPostType(),
		};
	}, [] );

	const [ hasError, setHasError ] = useState( false );
	const { createNotice, removeNotice } = useDispatch( 'core/notices' );

	// Listen for save attempts and validate title
	useEffect( () => {
		// Only validate for collection post type
		if ( postType !== 'newspack_collection' ) {
			return;
		}

		const unsubscribe = wp.data.subscribe( () => {
			const editor = wp.data.select( 'core/editor' );
			const isSaving = editor.isSavingPost() || editor.isAutosavingPost() || editor.isPublishingPost();

			if ( isSaving ) {
				const currentTitle = editor.getEditedPostAttribute( 'title' );
				if ( currentTitle?.trim() ) {
					validateTitleAsync( currentTitle.trim(), postId ).then( ( { exists } ) => setHasError( exists ) );
				}
			}
		} );

		return unsubscribe;
	}, [ postId, postType ] );

	// Update notices based on error state
	useEffect( () => {
		// Only show notices for collection post type
		if ( postType !== 'newspack_collection' ) {
			return;
		}

		if ( hasError ) {
			createNotice( 'error', ERROR_MESSAGE, {
				id: NOTICE_ID,
				isDismissible: true,
			} );
		} else {
			removeNotice( NOTICE_ID );
		}
	}, [ hasError, createNotice, removeNotice, postType ] );

	return null;
};

registerPlugin( 'newspack-title-validation', {
	render: TitleValidation,
	icon: null,
} );
