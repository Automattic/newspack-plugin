/**
 * Button Group
 */

/**
 * WordPress dependencies
 */
import { ButtonGroup as BaseComponent } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';

class ButtonGroup extends Component {
	/**
	 * Render.
	 */
	render( props ) {
		const { className, ...otherProps } = this.props;
		const classes = classnames( 'newspack-button-group', className );
		return <BaseComponent className={ classes } { ...otherProps } />;
	}
}

export default ButtonGroup;
