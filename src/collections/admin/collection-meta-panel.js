/**
 * Collection meta fields functionality.
 */

import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { TextControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';
import { domReady } from '../../utils';

import CollectionMetaUploadField from './collection-meta-upload-field';
import './collection-meta-panel.scss';

const VALIDATION_LOCK_KEY = 'collection-meta-validation';

/**
 * Check if a string is a valid URL.
 *
 * @param {string} value The URL to validate.
 * @return {boolean} Whether the URL is valid.
 */
const isValidUrl = value => {
	try {
		new URL( value );
		return true;
	} catch {
		return false;
	}
};

const CollectionMetaPanel = ( { postType, postMetaDefinitions } ) => {
	const [ fieldErrors, setFieldErrors ] = useState( {} );
	const { editPost, lockPostSaving, unlockPostSaving } = useDispatch( editorStore );

	// Get the current post type and meta data.
	const { currentPostType, meta = {} } = useSelect( select => {
		const editor = select( editorStore );
		return {
			currentPostType: editor.getCurrentPostType(),
			meta: editor.getEditedPostAttribute( 'meta' ) || {},
		};
	}, [] );

	// Update the meta data.
	const updateMeta = useCallback(
		( key, value ) => {
			editPost( { meta: { [ key ]: value } } );
		},
		[ editPost ]
	);

	// Remove an error for a specific field.
	const removeFieldError = useCallback( key => {
		setFieldErrors( prev => Object.fromEntries( Object.entries( prev ).filter( ( [ k ] ) => k !== key ) ) );
	}, [] );

	// Lock or unlock the post saving based on the field errors.
	useEffect( () => {
		const hasErrors = Object.keys( fieldErrors ).length > 0;
		if ( hasErrors ) {
			lockPostSaving( VALIDATION_LOCK_KEY );
		} else {
			unlockPostSaving( VALIDATION_LOCK_KEY );
		}
	}, [ fieldErrors, lockPostSaving, unlockPostSaving ] );

	// Handle the fields blur event.
	const handleMetaBlur = useCallback(
		( key, value, type ) => {
			if ( ! value ) {
				updateMeta( key, null );
				removeFieldError( key );
				return;
			}

			if ( type === 'url' ) {
				setFieldErrors( prev => {
					if ( ! value || isValidUrl( value ) ) {
						removeFieldError( key );
						return prev;
					}
					return {
						...prev,
						[ key ]: __( 'Please enter a valid URL.', 'newspack-plugin' ),
					};
				} );
			}
		},
		[ updateMeta, removeFieldError ]
	);

	return (
		// Only render the panel if the post type matches the current post type.
		postType === currentPostType && (
			<PluginDocumentSettingPanel
				name="newspack-collections-meta-panel"
				title={ __( 'Collection Details', 'newspack-plugin' ) }
				className="newspack-collections-meta-panel"
				icon="media-document"
			>
				<div className="collection-meta-fields">
					{ Object.entries( postMetaDefinitions ).map( ( [ name, def ] ) => {
						if ( name === 'file_attachment' ) {
							return (
								<CollectionMetaUploadField
									key={ def.key }
									metaKey={ def.key }
									label={ def.label }
									meta={ meta }
									updateMeta={ updateMeta }
									lockPostSaving={ lockPostSaving }
									unlockPostSaving={ unlockPostSaving }
								/>
							);
						}

						const hasError = !! fieldErrors[ def.key ];
						return (
							<TextControl
								key={ def.key }
								label={ def.label }
								help={ fieldErrors[ def.key ] || def.help }
								value={ meta[ def.key ] || '' }
								type={ def.type }
								onChange={ value => updateMeta( def.key, value ) }
								onBlur={ event => handleMetaBlur( def.key, event.target.value, def.type ) }
								className={ hasError ? 'meta-field-error' : '' }
							/>
						);
					} ) }
				</div>
			</PluginDocumentSettingPanel>
		)
	);
};

// Register the plugin if the collection meta definitions are available.
domReady( () => {
	const { collectionPostType } = window.newspackCollections || {};

	if ( collectionPostType?.postType && collectionPostType?.postMeta ) {
		registerPlugin( 'newspack-collection-meta-panel', {
			render: () => <CollectionMetaPanel postType={ collectionPostType.postType } postMetaDefinitions={ collectionPostType.postMeta } />,
			icon: 'media-document',
		} );
	}
} );
