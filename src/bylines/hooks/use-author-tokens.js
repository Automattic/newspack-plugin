/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useCoAuthors } from '../../shared/hooks/use-coauthors';

const BASE_QUERY = {
	_fields: 'id,name',
	context: 'view',
};

/**
 * WP user coauthors (or post_author fallback) as `{ id, name }` byline tokens.
 * Guests are excluded since the `[Author id=N]` shortcode requires a WP user ID.
 *
 * @param {number} postId The post ID.
 * @return {Object[]} Array of `{ id, name }` tokens.
 */
export function useAuthorTokens( postId ) {
	const { authors: coAuthors, isCapAvailable, isLoading } = useCoAuthors( postId );

	const postAuthor = useSelect( select => {
		const editorStore = select( 'core/editor' );
		const authorId = editorStore?.getEditedPostAttribute?.( 'author' );
		if ( ! authorId ) {
			return null;
		}
		return select( coreStore ).getUser( authorId, BASE_QUERY );
	}, [] );

	// Prevent `insertDefaultByline()` from seeding a truncated byline during new-CAP async resolve.
	if ( isLoading ) {
		return [];
	}

	// When coauthors exist, return only WP users — never fall back to post_author,
	// which would credit the wrong person on guest-only posts.
	if ( isCapAvailable && coAuthors && coAuthors.length > 0 ) {
		const wpUsers = coAuthors
			.filter( author => author.isGuest === false )
			.filter( ( author, index, arr ) => arr.findIndex( other => other.id === author.id ) === index );
		return wpUsers.map( author => ( {
			id: Number( author.id ),
			name: author.display_name,
		} ) );
	}

	// No coauthors (or CAP inactive) — fall back to the post author.
	if ( postAuthor ) {
		return [ postAuthor ];
	}

	return [];
}
