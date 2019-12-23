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
		const { id, name, ad_code, amp_ad_code } = adUnit;
		return (
			<Fragment>
				<TextControl
					label={ __( 'Ad unit name' ) }
					value={ name || '' }
					onChange={ value => this.handleOnChange( 'name', value ) }
				/>
				<TextareaControl
					label={ __( 'Paste the AMP ad code from Ad Manager here.' ) }
					value={ amp_ad_code || '' }
					placeholder={ __( 'AMP Ad code' ) }
					onChange={ value => this.handleOnChange( 'amp_ad_code', value ) }
				/>
				<TextareaControl
					label={ __( 'Paste the HTML ad code from Ad Manager here.' ) }
					placeholder={ __( 'HTML Ad code' ) }
					value={ ad_code || '' }
					onChange={ value => this.handleOnChange( 'ad_code', value ) }
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
