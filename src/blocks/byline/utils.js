/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Decode HTML entities in a string.
 *
 * @param {string} text Text with HTML entities.
 * @return {string} Decoded text.
 */
export function decodeHtmlEntities( text ) {
	const textarea = document.createElement( 'textarea' );
	textarea.innerHTML = text;
	return textarea.value;
}

/**
 * Parse byline shortcodes to extract display names and render as React elements.
 *
 * @param {string} bylineContent Raw byline content with shortcodes.
 * @return {Array} Array of React elements for display.
 */
export function parseBylineForDisplay( bylineContent ) {
	const elements = [];
	let lastIndex = 0;
	const regex = /\[Author id=(\d+)\](.*?)\[\/Author\]/g;
	let match;

	while ( ( match = regex.exec( bylineContent ) ) !== null ) {
		// Add text before the match.
		if ( match.index > lastIndex ) {
			const textBefore = bylineContent.slice( lastIndex, match.index );
			elements.push( decodeHtmlEntities( textBefore ) );
		}

		// Add author link.
		const authorId = match[ 1 ];
		const authorName = match[ 2 ];
		elements.push(
			createElement(
				'a',
				{
					key: `author-${ authorId }-${ match.index }`,
					href: '#author-link',
					onClick: e => e.preventDefault(),
					className: 'url fn n',
				},
				decodeHtmlEntities( authorName )
			)
		);

		lastIndex = match.index + match[ 0 ].length;
	}

	// Add remaining text after last match.
	if ( lastIndex < bylineContent.length ) {
		const textAfter = bylineContent.slice( lastIndex );
		elements.push( decodeHtmlEntities( textAfter ) );
	}

	return elements;
}

/**
 * Format authors list for display using Intl.ListFormat.
 *
 * Uses the browser's Intl.ListFormat API for localized list formatting,
 * which is the JS equivalent of WordPress's wp_sprintf_l().
 *
 * @param {Array}   authors       Array of author objects.
 * @param {boolean} linkToArchive Whether to show as links.
 * @return {Array} Array of React elements.
 */
export function formatAuthorsList( authors, linkToArchive ) {
	if ( ! authors || authors.length === 0 ) {
		return [];
	}

	// For a single author, return directly without list formatting.
	if ( authors.length === 1 ) {
		const author = authors[ 0 ];
		const name = author.display_name || author.name;
		return [
			createElement(
				'span',
				{ key: `author-wrapper-${ author.id || 0 }`, className: 'author vcard' },
				linkToArchive
					? createElement( 'a', { href: '#author-link', onClick: e => e.preventDefault(), className: 'url fn n' }, name )
					: createElement( 'span', { className: 'fn n' }, name )
			),
		];
	}

	// Use Intl.ListFormat for localized list formatting (JS equivalent of wp_sprintf_l).
	// Get the current locale from WordPress or fall back to browser locale.
	const locale = document.documentElement.lang || navigator.language || 'en';
	const listFormatter = new Intl.ListFormat( locale, { style: 'long', type: 'conjunction' } );

	// Create placeholder strings to get the formatted parts.
	const placeholders = authors.map( ( _, i ) => `__AUTHOR_${ i }__` );
	const formattedParts = listFormatter.formatToParts( placeholders );

	// Build React elements from the formatted parts.
	return formattedParts.map( ( part, partIndex ) => {
		if ( part.type === 'literal' ) {
			return part.value;
		}
		// Extract author index from placeholder.
		const authorIndex = parseInt( part.value.replace( '__AUTHOR_', '' ).replace( '__', '' ), 10 );
		const author = authors[ authorIndex ];
		const name = author.display_name || author.name;

		return createElement(
			'span',
			{ key: `author-wrapper-${ author.id || partIndex }`, className: 'author vcard' },
			linkToArchive
				? createElement( 'a', { href: '#author-link', onClick: e => e.preventDefault(), className: 'url fn n' }, name )
				: createElement( 'span', { className: 'fn n' }, name )
		);
	} );
}
