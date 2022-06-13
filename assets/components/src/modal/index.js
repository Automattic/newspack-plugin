/**
 * Modal
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { Modal as BaseComponent } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import './style.scss';

/**
 * External dependencies.
 */
import classnames from 'classnames';

class Modal extends Component {
	/**
	 * Render.
	 */
	render() {
		const { className, isWide, isNarrow, ...otherProps } = this.props;
		const classes = classnames(
			'newspack-modal',
			isWide && 'newspack-modal--wide',
			isNarrow && 'newspack-modal--narrow',
			className
		);

		return <BaseComponent className={ classes } { ...otherProps } />;
	}
}

export default Modal;
