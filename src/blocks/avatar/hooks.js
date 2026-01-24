/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

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
 * Checks for custom byline first. If active, only returns authors from the byline.
 * Otherwise, uses the shared useCoAuthors hook for CAP integration.
 *
 * @param {Object} props          Hook props.
 * @param {number} props.postId   Post ID to get authors for.
 * @param {string} props.postType Post type (default: 'post').
 * @return {Array} Authors array with avatar data.
 */
export function usePostAuthors( { postId, postType = 'post' } ) {
	const { bylineActive, bylineContent } = useCustomByline( postId, postType );
	const { authors: coAuthors } = useCoAuthors( postId, postType );

	// Determine which author IDs to use.
	const isCustomByline = bylineActive && bylineContent;
	const bylineAuthorIds = isCustomByline ? extractAuthorIdsFromByline( bylineContent ) : [];

	// Get avatar URLs for authors from the core store.
	const authorsWithAvatars = useSelect(
		select => {
			// Early return if no authors to process.
			const noBylineAuthors = isCustomByline && bylineAuthorIds.length === 0;
			const noCapAuthors = ! isCustomByline && ( ! coAuthors || coAuthors.length === 0 );
			if ( noBylineAuthors || noCapAuthors ) {
				return [];
			}

			const { getUser } = select( coreStore );

			// If custom byline is active, use authors from the byline only.
			if ( isCustomByline ) {
				return bylineAuthorIds.map( authorId => {
					const userData = getUser( authorId );
					return {
						id: authorId,
						name: userData?.name || '',
						display_name: userData?.name || '',
						avatar_urls: userData?.avatar_urls || null,
					};
				} );
			}

			// Otherwise, use CAP authors.
			return coAuthors.map( author => {
				const userData = author.id ? getUser( author.id ) : null;
				return {
					id: author.id,
					name: author.display_name,
					display_name: author.display_name,
					user_nicename: author.user_nicename,
					author_link: author.author_link,
					avatar_urls: userData?.avatar_urls || null,
				};
			} );
		},
		[ isCustomByline, bylineAuthorIds, coAuthors ]
	);

	return authorsWithAvatars;
}
