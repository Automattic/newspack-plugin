/**
 * Components for managing SEO accounts.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Grid, TextControl } from '../../../../../components/src';
import { ACCOUNTS } from './constants';

/**
 * Internal dependencies.
 */

function Accounts( {
	setData,
	data,
}: {
	setData: ( v: SeoData[ 'urls' ] ) => void;
	data: SeoData[ 'urls' ] & { [ k: string ]: string };
} ) {
	return (
		<Grid columns={ 3 } rowGap={ 16 }>
			{ ACCOUNTS.map( ( [ key, label, placholder ] ) => (
				<TextControl
					key={ key }
					label={ label }
					onChange={ ( value: string ) => setData( { ...data, [ key ]: value } ) }
					value={ data[ key ] }
					placeholder={ placholder }
				/>
			) ) }
		</Grid>
	);
}

export default Accounts;
