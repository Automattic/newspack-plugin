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
import { Button, Card, Grid, TextControl, withWizardScreen } from '../../../../components/src';
import './style.scss';

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
		const { adUnit, onSave, service } = this.props;
		const { id, code, name } = adUnit;
		const sizes = adUnit.sizes && Array.isArray( adUnit.sizes ) ? adUnit.sizes : [ [ 120, 120 ] ];
		return (
			<Fragment>
				<TextControl
					label={ __( 'Ad Unit Name', 'newspack' ) }
					value={ name || '' }
					onChange={ value => this.handleOnChange( 'name', value ) }
				/>
				<TextControl
					label={ __( 'Ad Unit Code', 'newspack' ) }
					value={ code || '' }
					onChange={ value => this.handleOnChange( 'code', value ) }
				/>
				{ sizes.map( ( size, index ) => (
					<div className="newspack_ad_unit__sizes" key={ index }>
						<div className="newspack_ad_unit__sizes__header">
							<p className="is-dark">
								<strong>
									{ __( 'Ad Unit Size', 'newspack' ) }
									{ sizes.length > 1 && ' ' + ( index + 1 ) }
								</strong>
							</p>
							{ sizes.length > 1 && (
								<Button
									isLink
									isDestructive
									onClick={ () => {
										sizes.splice( index, 1 );
										this.handleOnChange( 'sizes', sizes );
									} }
								>
									{ __( 'Delete Size', 'newspack' ) }
									{ ' ' + ( index + 1 ) }
								</Button>
							) }
						</div>
						<Card isMedium>
							<Grid gutter={ 32 }>
								<TextControl
									label={ __( 'Width' ) }
									value={ size[ 0 ] }
									type="number"
									onChange={ value => {
										sizes[ index ][ 0 ] = value;
										this.handleOnChange( 'sizes', sizes );
									} }
								/>
								<TextControl
									label={ __( 'Height' ) }
									value={ size[ 1 ] }
									type="number"
									onChange={ value => {
										sizes[ index ][ 1 ] = value;
										this.handleOnChange( 'sizes', sizes );
									} }
								/>
							</Grid>
						</Card>
					</div>
				) ) }
				<Button
					isLink
					onClick={ () => this.handleOnChange( 'sizes', [ ...sizes, [ 120, 120 ] ] ) }
					className="fr"
				>
					{ __( 'Add Size', 'newspack' ) }
				</Button>
				<div className="clear" />
				<div className="newspack-buttons-card">
					<Button isPrimary onClick={ () => onSave( id ) }>
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
