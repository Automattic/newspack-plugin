/**
 * Subscriptions Wizard.
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
import ManageSubscriptionsScreen from './views/manageSubscriptionsScreen';
import EditSubscriptionScreen from './views/editSubscriptionScreen';
import { withWizard } from '../../components/src';
import './style.scss';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * Subscriptions wizard for managing and setting up subscriptions.
 */
class SubscriptionsWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			subscriptions: [],
			choosePrice: false,
		};
	}

	/**
	 * wizardReady will be called when all plugin requirements are met.
	 */
	onWizardReady = () => {
		this.refreshSubscriptions();
		this.refreshChoosePrice();
	};

	/**
	 * Get the latest subscriptions info.
	 */
	refreshSubscriptions( callback ) {
		const { setError } = this.props;
		return apiFetch( { path: '/newspack/v1/wizard/subscriptions' } )
			.then( subscriptions => {
				const result = subscriptions.reduce( ( result, value ) => {
					result[ value.id ] = value;
					return result;
				}, {} );
				return new Promise( resolve => {
					this.setState(
						{
							subscriptions: result,
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
	 * Save the fields to a susbcription.
	 */
	saveSubscription( subscription ) {
		const { setError } = this.props;
		const { id, name, image, price, frequency } = subscription;
		const image_id = image ? image.id : 0;
		return new Promise( ( resolve, reject ) => {
			apiFetch( {
				path: '/newspack/v1/wizard/subscriptions',
				method: 'post',
				data: {
					id,
					name,
					image_id,
					price,
					frequency,
				},
			} )
				.then( subscription => {
					setError().then( () => resolve( subscription ) );
				} )
				.catch( error => {
					setError( error ).then( () => reject( error ) );
				} );
		} );
	}

	/**
	 * Delete a subscription.
	 *
	 * @param int id Subscription ID.
	 */
	deleteSubscription( id ) {
		const { setError } = this.props;
		if ( confirm( __( 'Are you sure you want to delete this subscription?' ) ) ) {
			apiFetch( {
				path: '/newspack/v1/wizard/subscriptions/' + id,
				method: 'delete',
			} )
				.then( response => {
					this.refreshSubscriptions();
				} )
				.catch( error => {
					this.setError( error );
				} );
		}
	}

	/**
	 * Get the latest info about the choosePrice setting.
	 */
	refreshChoosePrice() {
		apiFetch( { path: '/newspack/v1/wizard/subscriptions/choose-price' } ).then( choosePrice => {
			this.setState( {
				choosePrice: !! choosePrice,
			} );
		} );
	}

	/**
	 * Enable/Disable Name-Your-Price for Newspack subscriptions.
	 */
	toggleChoosePrice() {
		this.setState(
			{
				choosePrice: ! this.state.choosePrice,
			},
			() => {
				apiFetch( {
					path: '/newspack/v1/wizard/subscriptions/choose-price',
					method: 'post',
					data: {
						enabled: this.state.choosePrice,
					},
				} ).then( response => {
					this.refreshSubscriptions();
				} );
			}
		);
	}

	onSubscriptionChange = subscription => {
		this.setState( prevState => ( {
			subscriptions: {
				...prevState.subscriptions,
				[ subscription.id ]: subscription,
			},
		} ) );
	};

	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { subscriptions, choosePrice } = this.state;
		return (
			<HashRouter hashType="slash">
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ routeProps => (
							<ManageSubscriptionsScreen
								headerText={
									Object.values( subscriptions ).length
										? __( 'Any more subscriptions to add?' )
										: __( 'Add your first subscription' )
								}
								subHeaderText={ __(
									'Subscriptions can provide a stable, recurring source of revenue'
								) }
								subscriptions={ Object.values( subscriptions ) }
								choosePrice={ choosePrice }
								onClickDeleteSubscription={ subscription =>
									this.deleteSubscription( subscription.id )
								}
								onClickChoosePrice={ () => this.toggleChoosePrice() }
								buttonText={
									subscriptions.length
										? __( 'Add another subscription' )
										: __( 'Add a subscription' )
								}
								buttonAction="#/create"
							/>
						) }
					/>
					<Route
						path="/edit/:id"
						render={ routeProps => {
							return (
								<EditSubscriptionScreen
									headerText={ __( 'Edit subscription' ) }
									subHeaderText={ __( 'You are editing an existing subscription' ) }
									subscription={ subscriptions[ routeProps.match.params.id ] || {} }
									onChange={ this.onSubscriptionChange }
									onClickSave={ subscription =>
										this.saveSubscription( subscription ).then( () => this.refreshSubscriptions() )
									}
								/>
							);
						} }
					/>
					<Route
						path="/create"
						render={ routeProps => {
							return (
								<EditSubscriptionScreen
									headerText={ __( 'Add a subscription' ) }
									subHeaderText={ __( 'You are adding a new subscription' ) }
									subscription={
										subscriptions[ 0 ] || {
											id: 0,
											name: '',
											image_id: 0,
											price: '',
											frequency: '',
										}
									}
									onChange={ this.onSubscriptionChange }
									onClickSave={ subscription =>
										this.saveSubscription( subscription ).then( newSubscription => {
											return this.refreshSubscriptions().then( () =>
												routeProps.history.push( `edit/${ newSubscription.id }` )
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
		withWizard( SubscriptionsWizard, [
			'woocommerce',
			'woocommerce-subscriptions',
			'woocommerce-name-your-price',
			'woocommerce-one-page-checkout',
		] ),
		{
			buttonText: __( 'Back to checklist' ),
			buttonAction: newspack_urls[ 'checklists' ][ 'memberships' ],
		}
	),
	document.getElementById( 'newspack-subscriptions-wizard' )
);
