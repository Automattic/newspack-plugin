/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';
import { ExternalLink, ToggleControl } from '@wordpress/components';

function PostSettings() {
	const { meta } = useSelect( select => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		return {
			meta: getEditedPostAttribute( 'meta' ),
		};
	} );
	const { editPost } = useDispatch( 'core/editor' );
	return (
		<PluginDocumentSettingPanel name="content-gate-post-exemptions-panel" title={ __( 'Access control settings', 'newspack-plugin' ) }>
			<ToggleControl
				label={ __( 'Disable access control restrictions for this post', 'newspack-plugin' ) }
				help={
					<>
						{ __(
							'If enabled, this post will be accessible to all readers regardless of content restriction rules.',
							'newspack-plugin'
						) }{ ' ' }
						<ExternalLink href="/wp-admin/admin.php?page=newspack-audience-access-control">
							{ __( 'Manage access control', 'newspack-plugin' ) }
						</ExternalLink>
					</>
				}
				checked={ meta.newspack_content_restriction_is_exempt }
				onChange={ value => editPost( { meta: { newspack_content_restriction_is_exempt: value } } ) }
			/>
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'newspack-content-gate-post-exemptions', {
	render: PostSettings,
	icon: null,
} );
