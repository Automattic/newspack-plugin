/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';

/**
 * CoAuthors Plus store name.
 */
const CAP_STORE = 'cap/authors';
const COAUTHORS_ENDPOINT = '/coauthors/v1/coauthors';

// Module-level cache for guest author avatar URLs, keyed by post ID.
// Prevents duplicate REST requests when components re-mount or when
// multiple avatar blocks in a Query Loop share the same guest authors.
const guestAvatarCache = {};

/**
 * Hook to get CoAuthors Plus authors from the CAP store or REST API.
 *
 * For the currently-edited post, it uses CAP's JS store for real-time updates.
 * For Query Loop posts, it uses REST API data since CAP's store only works for the
 * currently-edited post.
 *
 * @param {number}  postId   Post ID to get authors for.
 * @param {string}  postType Post type (default: 'post').
 * @param {boolean} skip     Skip fetching (default: false).
 * @return {Object} Authors array and availability state.
 */
export function useCoAuthors( postId, postType = 'post', skip = false ) {
	const { authors, isCapAvailable } = useSelect(
		select => {
			if ( skip ) {
				return { authors: [], isCapAvailable: false };
			}
			// Check if CoAuthors Plus store is available.
			const capStore = select( CAP_STORE );
			const isCapStoreAvailable = Boolean( capStore && typeof capStore.getAuthors === 'function' );

			// Get the currently-edited post ID to detect Query Loop context.
			const editorStore = select( 'core/editor' );
			const currentPostId = editorStore?.getCurrentPostId?.();
			const isQueryLoopContext = postId && currentPostId && postId !== currentPostId;

			// For the currently-edited post, use CAP's store for real-time updates.
			if ( isCapStoreAvailable && ! isQueryLoopContext ) {
				const capAuthors = postId ? capStore.getAuthors( postId ) : [];

				if ( capAuthors && capAuthors.length > 0 ) {
					// Map CAP store author objects to our expected format.
					// CAP stores: { id, label, display, value, userType }
					const mappedAuthors = capAuthors.map( author => ( {
						id: author.id,
						display_name: author.display || author.value || author.label,
						user_nicename: author.value,
						isGuest: author.userType === 'guest-author',
					} ) );
					return { authors: mappedAuthors, isCapAvailable: true };
				}

				return { authors: [], isCapAvailable: true };
			}

			// For Query Loop context, try to get coauthors from REST API.
			// Newspack adds 'newspack_author_info' with full author data.
			if ( isQueryLoopContext && postId ) {
				const { getEntityRecord } = select( coreStore );
				const post = getEntityRecord( 'postType', postType, postId );

				// Use newspack_author_info which has full author objects.
				const restAuthors = post?.newspack_author_info;

				if ( restAuthors && Array.isArray( restAuthors ) && restAuthors.length > 0 ) {
					// Map REST API author objects to our expected format.
					const mappedAuthors = restAuthors.map( author => ( {
						id: author.id,
						display_name: author.display_name,
						author_link: author.author_link,
					} ) );
					return { authors: mappedAuthors, isCapAvailable: true };
				}
			}

			// CAP not available or no authors found.
			return { authors: [], isCapAvailable: isCapStoreAvailable };
		},
		[ postId, postType, skip ]
	);

	// Fetch avatar URLs from the CAP REST API for guest authors only.
	// The CAP store strips avatar data via formatAuthorData(), so we need
	// to fetch the raw REST response to get the avatar URL (especially for
	// guest authors whose avatars come from featured images).
	const [ avatarMap, setAvatarMap ] = useState( () => guestAvatarCache[ postId ] || {} );

	// Build a stable key from guest author IDs to avoid re-fetching on every render.
	const guestAuthorIds = authors
		.filter( author => author.isGuest )
		.map( author => author.id )
		.join( ',' );

	useEffect( () => {
		if ( skip || ! isCapAvailable || ! guestAuthorIds || ! postId ) {
			return;
		}

		// Use cached data if available (avoids duplicate requests on re-mount).
		if ( guestAvatarCache[ postId ] ) {
			setAvatarMap( guestAvatarCache[ postId ] );
			return;
		}

		let cancelled = false;
		apiFetch( { path: `${ COAUTHORS_ENDPOINT }?post_id=${ postId }` } ).then( result => {
			if ( cancelled || ! Array.isArray( result ) ) {
				return;
			}
			const map = {};
			result.forEach( item => {
				if ( item.id && item.avatar_urls ) {
					map[ item.id ] = item.avatar_urls;
				}
			} );
			if ( Object.keys( map ).length ) {
				guestAvatarCache[ postId ] = map;
				setAvatarMap( map );
			}
		} );

		return () => {
			cancelled = true;
		};
	}, [ skip, isCapAvailable, guestAuthorIds, postId ] );

	// Merge avatar URLs into guest authors.
	const authorsWithAvatars = authors.map( author => {
		if ( ! author.isGuest || ! avatarMap[ author.id ] ) {
			return author;
		}
		return { ...author, avatar_urls: avatarMap[ author.id ] };
	} );

	return { authors: authorsWithAvatars, isCapAvailable };
}
