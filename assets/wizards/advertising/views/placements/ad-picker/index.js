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
import { Grid, SelectControl } from '../../../../../components/src';
import './style.scss';

/**
 * Ad Picker
 */
class AdPicker extends Component {
	adUnitsForSelect = adUnits => {
		return [
			{
				label: '---',
				value: null,
			},
			...Object.values( adUnits ).map( adUnit => {
				return {
					label: adUnit.name,
					value: adUnit.id,
					disabled: adUnit.status === 'INACTIVE',
				};
			} ),
		];
	};

	adServicesForSelect = services => {
		return [
			{
				label: '---',
				value: null,
			},
			...Object.keys( services )
				.map(
					key =>
						services[ key ].enabled && {
							label: services[ key ].label,
							value: key,
						}
				)
				.filter( option => option ),
		];
	};

	needsAdUnit = value => {
		const { services } = this.props;
		const { service } = value;
		return (
			'google_ad_manager' === service &&
			services.google_ad_manager &&
			services.google_ad_manager.enabled
		);
	};

	/**
	 * Render.
	 */
	render() {
		const { adUnits, onChange, services, value } = this.props;
		const { service, ad_unit: adUnit } = value;
		return (
			<Grid gutter={ 32 }>
				<SelectControl
					label={ __( 'Ad Provider', 'newspack' ) }
					value={ service || '' }
					options={ this.adServicesForSelect( services ) }
					onChange={ _service => onChange( { ...value, service: _service } ) }
				/>
				{ this.needsAdUnit( value ) && (
					<SelectControl
						label={ __( 'Ad Unit', 'newspack' ) }
						value={ adUnit || '' }
						options={ this.adUnitsForSelect( adUnits ) }
						onChange={ _adUnit => onChange( { ...value, adUnit: _adUnit } ) }
					/>
				) }
			</Grid>
		);
	}
}

export default AdPicker;
