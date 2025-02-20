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
import { Icon, plus } from '@wordpress/icons';

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
				className="components-form-token-field__token token-inline-block"
				id={ 'token-button-' + token.id }
			>
				<span className="components-form-token-field__token-text">
					{ token.name }
				</span>
				<Button
					className="components-form-token-field__insert-token is-small has-icon token-inline-block__insert"
					onClick={ () => {
						onInsert.call();
					} }
				>
					<Icon icon={ plus } />
				</Button>
			</span>
		</>
	);
};

const BylinesSettingsPanel = () => {
	/** Tokens with authors assigned to the post */
	const [ tokens, setTokens ] = useState( [] );

	/** Tokens that are in use by the custom byline */
	const tokensInUse = useRef( [] );

	/** Reference to document to add event listners */
	const documentRef = useRef( document );

	/** Force update, necessary to update component after DOM is manipulated directly */
	const [ , forceUpdate ] = useState( {} );

	/** Current post ID */
	const { postId } = useSelect(
		select => ( {
			postId: select( 'core/editor' ).getCurrentPostId(),
		} ),
		[]
	);

	/** close icon copied from @wordpress/icons/src/library/close.js to be used as markup */
	const close = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z" />
		</svg>
	`;

	/** coAuthors fetched from co-Authors Plus */
	const [ coAuthors, setCoAuthors ] = useState( [] );

	const noticesDispatch = useDispatch( 'core/notices' );

	const { editPost } = useDispatch( 'core/editor' );

	const { getEditedPostAttribute } = useSelect( select =>
		select( 'core/editor' )
	);

	/** The custom byline text/html */
	const byline =
		getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyByline ] || '';

	/** Toggle if custom byline is enabled */
	const [ isEnabled, setIsEnabled ] = useState(
		!! getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyActive ]
	);

	/**
	 * Transform coAuthors into an object expected to be used as tokens
	 * in the format of { id: int; name: string }.
	 *
	 * @param {Object} Authors Co-authors fetched from Co-Author Plus API.
	 * @return {Object}        Co-authors transformed into tokens object: { id: int; name: string }
	 */
	const transformAuthorsToTokens = Authors => {
		return Object.values( Authors ).map( value => {
			return { id: value.id, name: value.display_name };
		} );
	};

	/**
	 * Insert token into the custom byline contenteditable div.
	 *
	 * @param {Object} token Token prop.
	 */
	const insertToken = token => {
		const bylineElement = document.querySelector(
			'.newspack-byline-textarea'
		);

		// Compound new token element with token data.
		const tokenElement = `<span id="token-${ token.id }" class="components-form-token-field__token token-inline-block author-token" data-token="${ token.id }">
				<span class="components-form-token-field__token-text">
					${ token.name }
				</span>
				<button
					class="components-button components-form-token-field__remove-token token-inline-block__remove"
					type="button"
					data-token="${ token.id }"
				>
					${ close }
				</button>
			</span>`;

		// Assign new token to byline innerHTML (Adds a space to the end allowing insertion of content after token).
		bylineElement.innerHTML =
			bylineElement.innerHTML + ' ' + tokenElement + '&nbsp;';

		tokensInUse.current = [ ...tokensInUse.current, token.id ];

		// Update byline meta
		editPost( {
			meta: {
				[ newspackBylines.metaKeyByline ]: bylineElement.innerHTML,
			},
		} );

		// Force component update after DOM manipulated directly.
		forceUpdate( {} );
	};

	/**
	 * Add a Mutation Observer to byline element, so when a token is edited trough delete/backspace it
	 * gets removed as it was clicked.
	 *
	 * @param {Element} bylineElement
	 */
	const addMutationObserverToByline = bylineElement => {
		// Mutation observer config.
		const config = {
			childList: true,
			subtree: true,
			characterData: true,
			characterDataOldValue: true,
		};

		/**
		 * Mutation observer callback triggered when any change is made to the byline.
		 * @param {MutationObserver} mutationList
		 */
		const callback = mutationList => {
			// The mutation types we want to watch for changes.
			const mutationTypes = [ 'childList', 'subtree', 'characterData' ];

			for ( const mutation of mutationList ) {
				if ( mutationTypes.includes( mutation.type ) ) {
					let rootElement;
					let tokenID = '';

					if ( mutation.type === 'characterData' ) {
						rootElement = mutation.target.parentNode ?? null;
						tokenID = rootElement?.dataset?.token ?? '';
					} else {
						rootElement = mutation.target ?? null;
						tokenID = rootElement?.dataset?.token ?? '';
					}

					// Remove token element.
					if (
						rootElement &&
						rootElement?.matches?.( '.token-inline-block' )
					) {
						rootElement.remove();

						// Force component update after DOM manipulated directly.
						forceUpdate( {} );
					}

					// Update byline meta.
					editPost( {
						meta: {
							[ newspackBylines.metaKeyByline ]:
								bylineElement.innerHTML,
						},
					} );

					// Update tokensInUse.
					if ( tokenID ) {
						tokensInUse.current = tokensInUse.current.filter(
							token => token !== Number( tokenID )
						);
					}
				}
			}
		};

		const observer = new MutationObserver( callback );

		// Start observing the target node for configured mutations
		observer.observe( bylineElement, config );
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
	 * Add event listener for token removal on document, since the tokens are dynamically
	 * inserted into byline element.
	 */
	useEffect( () => {
		documentRef.current.addEventListener( 'click', function ( event ) {
			// Check if clicked element is token remove button.
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
					// Remove token element.
					bylineElement
						.querySelector(
							'span#token-' + event.target.dataset.token
						)
						.remove();

					// Update byline meta.
					editPost( {
						meta: {
							[ newspackBylines.metaKeyByline ]:
								bylineElement.innerHTML,
						},
					} );
				}

				// Update tokensInUse
				tokensInUse.current = tokensInUse.current.filter(
					token => token !== Number( event.target.dataset.token )
				);

				// Force component update after DOM manipulated directly.
				forceUpdate( {} );
			}
		} );

		return () => {};
	}, [] );

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
	 * Initialize on DOM ready
	 *
	 * Fill tokenInUse on DOM ready analyzing the byline element.
	 * Add Mutation Observer to byline element.
	 */
	useEffect( () => {
		function handleDomReady() {
			if (
				document.readyState === 'complete' &&
				document.querySelector( '.newspack-byline-textarea' )
			) {
				const bylineElement = document.querySelector(
					'.newspack-byline-textarea'
				);

				const tokenElements = bylineElement.querySelectorAll(
					'span button[data-token]'
				);

				// Fill tokensInUse
				tokenElements.forEach( tokenElement => {
					tokensInUse.current = [
						...tokensInUse.current,
						Number( tokenElement.dataset.token ),
					];
				} );

				// Add Mutation Observer
				addMutationObserverToByline( bylineElement );

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
