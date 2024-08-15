/**
 * Components for managing SEO accounts.
 */

/**
 * WordPress dependencies.
 */
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Grid, TextControl } from '../../../../../components/src';

type VerificationData = {
	google: string;
	bing: string;
};

function VerificationCodes( {
	setData,
	data,
}: {
	setData: ( v: SeoData[ 'verification' ] ) => void;
	data: VerificationData;
} ) {
	return (
		<Grid>
			<TextControl
				label="Google"
				onChange={ ( google: string ) => setData( { ...data, google } ) }
				value={ data.google }
				help={
					<>
						{ __( 'Get your verification code in', 'newspack' ) + ' ' }
						<ExternalLink href="https://www.google.com/webmasters/verification/verification?tid=alternate">
							{ __( 'Google Search Console', 'newspack' ) }
						</ExternalLink>
					</>
				}
			/>
			<TextControl
				label="Bing"
				onChange={ ( bing: string ) => setData( { ...data, bing } ) }
				value={ data.bing }
				help={
					<>
						{ `${ __( 'Get your verification code in', 'newspack' ) } ` }
						<ExternalLink href="https://www.bing.com/toolbox/webmaster/#/Dashboard/">
							{ __( 'Bing Webmaster Tool', 'newspack' ) }
						</ExternalLink>
					</>
				}
			/>
		</Grid>
	);
}

export default VerificationCodes;
