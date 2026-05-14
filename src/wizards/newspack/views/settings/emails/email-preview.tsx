/**
 * EmailPreview — renders a scaled thumbnail of an email template.
 *
 * Lazy-loads via IntersectionObserver: the REST fetch only fires once the
 * component scrolls into view. On success an iframe with srcDoc displays the
 * rendered HTML; on error an envelope icon placeholder is shown instead.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useRef } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { Icon, envelope } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import './email-preview.scss';

interface EmailPreviewProps {
	postId: number;
}

const EmailPreview: React.FC< EmailPreviewProps > = ( { postId } ) => {
	const containerRef = useRef< HTMLDivElement >( null );
	const [ isVisible, setIsVisible ] = useState( false );
	const [ html, setHtml ] = useState< string | null >( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ hasError, setHasError ] = useState( false );

	// Observe visibility — fetch only when the thumbnail enters the viewport.
	useEffect( () => {
		const node = containerRef.current;
		if ( ! node ) {
			return;
		}

		const observer = new IntersectionObserver(
			( [ entry ] ) => {
				if ( entry.isIntersecting ) {
					setIsVisible( true );
					observer.disconnect();
				}
			},
			{ rootMargin: '200px' }
		);

		observer.observe( node );
		return () => observer.disconnect();
	}, [] );

	// Fetch preview HTML once visible.
	useEffect( () => {
		if ( ! isVisible ) {
			return;
		}

		setIsLoading( true );
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

	return (
		<div ref={ containerRef } className="newspack-email-preview">
			{ isLoading && (
				<div className="newspack-email-preview__placeholder">
					<Spinner />
				</div>
			) }
			{ hasError && (
				<div className="newspack-email-preview__placeholder">
					<Icon icon={ envelope } size={ 48 } />
				</div>
			) }
			{ html && ! hasError && ! isLoading && (
				<iframe className="newspack-email-preview__iframe" srcDoc={ html } sandbox="" tabIndex={ -1 } title="Email preview" />
			) }
		</div>
	);
};

export default EmailPreview;
