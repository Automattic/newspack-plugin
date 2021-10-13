/**
 * New/Edit Ad Unit Screen
 */

/**
 * WordPress dependencies.
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import {
	Notice,
	Button,
	Card,
	Grid,
	TextControl,
	CheckboxControl,
	withWizardScreen,
} from '../../../../components/src';
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
		const { id, code, fluid = false, name = '' } = adUnit;
		const isLegacy = false === serviceData.status?.can_connect || adUnit.is_legacy;
		const isExistingAdUnit = id !== 0;
		const sizes = adUnit.sizes && Array.isArray( adUnit.sizes ) ? adUnit.sizes : [];
		const isInvalidSize = ! fluid && sizes.length === 0;
		return (
			<Fragment>
				<h2>{ __( 'Ad Unit Details', 'newspack' ) }</h2>
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
				{ sizes.map( ( size, index ) => (
					<Card noBorder className="newspack-advertising-wizard__ad-unit-size" key={ index }>
						<Grid columns={ 1 } gutter={ 16 }>
							<div className="flex flex-wrap items-center">
								<h2>
									{ sizes.length > 1
										? __( 'Ad Unit Size #', 'newspack' ) + ( index + 1 )
										: __( 'Ad Unit Size', 'newspack' ) }
								</h2>
								<span className="sep" />
								<Button
									isLink
									isDestructive
									onClick={ () => {
										sizes.splice( index, 1 );
										this.handleOnChange( 'sizes', sizes );
									} }
								>
									{ __( 'Delete', 'newspack' ) }
								</Button>
							</div>
							<AdUnitSizeControl
								value={ size }
								onChange={ value => {
									sizes[ index ] = value;
									this.handleOnChange( 'sizes', sizes );
								} }
							/>
						</Grid>
					</Card>
				) ) }
				<Button
					isSecondary
					onClick={ () => this.handleOnChange( 'sizes', [ ...sizes, adUnitSizes[ 0 ] ] ) }
				>
					{ __( 'Add new size', 'newspack' ) }
				</Button>
				<div className="clear" />
				<CheckboxControl
					label={ __( 'Fluid size for native ads', 'newspack' ) }
					onChange={ value => this.handleOnChange( 'fluid', value ) }
					checked={ fluid }
					help={ __(
						'Fluid is a native ad size that allows more flexibility when styling your ad. Ad Manager automatically sizes the ad by filling the width of the enclosing column and adjusting the height as appropriate (just like a regular HTML div on your site).',
						'newspack'
					) }
				/>
				{ isInvalidSize && (
					<Notice
						isWarning
						noticeText={ __(
							'The ad unit must have at least one valid size or fluid size enabled.',
							'newspack'
						) }
					/>
				) }
				<div className="newspack-buttons-card">
					<Button
						disabled={ name.length === 0 || ( isLegacy && code.length === 0 ) || isInvalidSize }
						isPrimary
						onClick={ () => onSave( id ) }
					>
						{ __( 'Save', 'newspack' ) }
					</Button>
					<Button isSecondary href={ `#/${ service }` }>
						{ __( 'Cancel', 'newspack' ) }
					</Button>
				</div>
			</Fragment>
		);
	}
}

export default withWizardScreen( AdUnit );
