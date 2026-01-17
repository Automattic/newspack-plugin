/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Hook to get custom byline data.
 *
 * @param {number} postId Post ID.
 * @return {Object} Custom byline data.
 */
function useCustomByline( postId ) {
	const { bylineActive, bylineContent } = useSelect(
		select => {
			const { getEditedEntityRecord } = select( coreStore );
			const postRecord = getEditedEntityRecord( 'postType', 'post', postId );
			return {
				bylineActive: postRecord?.meta?._newspack_byline_active || false,
				bylineContent: postRecord?.meta?._newspack_byline || '',
			};
		},
		[ postId ]
	);

	return { bylineActive, bylineContent };
}

/**
 * CoAuthors Plus store name.
 */
const CAP_STORE = 'cap/authors';

/**
 * Hook to get CoAuthors Plus authors from the CAP store.
 * CoAuthors Plus uses its own data store for managing authors in the editor.
 * Note: CAP's store doesn't use standard WP data resolution, so we check
 * for authors directly rather than using hasFinishedResolution.
 *
 * @param {number} postId Post ID to get authors for.
 * @return {Object} Authors array and availability state.
 */
function useCoAuthors( postId ) {
	const { authors, isCapAvailable } = useSelect(
		select => {
			// Check if CoAuthors Plus store is available.
			const capStore = select( CAP_STORE );
			if ( ! capStore || typeof capStore.getAuthors !== 'function' ) {
				return { authors: [], isCapAvailable: false };
			}

			// Get authors from the CAP store for the specific post.
			// The postId is required to get the correct authors for the current post.
			const capAuthors = postId ? capStore.getAuthors( postId ) : [];

			if ( ! capAuthors || capAuthors.length === 0 ) {
				return { authors: [], isCapAvailable: true };
			}

			// Map CAP author objects to our expected format.
			// CAP stores: { id, label, display, value, userType }
			const mappedAuthors = capAuthors.map( author => ( {
				id: author.id,
				display_name: author.display || author.value || author.label,
				user_nicename: author.value,
			} ) );

			return { authors: mappedAuthors, isCapAvailable: true };
		},
		[ postId ]
	);

	return { authors, isCapAvailable };
}

/**
 * Hook to get default WordPress author.
 *
 * @param {number} postId   Post ID.
 * @param {string} postType Post type.
 * @return {Object} Author details and loading state.
 */
function useDefaultAuthor( postId, postType ) {
	const { authorDetails, isLoading } = useSelect(
		select => {
			const { getEditedEntityRecord, getUser, hasFinishedResolution } = select( coreStore );
			const authorId = getEditedEntityRecord( 'postType', postType, postId )?.author;

			if ( ! authorId ) {
				return { authorDetails: null, isLoading: false };
			}

			const user = getUser( authorId );
			const hasResolved = hasFinishedResolution( 'getUser', [ authorId ] );

			return {
				authorDetails: user,
				isLoading: ! hasResolved,
			};
		},
		[ postType, postId ]
	);

	return { authorDetails, isLoading };
}

/**
 * Decode HTML entities in a string.
 *
 * @param {string} text Text with HTML entities.
 * @return {string} Decoded text.
 */
function decodeHtmlEntities( text ) {
	const textarea = document.createElement( 'textarea' );
	textarea.innerHTML = text;
	return textarea.value;
}

/**
 * Parse byline shortcodes to extract display names and render as React elements.
 *
 * @param {string} bylineContent Raw byline content with shortcodes.
 * @return {Array} Array of React elements for display.
 */
function parseBylineForDisplay( bylineContent ) {
	const elements = [];
	let lastIndex = 0;
	const regex = /\[Author id=(\d+)\](.*?)\[\/Author\]/g;
	let match;

	while ( ( match = regex.exec( bylineContent ) ) !== null ) {
		// Add text before the match.
		if ( match.index > lastIndex ) {
			const textBefore = bylineContent.slice( lastIndex, match.index );
			elements.push( decodeHtmlEntities( textBefore ) );
		}

		// Add author link.
		const authorId = match[ 1 ];
		const authorName = match[ 2 ];
		elements.push(
			<a key={ `author-${ authorId }-${ match.index }` } href="#author-link" onClick={ e => e.preventDefault() } className="url fn n">
				{ decodeHtmlEntities( authorName ) }
			</a>
		);

		lastIndex = match.index + match[ 0 ].length;
	}

	// Add remaining text after last match.
	if ( lastIndex < bylineContent.length ) {
		const textAfter = bylineContent.slice( lastIndex );
		elements.push( decodeHtmlEntities( textAfter ) );
	}

	return elements;
}

/**
 * Format authors list for display using Intl.ListFormat.
 *
 * Uses the browser's Intl.ListFormat API for localized list formatting,
 * which is the JS equivalent of WordPress's wp_sprintf_l().
 *
 * @param {Array}   authors       Array of author objects.
 * @param {boolean} linkToArchive Whether to show as links.
 * @return {Array} Array of React elements.
 */
