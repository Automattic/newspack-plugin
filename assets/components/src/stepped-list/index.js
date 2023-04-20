/**
 * Notice
 */

/**
 * WordPress dependencies.
 */
import { Component, RawHTML } from '@wordpress/element';

/**
 * Internal dependencies.
 */
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
		const { className, rawHTML, listNumber, listText, style = {}, propertyName } = this.props;
		const classes = classnames(
			'stepped-list',
			className,
			propertyName && 'stepped-list__property-name'
		);

		return (
			<div className={ classes } style={ style }>
				<div className="stepped-list__number">{ listNumber }</div>
				<div className="stepped-list__content">
					{ rawHTML ? <RawHTML>{ listText }</RawHTML> : listText }
				</div>
			</div>
		);
	}
}

export default SteppedList;
