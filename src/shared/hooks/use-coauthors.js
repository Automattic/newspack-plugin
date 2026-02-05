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

// Module-level cache for guest author avatar URLs, keyed by user_nicename.
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
	//
	// Fetches per-author (by nicename) instead of per-post so that avatars
	// resolve immediately when a guest author is added — before the post is saved.
	const [ avatarMap, setAvatarMap ] = useState( {} );

	// Build a stable key from guest author nicenames to control effect re-runs.
	const guestAuthors = authors.filter( author => author.isGuest && author.user_nicename );
	const guestNicenames = guestAuthors.map( author => author.user_nicename ).join( ',' );

	useEffect( () => {
		if ( skip || ! isCapAvailable || ! guestNicenames ) {
			return;
		}

		// Determine which guest authors still need fetching.
		const toFetch = guestAuthors.filter( a => ! guestAvatarCache[ a.user_nicename ] );

		// All cached — sync cache into state and return early.
		if ( ! toFetch.length ) {
			const map = {};
			guestAuthors.forEach( a => {
				if ( guestAvatarCache[ a.user_nicename ] ) {
					map[ a.id ] = guestAvatarCache[ a.user_nicename ];
				}
			} );
			setAvatarMap( map );
			return;
		}

		let cancelled = false;
		Promise.all(
			toFetch.map(
				a =>
					apiFetch( { path: `${ COAUTHORS_ENDPOINT }/${ a.user_nicename }` } )
						.then( result => {
							if ( result?.avatar_urls ) {
								guestAvatarCache[ a.user_nicename ] = result.avatar_urls;
							}
						} )
						.catch( () => {} ) // Silently skip failed fetches.
			)
		).then( () => {
			if ( cancelled ) {
				return;
			}
			const map = {};
			guestAuthors.forEach( a => {
				if ( guestAvatarCache[ a.user_nicename ] ) {
					map[ a.id ] = guestAvatarCache[ a.user_nicename ];
				}
			} );
			setAvatarMap( map );
		} );

		return () => {
			cancelled = true;
		};
	}, [ skip, isCapAvailable, guestNicenames ] );

	// Merge avatar URLs into guest authors.
	const authorsWithAvatars = authors.map( author => {
		if ( ! author.isGuest || ! avatarMap[ author.id ] ) {
			return author;
		}
		return { ...author, avatar_urls: avatarMap[ author.id ] };
	} );

	return { authors: authorsWithAvatars, isCapAvailable };
}
