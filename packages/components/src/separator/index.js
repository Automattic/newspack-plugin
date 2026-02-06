/**
 * Separator
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
import classNames from 'classnames';

class Separator extends Component {
	/**
	 * Render
	 */
	render() {
		const { alignment = 'full-width', className, marginBottom = 64, marginTop = 64, variant = 'tertiary', ...otherProps } = this.props;

		const classes = classNames(
			'newspack-separator',
			className,
			alignment && `newspack-separator--alignment-${ alignment }`,
			variant && `newspack-separator--variant-${ variant }`
		);

		const style = {
			'--separator-margin-bottom': typeof marginBottom === 'number' ? `${ marginBottom }px` : marginBottom,
			'--separator-margin-top': typeof marginTop === 'number' ? `${ marginTop }px` : marginTop,
		};

		return <hr className={ classes } style={ style } { ...otherProps } />;
	}
}

export default Separator;
