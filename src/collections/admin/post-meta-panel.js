import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { TextControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';

const PostMetaPanel = ( { metaKey } ) => {
	const { editPost } = useDispatch( editorStore );

	// Get the current post type and meta data.
	const { currentPostType, meta = {} } = useSelect( select => {
		const editor = select( editorStore );
		return {
			currentPostType: editor.getCurrentPostType(),
			meta: editor.getEditedPostAttribute( 'meta' ) || {},
		};
	}, [] );

	// Update the meta data.
	const updateMeta = useCallback(
		value => {
			const sanitized = value === '' ? '' : parseInt( value, 10 ) || 0;
			editPost( { meta: { [ metaKey ]: sanitized } } );
		},
		[ editPost, metaKey ]
	);

	return (
		// Only render the panel for posts.
		'post' === currentPostType && (
			<PluginDocumentSettingPanel
				name="newspack-post-meta-panel"
				title={ __( 'Collection Settings', 'newspack-plugin' ) }
				icon="media-document"
			>
				<TextControl
					label={ __( 'Order', 'newspack-plugin' ) }
					type="number"
					value={ meta[ metaKey ] || '' }
					onChange={ updateMeta }
					help={ __( 'Set the order of this post within a collection.', 'newspack-plugin' ) }
					min={ 0 }
				/>
			</PluginDocumentSettingPanel>
		)
	);
};

domReady( () => {
	const { postMeta } = window.newspackCollections || {};
	if ( postMeta?.orderMetaKey ) {
		registerPlugin( 'newspack-post-meta-panel', {
			render: () => <PostMetaPanel metaKey={ postMeta.orderMetaKey } />,
			icon: 'media-document',
		} );
	}
} );
