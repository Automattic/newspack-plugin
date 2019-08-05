/**
 * Muriel Grid Container
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import murielClassnames from '../../../shared/js/muriel-classnames';

/**
 * Internal dependencies
 */
import './style.scss';

class Grid extends Component {
	/**
	 * Render.
	 */
	render() {
		const { className, ...otherProps } = this.props;
		const classes = murielClassnames(
			'muriel-grid-container',
			className,
		);
		return <div className={ classes } { ...otherProps } />;
	}
}

export default Grid;
