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
import { TextControl, SelectControl } from '../../../components/src';

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
		const { location, countrystateFields, currencyFields } = this.props;
		const { countrystate, address1, address2, city, postcode, currency } = location;

		return (
			<div className='newspack-location-setup-screen'>
				<SelectControl
					label={ __( 'Where is your business based?' ) }
					value={ countrystate }
					options={ countrystateFields }
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
					options={ currencyFields }
					onChange={ value => this.handleOnChange( 'currency', value ) }
				/>
			</div>
		);
	}
}

export default LocationSetup;
