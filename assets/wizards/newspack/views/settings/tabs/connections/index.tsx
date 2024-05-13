/**
 * Newspack / Settings / Connections (Tab)
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

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

const sections = {
	plugins: {},
	googleOAuth: {},
	mailchimp: {},
};

type SectionKeys = keyof typeof sections;

const Connections = () => {
	const { setDataPropError } = useDispatch( WIZARD_STORE_NAMESPACE );

	const setErrorWithPrefix = ( prop: SectionKeys ) => ( err?: ErrorParams ) => {
		let value = '';
		if ( ! err ) {
			value = __( "An error occured!", 'newspack-plugin' );
		} else if ( typeof err === 'string' ) {
			value = err ? `${ err }` : '';
		} else if ( 'message' in err ) {
			value = err.message;
		} else {
			value = `${ __( 'Error cannot be parsed!', 'newspack-plugin' ) }: ${ JSON.stringify(
				err
			) }`;
		}
		setDataPropError( {
			slug: 'settings-connections',
			prop,
			value,
		} );
	};

	return (
		<div className="newspack-dashboard__section">
			{ /* Plugins */ }
			<SectionHeader heading={ 3 } title={ __( 'Plugins', 'newspack-plugin' ) } />
			<Plugins />
			{ /* APIs; google */ }
			<SectionHeader heading={ 3 } title={ __( 'APIs', 'newspack-plugin' ) } />
			{ /* connections.dependencies.google && (
			)  */}
			<GoogleOAuth setError={ setErrorWithPrefix( 'googleOAuth' ) } />
			<Mailchimp setError={ setErrorWithPrefix( 'mailchimp' ) } />
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
