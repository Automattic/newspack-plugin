/**
 * Newspack / Settings / Connections (Tab)
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Plugins from './plugins';
import GoogleOAuth from './google-oauth';
import Mailchimp from './mailchimp';
import Recaptcha from './recaptcha';
import Webhooks from './webhooks';
import Analytics from './analytics';
import CustomEvents from './custom-events';
import { SectionHeader } from '../../../../../../components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../../../components/src/wizard/store';

const { connections } = window.newspackSettings.tabs;

const Connections = () => {
	const { setError } = useDispatch( WIZARD_STORE_NAMESPACE );
	// const error = useSelect( select => select( WIZARD_STORE_NAMESPACE ).getError() );

	const setErrorWithPrefix = ( prefix: string ) => ( err?: ErrorParams ) => {
		if ( ! err ) {
			setError( {
				message: `${ prefix } ${ __(
					"An error occured, that's all we know!",
					'newspack-plugin'
				) }`,
			} );
			return;
		}
		if ( typeof err === 'string' ) {
			setError( { message: err ? `${ prefix } ${ err }` : null, data: { level: 'notice' } } );
		} else if ( 'message' in err ) {
			setError( { ...err, message: `${ prefix } ${ err.message }` } );
		} else {
			setError( {
				...err,
				message: `${ prefix } ${ __(
					'Error cannot be parsed: ',
					'newspack-plugin'
				) } ${ JSON.stringify( err, null, 2 ) }`,
			} );
		}
	};

	return (
		<div className="newspack-dashboard__section">
			{ /* <pre>
				{JSON.stringify(error, null, 2)}
			</pre> */ }
			{ /* Plugins */ }
			<SectionHeader heading={ 3 } title={ __( 'Plugins', 'newspack-plugin' ) } />
			<Plugins setError={ setErrorWithPrefix( __( 'Plugins: ', 'newspack-plugin' ) ) } />
			{ /* APIs; google */ }
			<SectionHeader heading={ 3 } title={ __( 'APIs', 'newspack-plugin' ) } />
			{ connections.dependencies.google && (
				<GoogleOAuth setError={ setErrorWithPrefix( __( 'Google: ', 'newspack-plugin' ) ) } />
			) }
			<Mailchimp setError={ setErrorWithPrefix( __( 'Mailchimp: ', 'newspack-plugin' ) ) } />
			{ /* reCAPTCHA */ }
			<SectionHeader heading={ 3 } title={ __( 'reCAPTCHA v3', 'newspack-plugin' ) } />
			<Recaptcha />
			{ /* Webhooks */ }
			{ connections.dependencies.webhooks && <Webhooks /> }
			{ /* Analytics */ }
			<SectionHeader heading={ 3 } title={ __( 'Analytics', 'newspack-plugin' ) } />
			<Analytics editLink={ connections.sections.analytics.editLink } />
			{ /* Custom Events */ }
			<SectionHeader
				title={ __( 'Activate Newspack Custom Events', 'newspack-plugin' ) }
				heading={ 3 }
				description={ __(
					'Allows Newspack to send enhanced custom event data to your Google Analytics.',
					'newspack-plugin'
				) }
			/>
			<CustomEvents />
		</div>
	);
};

export default Connections;
