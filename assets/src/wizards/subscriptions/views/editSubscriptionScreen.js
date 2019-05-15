/**
 * New/Edit Subscription Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import Card from '../../../components/card';
import FormattedHeader from '../../../components/formattedHeader';
import Button from '../../../components/button';
import TextControl from '../../../components/textControl';
import ImageUpload from '../../../components/imageUpload';
import SelectControl from '../../../components/selectControl';
import ManageSubscriptionsScreen from './manageSubscriptionsScreen';

/**
 * New/Edit Subscription Screen.
 */
class EditSubscriptionScreen extends Component {

	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			subscription: []
		}
	}

	componentDidMount() {
		// get subscription info
	}

	/**
	 * Render.
	 */
	render() {
		const { subscription_id, changeScreen } = this.props;
		const editing_existing_subscription = !! subscription_id;
		const heading = editing_existing_subscription ? __( 'Edit subscription' ) : __( 'Add a subscription' );
		const subHeading = editing_existing_subscription ? __( 'Editing an existing subscription' ) : __( 'Adding a new subscription' );

		return(
			<div className='newspack-edit-subscription-screen'>
				<FormattedHeader
					headerText={ heading  }
					subHeaderText={ subHeading }
				/>
				<Card>
					<TextControl label={ __( 'What is this product called? e.g. Valued Donor' ) } />
					<ImageUpload />
					<TextControl label={ __( 'Price' ) } />
					<SelectControl label={ __( 'Frequency' ) } options={ [
							{ value: 'month', label: __( 'per month' ) },
							{ value: 'year', label: __( 'per year' ) },
							{ value: 'once', label: __( 'once' ) },
						] }
						value={ 'month' }
					/>
					<Button isPrimary className='is-centered' onClick={ () => changeScreen( ManageSubscriptionsScreen ) } >{ __( 'Save' ) }</Button>
					<a className='newspack-edit-subscription-screen__cancel' href='#goback'>{ __( 'Cancel' ) }</a>
				</Card>
			</div>
		);
	}
}

export default EditSubscriptionScreen;
