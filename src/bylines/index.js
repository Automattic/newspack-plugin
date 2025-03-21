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

/** Close icon copied from @wordpress/icons/src/library/close.js to be used as markup */
const close = `
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z" />
	</svg>
`;

/**
 * Parse byline meta to convert custom tags (<Author></Author> or [Author][/Author]) to token markup.
 *
 * @see    {@link https://github.com/Automattic/newspack-plugin/tree/trunk/includes/bylines#readme|Custom Bylines}
 * @param {string} metaByline Value of byline as stored in meta key.
 * @return {string}            Parsed byline looking up for <Author id=1></Author> tags and replacing them.
 */
const parseForEdit = ( metaByline ) => {
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

	return metaByline.replace(
		/\[Author id=(\d*)\](\D*)\[\/Author\]/g,
		tokenMarkup
	);
};

/**
 * Transform the bylineElement innerHTML into the format that we expect to save.
 *
 * @see   {@link https://github.com/Automattic/newspack-plugin/tree/trunk/includes/bylines#readme|Custom Bylines}
 * @param {Element} element Byline element reference.
 * @return {string}         Updated byline text, transformed into the save format.
 */
const transformByline = ( element ) => {
	const clonebylineElement = element.cloneNode( true );

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

const TokenInlineBlock = ( { token, onInsert } ) => {
	return (
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
	);
};

const Tokens = ( { tokens, tokensInUse, insertToken } ) => {
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

	/** Tokens with authors assigned to the post */
	const [ tokens, setTokens ] = useState( [] );

	/** Tokens that are in use by the custom byline */
	const [ tokensInUse, setTokensInUse ] = useState( [] );

	/** Reference to document to add event listners */
	const documentRef = useRef( document );
	const editableRef = useRef( null );

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

	const { getEditedPostAttribute } = useSelect( select =>
		select( 'core/editor' )
	);

	/** Fetch post author from core */
	const { postAuthor } = useSelect( select => {
		const { getUser } = select( coreStore );
		const _authorId = getEditedPostAttribute( 'author' );

		return {
			postAuthor: getUser( _authorId, BASE_QUERY ),
		};
	} );

	/** Toggle if custom byline is enabled */
	const [ isEnabled, setIsEnabled ] = useState(
		!! getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyActive ]
	);

	const byline = parseForEdit( getEditedPostAttribute( 'meta' )[ newspackBylines.metaKeyByline ] );

	/**
	 * Stores the byline as meta.
	 * @param {string} element The contenteditable element to read content from.
	 */
	const updateBylineMetaFromContentEditable = element => {
		editPost( {
			meta: {
				[ newspackBylines.metaKeyByline ]: transformByline( element ),
			},
		} );

		setTokensInUseFromContentEditable( element );
	};

	const setTokensInUseFromContentEditable = element => {
		const tokenElements = element.querySelectorAll(
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
		bylineElement.innerHTML += '&nbsp' + tokenElement + '&nbsp';

		// Update byline meta.
		updateBylineMetaFromContentEditable( bylineElement );
	};


	const { editPost } = useDispatch( 'core/editor' );

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
		documentRef.current.addEventListener( 'click', function ( { target } ) {
			// Check if clicked element is token remove button.
			if (
				target.classList.contains( 'token-inline-block__remove' )
			) {
				if (
					editableRef.current.querySelector( `span#token-${target.dataset.token}` )
				) {
					// Remove token element.
					editableRef.current.querySelector( `span#token-${target.dataset.token}` ).remove();
					setTokensInUseFromContentEditable( editableRef.current );
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
						<div
							className="newspack-byline-textarea"
							contentEditable="true"
							dangerouslySetInnerHTML={ { __html: parseForEdit( byline ) } }
							onInput={ ( { currentTarget } ) => updateBylineMetaFromContentEditable( currentTarget ) }
							ref={ editableRef }
						/>

						<Tokens
							tokens={ tokens }
							tokensInUse={ tokensInUse }
							insertToken={ insertToken }
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
