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
 * Reset the module-level guest avatar cache. Exposed for testing only.
 */
export function resetGuestAvatarCacheForTests() {
	Object.keys( guestAvatarCache ).forEach( key => delete guestAvatarCache[ key ] );
}

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
					// Extract user_nicename from author_link so the avatar
					// effect can fetch from the CAP single-author endpoint.
					const mappedAuthors = restAuthors.map( author => ( {
						id: author.id,
						display_name: author.display_name,
						author_link: author.author_link,
						user_nicename: author.author_link ? author.author_link.replace( /\/$/, '' ).split( '/' ).pop() : undefined,
					} ) );
					return { authors: mappedAuthors, isCapAvailable: true };
				}
			}

			// CAP not available or no authors found.
			return { authors: [], isCapAvailable: isCapStoreAvailable };
		},
		[ postId, postType, skip ]
	);

	// Fetch avatar URLs from the CAP REST API for authors that need it.
	// The CAP store strips avatar data via formatAuthorData(), so we need
	// to fetch the raw REST response to get the avatar URL (especially for
	// guest authors whose avatars come from featured images).
	//
	// Fetches per-author (by nicename) instead of per-post so that avatars
	// resolve immediately when a guest author is added — before the post is saved.
	//
	// For currently-edited post authors, isGuest is explicitly true/false.
	// For Query Loop authors, isGuest is undefined (we can't distinguish from
	// REST data alone), so we fetch for all of them and let the consumer
	// (hooks.js) prefer WP user data when available.
	const [ avatarMap, setAvatarMap ] = useState( {} );

	// Build a stable key from author nicenames to control effect re-runs.
	// isGuest !== false: includes guest authors (true) and Query Loop authors (undefined),
	// but excludes known WP users from the currently-edited post (false).
	const authorsNeedingAvatars = authors.filter( author => author.isGuest !== false && author.user_nicename );
	const avatarNicenames = authorsNeedingAvatars.map( author => author.user_nicename ).join( ',' );

	useEffect( () => {
		if ( skip || ! isCapAvailable || ! avatarNicenames ) {
			return;
		}

		// Determine which authors still need fetching.
		const toFetch = authorsNeedingAvatars.filter( a => ! guestAvatarCache[ a.user_nicename ] );

		// All cached — sync cache into state and return early.
		if ( ! toFetch.length ) {
			const map = {};
			authorsNeedingAvatars.forEach( a => {
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
					apiFetch( { path: `${ COAUTHORS_ENDPOINT }/${ encodeURIComponent( a.user_nicename ) }` } )
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
			authorsNeedingAvatars.forEach( a => {
				if ( guestAvatarCache[ a.user_nicename ] ) {
					map[ a.id ] = guestAvatarCache[ a.user_nicename ];
				}
			} );
			setAvatarMap( map );
		} );

		return () => {
			cancelled = true;
		};
	}, [ skip, isCapAvailable, avatarNicenames ] );

	// Merge avatar URLs into guest authors.
	// Check both the async avatarMap (populated by the effect) and the
	// synchronous guestAvatarCache (populated by previous fetches) so that
	// cached avatars render immediately without waiting for an effect cycle.
	const authorsWithAvatars = authors.map( author => {
		if ( author.isGuest === false || ! author.user_nicename ) {
			return author;
		}
		const urls = avatarMap[ author.id ] || guestAvatarCache[ author.user_nicename ];
		if ( ! urls ) {
			return author;
		}
		return { ...author, avatar_urls: urls };
	} );

	return { authors: authorsWithAvatars, isCapAvailable };
}
