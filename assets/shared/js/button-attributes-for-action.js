/**
 * Assess buttonAction and extract button attributes for click events, routes, and plain URLs.
 */

/**
 * External dependencies.
 */
import { isFunction, isString } from 'lodash';

const buttonAttributesForAction = ( action, props ) => {
	const { history } = props;
	const attributes = [];
	if ( isFunction( action ) ) {
		attributes.onClick = () => action( history );
	} else if ( action.onClick ) {
		attributes.onClick = () => action.onClick( history );
	}
	if ( isString( action ) ) {
		attributes.href = action;
	} else if ( action.url ) {
		attributes.href = action.url;
	} else if ( action.path ) {
		attributes.href = `#${ action.path }`;
	}
	return attributes;
};

export default buttonAttributesForAction;
