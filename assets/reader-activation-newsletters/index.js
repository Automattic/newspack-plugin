/**
 * Internal dependencies
 */
import { domReady } from '../reader-activation-auth/utils';
import { openNewslettersSignupModal } from './newsletters-modal';

import './newsletters-form.js';

window.newspackRAS = window.newspackRAS || [];
window.newspackRAS.push( readerActivation => {
	domReady( function () {
		/** Expose the openNewslettersSignupModal function to the RAS scope */
		readerActivation._openNewslettersSignupModal = openNewslettersSignupModal;
	} );
} );
