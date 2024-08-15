/**
 * Components for managing SEO accounts.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Grid, TextControl } from '../../../../../components/src';

/**
 * Internal dependencies.
 */

function Accounts( {
	setData,
	data,
}: {
	setData: ( v: SeoData[ 'urls' ] ) => void;
	data: SeoData[ 'urls' ];
} ) {
	return (
		<Grid columns={ 3 } rowGap={ 16 }>
			<TextControl
				label={ __( 'Facebook Page', 'newspack' ) }
				onChange={ ( facebook: string ) => setData( { ...data, facebook } ) }
				value={ data.facebook }
				placeholder={ __( 'https://facebook.com/page', 'newspack' ) }
			/>
			<TextControl
				label={ __( 'Twitter', 'newspack' ) }
				onChange={ ( twitter: string ) => setData( { ...data, twitter } ) }
				value={ data.twitter }
				placeholder={ __( 'username', 'newspack' ) }
			/>
			<TextControl
				label="Instagram"
				onChange={ ( instagram: string ) => setData( { ...data, instagram } ) }
				value={ data.instagram }
				placeholder={ __( 'https://instagram.com/user', 'newspack' ) }
			/>
			<TextControl
				label="LinkedIn"
				onChange={ ( linkedin: string ) => setData( { ...data, linkedin } ) }
				value={ data.linkedin }
				placeholder={ __( 'https://linkedin.com/user', 'newspack' ) }
			/>
			<TextControl
				label="YouTube"
				onChange={ ( youtube: string ) => setData( { ...data, youtube } ) }
				value={ data.youtube }
				placeholder={ __( 'https://youtube.com/c/channel', 'newspack' ) }
			/>
			<TextControl
				label="Pinterest"
				onChange={ ( pinterest: string ) => setData( { ...data, pinterest } ) }
				value={ data.pinterest }
				placeholder={ __( 'https://pinterest.com/user', 'newspack' ) }
			/>
		</Grid>
	);
}

export default Accounts;
