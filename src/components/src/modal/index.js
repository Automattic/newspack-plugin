/**
 * Modal
 */

/**
 * WordPress dependencies.
 */
import { forwardRef } from '@wordpress/element';
import { Modal as BaseComponent } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import './style.scss';

/**
 * External dependencies.
 */
import classnames from 'classnames';

function Modal( { className, isWide, isNarrow, ...otherProps }, ref ) {
	const classes = classnames(
		'newspack-modal',
		isWide && 'newspack-modal--wide',
		isNarrow && 'newspack-modal--narrow',
		className
	);

	return <BaseComponent className={ classes } { ...otherProps } ref={ ref } />;

}
export default forwardRef( Modal );
