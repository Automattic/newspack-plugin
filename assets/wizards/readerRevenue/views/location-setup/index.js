/**
 * Location Setup Screen
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SelectControl, TextControl, withWizardScreen } from '../../../../components/src';

/**
 * Location Setup Screen Component
 */
class LocationSetup extends Component {
	/**
	 * Render.
	 */
	render() {
		const { countryStateFields, currencyFields, location, onChange } = this.props;
		const { address1, address2, city, countrystate, currency, postcode } = location;
		return (
			<Fragment>
				<SelectControl
					label={ __( 'Where is your business based?' ) }
					value={ countrystate }
					options={ countryStateFields }
					onChange={ countrystate => onChange( { ...location, countrystate: value } ) }
				/>
				<TextControl
					label={ __( 'Address' ) }
					value={ address1 }
					onChange={ address1 => onChange( { ...location, address1 } ) }
				/>
				<TextControl
					label={ __( 'Address line 2' ) }
					value={ address2 }
					onChange={ address2 => onChange( { ...location, address2 } ) }
				/>
				<TextControl
					label={ __( 'City' ) }
					value={ city }
					onChange={ city => onChange( { ...location, city } ) }
				/>
				<TextControl
					label={ __( 'Postcode / Zip' ) }
					value={ postcode }
					onChange={ postcode => onChange( { ...location, postcode } ) }
				/>
				<SelectControl
					label={ 'Which currency does your business use?' }
					value={ currency }
					options={ currencyFields }
					onChange={ currency => onChange( { ...location, currency } ) }
				/>
			</Fragment>
		);
	}
}

LocationSetup.defaultProps = {
	countryStateFields: [ {} ],
	currencyFields: [ {} ],
	location: {},
	onChange: () => null,
};

export default withWizardScreen( LocationSetup );
