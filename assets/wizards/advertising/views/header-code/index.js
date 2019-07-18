/**
 * New/Edit Ad Unit Screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { ExternalLink, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Card, Button, TextControl, withWizardScreen } from '../../../../components/src';

/**
 * New/Edit Ad Unit Screen.
 */
class HeaderCode extends Component {
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
		const { onChange, code, service } = this.props;
		return (
			<Fragment>
				<TextareaControl
					label={ __(
						'If the ad service requires to render a global ad code on every page, paste it here.'
					) }
					placeholder={ __( 'Header Ad Code' ) }
					value={ code }
					onChange={ onChange }
				/>
				<p>
					{ __( 'More context how to do this and maybe an example of what it looks like.' ) }
					<ExternalLink url="#">{ __( 'Learn more' ) }</ExternalLink>
				</p>
			</Fragment>
		);
	}
}

export default withWizardScreen( HeaderCode );
