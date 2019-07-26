/**
 * Donations Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, render, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DonationSettingsScreen from './views/DonationSettingsScreen';
import { withWizard } from '../../components/src';
import './style.scss';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * Donations wizard for managing and setting up donations.
 */
class DonationsWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			name: '',
			suggestedAmounts: [ 7.50, 15.00, 30.00 ],
			suggestedAmountUntiered: 15.00,
			currencySymbol: '$',
			image: false,
			tiered: false,
		};
	}

	/**
	 * wizardReady will be called when all plugin requirements are met.
	 */
	onWizardReady = () => {
		this.refreshDonationSettings();
	};

	/**
	 * Get the latest donation settings.
	 */
	refreshDonationSettings() {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/newspack-donations-wizard/donation' } )
			.then( settings => {
				const { name, suggestedAmounts, suggestedAmountUntiered, tiered, currencySymbol, image } = settings;
				return new Promise( resolve => {
					this.setState(
						{
							name,
							suggestedAmounts,
							suggestedAmountUntiered,
							currencySymbol,
							tiered,
							image,
						},
						() => {
							setError();
							resolve( this.state );
						}
					);
				} );
			} )
			.catch( error => {
				setError( error );
			} );
	}

	/**
	 * Save the current donation settings.
	 */
	saveDonationSettings() {
		const { setError, wizardApiFetch } = this.props;
		const { name, suggestedAmounts, suggestedAmountUntiered, tiered, image } = this.state;
		const imageID = image ? image.id : 0;
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( {
				path: '/newspack/v1/wizard/newspack-donations-wizard/donation',
				method: 'post',
				data: {
					name,
					imageID,
					suggestedAmounts,
					suggestedAmountUntiered,
					tiered,
				},
			} )
				.then( settings => {
					setError().then( () => resolve( settings ) );
				} )
				.catch( error => {
					setError( error ).then( () => reject( error ) );
				} );
		} );
	}

	/**
	 * Mark this wizard as complete.
	 */
	markWizardComplete() {
		const { setError, wizardApiFetch } = this.props;
		return new Promise( ( resolve, reject ) => {
			wizardApiFetch( {
				path: '/newspack/v1/wizards/donations/complete',
				method: 'post',
				data: {},
			} )
				.then( response => {
					setError().then( () => resolve() );
				} )
				.catch( error => {
					setError( error ).then( () => reject() );
				} );
		} );
	}

	/**
	 * Update the state when a setting changes.
	 *
	 * @param string key The setting.
	 * @param mixed value The setting value.
	 */
	onSettingsChange = ( key, value ) => {
		this.setState( {
			[key]: value
		} );
	}

	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { name, suggestedAmounts, suggestedAmountUntiered, tiered, currencySymbol, image } = this.state;

		return (
			<HashRouter hashType="slash">
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ routeProps => (
							<DonationSettingsScreen
								headerText={ __( 'Donation Settings' ) }
								subHeaderText={ __( 'Donations can provide a stable, recurring source of revenue' ) }
								name={ name }
								suggestedAmounts={ suggestedAmounts }
								suggestedAmountUntiered={ suggestedAmountUntiered }
								currencySymbol={ currencySymbol }
								image={ image }
								tiered={ tiered }
								onChange={ this.onSettingsChange }
								buttonText={ __( 'Finish' ) }
								buttonAction={ () =>
									this.saveDonationSettings()
										.then( () => this.markWizardComplete()
											.then(
												() => ( window.location = newspack_urls[ 'checklists' ][ 'reader-revenue' ] )
											)
										)
								}
							/>
						) }
					/>
					<Redirect to="/" />
				</Switch>
			</HashRouter>
		);
	}
}

render(
	createElement(
		withWizard( DonationsWizard, [
			'woocommerce',
			'woocommerce-subscriptions',
			'woocommerce-name-your-price',
		] ),
		{
			buttonText: __( 'Back to dashboard' ),
			buttonAction: newspack_urls['dashboard'],
		}
	),
	document.getElementById( 'newspack-donations-wizard' )
);
