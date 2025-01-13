/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';
import { ToggleControl, TextareaControl } from '@wordpress/components';
/**
 * External dependencies
 */
import { useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import './style.scss';

// const ALLOWED_TAGS = [ 'Author' ];
const BYLINE_ID = 'newspack-byline';
const META_KEY_ACTIVE = '_newspack_byline_active';
const META_KEY_BYLINE = '_newspack_byline';


/**
 * Prepend byline to content in the Editor.
 *
 * @param {string} byline The byline
 */
const prependBylineToContent = byline => {
	const contentEl = document.querySelector( '.wp-block-post-content' );
	if ( contentEl && typeof byline === 'string' ) {
		let bylineEl = document.getElementById( BYLINE_ID );
		if ( ! bylineEl ) {
			bylineEl = document.createElement( 'div' );
			bylineEl.id = BYLINE_ID;
			contentEl.insertBefore( bylineEl, contentEl.firstChild );
		}
		bylineEl.innerHTML = byline;
	}
};

const BylinesSettingsPanel = () => {
	const { editPost } = useDispatch( 'core/editor' );
	const { getEditedPostAttribute } = useSelect( select => select( 'core/editor' ) );
	const [ isEnabled, setIsEnabled ] = useState( !! getEditedPostAttribute( 'meta' )[ META_KEY_ACTIVE ] );
	const [ byline, setByline ] = useState( getEditedPostAttribute( 'meta' )[ META_KEY_BYLINE ] || '' );

	useEffect( () => {
		prependBylineToContent( isEnabled ? byline : '' );
	}, [ byline, isEnabled ] );

	// Enabled toggle handler.
	const handleEnableToggle = value => {
		editPost( { meta: { [ META_KEY_ACTIVE ]: value } } );
		setIsEnabled( value );
	}
	// Byline change handler.
	const handleBylineChange = value => {
		editPost( { meta: { [ META_KEY_BYLINE ]: value } } );
		setByline( value );
	}
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

