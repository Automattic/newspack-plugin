/**
 * EmailPreview — renders a scaled thumbnail of an email template.
 *
 * Lazy-loads via IntersectionObserver: the REST fetch only fires once the
 * component scrolls into view. On success an iframe with srcDoc displays the
 * rendered HTML; on error an envelope icon placeholder is shown instead.
 *
 * Rendering contract mirrors NewsletterPreview in newspack-newsletters:
 * 848 px source viewport, 1 : 1 aspect ratio, fade-in via `is-ready` class,
 * and iframe height measured from the loaded document.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';
import { Icon, envelope } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import './email-preview.scss';

interface EmailPreviewProps {
	postId: number;
}

const IFRAME_WIDTH = 848;

const EmailPreview: React.FC< EmailPreviewProps > = ( { postId } ) => {
	const containerRef = useRef< HTMLDivElement >( null );
	const iframeRef = useRef< HTMLIFrameElement >( null );
	const safetyTimerRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const [ isVisible, setIsVisible ] = useState( false );
	const [ html, setHtml ] = useState< string | null >( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ hasError, setHasError ] = useState( false );
	const [ scale, setScale ] = useState< number | null >( null );
	const [ iframeHeight, setIframeHeight ] = useState< number | null >( null );
	const [ isReady, setIsReady ] = useState( false );

	// Observe visibility — fetch only when the thumbnail enters the viewport.
	useEffect( () => {
		if ( isVisible ) {
			return;
		}
		if ( typeof IntersectionObserver === 'undefined' ) {
			setIsVisible( true );
			return;
		}
		const node = containerRef.current;
		if ( ! node ) {
			return;
		}

		const observer = new IntersectionObserver(
			entries => {
				if ( entries[ 0 ]?.isIntersecting ) {
					setIsVisible( true );
				}
			},
			{ rootMargin: '200px' }
		);

		observer.observe( node );
		return () => observer.disconnect();
	}, [ isVisible ] );

	// Measure container width and compute iframe scale.
	useEffect( () => {
		if ( typeof ResizeObserver === 'undefined' ) {
			setScale( 1 );
			return;
		}
		const node = containerRef.current;
		if ( ! node ) {
			return;
		}

		const ro = new ResizeObserver( ( [ entry ] ) => {
			setScale( entry.contentRect.width / IFRAME_WIDTH );
		} );

		ro.observe( node );
		return () => ro.disconnect();
	}, [] );

	// Fetch preview HTML once visible. Cancel on postId change or unmount.
	useEffect( () => {
		if ( ! isVisible ) {
			return;
		}

		let cancelled = false;

		// Clear any lingering safety timer from a previous postId.
		if ( safetyTimerRef.current ) {
			clearTimeout( safetyTimerRef.current );
			safetyTimerRef.current = null;
		}

		setIsLoading( true );
		setIsReady( false );
		setIframeHeight( null );
		setHasError( false );
		setHtml( null );
		apiFetch< { html: string; post_id: number } >( {
			path: `/newspack/v1/wizard/newspack-settings/emails/${ postId }/preview`,
		} )
			.then( response => {
				if ( ! cancelled ) {
					setHtml( response.html );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setHasError( true );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setIsLoading( false );
				}
			} );

		return () => {
			cancelled = true;
			if ( safetyTimerRef.current ) {
				clearTimeout( safetyTimerRef.current );
				safetyTimerRef.current = null;
			}
		};
	}, [ isVisible, postId ] );

	// Handle iframe load: wait for stylesheets and images, then measure height and reveal.
	const handleIframeLoad = useCallback( () => {
		const doc = iframeRef.current?.contentDocument;
		if ( ! doc ) {
			return;
		}

		// Wire up listeners before checking loaded state to avoid a race where
		// the asset finishes between the check and the listener attachment.
		const awaitLink = ( link: HTMLLinkElement ) =>
			new Promise< void >( resolve => {
				link.addEventListener( 'load', () => resolve(), { once: true } );
				link.addEventListener( 'error', () => resolve(), { once: true } );
				if ( link.sheet ) {
					resolve();
				}
			} );
		const awaitImg = ( img: HTMLImageElement ) =>
			new Promise< void >( resolve => {
				img.addEventListener( 'load', () => resolve(), { once: true } );
				img.addEventListener( 'error', () => resolve(), { once: true } );
				if ( img.complete ) {
					resolve();
				}
			} );

		const linkPromises = Array.from( doc.querySelectorAll< HTMLLinkElement >( 'link[rel="stylesheet"]' ) ).map( awaitLink );
		const imgPromises = Array.from( doc.querySelectorAll< HTMLImageElement >( 'img' ) ).map( awaitImg );

		let finalized = false;
		const finalize = () => {
			if ( finalized ) {
				return;
			}
			finalized = true;
			if ( safetyTimerRef.current ) {
				clearTimeout( safetyTimerRef.current );
				safetyTimerRef.current = null;
			}
			setIframeHeight( doc.body.scrollHeight );
			setIsReady( true );
		};

		// 8 s safety so a slow asset never strands the spinner.
		safetyTimerRef.current = setTimeout( finalize, 8000 );

		Promise.all( [ ...linkPromises, ...imgPromises ] ).then( finalize );
	}, [] );

	const showSpinner = ! hasError && ! isReady && ( isLoading || Boolean( html ) );

	return (
		<div ref={ containerRef } className={ `newspack-email-preview${ isReady ? ' is-ready' : '' }` }>
			{ showSpinner && (
				<div className="newspack-email-preview__placeholder">
					<Spinner />
				</div>
			) }
			{ hasError && (
				<div className="newspack-email-preview__placeholder">
					<Icon icon={ envelope } size={ 48 } />
				</div>
			) }
			{ html && ! hasError && scale !== null && scale > 0 && (
				<iframe
					ref={ iframeRef }
					className="newspack-email-preview__iframe"
					srcDoc={ html }
					/* sandbox: allow-same-origin is required so handleIframeLoad can
					 * read contentDocument (body.scrollHeight, stylesheet load state).
					 * Without allow-scripts, JS cannot execute. Without allow-forms,
					 * form submissions are blocked. */
					sandbox="allow-same-origin"
					tabIndex={ -1 }
					title={ __( 'Email preview', 'newspack-plugin' ) }
					onLoad={ handleIframeLoad }
					onError={ () => setHasError( true ) }
					style={ {
						transform: `scale(${ scale })`,
						height: iframeHeight ? `${ iframeHeight }px` : undefined,
					} }
				/>
			) }
		</div>
	);
};

export default EmailPreview;
