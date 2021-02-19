/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { DontationAmounts } from '../../../readerRevenue/views/donation';
import { StripeKeysSettings } from '../../../readerRevenue/views/stripe-setup';

const ReaderRevenue = ( { configuration, onUpdate, className } ) => {
	useEffect( () => {
		apiFetch( { path: 'newspack/v1/wizard/newspack-reader-revenue-wizard' } ).then(
			( { donation_data, stripe_data } ) =>
				onUpdate( { ...donation_data, ...stripe_data, hasLoaded: true } )
		);
	}, [] );
	return (
		<div className={ classnames( className, { 'o-50': ! configuration.hasLoaded } ) }>
			<DontationAmounts data={ configuration } onChange={ onUpdate } />
			<h2>{ __( 'Payment gateway', 'newspack' ) }</h2>
			<StripeKeysSettings data={ configuration } onChange={ onUpdate } />
		</div>
	);
};

export default ReaderRevenue;
