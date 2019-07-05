/**
 * Memberships Page Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, render, Fragment } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { withWizard, FormattedHeader, Handoff } from '../../components/src';
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
			complete: false,
		};
	}

	/**
	 * Check completion status when wizard is ready.
	 */
	onWizardReady = () => {
		// this.refreshComplete();
	};

	/**
	 * When the wizard is marked complete, mark the checklist item complete.
	 */
	componentDidUpdate( prevProps, prevState ) {
	/*	const { complete: alreadyComplete } = prevState;
		const { complete } = this.state;
		if ( ! alreadyComplete && complete ) {
			this.markWizardComplete();
		}*/
	}

	/**
	 * Get whether AdSense setup is complete.
	 */
	refreshComplete() {
		const { setError } = this.props;
		return apiFetch( { path: '/newspack/v1/wizard/newspack-google-adsense-wizard/adsense-setup-complete' } )
			.then( complete => {
				return new Promise( resolve => {
					this.setState(
						{
							complete,
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
		const { complete } = this.state;
		return (
			<HashRouter hashType="slash">
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ routeProps => (
							<Fragment>
								<FormattedHeader
									headerText={ __( 'Memberships Page' ) }
									subHeaderText={ __( 'Create a landing page to feature and promote your membership options.' ) }
								/>
								{ complete && (
									<div className='newspack-memberships-page-wizard-wizard__success'>
										<Dashicon icon="yes-alt" />
										<h4>{ __( 'Your memberships landing page is set up' ) }</h4>
									</div>
								) }
								<Handoff
									plugin='google-site-kit'
									editLink='admin.php?page=googlesitekit-module-adsense'
									className='is-centered'
									isPrimary={ ! complete }
									isDefault={ !! complete }
								>{ complete ? __( 'AdSense Settings' ) : __( 'Set up Google AdSense' ) }</Handoff>
							</Fragment>
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
