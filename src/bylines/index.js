/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
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
const META_KEY_ACTIVE = '_newspack_byline_active';
const META_KEY_BYLINE = '_newspack_byline';

const BylinesSettingsPanel = () => {
	const { editPost } = useDispatch( 'core/editor' );
	const { getEditedPostAttribute } = useSelect( select => select( 'core/editor' ) );
	const [ authors, setAuthors ] = useState( [] );
	const [ byline, setByline ] = useState( getEditedPostAttribute( 'meta' )[ META_KEY_BYLINE ] || '' );
	const [ isEnabled, setIsEnabled ] = useState( !! getEditedPostAttribute( 'meta' )[ META_KEY_ACTIVE ] );
	const [ isFetching, setIsFetching ] = useState( true );
	// Update byline text in editor.
	useEffect( () => {
		prependBylineToContent( isEnabled ? byline : '' );
	}, [ authors, byline, isEnabled ] );
	// Fetch authors.
	useEffect( () => {
		setIsFetching( true );
		apiFetch( { path: '/wp/v2/users' } )
			.then( data => {
				setAuthors( data );
				setIsFetching( false );
			} );
	}, [] );
	// Enabled toggle handler.
	const handleEnableToggle = value => {
		editPost( { meta: { [ META_KEY_ACTIVE ]: value } } );
		setIsEnabled( value );
	}
	// Byline change handler.
	const handleBylineChange = value => {
		const tags = value.match( /<[^>]+>/g );
		if ( tags && tags.some( tag => ! tag.startsWith( '<Author' ) && ! tag.startsWith( '</Author' ) ) ) {
			alert( __( 'Only the <Author> tag is allowed.', 'newspack-plugin' ) ); // eslint-disable-line no-alert
			return;
		}
		editPost( { meta: { [ META_KEY_BYLINE ]: value } } );
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
			if ( isFetching ) {
				bylineEl.innerHTML = __( 'Loading…', 'newspack-plugin' );
				return;
			}
			// If there are author tags
			if ( /<Author id=(\d+)>/.test( text ) ) {
				text = text.replace( /<Author id=(\d+)>([^<]+)<\/Author>/g, ( match, authorId, authorName ) => {
					const authorData = authors.find( a => a.id === parseInt( authorId ) );
					return authorData ? `<a href="/author/${ authorData.name }">${ authorName }</a>` : authorName;
				} );
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
