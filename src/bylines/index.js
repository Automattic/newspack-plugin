/* globals newspackBylines */

/**
 * WordPress dependencies
 */
import { Button, Modal, ToggleControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import apiFetch from '@wordpress/api-fetch';
import { Icon, plus } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

/**
 * External dependencies
 */
import { useEffect, useState, useRef } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';

const BASE_QUERY = {
	_fields: 'id,name',
	context: 'view', // Allows non-admins to perform requests.
};

const AUTHORS_QUERY = {
	who: 'authors',
	per_page: 100,
	...BASE_QUERY,
};

/** Close icon copied from @wordpress/icons/src/library/close.js to be used as markup */
const close = `
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z" />
	</svg>
`;

const CustomBylineModal = ( { children } ) => {
	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

	return (
		<>
			<Button variant="secondary" onClick={ openModal }>
				Set Custom Byline
			</Button>
			{ isOpen && (
				<Modal title="Set Custom Byline" onRequestClose={ closeModal }>
					{ children }
					<Button variant="secondary" onClick={ closeModal }>
						Close
					</Button>
				</Modal>
			) }
		</>
	);
};
const BylineTextarea = ( { byline, onRendered } ) => {
	const { getEditedPostAttribute } = useSelect( select =>
		select( 'core/editor' )
	);

	/** The custom byline stored as meta */
	const metaByline =
		getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyByline ] || '';

	/**
	 * Parse byline meta to convert custom tags (<Author></Author> or [Author][/Author]) to token markup.
	 *
	 * @see    {@link https://github.com/Automattic/newspack-plugin/tree/trunk/includes/bylines#readme|Custom Bylines}
	 * @return {string} Parsed byline looking up for <Author id=1></Author> tags and replacing them.
	 */
	const bylineParser = () => {
		const tokenMarkup = `<span id="token-$1" class="components-form-token-field__token token-inline-block author-token" data-token="$1">
			<span class="components-form-token-field__token-text">$2</span>
			<button
				class="components-button components-form-token-field__remove-token token-inline-block__remove"
				type="button"
				data-token="$1"
			>
				${ close }
			</button>
		</span>`;

		// For backwards compatibility, replace the '<Author>' tags, which were used before.
		metaByline.replace( /<Author id=(\d*)>(\D*)<\/Author>/g, tokenMarkup );

		return metaByline.replace(
			/\[Author id=(\d*)\](\D*)\[\/Author\]/g,
			tokenMarkup
		);
	};

	useEffect( () => {
		onRendered();
	}, [ onRendered ] );

	useEffect( () => {
		byline.current = bylineParser();
	}, [] );

	return (
		<div
			className="newspack-byline-textarea"
			contentEditable="true"
			dangerouslySetInnerHTML={ { __html: byline.current } }
		/>
	);
};

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

const Tokens = ( { tokens, tokensInUse, insertToken, onRendered } ) => {
	useEffect( () => {
		// Notify parent that this component has rendered.
		onRendered();
	}, [ onRendered ] );

	return (
		<div className="tokens">
			{ tokens.map(
				token =>
					! tokensInUse.includes( token.id ) && (
						<TokenInlineBlock
							key={ token.id }
							token={ token }
							onInsert={ () => insertToken( token ) }
						/>
					)
			) }
		</div>
	);
};

