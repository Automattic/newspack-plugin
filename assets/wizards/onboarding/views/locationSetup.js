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
import { Card, FormattedHeader, Button, TextControl, SelectControl } from '../../../components/src';

/**
 * Location Setup Screen.
 */
class LocationSetup extends Component {
	/**
	 * Handle an update to a setting field.
	 *
	 * @param string key Setting field
	 * @param mixed  value New value for field
	 *
	 */
	handleOnChange( key, value ) {
		const { location, onChange } = this.props;
		location[ key ] = value;
		onChange( location );
	}

	/**
	 * Render.
	 */
	render() {
		const { location, onClickContinue, onClickSkip } = this.props;
		const { countrystate, address1, address2, city, postcode, currency } = location;

		return (
			<div className="newspack-location-setup-screen">
				<FormattedHeader
					headerText={ __( 'About your publication' ) }
					subHeaderText={ __(
						'This information is required for accepting payments and other features'
					) }
				/>
				<Card>
					<SelectControl
						label={ __( 'Where is your business based?' ) }
						value={ countrystate }
						options={ newspack_location_info }
						onChange={ value => this.handleOnChange( 'countrystate', value ) }
					/>
					<TextControl
						label={ __( 'Address' ) }
						value={ address1 }
						onChange={ value => this.handleOnChange( 'address1', value ) }
					/>
					<TextControl
						label={ __( 'Address line 2' ) }
						value={ address2 }
						onChange={ value => this.handleOnChange( 'address2', value ) }
					/>
					<TextControl
						label={ __( 'City' ) }
						value={ city }
						onChange={ value => this.handleOnChange( 'city', value ) }
					/>
					<TextControl
						label={ __( 'Postcode / Zip' ) }
						value={ postcode }
						onChange={ value => this.handleOnChange( 'postcode', value ) }
					/>
					<SelectControl
						label={ 'Which currency does your business use?' }
						value={ currency }
						options={ newspack_currency_info }
						onChange={ value => this.handleOnChange( 'currency', value ) }
					/>
					<Button isPrimary className="is-centered" onClick={ () => onClickContinue() }>
						{ __( 'Continue' ) }
					</Button>
					<Button
						className="isLink is-centered is-tertiary"
						href="#"
						onClick={ () => onClickSkip() }
					>
						{ __( 'Skip' ) }
					</Button>
				</Card>
			</div>
		);
	}
}

export default LocationSetup;
