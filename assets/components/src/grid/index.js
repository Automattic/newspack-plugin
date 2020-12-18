/**
 * Grid
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';

class Grid extends Component {
	/**
	 * Render
	 */
	render() {
		const { className, columns, gutter, ...otherProps } = this.props;
		const classes = classnames(
			'newspack-grid',
			columns && 'newspack-grid__columns-' + columns,
			gutter && 'newspack-grid__gutter-' + gutter,
			className
		);
		return <div className={ classes } { ...otherProps } />;
	}
}

Grid.defaultProps = {
	columns: 2,
	gutter: 64,
};

export default Grid;