function formatAuthorsList( authors, linkToArchive ) {
	if ( ! authors || authors.length === 0 ) {
		return [];
	}

	// For a single author, return directly without list formatting.
	if ( authors.length === 1 ) {
		const author = authors[ 0 ];
		const name = author.display_name || author.name;
		return [
			<span key={ `author-wrapper-${ author.id || 0 }` } className="author vcard">
				{ linkToArchive ? (
					<a href="#author-link" onClick={ e => e.preventDefault() } className="url fn n">
						{ name }
					</a>
				) : (
					<span className="fn n">{ name }</span>
				) }
			</span>,
		];
	}

	// Use Intl.ListFormat for localized list formatting (JS equivalent of wp_sprintf_l).
	// Get the current locale from WordPress or fall back to browser locale.
	const locale = document.documentElement.lang || navigator.language || 'en';
	const listFormatter = new Intl.ListFormat( locale, { style: 'long', type: 'conjunction' } );

	// Create placeholder strings to get the formatted parts.
	const placeholders = authors.map( ( _, i ) => `__AUTHOR_${ i }__` );
	const formattedParts = listFormatter.formatToParts( placeholders );

	// Build React elements from the formatted parts.
	return formattedParts.map( ( part, partIndex ) => {
		if ( part.type === 'literal' ) {
			return part.value;
		}
		// Extract author index from placeholder.
		const authorIndex = parseInt( part.value.replace( '__AUTHOR_', '' ).replace( '__', '' ), 10 );
		const author = authors[ authorIndex ];
		const name = author.display_name || author.name;

		return (
			<span key={ `author-wrapper-${ author.id || partIndex }` } className="author vcard">
				{ linkToArchive ? (
					<a href="#author-link" onClick={ e => e.preventDefault() } className="url fn n">
						{ name }
					</a>
				) : (
					<span className="fn n">{ name }</span>
				) }
			</span>
		);
	} );
}

/**
 * Inspector controls for the byline block.
 *
 * @param {Object}   props                Component props.
 * @param {Object}   props.attributes     Block attributes.
 * @param {Function} props.setAttributes  Set attributes function.
 * @param {boolean}  props.isCustomByline Whether custom byline is active.
 * @return {JSX.Element} Inspector controls.
 */
function BylineInspectorControls( { attributes, setAttributes, isCustomByline } ) {
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Settings', 'newspack-plugin' ) }>
				{ ! isCustomByline && (
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Prefix', 'newspack-plugin' ) }
						help={ __( 'Text displayed before the author name(s).', 'newspack-plugin' ) }
						value={ attributes.prefix }
						onChange={ prefix => setAttributes( { prefix } ) }
					/>
				) }
				{ isCustomByline && (
					<p className="components-base-control__help">
						{ __( 'Prefix is not shown for custom bylines as they include their own prefix text.', 'newspack-plugin' ) }
					</p>
				) }
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Link to author archive', 'newspack-plugin' ) }
					checked={ attributes.linkToAuthorArchive }
					onChange={ () => setAttributes( { linkToAuthorArchive: ! attributes.linkToAuthorArchive } ) }
					help={
						isCustomByline
							? __( 'This setting does not apply to custom bylines, which have their own link settings.', 'newspack-plugin' )
							: undefined
					}
				/>
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Edit component for the byline block.
 *
 * @param {Object}   props               Component props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Object}   props.context       Block context.
 * @param {Function} props.setAttributes Set attributes function.
 * @return {JSX.Element} Edit component.
 */
export default function Edit( { attributes, context, setAttributes } ) {
	const { postId, postType } = context;
	const blockProps = useBlockProps( { className: 'wp-block-newspack-byline' } );

	// Get custom byline data.
	const { bylineActive, bylineContent } = useCustomByline( postId );

	// Get CoAuthors Plus authors.
	const { authors: coAuthors, isCapAvailable } = useCoAuthors( postId );

	// Get default WordPress author.
	const { authorDetails: defaultAuthor, isLoading: isLoadingAuthor } = useDefaultAuthor( postId, postType );

	// Determine which byline to show.
	const isCustomByline = bylineActive && bylineContent;
	const hasCoAuthors = isCapAvailable && coAuthors?.length > 0;

	// Loading state - show spinner while fetching default author (only when CAP has no authors).
	if ( ! isCustomByline && ! hasCoAuthors && isLoadingAuthor ) {
		return (
			<div { ...blockProps }>
				<Spinner />
			</div>
		);
	}

	// Render custom byline.
	if ( isCustomByline ) {
		const parsedByline = parseBylineForDisplay( bylineContent );
		return (
			<>
				<BylineInspectorControls attributes={ attributes } setAttributes={ setAttributes } isCustomByline={ true } />
				<div { ...blockProps }>
					<span className="byline">{ parsedByline }</span>
				</div>
			</>
		);
	}

	// Render CoAuthors Plus byline.
	if ( hasCoAuthors ) {
		return (
			<>
				<BylineInspectorControls attributes={ attributes } setAttributes={ setAttributes } isCustomByline={ false } />
				<div { ...blockProps }>
					<span className="byline">
						{ attributes.prefix }
						{ formatAuthorsList( coAuthors, attributes.linkToAuthorArchive ) }
					</span>
				</div>
			</>
		);
	}

	// Render default WordPress author.
	if ( defaultAuthor?.name ) {
		return (
			<>
				<BylineInspectorControls attributes={ attributes } setAttributes={ setAttributes } isCustomByline={ false } />
				<div { ...blockProps }>
					<span className="byline">
						{ attributes.prefix }
						<span className="author vcard">
							{ attributes.linkToAuthorArchive ? (
								<a href="#author-link" onClick={ e => e.preventDefault() } className="url fn n">
									{ defaultAuthor.name }
								</a>
							) : (
								<span className="fn n">{ defaultAuthor.name }</span>
							) }
						</span>
					</span>
				</div>
			</>
		);
	}

	// Fallback - no author found.
	return (
		<div { ...blockProps }>
			<span className="byline">{ __( 'No author', 'newspack-plugin' ) }</span>
		</div>
	);
}
