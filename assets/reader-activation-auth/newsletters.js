/**
 * Internal dependencies
 */
import { domReady } from './utils';
import { openNewslettersSignupModal } from './newsletters-modal';

import './newsletters-form';

window.newspackRAS = window.newspackRAS || [];
window.newspackRAS.push( readerActivation => {
	domReady( function () {
		/** Expose the openNewslettersSignupModal function to the RAS scope */
		readerActivation._openNewslettersSignupModal = openNewslettersSignupModal;
	} );
} );
