/**
 * New/Edit Ad Unit Screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import DeleteIcon from '@material-ui/icons/Delete';

/**
 * Internal dependencies
 */
import { Button, Card, TextControl, withWizardScreen } from '../../../../components/src';
import './style.scss';

/**
 * New/Edit Ad Unit Screen.
 */
class AdUnit extends Component {
	/**
	 * Handle an update to an ad unit field.
	 *
	 * @param string key Ad Unit field
	 * @param mixed  value New value for field
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
		const { id, name } = adUnit;
		const sizes = adUnit.sizes && Array.isArray( adUnit.sizes ) ? adUnit.sizes : [];
		return (
			<Fragment>
				<TextControl
					label={ __( 'Ad unit name' ) }
					value={ name || '' }
					onChange={ value => this.handleOnChange( 'name', value ) }
				/>
				{ sizes.map( ( size, index ) => (
					<div className="newspack_ad_unit__sizes">
						<TextControl
							label={ __( 'Width' ) }
							value={ size[ 0 ] }
							onChange={ value => {
								sizes[ index ][ 0 ] = value;
								this.handleOnChange( 'sizes', sizes );
							} }
						/>
						<TextControl
							label={ __( 'Height' ) }
							value={ size[ 1 ] }
							onChange={ value => {
								sizes[ index ][ 1 ] = value;
								this.handleOnChange( 'sizes', sizes );
							} }
						/>
						<Button
							isSmall
							onClick={ () => {
								sizes.splice( index, 1 );
								this.handleOnChange( 'sizes', sizes );
							} }
						>
							<DeleteIcon />
						</Button>
					</div>
				) ) }
				<Button
					isPrimary
					onClick={ () => this.handleOnChange( 'sizes', [ ...sizes, [ 120, 120 ] ] ) }
				>
					{ __( 'Add Size', 'newspack' ) }
				</Button>
				<div className="newspack-buttons-card">
					<Button isPrimary onClick={ () => onSave( id ) }>
						{ __( 'Save' ) }
					</Button>
					<Button isDefault href={ `#/${ service }` }>
						{ __( 'Cancel' ) }
					</Button>
				</div>
			</Fragment>
		);
	}
}

export default withWizardScreen( AdUnit );
