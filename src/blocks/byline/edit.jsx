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
import { parseBylineForDisplay, formatAuthorsList } from './utils';

/**
 * Hook to get custom byline data.
 *
 * @param {number} postId   Post ID.
 * @param {string} postType Post type.
 * @return {Object} Custom byline data.
 */
function useCustomByline( postId, postType ) {
	const { bylineActive, bylineContent } = useSelect(
		select => {
			const { getEditedEntityRecord } = select( coreStore );
			const postRecord = getEditedEntityRecord( 'postType', postType, postId );
			return {
				bylineActive: postRecord?.meta?._newspack_byline_active || false,
				bylineContent: postRecord?.meta?._newspack_byline || '',
			};
		},
		[ postId, postType ]
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
					<>
						<TextControl
							__nextHasNoMarginBottom
							label={ __( 'Prefix', 'newspack-plugin' ) }
							help={ __( 'Text displayed before the author name(s).', 'newspack-plugin' ) }
							value={ attributes.prefix }
							onChange={ prefix => setAttributes( { prefix } ) }
						/>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Link to author archive', 'newspack-plugin' ) }
							checked={ attributes.linkToAuthorArchive }
							onChange={ () => setAttributes( { linkToAuthorArchive: ! attributes.linkToAuthorArchive } ) }
						/>
					</>
				) }
				{ isCustomByline && (
					<p className="components-base-control__help">
						{ __( 'Prefix and link settings are controlled by the custom byline and cannot be changed here.', 'newspack-plugin' ) }
					</p>
				) }
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
	const { postId, postType = 'post' } = context;
	const blockProps = useBlockProps( { className: 'wp-block-newspack-byline' } );

	// Get custom byline data.
	const { bylineActive, bylineContent } = useCustomByline( postId, postType );

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
						{ attributes.prefix && `${ attributes.prefix } ` }
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
						{ attributes.prefix && `${ attributes.prefix } ` }
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
