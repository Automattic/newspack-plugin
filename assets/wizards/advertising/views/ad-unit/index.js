/**
 * New/Edit Ad Unit Screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, Card, TextControl, TextareaControl, withWizardScreen } from '../../../../components/src';

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
		const { id, name, width, height } = adUnit;
		return (
			<Fragment>
				<TextControl
					label={ __( 'Ad unit name' ) }
					value={ name || '' }
					onChange={ value => this.handleOnChange( 'name', value ) }
				/>
				<TextControl
					label={ __( 'Width' ) }
					value={ width }
					placeholder={ __( '120' ) }
					onChange={ value => this.handleOnChange( 'width', value ) }
				/>
				<TextControl
					label={ __( 'Height' ) }
					placeholder={ __( '120' ) }
					value={ height }
					onChange={ value => this.handleOnChange( 'height', value ) }
				/>
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