const BylinesSettingsPanel = () => {
	/** Set when child components DOM are ready */
	const [ isBylineReady, setIsBylineReady ] = useState( false );
	const [ isTokensdReady, setIsTokensReady ] = useState( false );

	/** Tokens with authors assigned to the post */
	const [ tokens, setTokens ] = useState( [] );

	/** Tokens that are in use by the custom byline */
	const [ tokensInUse, setTokensInUse ] = useState( [] );

	/** Reference to document to add event listners */
	const documentRef = useRef( document );

	/** Current post data */
	const { postId } = useSelect(
		select => ( {
			postId: select( 'core/editor' ).getCurrentPostId(),
		} ),
		[]
	);

	/** coAuthors fetched from co-Authors Plus */
	const [ coAuthors, setCoAuthors ] = useState( [] );

	const noticesDispatch = useDispatch( 'core/notices' );

	const { editPost } = useDispatch( 'core/editor' );

	const { getEditedPostAttribute } = useSelect( select =>
		select( 'core/editor' )
	);

	/** Fetch post author from core */
	const { postAuthor } = useSelect( select => {
		const { getUser, getUsers } = select( coreStore );
		const _authorId = getEditedPostAttribute( 'author' );
		const query = { ...AUTHORS_QUERY };

		return {
			authors: getUsers( query ),
			postAuthor: getUser( _authorId, BASE_QUERY ),
		};
	} );

	/** byline innerHTML content */
	const byline = useRef( '' );

	/** Toggle if custom byline is enabled */
	const [ isEnabled, setIsEnabled ] = useState(
		!! getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyActive ]
	);

	/**
	 * Stores the byline as meta.
	 * @param {string} meta Content of the byline contentEditable element to be stored.
	 */
	const updateBylineMeta = meta => {
		editPost( {
			meta: {
				[ newspackBylines.metaKeyByline ]: transformByline( meta ),
			},
		} );
	};

	/**
	 * Transform the bylineElement innerHTML into the format that we expect to save.
	 *
	 * @see   {@link https://github.com/Automattic/newspack-plugin/tree/trunk/includes/bylines#readme|Custom Bylines}
	 * @param {Element} bylineElement Byline element reference.
	 * @return {string}               The transformed bylineElement innerHTML into the expected format to save.
	 */
	const transformByline = bylineElement => {
		const clonebylineElement = bylineElement.cloneNode( true );

		const tokenElements =
			clonebylineElement.querySelectorAll( 'span[data-token]' );

		tokenElements.forEach( tokenElement => {
			const authorID = tokenElement.dataset.token;
			const authorNode = tokenElement.querySelector( 'span' );
			const authorName = authorNode ? authorNode.innerText.trim() : '';

			if ( authorID && authorName ) {
				tokenElement.replaceWith(
					document.createTextNode(
						`[Author id=${ authorID }]${ authorName }[/Author]`
					)
				);
			}
		} );

		return clonebylineElement.innerHTML;
	};

	/**
	 * Update tokenInUse looking up for tokens into the byline element content.
	 * @param {Element} bylineElement
	 */
	const queryTokensInUse = bylineElement => {
		const tokenElements = bylineElement.querySelectorAll(
			'span button[data-token]'
		);

		let tokensBeingUsed = [];

		// Fill tokensInUse.
		tokenElements.forEach( tokenElement => {
			tokensBeingUsed = [
				...tokensBeingUsed,
				Number( tokenElement.dataset.token ),
			];
		} );

		setTokensInUse( tokensBeingUsed );
	};

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
		bylineElement.innerHTML = bylineElement.innerHTML + ' ' + tokenElement;
		bylineElement.innerHTML += '&nbsp';

		// Update byline meta.
		updateBylineMeta( bylineElement );

		queryTokensInUse( bylineElement );
	};

	/**
	 * Mutation observer callback triggered when any change is made to the byline.
	 * @param {MutationObserver} mutationList
	 */
	const handleMutation = mutationList => {
		const bylineElement = document.querySelector(
			'.newspack-byline-textarea'
		);

		// The mutation types we want to watch for changes.
		const mutationTypes = [ 'childList', 'subtree', 'characterData' ];

		for ( const mutation of mutationList ) {
			if ( mutationTypes.includes( mutation.type ) ) {
				let rootElement;

				// If mutation.type is characterData, target the outer span element.
				// Otherwise, on childList and subtree, remove the target itself.
				if ( mutation.type === 'characterData' ) {
					rootElement = mutation.target.parentNode.parentNode ?? null;
				} else {
					rootElement = mutation.target ?? null;
				}

				// Remove token element.
				if (
					rootElement &&
					rootElement?.matches?.( '.token-inline-block' )
				) {
					rootElement.remove();
				}

				// Update byline meta.
				updateBylineMeta( bylineElement );

				queryTokensInUse( bylineElement );
			}
		}
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

		const observer = new MutationObserver( handleMutation );

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
					updateBylineMeta( bylineElement );

					queryTokensInUse( bylineElement );
				}
			}
		} );

		return () => {};
	}, [] );

	/**
	 * Set tokens when coAuthors change.
	 */
	useEffect( () => {
		if ( coAuthors ) {
			setTokens( coAuthors );
		}
	}, [ coAuthors ] );

	/**
	 * Fetch co-authors from Co-Authors Plus.
	 */
	useEffect( () => {
		if ( ! postId ) {
			return;
		}

		// If Co-Authors Plus is active, use their authors
		if ( newspackBylines.is_co_authors_plus_active ) {
			const controller = new AbortController();

			apiFetch( {
				path: `/coauthors/v1/coauthors?post_id=${ postId }`,
				signal: controller.signal,
			} )
				.then( transformAuthorsToTokens )
				.then( setCoAuthors )
				.catch( handleError );

			return () => {
				controller.abort();
			};
		}
	}, [ postId ] );

	/**
	 * Use core post author if Co-Authors Plus is not active
	 */
	useEffect( () => {
		// If Co-Author Plus is active, return
		if ( newspackBylines.is_co_authors_plus_active ) {
			return;
		}

		if ( postAuthor === undefined ) {
			return;
		}

		setCoAuthors( [ postAuthor ] );
	}, [ postAuthor ] );

	/**
	 * Initialize on DOM ready
	 *
	 * Fill tokenInUse analyzing the byline element, and
	 * add Mutation Observer to byline element after child element is ready.
	 */
	useEffect( () => {
		// Wait for child component that will be analyzed to be ready.
		if ( ! isTokensdReady || ! isBylineReady ) {
			return;
		}

		const bylineElement = document.querySelector(
			'.newspack-byline-textarea'
		);

		queryTokensInUse( bylineElement );

		// Add Mutation Observer.
		addMutationObserverToByline( bylineElement );
	}, [ isTokensdReady, isBylineReady ] );

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
					<CustomBylineModal>
						<BylineTextarea
							byline={ byline }
							onRendered={ () => setIsBylineReady( true ) }
						/>

						<Tokens
							tokens={ tokens }
							tokensInUse={ tokensInUse }
							insertToken={ insertToken }
							onRendered={ () => setIsTokensReady( true ) }
						/>
					</CustomBylineModal>
				</>
			) }
		</PluginDocumentSettingPanel>
	);
};

registerPlugin( 'newspack-bylines-sidebar', {
	render: BylinesSettingsPanel,
	icon: false,
} );
