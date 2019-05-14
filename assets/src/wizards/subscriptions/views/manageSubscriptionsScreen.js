/**
 * Subscription Management Screens.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import CheckboxControl from '../../../components/checkboxControl';
import Card from '../../../components/card';
import FormattedHeader from '../../../components/formattedHeader';
import SubscriptionCard from './subscriptionCard';

/**
 * Subscriptions wizard stub for example purposes.
 */
class ManageSubscriptionsScreen extends Component {

	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			subscriptions: []
		}
	}

	componentDidMount() {
		apiFetch( { path: '/newspack/v1/wizard/subscriptions' } ).then( subscriptions => {
			this.setState( {
				subscriptions: subscriptions,
			} );
		} );
	}

	/**
	 * Render the example stub.
	 */
	render() {
		const { subscriptions } = this.state;

		return(
			<div className="newspack-manage-subscriptions-screen">
				<FormattedHeader
					headerText={ __( 'Any more subscriptions to add?' ) }
					subHeaderText={ __( 'Subscriptions can provide a stable, recurring source of revenue' ) }
				/>
				{ subscriptions.map( subscription => {
					return <SubscriptionCard subscription={ subscription } key={ subscription.id } />
				} ) }
				<CheckboxControl
					label={ __( 'Allow members to name their price' ) }
					onChange={ function(){ console.log( 'API REQUEST NOW' ); } }
					tooltip={ __( 'Enabling this makes the subscription price a "Recommended price" and allows subscribers to set the subscription price when purchasing.')}
					help={ __( 'Mostly used for donations' ) }
				/>
				<Button isPrimary>{ __( 'Add another subscription' ) }</Button>
				<a className="newspack-manage-subscriptions-screen__finished" href="#linktochecklisthere">{ __( "I'm done adding" ) }</a>
			</div>
		);
	}
}

export default ManageSubscriptionsScreen;
