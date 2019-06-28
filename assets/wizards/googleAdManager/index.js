/**
 * Google Ad Manager Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, render, Fragment } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizard, FormattedHeader, Handoff } from '../../components/src';

/**
 * External dependencies
 */
import ManageAdSlotsScreen from './views/manageAdSlotsScreen';
import EditAdSlotScreen from './views/editAdSlotsScreen';
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * AdSlots wizard for managing and setting up adSlots.
 */
class GoogleAdManagerWizard extends Component {

	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			adSlots: [],
		};
	}

	/**
	 * wizardReady will be called when all plugin requirements are met.
	 */
	onWizardReady = () => {
		this.refreshAdSlots();
	};

	/**
	 * Get the latest adSlots info.
	 */
	refreshAdSlots( callback ) {
		const { setError } = this.props;
		return apiFetch( { path: '/newspack/v1/wizard/adslots' } )
			.then( adSlots => {
				const result = adSlots.reduce( ( result, value ) => {
					result[ value.id ] = value;
					return result;
				}, {} );
				return new Promise( resolve => {
					this.setState(
						{
							adSlots: result,
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
	 * Save the fields to an ad slot.
	 */
	saveAdSlot( adSlot ) {
		const { setError } = this.props;
		const { id, name, code } = adSlot;
		return new Promise( ( resolve, reject ) => {
			apiFetch( {
				path: '/newspack/v1/wizard/adslots',
				method: 'post',
				data: {
					id,
					name,
					code,
				},
			} )
				.then( adSlot => {
					setError().then( () => resolve( adSlot ) );
				} )
				.catch( error => {
					setError( error ).then( () => reject( error ) );
				} );
		} );
	}

	/**
	 * Delete an ad slot.
	 *
	 * @param int id Ad Slot ID.
	 */
	deleteAdSlot( id ) {
		const { setError } = this.props;
		if ( confirm( __( 'Are you sure you want to delete this advert?' ) ) ) {
			apiFetch( {
				path: '/newspack/v1/wizard/adslots/' + id,
				method: 'delete',
			} )
				.then( response => {
					this.refreshAdSlots();
				} )
				.catch( error => {
					this.setError( error );
				} );
		}
	}

	onAdSlotChange = adSlot => {
		this.setState( prevState => ( {
			adSlots: {
				...prevState.adSlots,
				[ adSlot.id ]: adSlot,
			},
		} ) );
	};

	/**
	 * Render
	 */
	render() {
		const { adSlots } = this.state;
		console.log(adSlots);
		return (
			<HashRouter hashType="slash">
				<Switch>
					<Route
						path="/"
						exact
						render={ routeProps => (
							<ManageAdSlotsScreen
								headerText={
									Object.values( adSlots ).length
										? __( 'Any more adverts to add?' )
										: __( 'Add your first advert code' )
								}
								subHeaderText={ __(
									'Paste your ad code from Google Ad Manager and give it a descriptive name.'
								) }
								adSlots={ Object.values( adSlots ) }
								onClickDeleteAdSlot={ adSlot =>
									this.deleteAdSlot( adSlot.id )
								}
								buttonText={
									adSlots.length
										? __( 'Add another advert' )
										: __( 'Add an advert' )
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
								<EditAdSlotScreen
									headerText={ __( 'Edit ad slot' ) }
									subHeaderText={ __( 'You are editing an existing ad slot' ) }
									adSlot={ adSlots[ routeProps.match.params.id ] || {} }
									onChange={ this.onAdSlotChange }
									onClickSave={ adSlot =>
										this.saveAdSlot( adSlot ).then( newAdSlot => {
											return this.refreshAdSlots().then( () =>
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
								<EditAdSlotScreen
									headerText={ __( 'Add an ad slot' ) }
									subHeaderText={ __( 'You are adding a new ad slot' ) }
									adSlot={
										adSlots[ 0 ] || {
											id: 0,
											name: '',
											code: '',
										}
									}
									onChange={ this.onAdSlotChange }
									onClickSave={ adSlot =>
										this.saveAdSlot( adSlot ).then( newAdSlot => {
											return this.refreshAdSlots().then( () =>
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
