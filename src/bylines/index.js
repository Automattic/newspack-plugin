/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';
import { ToggleControl } from '@wordpress/components';

/**
 * External dependencies
 */
import { useState } from 'react';

const BylinesSettingsPanel = () => {
	const { editPost } = useDispatch( 'core/editor' );
	const { getEditedPostAttribute } = useSelect( select => select( 'core/editor' ) );

	const [ isEnabled, setIsEnabled ] = useState( !! getEditedPostAttribute( 'meta' )?.newspack_byline_enabled );

	const handleToggleChange = value => {
		setIsEnabled( value );
		editPost( { meta: { newspack_byline_enabled: value } } );
	}

	return (
		<PluginDocumentSettingPanel
			name="Newspack Bylines Settings Panel"
			title={ __( 'Custom Byline', 'newspack-plugin' ) }
		>
			<ToggleControl
				checked={ isEnabled }
				onChange={ () => handleToggleChange( ! isEnabled ) }
				label={ __( 'Enable custom byline', 'newspack-plugin' ) }
			/>
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'newspack-bylines-sidebar', {
	render: BylinesSettingsPanel,
	icon: false,
} );

