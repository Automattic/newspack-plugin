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
	isWide?: boolean;
	isNarrow?: boolean;
	hideTitle?: boolean;
	title?: string;
	isDestructive?: boolean;
	cancelButtonText?: string;
	confirmButtonText?: string;
	onConfirm: () => void;
	onCancel: () => void;
	children?: React.ReactNode;
};

function ConfirmDialog(
	{ className, isWide, isNarrow = true, hideTitle, isDestructive, onConfirm, onCancel, ...otherProps }: ConfirmDialogProps,
	ref: React.Ref< HTMLDivElement >
) {
	const classes = classnames(
		'newspack-modal',
		isWide && 'newspack-modal--wide',
		isNarrow && 'newspack-modal--narrow',
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
