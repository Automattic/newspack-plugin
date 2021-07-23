/**
 * Form Token Field
 */

/**
 * WordPress dependencies.
 */
import { FormTokenField as BaseComponent } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import './style.scss';

/**
 * External dependencies.
 */
import classnames from 'classnames';

class FormTokenField extends Component {
	/**
	 * Render.
	 */
	render() {
		const { className, isHelpTextHidden, ...otherProps } = this.props;
		const classes = classnames( 'newspack-form-token-field__input-container', className );
		return (
			<div
				className={ classnames(
					{
						'newspack-form-token-field--help-hidden': isHelpTextHidden,
					},
					'newspack-form-token-field'
				) }
			>
				<BaseComponent className={ classes } { ...otherProps } />
			</div>
		);
	}
}

export default FormTokenField;
