/**
 * Modal
 */

/**
 * WordPress dependencies.
 */
import { forwardRef } from '@wordpress/element';
import { __experimentalConfirmDialog as BaseComponent } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis

/**
 * External dependencies.
 */
import classnames from 'classnames';

/*
 * See both https://wordpress.github.io/gutenberg/?path=/docs/components-confirmdialog--docs and
 * https://wordpress.github.io/gutenberg/?path=/docs/components-modal--docs for all supported props.
 */
type ConfirmDialogProps = {
	className?: string;
	size?: 'small' | 'medium' | 'large' | 'x-large' | 'full';
	hideTitle?: boolean;
	title?: string;
	isDestructive?: boolean;
	cancelButtonText?: string;
	confirmButtonText?: string;
	onConfirm: () => void;
	onCancel: () => void;
	children?: React.ReactNode;
};

const sizeClassMap = {
	small: 'newspack-modal--size-small',
	medium: 'newspack-modal--size-medium',
	large: 'newspack-modal--size-large',
	'x-large': 'newspack-modal--size-x-large',
	full: 'newspack-modal--size-full',
};

function ConfirmDialog(
	{ className, size = 'small', hideTitle, isDestructive, onConfirm, onCancel, ...otherProps }: ConfirmDialogProps,
	ref: React.Ref< HTMLDivElement >
) {
	const classes = classnames(
		'newspack-modal',
		sizeClassMap[ size ],
		hideTitle && 'newspack-modal--hide-title', // Note: also hides the X close button.
		isDestructive && 'newspack-modal--destructive',
		className
	);

	return (
		<BaseComponent
			className={ classes }
			{ ...otherProps }
			ref={ ref }
			onConfirm={ onConfirm }
			onCancel={ onCancel }
			__experimentalHideHeader={ false }
		/>
	);
}
export default forwardRef( ConfirmDialog );
