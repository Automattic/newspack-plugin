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
import Platform from '../../../readerRevenue/views/platform';
import { DonationAmounts } from '../../../readerRevenue/views/donation';
import { Wizard } from '../../../../components/src';

const ReaderRevenue = ( { className } ) => {
	const wizardData = Wizard.useWizardData( 'reader-revenue' );
	return (
		<div className={ classnames( className, { 'o-50': isEmpty( wizardData ) } ) }>
			<Platform />
			{ 'nrh' === wizardData.platform_data?.platform && (
				<p>
					{ __(
						'To edit settings for News Revenue Hub, visit the Reader Revenue section from the Newspack dashboard.',
						'newspack-plugin'
					) }
				</p>
			) }
			{ 'other' === wizardData.platform_data?.platform && (
				<p>
					{ __(
						'Use a third-party reader revenue platform.',
						'newspack-plugin'
					) }
				</p>
			) }
			{ 'wc' === wizardData.platform_data?.platform && (
				<>
					<p>
						{ __(
							'Use Newspack’s advanced integration with WooCommerce. For more configuration options, visit the Reader Revenue section from the Newspack dashboard.',
							'newspack-plugin'
						) }
					</p>
					<DonationAmounts />
				</>
			) }
		</div>
	);
};

export default ReaderRevenue;
