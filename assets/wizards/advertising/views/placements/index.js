/**
 * Ad Services view.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, TabbedNavigation, SelectControl, ToggleGroup, withWizardScreen } from '../../../../components/src';

/**
 * Advertising management screen.
 */
class Placements extends Component {

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

	/**
	 * Render.
	 */
	render() {
		const { togglePlacement, placements, adUnits, onChange } = this.props;
		const {
			global_above_header,
			global_below_header,
			global_above_footer,
			archives,
			search_results,
		} = placements;
		return (
			<Fragment>
				<h4>Pre-defined ad placements</h4>
				<p>
					Define global advertising placements to serve ad units on your site. Enable the individual
					pre-defined ad placements to select which ads to serve.
				</p>
				<ToggleGroup
					title={ __( 'Global: Above Header' ) }
					description={ __( 'Choose an ad unit to display above the header' ) }
					checked={ global_above_header && global_above_header.enabled }
					onChange={ value => togglePlacement( 'global_above_header', value ) }
				>
					<SelectControl
						label={ __( 'Ad Unit' ) }
						value={ global_above_header.ad_unit || '' }
						options={ this.adUnitsForSelect( adUnits ) }
						onChange={ adUnit => onChange( 'global_above_header', adUnit ) }
					/>
				</ToggleGroup>
				<ToggleGroup
					title={ __( 'Global: Below Header' ) }
					description={ __( 'Choose an ad unit to display above the header' ) }
					checked={ global_below_header && global_below_header.enabled }
					onChange={ value => togglePlacement( 'global_below_header', value ) }
				>
					<SelectControl
						label={ __( 'Ad Unit' ) }
						value={ global_below_header.ad_unit || '' }
						options={ this.adUnitsForSelect( adUnits ) }
						onChange={ adUnit => onChange( 'global_below_header', adUnit ) }
					/>
				</ToggleGroup>
				<ToggleGroup
					title={ __( 'Global: Above Footer' ) }
					description={ __( 'Choose an ad unit to display above the header' ) }
					checked={ global_above_footer && global_above_footer.enabled }
					onChange={ value => togglePlacement( 'global_above_footer', value ) }
				>
					<SelectControl
						label={ __( 'Ad Unit' ) }
						value={ global_above_footer.ad_unit || '' }
						options={ this.adUnitsForSelect( adUnits ) }
						onChange={ adUnit => onChange( 'global_above_footer', adUnit ) }
					/>
				</ToggleGroup>
				<ToggleGroup
					title={ __( 'Archives' ) }
					description={ __( 'Choose an ad unit to display above the header' ) }
					checked={ archives && archives.enabled }
					onChange={ value => togglePlacement( 'archives', value ) }
				>
					<SelectControl
						label={ __( 'Ad Unit' ) }
						value={ archives.ad_unit || '' }
						options={ this.adUnitsForSelect( adUnits ) }
						onChange={ adUnit => onChange( 'archives', adUnit ) }
					/>
				</ToggleGroup>
				<ToggleGroup
					title={ __( 'Search Results' ) }
					description={ __( 'Choose an ad unit to display above the header' ) }
					checked={ search_results && search_results.enabled }
					onChange={ value => togglePlacement( 'search_results', value ) }
				>
					<SelectControl
						label={ __( 'Ad Unit' ) }
						value={ search_results.ad_unit || '' }
						options={ this.adUnitsForSelect( adUnits ) }
						onChange={ adUnit => onChange( 'search_results', adUnit ) }
					/>
				</ToggleGroup>
			</Fragment>
		);
	}
}

export default withWizardScreen( Placements );
