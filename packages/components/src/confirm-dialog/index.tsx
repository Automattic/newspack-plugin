/**
 * Modal
 */

/**
 * WordPress dependencies.
 */
import { __experimentalConfirmDialog as BaseComponent } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { forwardRef, useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import Router from '../proxied-imports/router';
const { useHistory } = Router;

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
	children?: React.ReactNode;
	when?: boolean;
};

const sizeClassMap = {
	small: 'newspack-modal--size-small',
	medium: 'newspack-modal--size-medium',
	large: 'newspack-modal--size-large',
	'x-large': 'newspack-modal--size-x-large',
	full: 'newspack-modal--size-full',
};

function ConfirmDialog(
	{ className, size = 'small', hideTitle, isDestructive, when = false, ...otherProps }: ConfirmDialogProps,
	ref: React.Ref< HTMLDivElement >
) {
	const [ showUnsavedChangesDialog, setShowUnsavedChangesDialog ] = useState( false );
	const history = useHistory();
	const pendingNavigation = useRef< ( () => void ) | null >( null );

	const onConfirm = useCallback( () => {
		setShowUnsavedChangesDialog( false );
		pendingNavigation.current?.();
		pendingNavigation.current = null;
	}, [ pendingNavigation ] );

	const onCancel = useCallback( () => {
		setShowUnsavedChangesDialog( false );
		pendingNavigation.current = null;
	}, [ pendingNavigation ] );

	// Block navigation when there are unsaved changes.
	useEffect( () => {
		if ( ! when ) {
			return;
		}
		const unblock = history.block( ( location: string, action: string ) => {
			pendingNavigation.current = () => {
				unblock();
				if ( action === 'REPLACE' ) {
					history.replace( location );
				} else {
					history.push( location );
				}
			};
			setShowUnsavedChangesDialog( true );
			return false;
		} );
		return unblock;
	}, [ when, history ] );

	if ( ! showUnsavedChangesDialog ) {
		return null;
	}

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
