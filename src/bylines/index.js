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
import { useEffect, useState, useRef } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';

const TokenInlineBlock = ( { token, onInsert } ) => {
	return (
		<>
			<span
				className="token-inline-block"
				id={ 'token-button-' + token.id }
			>
				<Button
					className="token-inline-block__insert"
					isLink
					onClick={ () => {
						onInsert.call();
					} }
				>
					{ token.name }
				</Button>
			</span>
		</>
	);
};

const BylinesSettingsPanel = () => {
	const [ tokens, setTokens ] = useState( [] );

	const tokensInUse = useRef( [] );

	const [ , forceUpdate ] = useState( {} );

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

	const byline =
		getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyByline ] || '';

	const [ isEnabled, setIsEnabled ] = useState(
		!! getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyActive ]
	);

	/**
	 * Insert token into the custom byline contenteditable div.
	 *
	 * @param {Object} token Token prop.
	 */
	const insertToken = token => {
		const bylineElement = document.querySelector(
			'.newspack-byline-textarea'
		);

		const tokenElement = `
			<span id="token-${ token.id }" class="token-inline-block author author-token">
				${ token.name }
				<button
					class="components-button is-link token-inline-block__remove"
					type="button"
					data-token="${ token.id }"
				>
					x
				</button>
			</span>
		`;

		bylineElement.innerHTML = bylineElement.innerHTML + ' ' + tokenElement;

		tokensInUse.current = [ ...tokensInUse.current, token.id ];

		editPost( {
			meta: {
				[ newspackBylines.metaKeyByline ]: bylineElement.innerHTML,
			},
		} );

		// Force component update after DOM manipulated directly.
		forceUpdate( {} );
	};

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
	 *
	 * @param {boolean} value Boolean, true if custom byline is enabled, false if not.
	 */
	const handleEnableToggle = value => {
		editPost( { meta: { [ newspackBylines.metaKeyActive ]: value } } );
		setIsEnabled( value );
	};

	/**
	 * Add event listener for token removal.
	 */
	useEffect( () => {
		document.body.addEventListener( 'click', function ( event ) {
			if (
				event.target.classList.contains( 'token-inline-block__remove' )
			) {
				const bylineElement = document.querySelector(
					'.newspack-byline-textarea'
				);

				if (
					bylineElement.querySelector(
						'span#token-' + event.target.dataset.token
					)
				) {
					bylineElement
						.querySelector(
							'span#token-' + event.target.dataset.token
						)
						.remove();

					editPost( {
						meta: {
							[ newspackBylines.metaKeyByline ]:
								bylineElement.innerHTML,
						},
					} );
				}

				tokensInUse.current = tokensInUse.current.filter(
					token => token !== Number( event.target.dataset.token )
				);

				// Force component update after DOM manipulated directly.
				forceUpdate( {} );
			}
		} );
	}, [] );

	/**
	 * Set tokens when coAuthors change.
	 */
	useEffect( () => {
		if ( coAuthors ) {
			setTokens( transformAuthorsToTokens( coAuthors ) );
		}
	}, [ coAuthors ] );

	useEffect( () => {
		tokensInUse.current =
			getEditedPostAttribute( 'meta' )[
				newspackBylines.metaKeyTokensInUse
			] || [];
	}, [] );

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
	 * Fill tokenInUse on DOM ready analyzing the .newspack-byline-textarea.
	 */
	useEffect( () => {
		function handleDomReady() {
			if ( document.readyState === 'complete' ) {
				const bylineElement = document.querySelector(
					'.newspack-byline-textarea'
				);

				const tokenElements = bylineElement.querySelectorAll(
					'span button[data-token]'
				);

				tokenElements.forEach( tokenElement => {
					tokensInUse.current = [
						...tokensInUse.current,
						Number( tokenElement.dataset.token ),
					];
				} );

				// Remove the listener to prevent it from firing again
				document.removeEventListener(
					'readystatechange',
					handleDomReady
				);
			}
		}

		// Check immediately in case the DOM is already ready
		handleDomReady();

		// Add a listener for future state changes
		document.addEventListener( 'readystatechange', handleDomReady );

		return () => {
			// Clean up the event listener on unmount
			document.removeEventListener( 'readystatechange', handleDomReady );
		};
	}, [] );

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
						dangerouslySetInnerHTML={ { __html: byline } }
					/>

					<div className="tokens">
						{ tokens.map(
							token =>
								! tokensInUse.current.includes( token.id ) && (
									<TokenInlineBlock
										key={ token.id }
										token={ token }
										onInsert={ () => insertToken( token ) }
									/>
								)
						) }
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
