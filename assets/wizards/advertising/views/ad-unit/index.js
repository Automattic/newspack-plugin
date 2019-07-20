/**
 * New/Edit Ad Unit Screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Card,
	Button,
	TextControl,
	withWizardScreen,
} from '../../../../components/src';

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
		const { adUnit, onChange } = this.props;
		adUnit[ key ] = value;
		onChange( adUnit );
	}

	/**
	 * Render.
	 */
	render() {
		const { adUnit, onSave, service } = this.props;
		const { id, name, ad_code, amp_ad_code } = adUnit;
		return (
			<Fragment>
				<Card>
					<TextControl
						label={ __( 'Ad unit name' ) }
						value={ name || '' }
						onChange={ value => this.handleOnChange( 'name', value ) }
					/>
					<TextareaControl
						label={ __( 'Paste the AMP ad code from Ad Manager here. Learn more' ) }
						value={ amp_ad_code || '' }
						placeholder={ __( 'AMP Ad code' ) }
						onChange={ value => this.handleOnChange( 'amp_ad_code', value ) }
					/>
					<TextareaControl
						label={ __( 'Paste the HTML ad code from Ad Manager here. Learn more' ) }
						placeholder={ __( 'HTML Ad code')}
						value={ ad_code || '' }
						onChange={ value => this.handleOnChange( 'ad_code', value ) }
					/>
				</Card>
				<Button isPrimary className="is-centered" onClick={ () => onSave( id ) }>
					{ __( 'Save' ) }
				</Button>
				<Button
					className="newspack-edit-ad-unit-screen__cancel isLink is-centered is-tertiary"
					href={ `#/${ service }` }
				>
					{ __( 'Cancel' ) }
				</Button>
			</Fragment>
		);
	}
}

export default withWizardScreen( AdUnit );
