/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

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
export function useCoAuthors( postId ) {
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
