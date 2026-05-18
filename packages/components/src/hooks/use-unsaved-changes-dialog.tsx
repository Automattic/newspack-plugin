/**
 * WordPress dependencies.
 */
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import useConfirmDialog from './use-confirm-dialog';

type UseUnsavedChangesDialogOptions = {
	when: boolean;
};

/**
 * Shared unsaved-changes guard. Wraps `useConfirmDialog` with standardized
 * messaging, intercepts outbound link clicks so the dialog fires instead of
 * a silent navigation, and adds a `beforeunload` listener as the last-resort
 * guard for refresh / tab-close (browser-native, cannot be styled). The
 * returned `confirmDialog` element must be rendered in JSX.
 */
function useUnsavedChangesDialog( { when }: UseUnsavedChangesDialogOptions ) {
	const { confirmDialog, requestConfirm } = useConfirmDialog( {
		when,
		message: __( 'You have unsaved changes that will be lost. Discard changes?', 'newspack-plugin' ),
		confirmButtonText: __( 'Discard changes', 'newspack-plugin' ),
		hideTitle: true,
	} );

	// Tracks navigation the user has already approved via our custom dialog so
	// the beforeunload guard doesn't fire a second native prompt on top of it.
	const isNavigatingRef = useRef( false );

	useEffect( () => {
		if ( ! when ) {
			return;
		}
		const handler = ( e: MouseEvent ) => {
			if ( e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 ) {
				return;
			}
			const target = e.target as HTMLElement | null;
			const link = target?.closest( 'a[href]' ) as HTMLAnchorElement | null;
			if ( ! link ) {
				return;
			}
			const href = link.getAttribute( 'href' );
			if ( ! href || href.startsWith( '#' ) || href.startsWith( 'javascript:' ) ) {
				return;
			}
			if ( link.target && link.target !== '_self' ) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			const destination = link.href;
			requestConfirm( () => {
				isNavigatingRef.current = true;
				window.location.href = destination;
			} );
		};
		document.addEventListener( 'click', handler, true );
		return () => document.removeEventListener( 'click', handler, true );
	}, [ when, requestConfirm ] );

	useEffect( () => {
		if ( ! when ) {
			return;
		}
		const handler = ( e: BeforeUnloadEvent ) => {
			if ( isNavigatingRef.current ) {
				return;
			}
			e.preventDefault();
			e.returnValue = '';
		};
		window.addEventListener( 'beforeunload', handler );
		return () => window.removeEventListener( 'beforeunload', handler );
	}, [ when ] );

	return { confirmDialog, requestConfirm };
}

export default useUnsavedChangesDialog;
