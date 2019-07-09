/**
 * Memberships Page Wizard.
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
import { withWizard } from '../../components/src';
import ManageMembershipsPage from './views/manageMembershipsPage';
import './style.scss';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * Subscriptions wizard for managing and setting up subscriptions.
 */
class MembershipsPageWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			page: false,
		};
	}

	/**
	 * Check completion status when wizard is ready.
	 */
	onWizardReady = () => {
		this.refreshMembershipsPage();
	};

	/**
	 * When the wizard is marked complete, mark the checklist item complete.
	 */
	componentDidUpdate( prevProps, prevState ) {
		const { page: pageSet } = prevState;
		const { page } = this.state;
		if ( ! pageSet && page && 'publish' === page.status ) {
			this.markWizardComplete();
		}
	}

	/**
	 * Get memberships page info.
	 */
	refreshMembershipsPage() {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/newspack-memberships-page-wizard/memberships-page' } )
			.then( page => {
				return new Promise( resolve => {
					this.setState(
						{
							page,
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

	createMembershipsPage() {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			 path: '/newspack/v1/wizard/newspack-memberships-page-wizard/create-memberships-page',
			 method: 'post',
			 data: {}, 
		} )
			.then( page => {
				return new Promise( resolve => {
					this.setState(
						{
							page,
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
	 * Mark this wizard as complete.
	 */
	markWizardComplete() {
		const { setError } = this.props;
		return new Promise( ( resolve, reject ) => {
			apiFetch( {
				path: '/newspack/v1/wizards/memberships-page/complete',
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
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { page } = this.state;

		return (
			<HashRouter hashType="slash">
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ routeProps => (
							<ManageMembershipsPage
								headerText={ __( 'Memberships Page' ) }
								subHeaderText={ __( 'Create a landing page to feature and promote your membership options.' ) }
								onClickCreate={ () => this.createMembershipsPage() }
								page={ page } 
								noBackground 
							/>
						) }
					/>
				</Switch>
			</HashRouter>
		);
	}
}

render(
	createElement(
		withWizard( MembershipsPageWizard, [
			'woocommerce',
			'woocommerce-subscriptions',
			'woocommerce-name-your-price',
			'woocommerce-one-page-checkout',
		] ),
		{
			buttonText: __( 'Back to checklist' ),
			buttonAction: newspack_urls[ 'checklists' ][ 'reader-revenue' ],
		}
	),
	document.getElementById( 'newspack-memberships-page-wizard' )
);
