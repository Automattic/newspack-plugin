/**
 * Location Setup Screen
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Card,
	Grid,
	SelectControl,
	TextControl,
	withWizardScreen,
} from '../../../../components/src';

/**
 * Location Setup Screen Component
 */
class LocationSetup extends Component {
	/**
	 * Render.
	 */
	render() {
		const { renderError, countryStateFields, currencyFields, data, onChange } = this.props;
		const {
			address1 = '',
			address2 = '',
			city = '',
			countrystate = '',
			currency = '',
			postcode = '',
		} = data;
		return (
			<>
				{ renderError() }
				<Grid gutter={ 32 } rowGap={ 16 }>
					<Card noBorder>
						<TextControl
							label={ __( 'Address', 'newspack' ) }
							value={ address1 }
							onChange={ _address1 => onChange( { ...data, address1: _address1 } ) }
						/>
						<TextControl
							label={ __( 'Address line 2', 'newspack' ) }
							value={ address2 }
							onChange={ _address2 => onChange( { ...data, address2: _address2 } ) }
						/>
						<SelectControl
							label={ __( 'Country', 'newspack' ) }
							value={ countrystate }
							options={ countryStateFields }
							onChange={ _countrystate => onChange( { ...data, countrystate: _countrystate } ) }
						/>
					</Card>
					<Card noBorder>
						<TextControl
							label={ __( 'City', 'newspack' ) }
							value={ city }
							onChange={ _city => onChange( { ...data, city: _city } ) }
						/>
						<TextControl
							label={ __( 'Postcode / Zip', 'newspack' ) }
							value={ postcode }
							onChange={ _postcode => onChange( { ...data, postcode: _postcode } ) }
						/>
						<SelectControl
							label={ __( 'Currency', 'newspack' ) }
							value={ currency }
							options={ currencyFields }
							onChange={ _currency => onChange( { ...data, currency: _currency } ) }
						/>
					</Card>
				</Grid>
			</>
		);
	}
}

LocationSetup.defaultProps = {
	countryStateFields: [ {} ],
	currencyFields: [ {} ],
	data: {},
	onChange: () => null,
};

export default withWizardScreen( LocationSetup );
