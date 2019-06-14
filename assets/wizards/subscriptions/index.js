/**
 * Subscriptions Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ManageSubscriptionsScreen from './views/manageSubscriptionsScreen';
import EditSubscriptionScreen from './views/editSubscriptionScreen';
import {
	FormattedHeader,
	Wizard,
	WizardScreen,
} from '../../components/src';
import './style.scss';

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
			error: false,
			subscriptions: [],
			editing: false,
			choosePrice: false,
		};
	}

	/**
	 * Get info when wizard is first loaded.
	 */
	onWizardReady() {
		this.refreshSubscriptions();
		this.refreshChoosePrice();
	}

	/**
	 * Get the latest subscriptions info.
	 */
	refreshSubscriptions() {
		apiFetch( { path: '/newspack/v1/wizard/subscriptions' } ).then( subscriptions => {
			this.setState( {
				subscriptions: subscriptions,
			} );
		} );
	}

	/**
	 * Save the fields to a susbcription.
	 */
	saveSubscription() {
		const { id, name, image, price, frequency } = this.state.editing;
		const image_id = image ? image.id : 0;

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
		} ).then( response => {
			this.setState(
				{
					editing: false,
				},
				() => {
					this.refreshSubscriptions();
				}
			);
		} );
	}

	/**
	 * Delete a subscription.
	 *
	 * @param int id Subscription ID.
	 */
	deleteSubscription( id ) {
		if ( confirm( __( 'Are you sure you want to delete this subscription?' ) ) ) {
			apiFetch( {
				path: '/newspack/v1/wizard/subscriptions/' + id,
				method: 'delete',
			} ).then( response => {
				this.refreshSubscriptions();
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

	/**
	 * Render.
	 */
	render() {
		const { subscriptions, editing, choosePrice, error } = this.state;
		const currentScreen = !! editing ? 'edit-subscription' : 'manage-subscriptions';
		const editingExistingSubscription = editing && editing.id;

		let heading = '';
		let subHeading = '';
		let buttonText = '';
		let subButtonText = '';
		switch ( currentScreen ) {
			case 'edit-subscription':
				heading = editingExistingSubscription
					? __( 'Edit subscription' )
					: __( 'Add a subscription' );
				subHeading = editingExistingSubscription
					? __( 'You are editing an existing subscription' )
					: __( 'You are adding a new subscription' );
				buttonText = __( 'Save' );
				subButtonText = __( 'Cancel' );
				break;
			case 'manage-subscriptions':
				heading = subscriptions.length
					? __( 'Any more subscriptions to add?' )
					: __( 'Add your first subscription' );
				subHeading = __( 'Subscriptions can provide a stable, recurring source of revenue' );
				buttonText = subscriptions.length
					? __( 'Add another subscription' )
					: __( 'Add a subscription' );
				subButtonText = __( "I'm done adding" );
				break;
		}

		return (
			<Fragment>
				{ heading && <FormattedHeader headerText={ heading } subHeaderText={ subHeading } /> }
				<Wizard
					requiredPlugins={ [ 'woocommerce' ] }
					activeScreen={ currentScreen }
					requiredPluginsCancelText={ __( 'Back to checklist' ) }
					onRequiredPluginsCancel={ () => window.location = newspack_urls['checklists']['memberships'] }
					onPluginRequirementsMet={ () => this.onWizardReady() }
					error={ error }
				>
					<WizardScreen
						identifier='manage-subscriptions'
						completeButtonText={ buttonText }
						onCompleteButtonClicked={ () => this.setState( 
							{
								editing: {
									id: 0,
									name: '',
									image: null,
									price: '',
									frequency: 'month',
								}
							} 
						) }
						subCompleteButtonText={ subButtonText }
						onSubCompleteButtonClicked={ () => window.location = newspack_urls['checklists']['memberships'] }
						noBackground
					>
						<ManageSubscriptionsScreen
							subscriptions={ subscriptions }
							choosePrice={ choosePrice }
							onClickEditSubscription={ subscription => this.setState( { editing: subscription } ) }
							onClickDeleteSubscription={ subscription => this.deleteSubscription( subscription.id ) }
							onClickChoosePrice={ () => this.toggleChoosePrice() }
						/>
					</WizardScreen>
					<WizardScreen
						identifier='edit-subscription'
						completeButtonText={ buttonText }
						onCompleteButtonClicked={ () => this.saveSubscription() }
						subCompleteButtonText={ subButtonText }
						onSubCompleteButtonClicked={ () => this.setState( { editing: false } ) }
					>
						<EditSubscriptionScreen
							subscription={ editing }
							onChange={ subscription => this.setState( { editing: subscription } ) }
							onClickSave={ subscription => this.saveSubscription( subscription ) }
							onClickCancel={ () => this.setState( { editing: false } ) }
						/>
					</WizardScreen>
				</Wizard>
			</Fragment>
		);
	}
}

render( <SubscriptionsWizard />, document.getElementById( 'newspack-subscriptions-wizard' ) );
