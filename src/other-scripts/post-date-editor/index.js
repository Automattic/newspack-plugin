/**
 * WordPress dependencies.
 */
import { ToggleControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

const PostDateSettingsPanel = () => {
	const { postType, meta } = useSelect( select => {
		const editor = select( 'core/editor' );
		return {
			postType: editor.getCurrentPostType(),
			meta: editor.getEditedPostAttribute( 'meta' ) || {},
		};
	}, [] );

	const { editPost } = useDispatch( 'core/editor' );

	const config = window.newspackPostDate;
	if ( ! config ) {
		return null;
	}

	const { mode, postTypes } = config;

	if ( ! postTypes.includes( postType ) ) {
		return null;
	}

	const updateMeta = ( key, value ) => {
		editPost( { meta: { [ key ]: value } } );
	};

	if ( mode === 'hide' ) {
		return (
			<PluginDocumentSettingPanel name="newspack-post-date-settings" title={ __( 'Updated Date', 'newspack-plugin' ) }>
				<ToggleControl
					label={ __( 'Hide last updated date', 'newspack-plugin' ) }
					help={ __( 'Override the sitewide setting and hide the updated date on this post.', 'newspack-plugin' ) }
					checked={ !! meta.newspack_hide_updated_date }
					onChange={ value => updateMeta( 'newspack_hide_updated_date', value ) }
				/>
			</PluginDocumentSettingPanel>
		);
	}

	return (
		<PluginDocumentSettingPanel name="newspack-post-date-settings" title={ __( 'Updated Date', 'newspack-plugin' ) }>
			<ToggleControl
				label={ __( 'Show last updated date', 'newspack-plugin' ) }
				help={ __( 'Show the updated date on this post even though the sitewide setting is off.', 'newspack-plugin' ) }
				checked={ !! meta.newspack_show_updated_date }
				onChange={ value => updateMeta( 'newspack_show_updated_date', value ) }
			/>
		</PluginDocumentSettingPanel>
	);
};

registerPlugin( 'newspack-post-date', {
	render: PostDateSettingsPanel,
	icon: null,
} );
