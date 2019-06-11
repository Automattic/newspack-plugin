/**
 * Muriel-styled Modal notice.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Modal as BaseComponent } from '@wordpress/components';

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import murielClassnames from '../../../shared/js/muriel-classnames';
import './style.scss';

class Modal extends Component {
	/**
	 * Render.
	 */
	render() {
		const { className, overlayClassName, ...otherProps } = this.props;
		const classes = murielClassnames( 'muriel-modal', className );
		const overlayClasses = murielClassnames( 'muriel-modal-overlay', overlayClassName );

		return (
			<BaseComponent className={ classes } overlayClassName={ overlayClasses } { ...otherProps } />
		);
	}
}

export default Modal;
