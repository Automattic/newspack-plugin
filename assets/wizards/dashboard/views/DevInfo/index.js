/**
 * External dependencies.
 */
import marked from 'marked';
import { sanitize } from 'dompurify';
import { formatDistanceToNow } from 'date-fns';
import 'whatwg-fetch';

/**
 * WordPress dependencies.
 */
import { useState, useEffect } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import { Card } from '../../../../components/src';
import './style.scss';

const HEADING_REGEX = /##? \[([\d\.]*)\].*\(([\d-]*)\)\n\n/;

const parseReleaseHeader = release => {
	if ( ! release ) {
		return {};
	}

	// eslint-disable-next-line @wordpress/no-unused-vars-before-return, no-unused-vars
	const [ _, version, date ] = release.body.match( HEADING_REGEX );
	const content = release.body.replace( HEADING_REGEX, '' );

	const tokens = marked.lexer( content );
	let bugFixes = [];
	let features = [];
	tokens.forEach( ( token, i ) => {
		if ( token.text === 'Bug Fixes' ) {
			bugFixes = tokens[ i + 1 ].items.map( item => item.text );
		}
		if ( token.text === 'Features' ) {
			features = tokens[ i + 1 ].items.map( item => item.text );
		}
	} );

	return { version, date, content, bugFixes, features };
};

const ReleaseNotes = ( { repoSlug, repoName } ) => {
	const [ releaseData, setReleaseData ] = useState();
	const [ error, setError ] = useState();

	useEffect( () => {
		fetch( `https://api.github.com/repos/Automattic/${ repoSlug }/releases/latest` )
			.then( res => res.json() )
			.then( setReleaseData )
			.catch( () => {
				setError(
					`${ __( 'Something went wrong when fetching', 'newspack' ) } ${ repoName } ${ __(
						'data.',
						'newspack'
					) }`
				);
			} );
	}, [] );

	if ( error ) {
		return <div className="error">{ error }</div>;
	}

	const { date, content, bugFixes = [], features = [] } = parseReleaseHeader( releaseData );

	const bugFixesAmountString = sprintf(
		_n( '%d bug', '%d bugs', bugFixes.length, 'newspack' ),
		bugFixes.length
	);
	const featuresAmountString = sprintf(
		_n( '%d new feature', '%d new features', features.length, 'newspack' ),
		features.length
	);

	const infoStrings = [
		...( bugFixes.length ? [ `${ __( 'fixing', 'newspack' ) } ${ bugFixesAmountString }` ] : [] ),
		...( features.length ? [ `${ __( 'adding', 'newspack' ) } ${ featuresAmountString }` ] : [] ),
	];

	return releaseData ? (
		<details>
			<summary>
				<strong>{ repoName }</strong> was released{' '}
				{ formatDistanceToNow( new Date( date ), { addSuffix: true } ) }{' '}
				<strong>{ infoStrings.join( __( ' and ', 'newspack' ) ) }</strong>.
			</summary>
			<div dangerouslySetInnerHTML={ { __html: sanitize( marked( content ) ) } } />
		</details>
	) : (
		<div>
			<Spinner />
		</div>
	);
};

const DevInfo = () => {
	return (
		<Card className="newspack-dashboard__news">
			<h1>{ __( "What's new?", 'newspack' ) }</h1>
			<ReleaseNotes repoSlug="newspack-plugin" repoName="Newspack Plugin" />
			<ReleaseNotes repoSlug="newspack-blocks" repoName="Blocks Plugin" />
			<ReleaseNotes repoSlug="newspack-newsletters" repoName="Newsletters Plugin" />
			<ReleaseNotes repoSlug="newspack-popups" repoName="Campaigns Plugin" />
			<ReleaseNotes repoSlug="newspack-theme" repoName="Newspack Theme" />
		</Card>
	);
};

export default DevInfo;
