/**
 * Ad Services view.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SelectControl } from '../../../../../components/src';
import './style.scss';

/**
 * Ad Picker
 */
class AdPicker extends Component {
	adUnitsForSelect = adUnits => {
		return [
			{
				label: __( 'Select an ad unit' ),
				value: null,
			},
			...Object.values( adUnits ).map( adUnit => {
				return {
					label: adUnit.name,
					value: adUnit.id,
				};
			} ),
		];
	};

	adServicesForSelect = services => {
		return [
			{
				label: __( 'Select an ad provider' ),
				value: null,
			},
			...Object.keys( services ).map( key => {
				return {
					label: services[ key ].label,
					value: key,
				};
			} ),
		];
	};

	needsAdUnit = value => {
		const { service } = value;
		return 'google_ad_manager' === service;
	};

	/**
	 * Render.
	 */
	render() {
		const { adUnits, onChange, services, value } = this.props;
		const { service, ad_unit: adUnit } = value;
		return (
			<div className="newspack-ad-picker">
				<SelectControl
					label={ __( 'Ad Provider' ) }
					value={ service || '' }
					options={ this.adServicesForSelect( services ) }
					onChange={ service => onChange( { ...value, service } ) }
				/>
				{ this.needsAdUnit( value ) && (
					<SelectControl
						label={ __( 'Ad Unit' ) }
						value={ adUnit || '' }
						options={ this.adUnitsForSelect( adUnits ) }
						onChange={ adUnit => onChange( { ...value, adUnit } ) }
					/>
				) }
			</div>
		);
	}
}

export default AdPicker;
