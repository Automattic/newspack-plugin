/**
 * New/Edit Ad Unit Screen
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { Button, Card, Grid, TextControl, withWizardScreen } from '../../../../components/src';
import AdUnitSizeControl, {
	DEFAULT_SIZES as adUnitSizes,
} from '../../components/ad-unit-size-control';

/**
 * New/Edit Ad Unit Screen.
 */
class AdUnit extends Component {
	/**
	 * Handle an update to an ad unit field.
	 *
	 * @param {string} key Ad Unit field
	 * @param {any}  value New value for field
	 *
	 */
	handleOnChange( key, value ) {
		const { adUnit, onChange, service } = this.props;
		onChange( { ...adUnit, ad_service: service, [ key ]: value } );
	}

	/**
	 * Render.
	 */
	render() {
		const { adUnit, onSave, service, serviceData = {} } = this.props;
		const { id, code, name = '' } = adUnit;
		const isLegacy = false === serviceData.status?.can_connect || adUnit.is_legacy;
		const isExistingAdUnit = id !== 0;
		const sizes =
			adUnit.sizes && Array.isArray( adUnit.sizes ) ? adUnit.sizes : [ adUnitSizes[ 0 ] ];
		return (
			<>
				<Card headerActions noBorder>
					<h2>{ __( 'Ad Unit Details', 'newspack' ) }</h2>
				</Card>

				<Grid gutter={ 32 }>
					<TextControl
						label={ __( 'Name', 'newspack' ) }
						value={ name || '' }
						onChange={ value => this.handleOnChange( 'name', value ) }
					/>
					{ ( isExistingAdUnit || isLegacy ) && (
						<TextControl
							label={ __( 'Code', 'newspack' ) }
							value={ code || '' }
							className="code"
							help={
								isLegacy
									? undefined
									: __(
											"Identifies the ad unit in the associated ad tag. Once you've created the ad unit, you can't change the code.",
											'newspack'
									  )
							}
							disabled={ ! isLegacy }
							onChange={ value => this.handleOnChange( 'code', value ) }
						/>
					) }
				</Grid>

				<Card headerActions noBorder>
					<h2>
						{ sizes.length > 1
							? __( 'Ad Unit Sizes', 'newspack' )
							: __( 'Ad Unit Size', 'newspack' ) }
					</h2>
					<Button
						isSecondary
						isSmall
						onClick={ () => this.handleOnChange( 'sizes', [ ...sizes, adUnitSizes[ 0 ] ] ) }
					>
						{ __( 'Add New Size', 'newspack' ) }
					</Button>
				</Card>

				<Grid columns={ 4 } gutter={ 8 } className="newspack-grid__thead">
					<strong>{ __( 'Size', 'newspack' ) }</strong>
					<strong>{ __( 'Width', 'newspack' ) }</strong>
					<strong>{ __( 'Height', 'newspack' ) }</strong>
					<span className="screen-reader-text">{ __( 'Action', 'newspack' ) }</span>
				</Grid>

				{ sizes.map( ( size, index ) => (
					<Grid columns={ 4 } gutter={ 8 } className="newspack-grid__tbody" key={ index }>
						<AdUnitSizeControl
							value={ size }
							onChange={ value => {
								sizes[ index ] = value;
								this.handleOnChange( 'sizes', sizes );
							} }
						/>
						<Button
							isQuaternary
							onClick={ () => {
								sizes.splice( index, 1 );
								this.handleOnChange( 'sizes', sizes );
							} }
							icon={ trash }
							disabled={ sizes.length <= 1 }
							label={ __( 'Delete', 'newspack' ) }
							showTooltip={ true }
						/>
					</Grid>
				) ) }

				<div className="newspack-buttons-card">
					<Button
						disabled={ name.length === 0 || ( isLegacy && code.length === 0 ) }
						isPrimary
						onClick={ () => onSave( id ) }
					>
						{ __( 'Save', 'newspack' ) }
					</Button>
					<Button isSecondary href={ `#/${ service }` }>
						{ __( 'Cancel', 'newspack' ) }
					</Button>
				</div>
			</>
		);
	}
}

export default withWizardScreen( AdUnit );
