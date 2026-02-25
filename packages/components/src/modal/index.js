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

function Modal( { className, isWide, isMedium, isNarrow, hideTitle, ...otherProps }, ref ) {
	const classes = classnames(
		'newspack-modal',
		isWide && 'newspack-modal--wide',
		isMedium && 'newspack-modal--medium',
		isNarrow && 'newspack-modal--narrow',
		hideTitle && 'newspack-modal--hide-title', // Note: also hides the X close button.
		className
	);

	return <BaseComponent className={ classes } { ...otherProps } ref={ ref } />;
}
export default forwardRef( Modal );
