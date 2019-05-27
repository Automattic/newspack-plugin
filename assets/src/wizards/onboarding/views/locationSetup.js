/**
 * Location setup Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Card,
	FormattedHeader,
	Button,
	TextControl,
	SelectControl,
} from '../../../components';

// @todo pull this info from WC.
const locationOptions = [
	{ value: 'us', label: __( 'USA' ) },
	{ value: 'uk', label: __( 'UK' ) },
	{ value: 'other', label: __( 'Other' ) },
];
const currencyOptions = [
	{ value: 'usd', label: __( 'USD' ) },
	{ value: 'euro', label: __( 'Euro' ) },
];

/**
 * Location Setup Screen.
 */
class LocationSetup extends Component {

	handleOnChange( key, value ) {
		/*const { subscription, onChange } = this.props;
		subscription[ key ] = value;
		onChange( subscription );*/
	}

	/**
	 * Render.
	 */
	render() {
		return (
			<div className='newspack-location-setup-screen'>
				<FormattedHeader
					headerText={ __( 'About your publication' ) }
					subHeaderText={ __( 'This information is required to accept payments and other features' ) }
				/>
				<Card>
					<SelectControl
						label={ __( 'Where is your business based?' ) }
						value={ '' }
						options={ locationOptions }
						onChange={ value => this.handleOnChange( 'location', value ) }
					/>
					<TextControl
						label={ __( 'Address' ) }
						value={ '' }
						onChange={ value => this.handleOnChange( 'address1', value ) }
					/>
					<TextControl
						label={ __( 'Address line 2' ) }
						value={ '' }
						onChange={ value => this.handleOnChange( 'address2', value ) }
					/>
					<TextControl
						label={ __( 'City' ) }
						value={ '' }
						onChange={ value => this.handleOnChange( 'city', value ) }
					/>
					<TextControl
						label={ __( 'Postcode / Zip' ) }
						value={ '' }
						onChange={ value => this.handleOnChange( 'postcode', value ) }
					/>
					<SelectControl
						label={ 'Which currency does your business use?' }
						value={ '' }
						options={ currencyOptions }
						onChange={ value => this.handleOnChange( 'currency', value ) }
					/>
					<Button isPrimary className="is-centered" onClick={ () => {} }>
						{ __( 'Continue' ) }
					</Button>
					<Button
						className="isLink is-centered is-tertiary"
						href="#"
						onClick={ () => {} }
					>
						{ __( 'Cancel' ) }
					</Button>
				</Card>
			</div>
		);
	}
}

export default LocationSetup;
