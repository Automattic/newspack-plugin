/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Button,
	Wizard,
} from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';

export const PaymentGateway = ( { gateway } ) => {
	const isLoading = useSelect( select => select( Wizard.STORE_NAMESPACE ).isLoading() );
	const isQuietLoading = useSelect( select => select( Wizard.STORE_NAMESPACE ).isQuietLoading() );
	const { updateWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const changeHandler = ( key, value ) =>
		updateWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			path: [ 'payment_gateways', gateway.slug, key ],
			value,
		} );

	const { saveWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const onSave = () =>
		saveWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			section: 'gateway',
			payloadPath: [ 'payment_gateways', gateway.slug ],
		} );
	const testMode = gateway?.test_mode;
	const isConnected = gateway?.is_connected;
	const getConnectionStatus = () => {
		if ( ! gateway?.enabled ) {
			return null;
		}
		if ( isLoading || isQuietLoading ) {
			return __( 'Loading…', 'newspack-plugin' );
		}
		if ( ! isConnected ) {
			return __( 'Not connected', 'newspack-plugin' );
		}
		if ( testMode ) {
			return __( 'Connected - test mode', 'newspack-plugin' );
		}
		return __( 'Connected', 'newspack-plugin' );
	}
	const getBadgeLevel = () => {
		if ( ! gateway?.enabled || isLoading || isQuietLoading ) {
			return 'info';
		}
		if ( ! isConnected ) {
			return 'error';
		}
		return 'success';
	}

	return (
		<ActionCard
			isMedium
			title={ gateway.name }
			description={ () => (
				<>
					{ sprintf(
						// Translators: %s is the payment gateway name.
						__( 'Enable %s. ', 'newspack-plugin' ),
						gateway.name
					) }
					{ gateway.url && (
						<ExternalLink href={ gateway.url }>
							{ __( 'Learn more', 'newspack-plugin' ) }
						</ExternalLink>
					) }
				</>
			) }
			hasWhiteHeader
			toggleChecked={ !! gateway.enabled }
			toggleOnChange={ () => {
				changeHandler( 'enabled', ! gateway.enabled );
				onSave();
			} }
			badge={ getConnectionStatus() }
			badgeLevel={ getBadgeLevel() }
			// eslint-disable-next-line no-nested-ternary
			actionContent={ ( ! gateway?.enabled || isLoading || isQuietLoading ) ? null : isConnected ? (
				<Button
					variant="secondary"
					href={ gateway.settings }
					target="_blank"
					rel="noreferrer"
				>
					{ __( 'Configure', 'newspack-plugin' ) }
				</Button>
			) : (
				<Button
					variant="primary"
					href={ gateway.connect }
					target="_blank"
					rel="noreferrer"
				>
					{ __( 'Connect', 'newspack-plugin' ) }
				</Button>
			) }
		/>
	);
}