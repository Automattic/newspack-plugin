/* globals newspack_metering_settings */

const settings = newspack_metering_settings;

function getCurrentExpiration() {
	const date = new Date();
	// Reset time to 00:00:00:000.
	date.setHours( 0 );
	date.setMinutes( 0 );
	date.setSeconds( 0 );
	date.setMilliseconds( 0 );
	switch ( settings.period ) {
		case 'day':
			date.setDate( date.getDate() + 1 );
			break;
		case 'week':
			const day = date.getDay();
			const daysToSaturday = 6 - day;
			date.setDate( date.getDate() + daysToSaturday );
			break;
		case 'month':
			date.setMonth( date.getMonth() + 1 );
			date.setDate( 1 );
			break;
	}
	return parseInt( date.getTime() / 1000, 10 );
}

function getUserData( store ) {
	const currentExpiration = getCurrentExpiration();
	const data = store.get( 'metering' ) || {
		content: [],
		expiration: currentExpiration,
	};
	data.expiration = parseInt( data.expiration, 10 ) || 0;
	if ( data.expiration !== currentExpiration ) {
		// Clear content if expired.
		if ( data.expiration < currentExpiration ) {
			data.content = [];
		}
		// Reset expiration.
		data.expiration = currentExpiration;
	}
	store.set( 'metering', data );
	return data;
}

function lockContent() {
	const content = document.querySelector( '.entry-content' );
	if ( ! content ) {
		return;
	}
	// Remove campaign prompts.
	const prompts = document.querySelectorAll( '.newspack-popup' );
	prompts.forEach( prompt => {
		prompt.parentNode.removeChild( prompt );
	} );
	const visibleParagraphs = settings.visible_paragraphs;
	const articleElements = document.querySelectorAll( '.entry-content > *' );
	const moreIndex = content.innerHTML.indexOf( '<!--more-->' );
	const inlineGate = document.querySelector( '.newspack-memberships__inline-gate' );
	if ( moreIndex > -1 && settings.use_more_tag ) {
		content.innerHTML = content.innerHTML.substring( 0, moreIndex );
	} else {
		let paragraphIndex = 0;
		articleElements.forEach( element => {
			if ( element.tagName === 'P' ) {
				paragraphIndex++;
			}
			if ( paragraphIndex > visibleParagraphs ) {
				content.removeChild( element );
			}
		} );
	}
	if ( inlineGate ) {
		content.appendChild( inlineGate );
	}
}

function meter( store ) {
	const data = getUserData( store );
	let locked = false;
	// Lock content if reached limit, remove gate content if not.
	if ( settings.count <= data.content.length && ! data.content.includes( settings.post_id ) ) {
		lockContent();
		locked = true;
	} else {
		const gates = document.querySelectorAll( '.newspack-memberships__gate' );
		gates.forEach( gate => {
			gate.parentNode.removeChild( gate );
		} );
	}
	if ( ! locked ) {
		// Push article_view activity.
		if ( settings.article_view ) {
			window.newspackRAS.push( [ settings.article_view.action, settings.article_view.data ] );
		}
		// Add current content to read content.
		if ( ! data.content.includes( settings.post_id ) ) {
			data.content.push( settings.post_id );
			store.set( 'metering', data );
		}
	}
}

window.newspackRAS = window.newspackRAS || [];
window.newspackRAS.push( ras => meter( ras.store ) );
