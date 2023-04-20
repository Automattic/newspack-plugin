/**
 * Stepped List Item
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import './style.scss';

/**
 * External dependencies.
 */
import classnames from 'classnames';

class SteppedListItem extends Component {
	/**
	 * Render
	 */
	render() {
		const { className, itemCount, itemText, style = {} } = this.props;
		const classes = classnames( 'stepped-list-item', className );

		return (
			<div className={ classes } style={ style }>
				<div className="stepped-list-item__number">{ itemCount }</div>
				<div className="stepped-list-item__content"> { itemText }</div>
			</div>
		);
	}
}

export default SteppedListItem;
