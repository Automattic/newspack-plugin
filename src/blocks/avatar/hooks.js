/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useCoAuthors } from '../../shared/hooks/use-coauthors';
import { useCustomByline, extractAuthorIdsFromByline } from '../../shared/hooks/use-custom-byline';

function getAvatarSizes( sizes ) {
	const minSize = sizes ? sizes[ 0 ] : 24;
	const maxSize = sizes ? sizes[ sizes.length - 1 ] : 128;
	const maxSizeBuffer = Math.floor( maxSize * 2.5 );
	return {
		minSize,
		maxSize: maxSizeBuffer,
	};
}

function useDefaultAvatar() {
	const { avatarURL: defaultAvatarUrl } = useSelect( select => {
		const { getSettings } = select( blockEditorStore );
		const { __experimentalDiscussionSettings } = getSettings();
		return __experimentalDiscussionSettings;
	} );
	return defaultAvatarUrl;
}

export function useUserAvatar( { postId, postType } ) {
	const { authorDetails } = useSelect(
		select => {
			const { getEditedEntityRecord, getUser } = select( coreStore );
			const _authorId = getEditedEntityRecord( 'postType', postType, postId )?.author;
			return {
				authorDetails: _authorId ? getUser( _authorId ) : null,
			};
		},
		[ postType, postId ]
	);
	const avatarUrls = authorDetails?.avatar_urls ? Object.values( authorDetails.avatar_urls ) : null;
	const sizes = authorDetails?.avatar_urls ? Object.keys( authorDetails.avatar_urls ) : null;
	const { minSize, maxSize } = getAvatarSizes( sizes );
	const defaultAvatar = useDefaultAvatar();
	return {
		src: avatarUrls ? avatarUrls[ avatarUrls.length - 1 ] : defaultAvatar,
		minSize,
		maxSize,
		alt: authorDetails
			? // translators: %s: Author name.
			  sprintf( __( '%s Avatar', 'newspack-plugin' ), authorDetails?.name )
			: __( 'Default Avatar', 'newspack-plugin' ),
	};
}

/**
 * Hook to get post authors with avatar data.
 *
 * Resolution order mirrors the PHP get_avatar_authors() method:
 * 1. Custom byline authors (if active and has [Author] shortcodes).
 *    If the byline is active but text-only (no shortcodes), returns empty — no avatars.
 * 2. CoAuthors Plus authors.
 * 3. Empty array (caller falls back to useUserAvatar for single-author display).
 *
 * Each returned author includes an `avatarSrc` field with a resolved URL,
 * falling back to the site's default avatar when user-specific data is unavailable
 * (e.g. CAP guest authors without a linked WordPress account).
 *
 * @param {Object} props          Hook props.
 * @param {number} props.postId   Post ID to get authors for.
 * @param {string} props.postType Post type (default: 'post').
 * @return {Array} Authors array with avatar data.
 */
export function usePostAuthors( { postId, postType = 'post' } ) {
	const { bylineActive, bylineContent } = useCustomByline( postId, postType );
	const { authors: coAuthors } = useCoAuthors( postId, postType, bylineActive );
	const defaultAvatarUrl = useDefaultAvatar();

	// Extract author IDs from custom byline content.
	const bylineAuthorIds = useMemo(
		() => ( bylineActive && bylineContent ? extractAuthorIdsFromByline( bylineContent ) : [] ),
		[ bylineActive, bylineContent ]
	);

	const hasCustomBylineAuthors = bylineAuthorIds.length > 0;

	// Custom byline is active but contains no [Author] shortcodes — text-only byline.
	const hasActiveTextOnlyByline = bylineActive && ! hasCustomBylineAuthors;

	// Resolve authors from the core store.
	const authorsWithAvatars = useSelect(
		select => {
			// Text-only byline: no avatars to display.
			if ( hasActiveTextOnlyByline ) {
				return [];
			}

			const { getUser } = select( coreStore );

			// Custom byline with author shortcodes: use only those authors.
			// Filter out deleted users (getUser returns null).
			if ( hasCustomBylineAuthors ) {
				return bylineAuthorIds
					.map( authorId => {
						const userData = getUser( authorId );
						if ( ! userData ) {
							return null;
						}
						return {
							id: authorId,
							name: userData.name || '',
							display_name: userData.name || '',
							avatar_urls: userData.avatar_urls || null,
						};
					} )
					.filter( Boolean );
			}

			// CoAuthors Plus authors.
			if ( coAuthors && coAuthors.length > 0 ) {
				return coAuthors.map( author => {
					// Skip getUser for guest authors as they don't have WP user accounts.
					const userData = author.id && ! author.isGuest ? getUser( author.id ) : null;
					return {
						id: author.id,
						name: author.display_name,
						display_name: author.display_name,
						user_nicename: author.user_nicename,
						author_link: author.author_link,
						avatar_urls: userData?.avatar_urls || author.avatar_urls || null,
					};
				} );
			}

			return [];
		},
		[ hasActiveTextOnlyByline, hasCustomBylineAuthors, bylineAuthorIds, coAuthors ]
	);

	// Resolve a concrete avatarSrc for each author so the render layer doesn't need
	// to know about fallback logic.
	return useMemo(
		() =>
			authorsWithAvatars.map( author => ( {
				...author,
				avatarSrc: author.avatar_urls?.[ '96' ] || defaultAvatarUrl,
			} ) ),
		[ authorsWithAvatars, defaultAvatarUrl ]
	);
}
