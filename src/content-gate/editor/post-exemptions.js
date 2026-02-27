/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';
import { ToggleControl } from '@wordpress/components';

function PostExemptions() {
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
				checked={ meta.newspack_content_restriction_is_exempt }
				onChange={ value => editPost( { meta: { newspack_content_restriction_is_exempt: value } } ) }
			/>
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'newspack-content-gate-post-exemptions', {
	render: PostExemptions,
	icon: null,
} );
