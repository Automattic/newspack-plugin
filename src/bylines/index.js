/* globals newspackBylines */

/**
 * WordPress dependencies
 */
import { ToggleControl, TextareaControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
/**
 * External dependencies
 */
import { useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import './style.scss';

const BYLINE_ID = 'newspack-byline';

const BylinesSettingsPanel = () => {
	const { editPost } = useDispatch( 'core/editor' );
	const { getEditedPostAttribute } = useSelect( select => select( 'core/editor' ) );
	const [ byline, setByline ] = useState( getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyByline ] || '' );
	const [ isEnabled, setIsEnabled ] = useState( !! getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyActive ] );
	// Update byline text in editor.
	useEffect( () => {
		prependBylineToContent( isEnabled ? byline : '' );
	}, [ byline, isEnabled ] );
	// Enabled toggle handler.
	const handleEnableToggle = value => {
		editPost( { meta: { [ newspackBylines.metaKeyActive ]: value } } );
		setIsEnabled( value );
	}
	// Byline change handler.
	const handleBylineChange = value => {
		const tags = value.match( /\[[^\]]+\]/g );
		if (
			tags &&
			tags.some(
				tag =>
					! tag.startsWith( '[Author' ) &&
					! tag.startsWith( '[/Author' )
			)
		) {
			// eslint-disable-next-line no-alert
			alert(
				__( 'Only the [Author] tag is allowed.', 'newspack-plugin' )
			);
			return;
		}
		editPost( { meta: { [ newspackBylines.metaKeyByline ]: value } } );
		setByline( value );
	}
	const prependBylineToContent = text => {
		const contentEl = document.querySelector( '.wp-block-post-content' );
		if ( contentEl ) {
			let bylineEl = document.getElementById( BYLINE_ID );
			if ( ! bylineEl ) {
				bylineEl = document.createElement( 'div' );
				bylineEl.id = BYLINE_ID;
				contentEl.insertBefore( bylineEl, contentEl.firstChild );
			}
			// If there are author tags
			if ( /\[Author id=(\d+)\]/.test( text ) ) {
				text = text.replace(
					/\[Author id=(\d+)\]([^\[]+)\[\/Author\]/g,
					( match, authorId, authorName ) => {
						return `<a href="${ newspackBylines.siteUrl }/?author=${ authorId }">${ authorName }</a>`;
					}
				);
			}
			bylineEl.innerHTML = text;
		}
	};
	return (
		<PluginDocumentSettingPanel
			className="newspack-byline"
			name="Newspack Byline Settings Panel"
			title={ __( 'Newspack Custom Byline', 'newspack-plugin' ) }
		>
			<ToggleControl
				className="newspack-byline-toggle"
				checked={ isEnabled }
				label={ __( 'Enable custom byline', 'newspack-plugin' ) }
				onChange={ () => handleEnableToggle( ! isEnabled ) }
			/>
			{ isEnabled && (
				<TextareaControl
					className="newspack-byline-textarea"
					value={ byline }
					onChange={ value => handleBylineChange( value ) }
					placeholder={ __( 'Enter custom byline…', 'newspack-plugin' ) }
					rows="4"
				/>
			) }
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'newspack-bylines-sidebar', {
	render: BylinesSettingsPanel,
	icon: false,
} );
