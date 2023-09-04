/* globals newspack_ads_wizard */
/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { TextControl, CheckboxControl, Spinner, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Grid, Card } from '../../../../../components/src';

/**
 * Advertising Marketplace Products Screen.
 */
export default function MarketplaceSettings() {
	const [ settings, setSettings ] = useState( {} );
	const [ inFlight, setInFlight ] = useState( false );
	useEffect( () => {
		setInFlight( true );
		apiFetch( {
			path: `/newspack-ads/v1/marketplace/settings`,
		} )
			.then( data => {
				setSettings( data );
			} )
			.catch( err => {
				console.log( err );
			} )
			.finally( () => setInFlight( false ) );
	}, [] );
	const save = () => {
		setInFlight( true );
		apiFetch( {
			path: `/newspack-ads/v1/marketplace/settings`,
			method: 'POST',
			data: settings,
		} )
			.then( data => {
				setSettings( data );
			} )
			.catch( err => {
				console.log( err );
			} )
			.finally( () => setInFlight( false ) );
	};
	if ( inFlight && ! Object.keys( settings ).length ) {
		return <Spinner />;
	}
	return (
		<>
			<h2>{ __( 'Marketplace Settings', 'newspack' ) }</h2>
			<Grid columns={ 1 } gutter={ 32 }>
				<CheckboxControl
					label={ __( 'Send email notification', 'newspack' ) }
					help={ __(
						'Whether to send an email notification on every new marketplace order placed.',
						'newspack'
					) }
					disabled={ inFlight }
					checked={ settings.enable_email_notification }
					onChange={ enable_email_notification => {
						setSettings( { ...settings, enable_email_notification } );
					} }
				/>
				<p>
					{ __(
						'Make sure you also have email notifications enabled for new orders on WooCommerce settings:',
						'newspack'
					) }{ ' ' }
					<a href={ newspack_ads_wizard.wc_email_settings_url } target="_blank" rel="noreferrer">
						{ __( 'WooCommerce > Settings > Emails', 'newspack' ) }
					</a>
				</p>
				<TextControl
					label={ __( 'Email address for notifications', 'newspack' ) }
					help={ __( 'Email address to send notifications to.', 'newspack' ) }
					disabled={ inFlight }
					value={ settings.notification_email_address }
					onChange={ notification_email_address => {
						setSettings( { ...settings, notification_email_address } );
					} }
				/>
			</Grid>
			<Card buttonsCard noBorder className="justify-end">
				<Button isPrimary onClick={ save } disabled={ inFlight }>
					{ __( 'Save Changes', 'newspack' ) }
				</Button>
			</Card>
		</>
	);
}
