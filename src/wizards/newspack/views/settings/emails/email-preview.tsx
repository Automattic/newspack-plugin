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
	const [ isVisible, setIsVisible ] = useState( false );
	const [ html, setHtml ] = useState< string | null >( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ hasError, setHasError ] = useState( false );
	const [ scale, setScale ] = useState( 0 );
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

	// Fetch preview HTML once visible. Reset state on postId change.
	useEffect( () => {
		if ( ! isVisible ) {
			return;
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
				setHtml( response.html );
			} )
			.catch( () => {
				setHasError( true );
			} )
			.finally( () => {
				setIsLoading( false );
			} );
	}, [ isVisible, postId ] );

	// Handle iframe load: wait for stylesheets and images, then measure height and reveal.
	const handleIframeLoad = useCallback( () => {
		const doc = iframeRef.current?.contentDocument;
		if ( ! doc ) {
			return;
		}

		const awaitLoad = ( el: HTMLLinkElement | HTMLImageElement ) =>
			new Promise< void >( resolve => {
				el.addEventListener( 'load', () => resolve(), { once: true } );
				el.addEventListener( 'error', () => resolve(), { once: true } );
			} );

		const linkPromises = Array.from( doc.querySelectorAll< HTMLLinkElement >( 'link[rel="stylesheet"]' ) )
			.filter( link => ! link.sheet )
			.map( awaitLoad );
		const imgPromises = Array.from( doc.querySelectorAll< HTMLImageElement >( 'img' ) )
			.filter( img => ! img.complete )
			.map( awaitLoad );

		// 8 s safety so a slow asset never strands the spinner.
		const safety = setTimeout( () => {
			setIframeHeight( doc.body.scrollHeight );
			setIsReady( true );
		}, 8000 );

		Promise.all( [ ...linkPromises, ...imgPromises ] ).then( () => {
			clearTimeout( safety );
			setIframeHeight( doc.body.scrollHeight );
			setIsReady( true );
		} );
	}, [] );

	return (
		<div ref={ containerRef } className={ `newspack-email-preview${ isReady ? ' is-ready' : '' }` }>
			{ ( isLoading || ( html && ! isReady ) ) && ! hasError && (
				<div className="newspack-email-preview__placeholder">
					<Spinner />
				</div>
			) }
			{ hasError && (
				<div className="newspack-email-preview__placeholder">
					<Icon icon={ envelope } size={ 48 } />
				</div>
			) }
			{ html && ! hasError && scale > 0 && (
				<iframe
					ref={ iframeRef }
					className="newspack-email-preview__iframe"
					srcDoc={ html }
					sandbox="allow-same-origin"
					tabIndex={ -1 }
					title="Email preview"
					onLoad={ handleIframeLoad }
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
