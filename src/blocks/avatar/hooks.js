/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

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

export function usePostAuthors( { postId } ) {
	const [ authors, setAuthors ] = useState( [] );

	useEffect( () => {
		const controller = new AbortController();
		const signal = controller.signal;

		apiFetch( {
			path: `/coauthors/v1/coauthors?post_id=${ postId }`,
			signal,
		} ).then( coauthors => {
			if ( Array.isArray( coauthors ) ) {
				setAuthors( coauthors );
			}
		} );

		return () => {
			controller.abort(); // Clean up if component unmounts
		};
	}, [ postId ] );

	return authors;
}
