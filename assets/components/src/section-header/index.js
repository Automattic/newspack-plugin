/**
 * Section Header
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

class SectionHeader extends Component {
	/**
	 * Render
	 */
	render() {
		const { className, description, title } = this.props;
		const classes = classnames( 'newspack-section-header', className );
		return (
			<div className={ classes }>
				<h2>{ title }</h2>
				{ description && <span>{ description }</span> }
			</div>
		);
	}
}

export default SectionHeader;
