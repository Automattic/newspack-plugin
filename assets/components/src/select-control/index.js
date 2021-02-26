/**
 * Select Control
 */

/**
 * WordPress dependencies
 */
import { SelectControl as BaseComponent } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import GroupedSelectControl from './GroupedSelectControl';

class SelectControl extends Component {
	/**
	 * Render.
	 */
	render() {
		const { className, optgroups, ...otherProps } = this.props;
		const classes = classNames( 'newspack-select-control', className );
		return (
			<div className={ classes }>
				{ optgroups ? (
					<GroupedSelectControl optgroups={ optgroups } { ...otherProps } />
				) : (
					<BaseComponent { ...otherProps } />
				) }
			</div>
		);
	}
}

export default SelectControl;
