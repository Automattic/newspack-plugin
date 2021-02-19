/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { TextControl } from '../../../../components/src';

const AdManager = ( { configuration, onUpdate } ) => {
	useEffect( () => {
		apiFetch( { path: '/newspack/v1/wizard/advertising' } ).then( res =>
			onUpdate( { network_code: res.services.google_ad_manager.network_code } )
		);
	}, [] );
	return (
		<TextControl
			label={ __( 'Network Code', 'newspack' ) }
			placeholder={ __( '123456789' ) }
			value={ configuration.network_code === undefined ? '' : configuration.network_code }
			disabled={ configuration.network_code === undefined }
			onChange={ network_code => onUpdate( { network_code } ) }
		/>
	);
};

export default AdManager;
