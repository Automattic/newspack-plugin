/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * CoAuthors Plus store name.
 */
const CAP_STORE = 'cap/authors';

/**
 * Hook to get CoAuthors Plus authors from the CAP store or REST API.
 *
 * For the currently-edited post, it uses CAP's JS store for real-time updates.
 * For Query Loop posts, it uses REST API data since CAP's store only works for the
 * currently-edited post.
 *
 * @param {number} postId   Post ID to get authors for.
 * @param {string} postType Post type (default: 'post').
 * @return {Object} Authors array and availability state.
 */
export function useCoAuthors( postId, postType = 'post' ) {
	const { authors, isCapAvailable } = useSelect(
		select => {
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
		[ postId, postType ]
	);

	return { authors, isCapAvailable };
}
