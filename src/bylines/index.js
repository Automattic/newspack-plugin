/* globals newspackBylines */

/**
 * WordPress dependencies
 */
import { Button, ToggleControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';

const BYLINE_ID = 'newspack-byline';

const TokenInlineBlock = ( { token, onRemove, onInsert } ) => {
	const [ isTokenUsed, setIsTokenUsed ] = useState( [] );

	useEffect( () => {
		const bylineElement = document.querySelector(
			'.newspack-byline-textarea'
		);

		const found =
			bylineElement !== null
				? !! bylineElement.querySelector( 'span#token-' + token.id )
				: false;

		setIsTokenUsed( found );
	}, [ isTokenUsed ] );

	return (
		! isTokenUsed && (
			<span className="token-inline-block" id={ 'token-' + token.id }>
				<Button
					className="token-inline-block__insert"
					isLink
					onClick={ () => {
						onInsert.call();
						setIsTokenUsed( true );
					} }
				>
					{ token.name }
				</Button>
				<Button
					className="token-inline-block__remove"
					isLink
					onClick={ () => {
						onRemove.call();
						setIsTokenUsed( false );
					} }
				>
					x
				</Button>
			</span>
		)
	);
};

const BylinesSettingsPanel = () => {
	const [ tokens, setTokens ] = useState( [] );

	const { postId } = useSelect(
		select => ( {
			postId: select( 'core/editor' ).getCurrentPostId(),
		} ),
		[]
	);

	const transformAuthorsToTokens = coAuthors => {
		return Object.values( coAuthors ).map( value => {
			return { id: value.id, name: value.display_name };
		} );
	};

	const [ coAuthors, setCoAuthors ] = useState( [] );

	const noticesDispatch = useDispatch( 'core/notices' );

	const { editPost } = useDispatch( 'core/editor' );

	const { getEditedPostAttribute } = useSelect( select =>
		select( 'core/editor' )
	);

	const [ byline, setByline ] = useState(
		getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyByline ] || ''
	);

	const [ isEnabled, setIsEnabled ] = useState(
		!! getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyActive ]
	);

	const insertToken = token => {
		setByline(
			<>
				{ byline }{ ' ' }
				<span
					id={ 'token-' + token.id }
					className="author author-token"
				>
					{ token.name }
				</span>
			</>
		);
	};

	/**
	 * Set tokens when coAuthors change.
	 */
	useEffect( () => {
		if ( coAuthors ) {
			setTokens( transformAuthorsToTokens( coAuthors ) );
		}
	}, [ coAuthors ] );

	/**
	 * Fetch co-authors from Co-Authors Plus.
	 */
	useEffect( () => {
		if ( ! postId ) {
			return;
		}

		const controller = new AbortController();

		apiFetch( {
			path: `/coauthors/v1/coauthors?post_id=${ postId }`,
			signal: controller.signal,
		} )
			.then( setCoAuthors )
			.catch( handleError );

		return () => {
			controller.abort();
		};
	}, [ postId ] );

	/**
	 * Update byline text in editor.
	 */
	useEffect( () => {
		prependBylineToContent( isEnabled ? byline : '' );
	}, [ byline, isEnabled ] );

	/**
	 * Handle Error
	 *
	 * @param {Error} error
	 */
	function handleError( error ) {
		if ( 'AbortError' === error.name ) {
			return;
		}
		noticesDispatch.createErrorNotice( error.message, {
			isDismissible: true,
		} );
	}

	/**
	 * Enabled toggle handler.
	 */
	const handleEnableToggle = value => {
		editPost( { meta: { [ newspackBylines.metaKeyActive ]: value } } );
		setIsEnabled( value );
	};

	/**
	 * Prepend Byline to the content
	 */
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
			if ( /<Author id=(\d+)>/.test( text ) ) {
				text = text.replace(
					/<Author id=(\d+)>([^<]+)<\/Author>/g,
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
				<>
					<div
						className="newspack-byline-textarea"
						contentEditable="true"
					>
						{ byline }
					</div>

					<div className="tokens">
						{ tokens.map( token => (
							<TokenInlineBlock
								key={ token.id }
								token={ token }
								onRemove={ () => {} }
								onInsert={ () => insertToken( token ) }
							/>
						) ) }
					</div>
				</>
			) }
		</PluginDocumentSettingPanel>
	);
};

registerPlugin( 'newspack-bylines-sidebar', {
	render: BylinesSettingsPanel,
	icon: false,
} );
