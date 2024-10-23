/**
 * External dependencies
 */
import classnames from 'classnames';
import isEmpty from 'lodash/isEmpty';

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { DonationAmounts } from '../../../readerRevenue/views/donation';
import PaymentGateways from '../../../readerRevenue/views/payment-methods';
import { Wizard } from '../../../../components/src';

const ReaderRevenue = ( { className } ) => {
	const wizardData = Wizard.useWizardData( 'reader-revenue' );
	return (
		<div className={ classnames( className, { 'o-50': isEmpty( wizardData ) } ) }>
			{ wizardData.platform_data?.platform === 'nrh' ? (
				<p>
					{ __(
						'Looks like this Newspack instance is already configured to use News Revenue Hub as the Reader Revenue platform. To edit these settings, visit the Reader Revenue section from the Newspack dashboard.',
						'newspack'
					) }
				</p>
			) : (
				<>
					<DonationAmounts />
					<PaymentGateways />
				</>
			) }
		</div>
	);
};

export default ReaderRevenue;
