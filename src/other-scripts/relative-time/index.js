/**
 * Relative Time script.
 *
 * Replaces post dates with relative "time ago" format on the frontend.
 * Runs client-side to bypass page caching (the PHP filter renders at cache time,
 * this script corrects stale relative dates).
 *
 * Reads: window.newspackRelativeTime.cutoff (seconds), window.newspackRelativeTime.locale
 */

( function () {
	const config = window.newspackRelativeTime;
	if ( ! config ) {
		return;
	}

	const { cutoff, locale } = config;

	/**
	 * Determine the best unit and value for Intl.RelativeTimeFormat.
	 *
	 * @param {number} diffSeconds Difference in seconds (positive = past).
	 * @return {{ value: number, unit: string }|null} Value and unit, or null if beyond cutoff.
	 */
	function getRelativeUnit( diffSeconds ) {
		if ( diffSeconds >= cutoff ) {
			return null;
		}

		const units = [
			{ unit: 'second', threshold: 60 },
			{ unit: 'minute', threshold: 3600 },
			{ unit: 'hour', threshold: 86400 },
			{ unit: 'day', threshold: 2592000 },
			{ unit: 'month', threshold: 31536000 },
			{ unit: 'year', threshold: Infinity },
		];

		for ( const { unit, threshold } of units ) {
			if ( diffSeconds < threshold ) {
				const divisors = { second: 1, minute: 60, hour: 3600, day: 86400, month: 2592000, year: 31536000 };
				return { value: -Math.round( diffSeconds / divisors[ unit ] ), unit };
			}
		}
		return null;
	}

	/**
	 * Format and replace date text in time elements.
	 */
	function updateDates() {
		let formatter;
		try {
			formatter = new Intl.RelativeTimeFormat( locale.replace( '_', '-' ), {
				numeric: 'auto',
			} );
		} catch {
			// Fallback: no Intl support.
			return;
		}

		// Block theme: .wp-block-post-date time
		// Classic theme / newspack-blocks: time.entry-date
		const selectors = [
			'.wp-block-post-date:not(.wp-block-post-date__modified-date) time[datetime]',
			'time.entry-date.published[datetime]',
			'.comment-meta time[datetime]',
		];
		const elements = document.querySelectorAll( selectors.join( ', ' ) );
		const now = Date.now();

		elements.forEach( function ( el ) {
			// Skip if already inside a modified date wrapper.
			if ( el.closest( '.wp-block-post-date__modified-date' ) ) {
				return;
			}

			const datetime = el.getAttribute( 'datetime' );
			if ( ! datetime ) {
				return;
			}

			const timestamp = new Date( datetime ).getTime();
			const diffSeconds = Math.round( ( now - timestamp ) / 1000 );

			if ( diffSeconds < 0 ) {
				return; // Future date.
			}

			const relative = getRelativeUnit( diffSeconds );
			if ( ! relative ) {
				return; // Beyond cutoff.
			}

			const formatted = formatter.format( relative.value, relative.unit );

			// Store original text as title for hover.
			if ( ! el.getAttribute( 'title' ) ) {
				el.setAttribute( 'title', el.textContent );
			}

			// Preserve <a> wrapper when isLink is enabled.
			const anchor = el.querySelector( 'a' );
			if ( anchor ) {
				anchor.textContent = formatted;
			} else {
				el.textContent = formatted;
			}
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', updateDates );
	} else {
		updateDates();
	}
} )();
