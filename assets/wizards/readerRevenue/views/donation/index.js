/**
 * Donation Settings Screen
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies.
 */
import { values } from 'lodash';

/**
 * Internal dependencies.
 */
import { MoneyInput } from '../../components/';
import {
	Card,
	Grid,
	Button,
	Notice,
	ToggleControl,
	withWizardScreen,
} from '../../../../components/src';

export const DontationAmounts = ( { data, onChange } ) => {
	const {
		suggestedAmounts = [ 0, 0, 0 ],
		suggestedAmountUntiered = 0,
		currencySymbol = '$',
		tiered = false,
	} = data;

	return (
		<>
			<h2>{ __( 'Suggested donations' ) }</h2>
			<p>
				{ __(
					'Set suggested monthly donation amounts. The one-time and annual suggested donation amount will be adjusted according to the monthly amount.'
				) }
			</p>
			<ToggleControl
				label={ __( 'Set exact monthly donation tiers' ) }
				checked={ tiered }
				onChange={ _tiered => onChange( { ...data, tiered: _tiered } ) }
			/>
			{ tiered ? (
				<Grid columns={ 3 } gutter={ 8 }>
					<MoneyInput
						currencySymbol={ currencySymbol }
						label={ __( 'Low-tier' ) }
						value={ suggestedAmounts[ 0 ] }
						onChange={ value =>
							onChange( { ...data, suggestedAmounts: { ...suggestedAmounts, 0: value } } )
						}
					/>
					<MoneyInput
						currencySymbol={ currencySymbol }
						label={ __( 'Mid-tier' ) }
						value={ suggestedAmounts[ 1 ] }
						onChange={ value =>
							onChange( { ...data, suggestedAmounts: { ...suggestedAmounts, 1: value } } )
						}
					/>
					<MoneyInput
						currencySymbol={ currencySymbol }
						label={ __( 'High-tier' ) }
						value={ suggestedAmounts[ 2 ] }
						onChange={ value =>
							onChange( { ...data, suggestedAmounts: { ...suggestedAmounts, 2: value } } )
						}
					/>
				</Grid>
			) : (
				<MoneyInput
					currencySymbol={ currencySymbol }
					label={ __( 'Suggested donation amount per month' ) }
					value={ suggestedAmountUntiered }
					onChange={ _suggestedAmountUntiered =>
						onChange( { ...data, suggestedAmountUntiered: _suggestedAmountUntiered } )
					}
				/>
			) }
		</>
	);
};

/**
 * Donation Settings Screen Component
 */
const Donation = ( { data = {}, onChange = () => null, donationPage } ) => {
	const renderErrorNotices = () => {
		if ( data.errors && values( data.errors ).length ) {
			return values( data.errors ).map( ( error, i ) => (
				<Notice key={ i } isError noticeText={ error } />
			) );
		}
	};

	return (
		<>
			{ renderErrorNotices() }
			<Grid>
				{ donationPage && (
					<Card noBorder>
						<h2>{ __( 'Donations landing page' ) }</h2>
						{ 'publish' === donationPage.status ? (
							<Notice
								isSuccess
								noticeText={ __( 'Your donations landing page is set up and published.' ) }
							/>
						) : (
							<Notice
								isError
								noticeText={ __(
									"Your donations landing page has been created, but is not yet published. You can now edit it and publish when you're ready."
								) }
							/>
						) }
						<Button isSecondary href={ donationPage.editUrl }>
							{ __( 'Edit Page' ) }
						</Button>
					</Card>
				) }
				<Card noBorder>
					<DontationAmounts data={ data } onChange={ onChange } />
				</Card>
			</Grid>
		</>
	);
};

export default withWizardScreen( Donation );
