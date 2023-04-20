/**
 * Stepped List
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { SteppedListItem } from '../';
import './style.scss';

/**
 * External dependencies.
 */
import classnames from 'classnames';

class SteppedList extends Component {
	/**
	 * Render
	 */
	render() {
		const { className, steppedListItems, narrowList, style = {} } = this.props;
		const classes = classnames(
			'stepped-list',
			className,
			narrowList && 'stepped-list__narrow-list'
		);

		return (
			<div className={ classes } style={ style }>
				{ steppedListItems.map( ( listItem, index ) => {
					return (
						// TODO: Fix how the counting is handled.
						<SteppedListItem key={ listItem.id } itemCount={ index + 1 } itemText={ listItem } />
					);
				} ) }
			</div>
		);
	}
}

export default SteppedList;
