/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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

export const WooPayments = ( { woopayments } ) => {
	const isLoading = useSelect( select => select( Wizard.STORE_NAMESPACE ).isLoading() );
	const isQuietLoading = useSelect( select => select( Wizard.STORE_NAMESPACE ).isQuietLoading() );
	const { updateWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const changeHandler = ( key, value ) =>
		updateWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			path: [ 'payment_gateways', 'woopayments', key ],
			value,
		} );

	const { saveWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const onSave = () =>
		saveWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			section: 'woopayments',
			payloadPath: [ 'payment_gateways', 'woopayments' ],
		} );
	const testMode = woopayments?.test_mode;
	const isConnected = woopayments?.is_connected;
	const getConnectionStatus = () => {
		if ( ! woopayments?.enabled ) {
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
		if ( ! woopayments?.enabled || isLoading || isQuietLoading ) {
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
			title={ __( 'WooPayments', 'newspack-plugin' ) }
			description={ () => (
				<>
					{ __(
						'Enable WooPayments. ',
						'newspack-plugin'
					) }
					<ExternalLink href="https://woocommerce.com/payments/">
						{ __( 'Learn more', 'newspack-plugin' ) }
					</ExternalLink>
				</>
			) }
			hasWhiteHeader
			toggleChecked={ !! woopayments.enabled }
			toggleOnChange={ () => {
				changeHandler( 'enabled', ! woopayments.enabled );
				onSave();
			} }
			badge={ getConnectionStatus() }
			badgeLevel={ getBadgeLevel() }
			// eslint-disable-next-line no-nested-ternary
			actionContent={ ( ! woopayments?.enabled || isLoading || isQuietLoading ) ? null : isConnected ? (
				<Button
					variant="secondary"
					href="/wp-admin/admin.php?page=wc-settings&tab=checkout&section=woocommerce_payments"
					target="_blank"
					rel="noreferrer"
				>
					{ __( 'Configure', 'newspack-plugin' ) }
				</Button>
			) : (
				<Button
					variant="primary"
					href="/wp-admin/admin.php?page=wc-admin&path=%2Fpayments%2Foverview"
					target="_blank"
					rel="noreferrer"
				>
					{ __( 'Connect', 'newspack-plugin' ) }
				</Button>
			) }
		/>
	);
}