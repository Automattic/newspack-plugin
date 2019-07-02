/**
 * Google Ad Manager Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, render } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizard } from '../../components/src';
import ManageAdUnitsScreen from './views/manageAdUnitsScreen';
import EditAdUnitScreen from './views/editAdUnitsScreen';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * AdUnits wizard for managing and setting up adUnits.
 */
class GoogleAdManagerWizard extends Component {

	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			adUnits: [],
		};
	}

	/**
	 * wizardReady will be called when all plugin requirements are met.
	 */
	onWizardReady = () => {
		this.refreshAdUnits();
	};

	/**
	 * Get the latest adUnits info.
	 */
	refreshAdUnits() {
		const { setError } = this.props;
		return apiFetch( { path: '/newspack/v1/wizard/adunits' } )
			.then( adUnits => {
				const result = adUnits.reduce( ( result, value ) => {
					result[ value.id ] = value;
					return result;
				}, {} );
				return new Promise( resolve => {
					this.setState(
						{
							adUnits: result,
						},
						() => {
							setError();
							resolve( this.state );
						}
					);
				} );
			} )
			.catch( error => {
				this.setError( error );
			} );
	}

	/**
	 * Save the fields to an ad unit.
	 */
	saveAdUnit( adUnit ) {
		const { setError } = this.props;
		const { id, name, code } = adUnit;
		return new Promise( ( resolve, reject ) => {
			apiFetch( {
				path: '/newspack/v1/wizard/adunits',
				method: 'post',
				data: {
					id,
					name,
					code,
				},
			} )
				.then( adUnit => {
					setError().then( () => resolve( adUnit ) );
				} )
				.catch( error => {
					setError( error ).then( () => reject( error ) );
				} );
		} );
	}

	/**
	 * Delete an ad unit.
	 *
	 * @param int id Ad Unit ID.
	 */
	deleteAdUnit( id ) {
		const { setError } = this.props;
		if ( confirm( __( 'Are you sure you want to delete this ad unit?' ) ) ) {
			apiFetch( {
				path: '/newspack/v1/wizard/adunits/' + id,
				method: 'delete',
			} )
				.then( response => {
					this.refreshAdUnits();
				} )
				.catch( error => {
					this.setError( error );
				} );
		}
	}

	onAdUnitChange = adUnit => {
		this.setState( prevState => ( {
			adUnits: {
				...prevState.adUnits,
				[ adUnit.id ]: adUnit,
			},
		} ) );
	};

	/**
	 * Render
	 */
	render() {
		const { adUnits } = this.state;
		return (
			<HashRouter hashType="slash">
				<Switch>
					<Route
						path="/"
						exact
						render={ routeProps => (
							<ManageAdUnitsScreen
								headerText={
									Object.values( adUnits ).length
										? __( 'Any more ad units to add?' )
										: __( 'Add your first ad unit.' )
								}
								subHeaderText={ __(
									'Paste your ad code from Google Ad Manager and give it a descriptive name.'
								) }
								adUnits={ Object.values( adUnits ) }
								onClickDeleteAdUnit={ adUnit =>
									this.deleteAdUnit( adUnit.id )
								}
								buttonText={
									adUnits.length
										? __( 'Add another ad unit' )
										: __( 'Add an ad unit' )
								}
								buttonAction="#/create"
								noBackground
							/>
						) }
					/>
					<Route
						path="/edit/:id"
						render={ routeProps => {
							return (
								<EditAdUnitScreen
									headerText={ __( 'Edit ad unit' ) }
									subHeaderText={ __( 'You are editing an existing ad unit' ) }
									adUnit={ adUnits[ routeProps.match.params.id ] || {} }
									onChange={ this.onAdUnitChange }
									onClickSave={ adUnit =>
										this.saveAdUnit( adUnit ).then( newAdUnit => {
											return this.refreshAdUnits().then( () =>
												routeProps.history.push( '/' )
											);
										} )
									}
								/>
							);
						} }
					/>
					<Route
						path="/create"
						render={ routeProps => {
							return (
								<EditAdUnitScreen
									headerText={ __( 'Add an ad unit' ) }
									subHeaderText={ __( 'You are adding a new ad unit' ) }
									adUnit={
										adUnits[ 0 ] || {
											id: 0,
											name: '',
											code: '',
										}
									}
									onChange={ this.onAdUnitChange }
									onClickSave={ adUnit =>
										this.saveAdUnit( adUnit ).then( newAdUnit => {
											return this.refreshAdUnits().then( () =>
												routeProps.history.push( '/' )
											);
										} )
									}
								/>
							);
						} }
					/>
					<Redirect to="/" />
				</Switch>
			</HashRouter>
		);
	}

}

render(
	createElement(
		withWizard( GoogleAdManagerWizard ),
		{
			buttonText: __( 'Back to checklist' ),
			buttonAction: newspack_urls[ 'checklists' ][ 'advertising' ],
		}
	),
	document.getElementById( 'newspack-google-ad-manager-wizard' )
);
